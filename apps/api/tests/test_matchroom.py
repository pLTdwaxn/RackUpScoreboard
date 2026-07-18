import json

from scoreboard.domain.models.matchroom import Matchroom
from scoreboard.repositories.matchroom_serializer import (
    deserialize_matchroom,
    serialize_matchroom,
)


class CopyingMatchroomRepository:
    def __init__(self):
        self._matchrooms: dict[str, dict] = {}

    def get(self, matchroom_id: str) -> Matchroom | None:
        data = self._matchrooms.get(matchroom_id)
        if data is None:
            return None
        return deserialize_matchroom(data)

    def save(self, matchroom: Matchroom) -> None:
        self._matchrooms[matchroom.id] = serialize_matchroom(matchroom)

    def delete(self, matchroom_id: str) -> None:
        self._matchrooms.pop(matchroom_id, None)

    def clear(self) -> None:
        self._matchrooms.clear()


def _use_copying_matchroom_repository(monkeypatch):
    from scoreboard.domain.services.matchroom_service import matchroom_service

    monkeypatch.setattr(matchroom_service, "repository", CopyingMatchroomRepository())


def _connect(client, display_name: str, matchroom_id: str | None = None) -> dict:
    payload = {"display_name": display_name}
    if matchroom_id is not None:
        payload["matchroom_id"] = matchroom_id

    response = client.post("/connect", json=payload)
    assert response.status_code == 200
    return response.json()


def test_connect_endpoint_returns_player_key_and_trimmed_name(client):
    data = _connect(client, "  Ronnie  ")

    assert data["display_name"] == "Ronnie"
    assert data["identity_type"] == "anonymous"
    assert data["player_key"]
    assert data["matchroom_id"]


def test_connect_endpoint_reuses_existing_matchroom_when_id_is_provided(client):
    first = _connect(client, "Player 1")
    second = _connect(client, "Player 2", matchroom_id=first["matchroom_id"])

    assert second["matchroom_id"] == first["matchroom_id"]


def test_websocket_initial_payload_includes_current_frame_state(client):
    p1 = _connect(client, "Breaker")

    params = f"matchroom_id={p1['matchroom_id']}&session_key={p1['player_key']}"
    with client.websocket_connect(f"/ws/room/?{params}") as ws:
        payload = json.loads(ws.receive_text())

    assert payload["type"] == "game_state"
    assert payload["matchroom"]["id"] == p1["matchroom_id"]
    assert payload["current_frame"]["current_turn"] == p1["player_key"]
    assert payload["current_frame"]["points_remaining"] == 147


def test_shot_event_updates_state_for_both_connections(client):
    p1 = _connect(client, "Player One")
    p2 = _connect(client, "Player Two", matchroom_id=p1["matchroom_id"])

    p1_params = f"matchroom_id={p1['matchroom_id']}&session_key={p1['player_key']}"
    p2_params = f"matchroom_id={p2['matchroom_id']}&session_key={p2['player_key']}"

    with client.websocket_connect(f"/ws/room/?{p1_params}") as ws1:
        _ = json.loads(ws1.receive_text())

        with client.websocket_connect(f"/ws/room/?{p2_params}") as ws2:
            _ = json.loads(ws2.receive_text())
            _ = json.loads(ws1.receive_text())

            ws2.send_text(
                json.dumps(
                    {
                        "action": "shot",
                        "data": {
                            "potted_balls": ["red"],
                            "foul": 0,
                        },
                    }
                )
            )

            update_p1 = json.loads(ws1.receive_text())
            update_p2 = json.loads(ws2.receive_text())

    for update in (update_p1, update_p2):
        assert update["type"] == "game_state"
        assert update["current_frame"]["scores"][p1["player_key"]] == 1
        assert update["current_frame"]["current_break"] == 1
        assert update["current_frame"]["object_ball"] == "colour"


