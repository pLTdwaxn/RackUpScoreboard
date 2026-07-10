import json


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


def test_invalid_action_is_rejected_over_websocket(client):
    p1 = _connect(client, "Breaker")
    params = f"matchroom_id={p1['matchroom_id']}&session_key={p1['player_key']}"

    with client.websocket_connect(f"/ws/room/?{params}") as ws:
        _ = json.loads(ws.receive_text())
        ws.send_text(json.dumps({"action": "invalid_action"}))
        err = json.loads(ws.receive_text())

    assert err["type"] == "error"
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
