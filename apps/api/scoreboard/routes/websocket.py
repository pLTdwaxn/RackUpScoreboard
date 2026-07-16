# scoreboard/routes/websocket.py
import json

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from scoreboard.domain.models.matchroom import Matchroom
from scoreboard.domain.projectors.match_state_projector import MatchStateProjector
from scoreboard.domain.services.matchroom_service import matchroom_service
from scoreboard.runtime.broadcast import broadcast_to_connections
from scoreboard.runtime.connection_registry import matchroom_connection_registry
from scoreboard.services.matchroom_action_dispatcher import (
    matchroom_action_dispatcher,
)

router = APIRouter()
match_state_projector = MatchStateProjector()


async def send_game_state(matchroom_id: str, matchroom: Matchroom):
    await broadcast_to_connections(
        matchroom_connection_registry.get(matchroom_id),
        {"type": "game_state", **match_state_projector.state_payload(matchroom)},
    )


async def send_error(websocket: WebSocket, message: str, action_id: str | None = None):
    payload = {
        "type": "error",
        "message": message,
        "error": message,
    }
    if action_id is not None:
        payload["action_id"] = action_id

    await websocket.send_text(json.dumps(payload))


async def handle_client_event(
    websocket: WebSocket,
    matchroom_id: str,
    matchroom: Matchroom,
    session_key: str,
    event: dict,
):
    action_id = event.get("action_id") if isinstance(event, dict) else None
    if action_id is not None and not isinstance(action_id, str):
        await send_error(websocket, "Action id must be a string.")
        return

    handled, error = matchroom_action_dispatcher.dispatch(matchroom, session_key, event)
    if not handled:
        await send_error(websocket, error or "Unable to process message.", action_id)
        return

    matchroom_service.save_matchroom(matchroom)
    await send_game_state(matchroom_id, matchroom)


async def handle_disconnect(matchroom_id: str, session_key: str):
    matchroom_connection_registry.remove(matchroom_id, session_key)

    active_connections = matchroom_connection_registry.get(matchroom_id)
    if active_connections:
        await broadcast_to_connections(
            active_connections,
            {
                "type": "player_status_change",
                "key": session_key,
                "status": "disconnected",
            },
        )


@router.websocket("/ws/room/")
async def websocket_endpoint(
    websocket: WebSocket,
    matchroom_id: str = Query(...),
    session_key: str = Query(...),
):
    matchroom = matchroom_service.get_matchroom_by_id(matchroom_id)

    if matchroom is None:
        await websocket.accept()
        await send_error(websocket, "Matchroom not found.")
        await websocket.close(code=4404)
        return

    await matchroom_connection_registry.register(matchroom_id, session_key, websocket)

    try:
        await send_game_state(matchroom_id, matchroom)

        while True:
            data = await websocket.receive_text()
            event = json.loads(data)
            await handle_client_event(websocket, matchroom_id, matchroom, session_key, event)

    except WebSocketDisconnect:
        await handle_disconnect(matchroom_id, session_key)
