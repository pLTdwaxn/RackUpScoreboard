from scoreboard.engine.models.match_session import MatchSession
from scoreboard.engine.models.participant import (
    AnonymousParticipant,
    VerifiedParticipant,
)


def test_match_room_initializes_with_first_player_state():
    p1 = AnonymousParticipant(guest_slug="guest123", nickname="CasualRonnie")
    room = MatchSession(match_id="table_one", p1=p1)

    assert room.matchroom.match_id == "table_one"
    assert room.matchroom.players == [p1]
    assert room.frame.scores == {"anon_guest123": 0}
    assert room.frame.current_turn == "anon_guest123"
    assert room.frame.current_break == 0
    assert room.match.is_finished is False
    assert room.frame.snookers_required == 0


def test_match_room_exposes_separate_room_match_and_frame_state():
    p1 = AnonymousParticipant(guest_slug="guest123", nickname="CasualRonnie")
    room = MatchSession(match_id="table_state_split", p1=p1)

    assert room.matchroom.match_id == "table_state_split"
    assert room.match.frames_to_win == 0
    assert room.frame.reds_remaining == 15

    room.match.match_type = "best_of"
    room.match.frames_to_win = 5
    room.frame.object_ball = "colour"

    assert room.match.match_type == "best_of"
    assert room.match.frames_to_win == 5
    assert room.frame.object_ball == "colour"


def test_add_opponent_adds_second_player_once_only():
    p1 = AnonymousParticipant(guest_slug="guest123", nickname="CasualRonnie")
    p2 = AnonymousParticipant(guest_slug="guest789", nickname="CasualJudd")
    p3 = VerifiedParticipant(user_id="42", username="RonnieO")
    room = MatchSession(match_id="table_two", p1=p1)

    room.add_opponent(p2)
    room.add_opponent(p3)

    assert len(room.matchroom.players) == 2
    assert room.matchroom.players[1].session_key == "anon_guest789"
    assert "anon_guest789" in room.frame.scores
    assert "user_42" not in room.frame.scores


def test_get_sync_payload_has_expected_shape():
    p1 = VerifiedParticipant(user_id="42", username="RonnieO")
    room = MatchSession(match_id="table_six", p1=p1)

    payload = room.get_sync_payload()

    assert payload["match_id"] == "table_six"
    assert payload["scores"] == {"user_42": 0}
    assert payload["players"] == [{"key": "user_42", "name": "RonnieO", "type": "verified"}]


def test_apply_factual_event_updates_table_state_and_points_remaining():
    p1 = AnonymousParticipant(guest_slug="guest123", nickname="CasualRonnie")
    p2 = AnonymousParticipant(guest_slug="guest789", nickname="CasualJudd")
    room = MatchSession(match_id="table_seven", p1=p1)
    room.add_opponent(p2)

    room.apply_factual_event(
        "anon_guest123",
        {"player": "player1", "potted": True, "potted_balls": ["red"], "foul": 0},
    )

    assert room.frame.scores["anon_guest123"] == 1
    assert room.frame.reds_remaining == 14
    assert room.frame.object_ball == "colour"
    assert room.frame.points_remaining == 146
    assert len(room.frame.history) == 1

    room.apply_factual_event(
        "anon_guest123",
        {"player": "player1", "potted": True, "potted_balls": ["blue"], "foul": 0},
    )

    assert room.frame.scores["anon_guest123"] == 6
    assert room.frame.colours_on_table["blue"] is True
    assert room.frame.object_ball == "red"
    assert room.frame.points_remaining == 139
    assert len(room.frame.history) == 2


def test_points_remaining_drops_after_miss_on_colour_turn():
    p1 = AnonymousParticipant(guest_slug="guest123", nickname="CasualRonnie")
    p2 = AnonymousParticipant(guest_slug="guest789", nickname="CasualJudd")
    room = MatchSession(match_id="table_miss", p1=p1)
    room.add_opponent(p2)

    room.apply_factual_event(
        "anon_guest123",
        {"player": "player1", "potted": True, "potted_balls": ["red"], "foul": 0},
    )
    assert room.frame.points_remaining == 146
    assert room.frame.object_ball == "colour"

    room.apply_factual_event(
        "anon_guest123",
        {"player": "player1", "potted": False, "potted_balls": [], "foul": 0},
    )
    assert room.frame.current_turn == "anon_guest789"
    assert room.frame.object_ball == "red"
    assert room.frame.points_remaining == 139


def test_apply_factual_event_records_foul_and_switches_turn():
    p1 = AnonymousParticipant(guest_slug="guest123", nickname="CasualRonnie")
    p2 = AnonymousParticipant(guest_slug="guest789", nickname="CasualJudd")
    room = MatchSession(match_id="table_eight", p1=p1)
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

    assert room.frame.scores["anon_guest789"] == 6
    assert room.frame.current_turn == "anon_guest789"
    assert room.frame.current_break == 0
    assert room.frame.reds_remaining == 14
    assert room.frame.colours_on_table["pink"] is True
    assert room.frame.object_ball == "red"


