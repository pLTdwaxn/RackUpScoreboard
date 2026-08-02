import json
import signal
from contextlib import contextmanager


class WebSocketReceiveTimeout(TimeoutError):
    pass


@contextmanager
def websocket_receive_timeout(seconds: float):
    previous_handler = signal.getsignal(signal.SIGALRM)

    def timeout_handler(signum, frame):
        raise WebSocketReceiveTimeout(f"Timed out after {seconds}s waiting for websocket message")

    signal.signal(signal.SIGALRM, timeout_handler)
    signal.setitimer(signal.ITIMER_REAL, seconds)

    try:
        yield
    finally:
        signal.setitimer(signal.ITIMER_REAL, 0)
        signal.signal(signal.SIGALRM, previous_handler)


def receive_matching_json(ws, predicate, label: str, max_messages: int = 5, timeout: float = 1.0):
    messages = []

    for _ in range(max_messages):
        try:
            with websocket_receive_timeout(timeout):
                message = ws.receive_json()
        except WebSocketReceiveTimeout as exc:
            raise AssertionError(f"Timed out waiting for {label}. Messages received: {messages!r}") from exc

        messages.append(message)
        if predicate(message):
            return message

    raise AssertionError(f"Did not receive {label}. Messages received: {messages!r}")


def is_next_frame_confirmation(player_key: str):
    return lambda message: (
        message["type"] == "game_state"
        and message["current_frame"]["status"] == "finished"
        and message["next_frame_confirmations"] == [player_key]
    )


def is_new_frame_for_player(player_key: str):
    return lambda message: (
        message["type"] == "game_state"
        and message["current_frame"]["status"] == "ready"
        and message["current_frame"]["current_turn"] == player_key
        and message["current_frame"]["opening_turn"] == player_key
        and message["next_frame_confirmations"] == []
    )


def without_facts(value):
    if isinstance(value, list):
        return [without_facts(item) for item in value]
    if isinstance(value, dict):
        return {key: without_facts(item) for key, item in value.items() if key != "facts"}
    return value


def test_websocket_initial_payload_includes_current_frame_state(client, connect_player):
    p1 = connect_player("Breaker")

    params = f"matchroom_id={p1['matchroom_id']}&session_key={p1['player_key']}"
    with client.websocket_connect(f"/ws/room/?{params}") as ws:
        payload = json.loads(ws.receive_text())

    assert payload["type"] == "game_state"
    assert payload["matchroom"]["id"] == p1["matchroom_id"]
    assert payload["score_keeper"] == "opp"
    assert payload["current_frame"]["current_turn"] == p1["player_key"]
    assert payload["current_frame"]["points_remaining"] == 147


def test_shot_event_updates_state_for_both_connections(client, connect_player):
    p1 = connect_player("Player One")
    p2 = connect_player("Player Two", matchroom_id=p1["matchroom_id"])

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


def test_websocket_game_state_projects_frame_log_and_updates_after_undo(client, connect_player):
    p1 = connect_player("Player One")
    p2 = connect_player("Player Two", matchroom_id=p1["matchroom_id"])

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
    assert without_facts(shot_update["frame_log"]) == [
        {
            "id": shot_update["frame_log"][0]["id"],
            "type": "visit",
            "player_key": p1["player_key"],
            "player_name": "Player One",
            "history_ids": shot_update["frame_log"][0]["history_ids"],
            "shots": [
                {
                    "history_id": shot_update["frame_log"][0]["history_ids"][0],
                    "action": "shot",
                    "potted_balls": ["red"],
                    "scored_balls": ["red"],
                    "free_ball_pots": [],
                    "break_points": 1,
                    "foul_points": 0,
                }
            ],
            "potted_balls": ["red"],
            "scored_balls": ["red"],
            "free_ball_pots": [],
            "shot_count": 1,
            "break_points": 1,
            "foul_points": 0,
            "result": "in_progress",
        }
    ]
    assert shot_update["frame_log"][0]["facts"] == [
        {
            "kind": "visit_summary",
            "player_key": p1["player_key"],
            "history_ids": shot_update["frame_log"][0]["history_ids"],
            "shot_count": 1,
            "potted_balls": ["red"],
            "scored_balls": ["red"],
            "free_ball_pots": [],
            "break_points": 1,
            "foul_points": 0,
            "result": "in_progress",
        }
    ]
    assert shot_update["frame_log"][0]["shots"][0]["facts"] == [
        {
            "kind": "shot_result",
            "player_key": p1["player_key"],
            "result": "scoring",
            "potted_balls": ["red"],
            "scored_balls": ["red"],
            "free_ball_pots": [],
            "break_points": 1,
            "foul_points": 0,
            "winner_key": None,
        }
    ]
    assert shot_update["frame_log"][0]["history_ids"] == [shot_update["frame_log"][0]["id"]]
    assert undo_update["type"] == "game_state"
    assert undo_update["frame_log"][0]["facts"] == [
        {
            "kind": "break_off",
            "player_key": p1["player_key"],
            "result": "in_progress",
        }
    ]