def test_websocket_actions_reload_latest_room_state_for_opponent_scorekeeping(client, monkeypatch):
    _use_copying_matchroom_repository(monkeypatch)

    p1 = _connect(client, "Player One")
    p2 = _connect(client, "Player Two", matchroom_id=p1["matchroom_id"])

    p1_params = f"matchroom_id={p1['matchroom_id']}&session_key={p1['player_key']}"
    p2_params = f"matchroom_id={p2['matchroom_id']}&session_key={p2['player_key']}"

    with client.websocket_connect(f"/ws/room/?{p1_params}") as ws1:
        _ = json.loads(ws1.receive_text())

        with client.websocket_connect(f"/ws/room/?{p2_params}") as ws2:
            _ = json.loads(ws2.receive_text())
            _ = json.loads(ws1.receive_text())

            ws2.send_text(json.dumps({"action": "shot", "data": {"potted_balls": ["red"], "foul": 0}}))
            _ = json.loads(ws1.receive_text())
            _ = json.loads(ws2.receive_text())

            ws2.send_text(json.dumps({"action": "shot", "data": {"potted_balls": ["blue"], "foul": 0}}))
            _ = json.loads(ws1.receive_text())
            _ = json.loads(ws2.receive_text())

            ws2.send_text(json.dumps({"action": "shot", "data": {"potted_balls": [], "foul": 0}}))
            turn_switch_p1 = json.loads(ws1.receive_text())
            turn_switch_p2 = json.loads(ws2.receive_text())

            for update in (turn_switch_p1, turn_switch_p2):
                assert update["type"] == "game_state"
                assert update["current_frame"]["current_turn"] == p2["player_key"]

            ws1.send_text(json.dumps({"action": "shot", "data": {"potted_balls": ["red"], "foul": 0}}))
            p1_pot_update = json.loads(ws1.receive_text())
            p2_pot_update = json.loads(ws2.receive_text())

    for update in (p1_pot_update, p2_pot_update):
        assert update["type"] == "game_state"
        assert update["current_frame"]["scores"][p1["player_key"]] == 6
        assert update["current_frame"]["scores"][p2["player_key"]] == 1
        assert update["current_frame"]["current_turn"] == p2["player_key"]
        assert update["current_frame"]["object_ball"] == "colour"


def test_pass_shot_reloads_latest_room_state_after_cross_socket_foul(client, monkeypatch):
    _use_copying_matchroom_repository(monkeypatch)

    p1 = _connect(client, "Player One")
    p2 = _connect(client, "Player Two", matchroom_id=p1["matchroom_id"])

    p1_params = f"matchroom_id={p1['matchroom_id']}&session_key={p1['player_key']}"
    p2_params = f"matchroom_id={p2['matchroom_id']}&session_key={p2['player_key']}"

    with client.websocket_connect(f"/ws/room/?{p1_params}") as ws1:
        _ = json.loads(ws1.receive_text())

        with client.websocket_connect(f"/ws/room/?{p2_params}") as ws2:
            _ = json.loads(ws2.receive_text())
            _ = json.loads(ws1.receive_text())

            ws2.send_text(json.dumps({"action": "shot", "data": {"potted_balls": [], "foul": 4}}))
            foul_p1 = json.loads(ws1.receive_text())
            foul_p2 = json.loads(ws2.receive_text())

            for update in (foul_p1, foul_p2):
                assert update["type"] == "game_state"
                assert update["current_frame"]["current_turn"] == p2["player_key"]
                assert update["current_frame"]["previously_fouled"] is True

            ws1.send_text(json.dumps({"action": "pass_shot", "data": {}}))
            pass_p1 = json.loads(ws1.receive_text())
            pass_p2 = json.loads(ws2.receive_text())

    for update in (pass_p1, pass_p2):
        assert update["type"] == "game_state"
        assert update["current_frame"]["current_turn"] == p1["player_key"]
        assert update["current_frame"]["previously_fouled"] is False


