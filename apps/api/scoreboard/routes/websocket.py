# scoreboard/routes/websocket.py
import json
from dataclasses import dataclass
from json import JSONDecodeError
from typing import Any

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


@dataclass(frozen=True)
class ClientEventEnvelope:
    event: dict
    action_id: str | None = None


def parse_client_event(data: str) -> ClientEventEnvelope:
    try:
        event = json.loads(data)
    except JSONDecodeError as exc:
        raise ValueError("Message must be valid JSON.") from exc

    return validate_client_event_envelope(event)


def validate_client_event_envelope(event: Any) -> ClientEventEnvelope:
    if not isinstance(event, dict):
        raise ValueError("Message must be a JSON object.")

    action_id = event.get("action_id")
    if action_id is not None and not isinstance(action_id, str):
        raise ValueError("Action id must be a string.")

    return ClientEventEnvelope(event=event, action_id=action_id)


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
    session_key: str,
    envelope: ClientEventEnvelope,
):
    matchroom = matchroom_service.get_matchroom_by_id(matchroom_id)
    if matchroom is None:
        await send_error(websocket, "Matchroom not found.", envelope.action_id)
        return

    handled, error = matchroom_action_dispatcher.dispatch(matchroom, session_key, envelope.event)
    if not handled:
        await send_error(websocket, error or "Unable to process message.", envelope.action_id)
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
            try:
                envelope = parse_client_event(data)
            except ValueError as error:
                await send_error(websocket, str(error))
                continue

            await handle_client_event(websocket, matchroom_id, session_key, envelope)

    except WebSocketDisconnect:
        await handle_disconnect(matchroom_id, session_key)
