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