def test_undo_reloads_latest_room_state_after_cross_socket_shot(client, monkeypatch):
    _use_copying_matchroom_repository(monkeypatch)

    p1 = _connect(client, "Player One")
    p2 = _connect(client, "Player Two", matchroom_id=p1["matchroom_id"])

    p1_params = f"matchroom_id={p1['matchroom_id']}&session_key={p1['player_key']}"
    p2_params = f"matchroom_id={p2['matchroom_id']}&session_key={p2['player_key']}"

    with client.websocket_connect(f"/ws/room/?{p1_params}") as ws1:
        _ = json.loads(ws1.receive_text())

        with client.websocket_connect(f"/ws/room/?{p2_params}") as ws2:
            _ = json.loads(ws2.receive_text())
            _ = json.loads(ws1.receive_text())

            ws2.send_text(json.dumps({"action": "shot", "data": {"potted_balls": ["red"], "foul": 0}}))
            shot_p1 = json.loads(ws1.receive_text())
            shot_p2 = json.loads(ws2.receive_text())

            for update in (shot_p1, shot_p2):
                assert update["type"] == "game_state"
                assert update["current_frame"]["scores"][p1["player_key"]] == 1
                assert update["frame_log"]

            ws1.send_text(json.dumps({"action": "undo", "data": {}}))
            undo_p1 = json.loads(ws1.receive_text())
            undo_p2 = json.loads(ws2.receive_text())

    for update in (undo_p1, undo_p2):
        assert update["type"] == "game_state"
        assert update["current_frame"]["scores"][p1["player_key"]] == 0
        assert update["current_frame"]["current_break"] == 0
        assert update["current_frame"]["object_ball"] == "red"
        assert update["frame_log"] == []


def test_websocket_game_state_projects_frame_log_and_updates_after_undo(client):
    p1 = _connect(client, "Player One")
    p2 = _connect(client, "Player Two", matchroom_id=p1["matchroom_id"])

    p2_params = f"matchroom_id={p2['matchroom_id']}&session_key={p2['player_key']}"

    with client.websocket_connect(f"/ws/room/?{p2_params}") as ws:
        _ = json.loads(ws.receive_text())

        ws.send_text(
            json.dumps(
                {
                    "action": "shot",
                    "data": {
                        "potted_balls": ["red"],
                        "foul": 0,
                    },
                }
            )
        )
        shot_update = json.loads(ws.receive_text())

        ws.send_text(json.dumps({"action": "undo", "data": {}}))
        undo_update = json.loads(ws.receive_text())

    assert shot_update["type"] == "game_state"
    assert shot_update["frame_log"] == [
        {
            "id": shot_update["frame_log"][0]["id"],
            "type": "visit",
            "player_key": p1["player_key"],
            "player_name": "Player One",
            "history_ids": shot_update["frame_log"][0]["history_ids"],
            "potted_balls": ["red"],
            "shot_count": 1,
            "break_points": 1,
            "foul_points": 0,
            "result": "in_progress",
            "message": "Player One: break 1",
        }
    ]
    assert shot_update["frame_log"][0]["history_ids"] == [shot_update["frame_log"][0]["id"]]
    assert undo_update["type"] == "game_state"
    assert undo_update["frame_log"] == []


def test_next_frame_flow_updates_state_over_websocket_for_both_players(client):
    p1 = _connect(client, "Player One")
    p2 = _connect(client, "Player Two", matchroom_id=p1["matchroom_id"])

    p1_params = f"matchroom_id={p1['matchroom_id']}&session_key={p1['player_key']}"
    p2_params = f"matchroom_id={p2['matchroom_id']}&session_key={p2['player_key']}"

    with client.websocket_connect(f"/ws/room/?{p1_params}") as ws1:
        initial_p1 = json.loads(ws1.receive_text())

        with client.websocket_connect(f"/ws/room/?{p2_params}") as ws2:
            _ = json.loads(ws2.receive_text())
            _ = json.loads(ws1.receive_text())

            ws1.send_text(json.dumps({"action": "concede", "data": {}}))
            conceded_p1 = json.loads(ws1.receive_text())
            conceded_p2 = json.loads(ws2.receive_text())

            ws1.send_text(json.dumps({"action": "next_frame", "data": {}}))
            first_confirm_p1 = json.loads(ws1.receive_text())
            first_confirm_p2 = json.loads(ws2.receive_text())

            ws2.send_text(json.dumps({"action": "next_frame", "data": {}}))
            next_frame_p1 = json.loads(ws1.receive_text())
            next_frame_p2 = json.loads(ws2.receive_text())

    assert initial_p1["type"] == "game_state"
    assert initial_p1["current_frame"]["current_turn"] == p1["player_key"]

    for update in (conceded_p1, conceded_p2):
        assert update["type"] == "game_state"
        assert update["current_frame"]["status"] == "finished"
        assert update["current_frame"]["winner_key"] == p2["player_key"]

    for update in (first_confirm_p1, first_confirm_p2):
        assert update["type"] == "game_state"
        assert update["current_frame"]["status"] == "finished"
        assert update["next_frame_confirmations"] == [p1["player_key"]]

    for update in (next_frame_p1, next_frame_p2):
        assert update["type"] == "game_state"
        assert update["current_frame"]["status"] == "ready"
        assert update["current_frame"]["current_turn"] == p2["player_key"]
        assert update["current_frame"]["opening_turn"] == p2["player_key"]
        assert update["current_frame"]["scores"] == {
            p1["player_key"]: 0,
            p2["player_key"]: 0,
        }
        assert update["current_frame"]["winner_key"] is None
        assert update["next_frame_confirmations"] == []


