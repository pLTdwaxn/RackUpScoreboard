# scoreboard/routes/websocket.py
import json

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from scoreboard.engine import AnonymousParticipant, VerifiedParticipant, room_manager
from scoreboard.engine.rules.validator import validate_event
from scoreboard.engine.runtime.broadcast import broadcast_to_connections
from scoreboard.engine.runtime.connection_registry import connection_registry

router = APIRouter()


@router.websocket("/ws/room/")
async def websocket_endpoint(
    websocket: WebSocket,
    match_id: str = Query(...),
    identity_type: str = Query(...),
    player_id: str = Query(...),
    display_name: str = Query(...),
):

    if identity_type == "verified":
        current_player = VerifiedParticipant(user_id=player_id, username=display_name)
    else:
        current_player = AnonymousParticipant(guest_slug=player_id, nickname=display_name)

    room = room_manager.get_or_create_room(match_id, current_player)

    if match_id and not room.match_id:
        room.match_id = match_id

    if room.players[0].session_key != current_player.session_key and len(room.players) == 1:
        room.add_opponent(current_player)

    await connection_registry.register(match_id, current_player.session_key, websocket)

    try:
        await broadcast_to_connections(
            connection_registry.get(match_id),
            {"type": "game_state", **room.state_payload()},
        )

        while True:
            data = await websocket.receive_text()
            event = json.loads(data)

            if event.get("undo") is True:
                if not room.undo_last_event():
                    await websocket.send_text(json.dumps({"error": "No prior message to undo."}))
                    continue

                await broadcast_to_connections(
                    connection_registry.get(match_id),
                    {"type": "game_state", **room.state_payload()},
                )
                continue

            if room.current_turn != current_player.session_key:
                await websocket.send_text(json.dumps({"error": "It is not your turn to score."}))
                continue

            try:
                validate_event(event)
            except ValueError as exc:
                await websocket.send_text(json.dumps({"error": str(exc)}))
                continue

            room.apply_event(current_player.session_key, event)

            await broadcast_to_connections(
                connection_registry.get(match_id),
                {"type": "game_state", **room.state_payload()},
            )

    except WebSocketDisconnect:
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
