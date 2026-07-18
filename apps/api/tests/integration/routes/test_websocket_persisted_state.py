import json


def test_websocket_actions_reload_latest_room_state_for_opponent_scorekeeping(
    client,
    connect_player,
    copying_matchroom_repository,
):
    p1 = connect_player("Player One")
    p2 = connect_player("Player Two", matchroom_id=p1["matchroom_id"])

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


def test_pass_shot_reloads_latest_room_state_after_cross_socket_foul(
    client,
    connect_player,
    copying_matchroom_repository,
):
    p1 = connect_player("Player One")
    p2 = connect_player("Player Two", matchroom_id=p1["matchroom_id"])

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


def test_undo_reloads_latest_room_state_after_cross_socket_shot(
    client,
    connect_player,
    copying_matchroom_repository,
):
    p1 = connect_player("Player One")
    p2 = connect_player("Player Two", matchroom_id=p1["matchroom_id"])

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


def test_next_frame_confirmation_reloads_latest_room_state_after_concede(
    client,
    connect_player,
    copying_matchroom_repository,
):
    p1 = connect_player("Player One")
    p2 = connect_player("Player Two", matchroom_id=p1["matchroom_id"])

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
