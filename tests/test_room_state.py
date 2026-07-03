from app.engine.models.participant import AnonymousParticipant, VerifiedParticipant
from app.engine.models.room_state import MatchRoom


def test_match_room_initializes_with_first_player_state():
    p1 = AnonymousParticipant(guest_slug="guest123", nickname="CasualRonnie")
    room = MatchRoom(match_id="table_one", p1=p1)

    assert room.match_id == "table_one"
    assert room.players == [p1]
    assert room.scores == {"anon_guest123": 0}
    assert room.current_turn == "anon_guest123"
    assert room.current_break == 0
    assert room.is_finished is False


def test_add_opponent_adds_second_player_once_only():
    p1 = AnonymousParticipant(guest_slug="guest123", nickname="CasualRonnie")
    p2 = AnonymousParticipant(guest_slug="guest789", nickname="CasualJudd")
    p3 = VerifiedParticipant(user_id="42", username="RonnieO")
    room = MatchRoom(match_id="table_two", p1=p1)

    room.add_opponent(p2)
    room.add_opponent(p3)

    assert len(room.players) == 2
    assert room.players[1].session_key == "anon_guest789"
    assert "anon_guest789" in room.scores
    assert "user_42" not in room.scores


def test_record_action_pot_increments_score_and_break():
    p1 = AnonymousParticipant(guest_slug="guest123", nickname="CasualRonnie")
    room = MatchRoom(match_id="table_three", p1=p1)

    room.record_action("anon_guest123", {"action": "pot", "points": 7})

    assert room.scores["anon_guest123"] == 7
    assert room.current_break == 7
    assert room.current_turn == "anon_guest123"


def test_record_action_miss_switches_turn_and_resets_break():
    p1 = AnonymousParticipant(guest_slug="guest123", nickname="CasualRonnie")
    p2 = AnonymousParticipant(guest_slug="guest789", nickname="CasualJudd")
    room = MatchRoom(match_id="table_four", p1=p1)
    room.add_opponent(p2)

    room.record_action("anon_guest123", {"action": "pot", "points": 4})
    room.record_action("anon_guest123", {"action": "miss"})

    assert room.current_break == 0
    assert room.current_turn == "anon_guest789"


def test_record_action_foul_switches_turn_and_resets_break():
    p1 = AnonymousParticipant(guest_slug="guest123", nickname="CasualRonnie")
    p2 = AnonymousParticipant(guest_slug="guest789", nickname="CasualJudd")
    room = MatchRoom(match_id="table_five", p1=p1)
    room.add_opponent(p2)

    room.record_action("anon_guest123", {"action": "pot", "points": 3})
    room.record_action("anon_guest123", {"action": "foul"})

    assert room.current_break == 0
    assert room.current_turn == "anon_guest789"


def test_get_sync_payload_has_expected_shape():
    p1 = VerifiedParticipant(user_id="42", username="RonnieO")
    room = MatchRoom(match_id="table_six", p1=p1)

    payload = room.get_sync_payload()

    assert payload["match_id"] == "table_six"
    assert payload["scores"] == {"user_42": 0}
    assert payload["players"] == [{"key": "user_42", "name": "RonnieO", "type": "verified"}]
