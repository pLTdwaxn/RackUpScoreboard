def test_connect_endpoint_returns_player_key_and_trimmed_name(connect_player):
    data = connect_player("  Ronnie  ")

    assert data["display_name"] == "Ronnie"
    assert data["identity_type"] == "anonymous"
    assert data["player_key"]
    assert data["matchroom_id"]


def test_connect_endpoint_reuses_existing_matchroom_when_id_is_provided(connect_player):
    first = connect_player("Player 1")
    second = connect_player("Player 2", matchroom_id=first["matchroom_id"])

    assert second["matchroom_id"] == first["matchroom_id"]


def test_connect_endpoint_uses_requested_score_keeper_for_new_room(client):
    created = client.post(
        "/connect",
        json={"display_name": "Player 1", "score_keeper": "any"},
    )
    assert created.status_code == 200
    matchroom_id = created.json()["matchroom_id"]
    player_key = created.json()["player_key"]

    with client.websocket_connect(
        f"/ws/room/?matchroom_id={matchroom_id}&session_key={player_key}",
    ) as ws:
        payload = ws.receive_json()

    assert payload["score_keeper"] == "any"
    assert payload["matchroom"]["score_keeper"] == "any"