def test_next_frame_confirmation_reloads_latest_room_state_after_concede(client, monkeypatch):
    _use_copying_matchroom_repository(monkeypatch)

    p1 = _connect(client, "Player One")
    p2 = _connect(client, "Player Two", matchroom_id=p1["matchroom_id"])

    p1_params = f"matchroom_id={p1['matchroom_id']}&session_key={p1['player_key']}"
    p2_params = f"matchroom_id={p2['matchroom_id']}&session_key={p2['player_key']}"

    with client.websocket_connect(f"/ws/room/?{p1_params}") as ws1:
        _ = json.loads(ws1.receive_text())

        with client.websocket_connect(f"/ws/room/?{p2_params}") as ws2:
            _ = json.loads(ws2.receive_text())
            _ = json.loads(ws1.receive_text())

            ws1.send_text(json.dumps({"action": "concede", "data": {}}))
            conceded_p1 = json.loads(ws1.receive_text())
            conceded_p2 = json.loads(ws2.receive_text())

            for update in (conceded_p1, conceded_p2):
                assert update["type"] == "game_state"
                assert update["current_frame"]["status"] == "finished"

            ws2.send_text(json.dumps({"action": "next_frame", "data": {}}))
            confirmation_p1 = json.loads(ws1.receive_text())
            confirmation_p2 = json.loads(ws2.receive_text())

    for update in (confirmation_p1, confirmation_p2):
        assert update["type"] == "game_state"
        assert update["current_frame"]["status"] == "finished"
        assert update["next_frame_confirmations"] == [p2["player_key"]]


def test_invalid_action_is_rejected_over_websocket(client):
    p1 = _connect(client, "Breaker")
    params = f"matchroom_id={p1['matchroom_id']}&session_key={p1['player_key']}"

    with client.websocket_connect(f"/ws/room/?{params}") as ws:
        _ = json.loads(ws.receive_text())
        ws.send_text(json.dumps({"action": "invalid_action"}))
        err = json.loads(ws.receive_text())

    assert err["type"] == "error"
    assert "Unsupported action" in err["error"]


def test_action_error_echoes_action_id(client):
    p1 = _connect(client, "Breaker")
    params = f"matchroom_id={p1['matchroom_id']}&session_key={p1['player_key']}"

    with client.websocket_connect(f"/ws/room/?{params}") as ws:
        _ = json.loads(ws.receive_text())
        ws.send_text(json.dumps({"action_id": "bad-1", "action": "invalid_action"}))
        err = json.loads(ws.receive_text())

    assert err["type"] == "error"
    assert err["action_id"] == "bad-1"
    assert "Unsupported action" in err["error"]


def test_disconnect_notifies_remaining_player(client):
    p1 = _connect(client, "Player One")
    p2 = _connect(client, "Player Two", matchroom_id=p1["matchroom_id"])

    p1_params = f"matchroom_id={p1['matchroom_id']}&session_key={p1['player_key']}"
    p2_params = f"matchroom_id={p2['matchroom_id']}&session_key={p2['player_key']}"

    with client.websocket_connect(f"/ws/room/?{p2_params}") as ws2:
        _ = json.loads(ws2.receive_text())

        with client.websocket_connect(f"/ws/room/?{p1_params}") as ws1:
            _ = json.loads(ws1.receive_text())
            _ = json.loads(ws2.receive_text())

        status_change = json.loads(ws2.receive_text())

    assert status_change["type"] == "player_status_change"
    assert status_change["key"] == p1["player_key"]
    assert status_change["status"] == "disconnected"
