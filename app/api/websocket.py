# app/api/websocket.py
import json

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect, status

from app.engine.snooker import AnonymousParticipant, VerifiedParticipant, room_manager
from app.services.rackup_client import RackUpServiceClient

router = APIRouter()


@router.websocket("/ws/room/{matchroom_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    matchroom_id: str,
    identity_type: str = Query(...),  # Explicitly passed: "verified" or "anonymous"
    player_identifier: str = Query(...),  # Acts as either user_id or random guest_slug
    display_name: str = Query(...),  # Display nickname
    match_id: str = Query(None),  # Optional database tracking anchor
):
    # 1. TOURNAMENT GATEKEEPER BRANCH
    if match_id:
        try:
            # Safely fetch verification schemas via the mocked service
            match_info = await RackUpServiceClient.fetch_tournament_match(match_id)
            authorized_players = [
                str(match_info["player1_id"]),
                str(match_info["player2_id"]),
            ]

            # If an unassigned user attempts entry, drop the connection frame immediately
            if player_identifier not in authorized_players:
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                return
        except Exception:
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
            return

    # 2. POLYMORPHIC INITIALIZATION
    if identity_type == "verified":
        current_player = VerifiedParticipant(user_id=player_identifier, username=display_name)
    else:
        current_player = AnonymousParticipant(guest_slug=player_identifier, nickname=display_name)

    room = room_manager.get_or_create_room(matchroom_id, current_player)

    if match_id and not room.match_id:
        room.match_id = match_id

    # If this current connection is a separate player from P1, register them as the opponent
    if room.players[0].session_key != current_player.session_key and len(room.players) == 1:
        room.add_opponent(current_player)

    await room.register_connection(current_player.session_key, websocket)

    try:
        # Send instant baseline confirmation down the channel bridge
        await room.broadcast(
            {
                "type": "game_state",
                "players": [p.to_dict() for p in room.players],
                "scores": room.scores,
                "current_turn": room.current_turn,
                "current_break": room.current_break,
                "match_id": room.match_id,
            }
        )

        # 3. REAL-TIME ROUTING LOOP
        while True:
            data = await websocket.receive_text()
            event = json.loads(data)

            if room.current_turn != current_player.session_key:
                await websocket.send_text(json.dumps({"error": "It is not your turn to score."}))
                continue

            if event.get("action") == "frame_conceded":
                room.is_finished = True

                # Push back to Django ledger safely only if an anchor match_id tracking code exists
                if room.match_id:
                    sync_data = room.get_sync_payload()
                    await RackUpServiceClient.sync_final_frame(room.match_id, sync_data)

                await room.broadcast(
                    {
                        "type": "match_complete",
                        "final_snapshot": room.get_sync_payload(),
                    }
                )
                room_manager.close_room(matchroom_id)
                break

            # Handle dynamic mid-game authentication linkages
            if event.get("action") == "link_match_model":
                room.match_id = event.get("match_id")
                continue

            room.record_action(current_player.session_key, event)

            await room.broadcast(
                {
                    "type": "game_state",
                    "players": [p.to_dict() for p in room.players],
                    "scores": room.scores,
                    "current_turn": room.current_turn,
                    "current_break": room.current_break,
                    "match_id": room.match_id,
                }
            )

    except WebSocketDisconnect:
        room.remove_connection(current_player.session_key)
        if not room.connections and not room.is_finished:
            room_manager.close_room(matchroom_id)
