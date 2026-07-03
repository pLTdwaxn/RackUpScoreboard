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
    assert room.snooker_required() == 0


def test_match_room_exposes_separate_room_match_and_frame_state():
    p1 = AnonymousParticipant(guest_slug="guest123", nickname="CasualRonnie")
    room = MatchRoom(match_id="table_state_split", p1=p1)

    assert room.room_state.match_id == "table_state_split"
    assert room.match_state.frames_to_win == 0
    assert room.frame_state.reds_remaining == 15

    room.match_type = "best_of"
    room.frames_to_win = 5
    room.object_ball = "colour"

    assert room.match_state.match_type == "best_of"
    assert room.match_state.frames_to_win == 5
    assert room.frame_state.object_ball == "colour"


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


def test_get_sync_payload_has_expected_shape():
    p1 = VerifiedParticipant(user_id="42", username="RonnieO")
    room = MatchRoom(match_id="table_six", p1=p1)

    payload = room.get_sync_payload()

    assert payload["match_id"] == "table_six"
    assert payload["scores"] == {"user_42": 0}
    assert payload["players"] == [{"key": "user_42", "name": "RonnieO", "type": "verified"}]


def test_apply_factual_event_updates_table_state_and_points_remaining():
    p1 = AnonymousParticipant(guest_slug="guest123", nickname="CasualRonnie")
    p2 = AnonymousParticipant(guest_slug="guest789", nickname="CasualJudd")
    room = MatchRoom(match_id="table_seven", p1=p1)
    room.add_opponent(p2)

    room.apply_factual_event(
        "anon_guest123",
        {"player": "player1", "potted": True, "potted_balls": ["red"], "foul": 0},
    )

    assert room.scores["anon_guest123"] == 1
    assert room.reds_remaining == 14
    assert room.object_ball == "colour"
    assert room.points_remaining() == 146
    assert len(room.history) == 1

    room.apply_factual_event(
        "anon_guest123",
        {"player": "player1", "potted": True, "potted_balls": ["blue"], "foul": 0},
    )

    assert room.scores["anon_guest123"] == 6
    assert room.colours_on_table["blue"] is True
    assert room.object_ball == "red"
    assert room.points_remaining() == 139
    assert len(room.history) == 2


def test_points_remaining_drops_after_miss_on_colour_turn():
    p1 = AnonymousParticipant(guest_slug="guest123", nickname="CasualRonnie")
    p2 = AnonymousParticipant(guest_slug="guest789", nickname="CasualJudd")
    room = MatchRoom(match_id="table_miss", p1=p1)
    room.add_opponent(p2)

    room.apply_factual_event(
        "anon_guest123",
        {"player": "player1", "potted": True, "potted_balls": ["red"], "foul": 0},
    )
    assert room.points_remaining() == 146
    assert room.object_ball == "colour"

    room.apply_factual_event(
        "anon_guest123",
        {"player": "player1", "potted": False, "potted_balls": [], "foul": 0},
    )
    assert room.current_turn == "anon_guest789"
    assert room.object_ball == "red"
    assert room.points_remaining() == 139


def test_apply_factual_event_records_foul_and_switches_turn():
    p1 = AnonymousParticipant(guest_slug="guest123", nickname="CasualRonnie")
    p2 = AnonymousParticipant(guest_slug="guest789", nickname="CasualJudd")
    room = MatchRoom(match_id="table_eight", p1=p1)
    room.add_opponent(p2)

    room.apply_factual_event(
        "anon_guest123",
        {
            "player": "player1",
            "potted": True,
            "potted_balls": ["red", "pink"],
            "foul": 6,
        },
    )

    assert room.scores["anon_guest789"] == 6
    assert room.current_turn == "anon_guest789"
    assert room.current_break == 0
    assert room.reds_remaining == 14
    assert room.colours_on_table["pink"] is True
    assert room.object_ball == "red"


