# scoreboard/routes/websocket.py
import json

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from scoreboard.engine import AnonymousParticipant, VerifiedParticipant, session_manager
from scoreboard.engine.runtime.broadcast import broadcast_to_connections
from scoreboard.engine.runtime.connection_registry import connection_registry

router = APIRouter()


def build_current_player(identity_type: str, player_id: str, display_name: str):
    if identity_type == "verified":
        return VerifiedParticipant(user_id=player_id, username=display_name)

    return AnonymousParticipant(guest_slug=player_id, nickname=display_name)


def ensure_session(match_id: str, current_player, score_keeper: str):
    session = session_manager.get_or_create_session(
        match_id,
        current_player,
        score_keeper,
    )

    if match_id and not session.matchroom.match_id:
        session.matchroom.match_id = match_id

    if session.matchroom.players[0].session_key != current_player.session_key and len(session.matchroom.players) == 1:
        session.add_opponent(current_player)

    return session


async def send_game_state(match_id: str, session):
    await broadcast_to_connections(
        connection_registry.get(match_id),
        {"type": "game_state", **session.state_payload()},
    )


async def send_error(websocket: WebSocket, message: str):
    await websocket.send_text(
        json.dumps(
            {
                "type": "error",
                "message": message,
                "error": message,
            },
        ),
    )


async def handle_client_event(websocket: WebSocket, match_id: str, session, current_player, event: dict):
    handled, error = session.process_event(current_player.session_key, event)
    if not handled:
        await send_error(websocket, error or "Unable to process message.")
        return

    await send_game_state(match_id, session)


async def handle_disconnect(match_id: str, current_player):
    connection_registry.remove(match_id, current_player.session_key)

    active_connections = connection_registry.get(match_id)
    if active_connections:
        await broadcast_to_connections(
            active_connections,
            {
                "type": "player_status_change",
                "key": current_player.session_key,
                "status": "disconnected",
            },
        )


@router.websocket("/ws/room/")
async def websocket_endpoint(
    websocket: WebSocket,
    match_id: str = Query(...),
    identity_type: str = Query(...),
    player_id: str = Query(...),
    display_name: str = Query(...),
    score_keeper: str = Query("opp"),
):
    current_player = build_current_player(identity_type, player_id, display_name)
    session = ensure_session(match_id, current_player, score_keeper)

    await connection_registry.register(match_id, current_player.session_key, websocket)

    try:
        await send_game_state(match_id, session)

        while True:
            data = await websocket.receive_text()
            event = json.loads(data)
            await handle_client_event(websocket, match_id, session, current_player, event)

    except WebSocketDisconnect:
        await handle_disconnect(match_id, current_player)
