import json


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