def test_colour_is_respotted_when_reds_remain():
    p1 = AnonymousParticipant(guest_slug="guest123", nickname="CasualRonnie")
    p2 = AnonymousParticipant(guest_slug="guest789", nickname="CasualJudd")
    room = MatchRoom(match_id="table_respot", p1=p1)
    room.add_opponent(p2)

    room.apply_factual_event(
        "anon_guest123",
        {"potted": True, "potted_balls": ["red"], "foul": 0},
    )
    room.apply_factual_event(
        "anon_guest123",
        {"potted": True, "potted_balls": ["brown"], "foul": 0},
    )
    room.apply_factual_event(
        "anon_guest123",
        {"potted": True, "potted_balls": ["red"], "foul": 0},
    )

    assert room.object_ball == "colour"
    assert room.colours_on_table["brown"] is True
    assert room.points_remaining() == 138


def test_last_red_then_black_is_legal_and_starts_colour_sequence():
    p1 = AnonymousParticipant(guest_slug="guest123", nickname="CasualRonnie")
    p2 = AnonymousParticipant(guest_slug="guest789", nickname="CasualJudd")
    room = MatchRoom(match_id="table_last_red", p1=p1)
    room.add_opponent(p2)

    room.reds_remaining = 1
    room.object_ball = "red"

    room.apply_factual_event(
        "anon_guest123",
        {"potted": True, "potted_balls": ["red"], "foul": 0},
    )
    assert room.reds_remaining == 0
    assert room.object_ball == "colour"

    room.apply_factual_event(
        "anon_guest123",
        {"potted": True, "potted_balls": ["black"], "foul": 0},
    )

    assert room.scores["anon_guest123"] == 8
    assert room.scores["anon_guest789"] == 0
    assert room.object_ball == "yellow"
    assert room.colours_on_table["black"] is True


def test_undo_last_event_restores_previous_state():
    p1 = AnonymousParticipant(guest_slug="guest123", nickname="CasualRonnie")
    room = MatchRoom(match_id="table_nine", p1=p1)

    room.apply_factual_event(
        "anon_guest123",
        {"player": "player1", "potted": True, "potted_balls": ["red"], "foul": 0},
    )
    assert room.scores["anon_guest123"] == 1
    assert room.object_ball == "colour"

    assert room.undo_last_event() is True
    assert room.scores["anon_guest123"] == 0
    assert room.reds_remaining == 15
    assert room.object_ball == "red"
    assert room.points_remaining() == 147
    assert room.snooker_required() == 0
    assert len(room.history) == 0


def test_snooker_required_non_zero_when_gap_exceeds_points_remaining_with_pink_on():
    p1 = AnonymousParticipant(guest_slug="guest123", nickname="CasualRonnie")
    p2 = AnonymousParticipant(guest_slug="guest789", nickname="CasualJudd")
    room = MatchRoom(match_id="table_ten", p1=p1)
    room.add_opponent(p2)

    room.scores["anon_guest123"] = 120
    room.scores["anon_guest789"] = 0
    room.reds_remaining = 2

    assert room.points_remaining() == 43
    assert room.snooker_required() == 7


def test_snooker_required_is_zero_when_pink_is_not_on_table():
    p1 = AnonymousParticipant(guest_slug="guest123", nickname="CasualRonnie")
    p2 = AnonymousParticipant(guest_slug="guest789", nickname="CasualJudd")
    room = MatchRoom(match_id="table_eleven", p1=p1)
    room.add_opponent(p2)

    room.scores["anon_guest123"] = 100
    room.scores["anon_guest789"] = 0
    room.reds_remaining = 0
    room.colours_on_table = {
        "yellow": False,
        "green": False,
        "brown": False,
        "blue": False,
        "pink": False,
        "black": True,
    }

    assert room.points_remaining() == 7
    assert room.snooker_required() == 0


def test_snooker_required_uses_four_point_baseline_when_no_reds_remain():
    p1 = AnonymousParticipant(guest_slug="guest123", nickname="CasualRonnie")
    p2 = AnonymousParticipant(guest_slug="guest789", nickname="CasualJudd")
    room = MatchRoom(match_id="table_twelve", p1=p1)
    room.add_opponent(p2)

    room.scores["anon_guest123"] = 40
    room.scores["anon_guest789"] = 0
    room.reds_remaining = 0
    room.colours_on_table = {
        "yellow": False,
        "green": False,
        "brown": False,
        "blue": False,
        "pink": True,
        "black": False,
    }

    assert room.points_remaining() == 6
    assert room.snooker_required() == 9