def test_next_frame_flow_updates_state_over_websocket_for_both_players(client, connect_player):
    p1 = connect_player("Player One")
    p2 = connect_player("Player Two", matchroom_id=p1["matchroom_id"])

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
            first_confirm_p1 = receive_matching_json(
                ws1,
                is_next_frame_confirmation(p1["player_key"]),
                "p1 next-frame confirmation",
            )
            first_confirm_p2 = receive_matching_json(
                ws2,
                is_next_frame_confirmation(p1["player_key"]),
                "p2 next-frame confirmation",
            )

            ws2.send_text(json.dumps({"action": "next_frame", "data": {}}))
            next_frame_p2 = receive_matching_json(
                ws2,
                is_new_frame_for_player(p2["player_key"]),
                "p2 new frame update",
            )
            next_frame_p1 = receive_matching_json(
                ws1,
                is_new_frame_for_player(p2["player_key"]),
                "p1 new frame update",
            )

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


def test_invalid_action_is_rejected_over_websocket(client, connect_player):
    p1 = connect_player("Breaker")
    params = f"matchroom_id={p1['matchroom_id']}&session_key={p1['player_key']}"

    with client.websocket_connect(f"/ws/room/?{params}") as ws:
        _ = json.loads(ws.receive_text())
        ws.send_text(json.dumps({"action": "invalid_action"}))
        err = json.loads(ws.receive_text())

    assert err["type"] == "error"
    assert "Unsupported action" in err["error"]


def test_action_error_echoes_action_id(client, connect_player):
    p1 = connect_player("Breaker")
    params = f"matchroom_id={p1['matchroom_id']}&session_key={p1['player_key']}"

    with client.websocket_connect(f"/ws/room/?{params}") as ws:
        _ = json.loads(ws.receive_text())
        ws.send_text(json.dumps({"action_id": "bad-1", "action": "invalid_action"}))
        err = json.loads(ws.receive_text())

    assert err["type"] == "error"
    assert err["action_id"] == "bad-1"
    assert "Unsupported action" in err["error"]


def test_invalid_json_is_rejected_over_websocket(client, connect_player):
    p1 = connect_player("Breaker")
    params = f"matchroom_id={p1['matchroom_id']}&session_key={p1['player_key']}"

    with client.websocket_connect(f"/ws/room/?{params}") as ws:
        _ = json.loads(ws.receive_text())
        ws.send_text("{")
        err = json.loads(ws.receive_text())

    assert err["type"] == "error"
    assert err["error"] == "Message must be valid JSON."


def test_non_object_message_is_rejected_over_websocket(client, connect_player):
    p1 = connect_player("Breaker")
    params = f"matchroom_id={p1['matchroom_id']}&session_key={p1['player_key']}"

    with client.websocket_connect(f"/ws/room/?{params}") as ws:
        _ = json.loads(ws.receive_text())
        ws.send_text(json.dumps(["shot"]))
        err = json.loads(ws.receive_text())

    assert err["type"] == "error"
    assert err["error"] == "Message must be a JSON object."


def test_non_string_action_id_is_rejected_over_websocket(client, connect_player):
    p1 = connect_player("Breaker")
    params = f"matchroom_id={p1['matchroom_id']}&session_key={p1['player_key']}"

    with client.websocket_connect(f"/ws/room/?{params}") as ws:
        _ = json.loads(ws.receive_text())
        ws.send_text(json.dumps({"action_id": 1, "action": "undo"}))
        err = json.loads(ws.receive_text())

    assert err["type"] == "error"
    assert err["error"] == "Action id must be a string."
    assert "action_id" not in err


def test_disconnect_notifies_remaining_player(client, connect_player):
    p1 = connect_player("Player One")
    p2 = connect_player("Player Two", matchroom_id=p1["matchroom_id"])

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