def test_colour_is_respotted_when_reds_remain():
    p1 = AnonymousParticipant(guest_slug="guest123", nickname="CasualRonnie")
    p2 = AnonymousParticipant(guest_slug="guest789", nickname="CasualJudd")
    room = MatchSession(match_id="table_respot", p1=p1)
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

    assert room.frame.object_ball == "colour"
    assert room.frame.colours_on_table["brown"] is True
    assert room.frame.points_remaining == 138


def test_last_red_then_black_is_legal_and_starts_colour_sequence():
    p1 = AnonymousParticipant(guest_slug="guest123", nickname="CasualRonnie")
    p2 = AnonymousParticipant(guest_slug="guest789", nickname="CasualJudd")
    room = MatchSession(match_id="table_last_red", p1=p1)
    room.add_opponent(p2)

    room.frame.reds_remaining = 1
    room.frame.object_ball = "red"

    room.apply_factual_event(
        "anon_guest123",
        {"potted": True, "potted_balls": ["red"], "foul": 0},
    )
    assert room.frame.reds_remaining == 0
    assert room.frame.object_ball == "colour"

    room.apply_factual_event(
        "anon_guest123",
        {"potted": True, "potted_balls": ["black"], "foul": 0},
    )

    assert room.frame.scores["anon_guest123"] == 8
    assert room.frame.scores["anon_guest789"] == 0
    assert room.frame.object_ball == "yellow"
    assert room.frame.colours_on_table["black"] is True


def test_undo_last_event_restores_previous_state():
    p1 = AnonymousParticipant(guest_slug="guest123", nickname="CasualRonnie")
    room = MatchSession(match_id="table_nine", p1=p1)

    room.apply_factual_event(
        "anon_guest123",
        {"player": "player1", "potted": True, "potted_balls": ["red"], "foul": 0},
    )
    assert room.frame.scores["anon_guest123"] == 1
    assert room.frame.object_ball == "colour"

    assert room.undo_last_event() is True
    assert room.frame.scores["anon_guest123"] == 0
    assert room.frame.reds_remaining == 15
    assert room.frame.object_ball == "red"
    assert room.frame.points_remaining == 147
    assert room.frame.snookers_required == 0
    assert len(room.frame.history) == 0


def test_snookers_required_non_zero_when_gap_exceeds_points_remaining_with_pink_on():
    p1 = AnonymousParticipant(guest_slug="guest123", nickname="CasualRonnie")
    p2 = AnonymousParticipant(guest_slug="guest789", nickname="CasualJudd")
    room = MatchSession(match_id="table_ten", p1=p1)
    room.add_opponent(p2)

    room.frame.scores["anon_guest123"] = 120
    room.frame.scores["anon_guest789"] = 0
    room.frame.reds_remaining = 2
    room.frame.recalculate_score_context()

    assert room.frame.points_remaining == 43
    assert room.frame.snookers_required == 7


def test_snookers_required_is_zero_when_pink_is_not_on_table():
    p1 = AnonymousParticipant(guest_slug="guest123", nickname="CasualRonnie")
    p2 = AnonymousParticipant(guest_slug="guest789", nickname="CasualJudd")
    room = MatchSession(match_id="table_eleven", p1=p1)
    room.add_opponent(p2)

    room.frame.scores["anon_guest123"] = 100
    room.frame.scores["anon_guest789"] = 0
    room.frame.reds_remaining = 0
    room.frame.colours_on_table = {
        "yellow": False,
        "green": False,
        "brown": False,
        "blue": False,
        "pink": False,
        "black": True,
    }
    room.frame.recalculate_score_context()

    assert room.frame.points_remaining == 7
    assert room.frame.snookers_required == 0


def test_snookers_required_uses_four_point_baseline_when_no_reds_remain():
    p1 = AnonymousParticipant(guest_slug="guest123", nickname="CasualRonnie")
    p2 = AnonymousParticipant(guest_slug="guest789", nickname="CasualJudd")
    room = MatchSession(match_id="table_twelve", p1=p1)
    room.add_opponent(p2)

    room.frame.scores["anon_guest123"] = 40
    room.frame.scores["anon_guest789"] = 0
    room.frame.reds_remaining = 0
    room.frame.colours_on_table = {
        "yellow": False,
        "green": False,
        "brown": False,
        "blue": False,
        "pink": True,
        "black": False,
    }
    room.frame.recalculate_score_context()

    assert room.frame.points_remaining == 6
    assert room.frame.snookers_required == 9
