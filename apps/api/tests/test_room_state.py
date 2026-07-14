from scoreboard.services.matchroom_action_dispatcher import (
    MatchroomActionDispatcher,
)
from scoreboard.services.matchroom_manager import MatchroomManager


def _create_room_with_two_players(
    manager: MatchroomManager,
    room_id: str,
    score_keeper: str = "opp",
):
    room = manager.get_or_create_matchroom(
        {"id": room_id, "score_keeper": score_keeper},
        {"id": "", "session_key": "p1", "display_name": "Player 1"},
        {"id": "", "match_importance": "practice match", "frames_to_win": 3},
    )
    manager.get_or_create_matchroom(
        {"id": room.id, "score_keeper": score_keeper},
        {"id": "", "session_key": "p2", "display_name": "Player 2"},
        {"id": "", "match_importance": "practice match", "frames_to_win": 3},
    )
    return room


def test_state_payload_exposes_matchroom_match_and_current_frame() -> None:
    manager = MatchroomManager()
    room = _create_room_with_two_players(manager, "room_payload")

    payload = room.state_payload()

    assert payload["matchroom"]["id"] == room.id
    assert payload["match"]["frames_to_win"] == 3
    assert payload["current_frame"]["reds_remaining"] == 15
    assert payload["current_frame"]["object_ball"] == "red"
    assert payload["players"][0]["session_key"] == "p1"
    assert payload["players"][1]["session_key"] == "p2"


def test_dispatch_shot_updates_scores_break_and_history() -> None:
    manager = MatchroomManager()
    dispatcher = MatchroomActionDispatcher()
    room = _create_room_with_two_players(manager, "room_scoring")

    assert room.match is not None
    assert room.current_frame_id is not None
    frame = room.match.frames[room.current_frame_id]

    handled, error = dispatcher.dispatch(
        room,
        "p2",
        {"action": "shot", "data": {"potted_balls": ["red"], "foul": 0}},
    )

    assert handled is True
    assert error is None
    assert frame.scores["p1"] == 1
    assert frame.object_ball == "colour"
    assert frame.reds_remaining == 14
    assert frame.current_break == 1
    assert len(frame.history) == 1


def test_dispatch_foul_awards_opponent_and_switches_turn() -> None:
    manager = MatchroomManager()
    dispatcher = MatchroomActionDispatcher()
    room = _create_room_with_two_players(manager, "room_foul")

    assert room.match is not None
    assert room.current_frame_id is not None
    frame = room.match.frames[room.current_frame_id]

    handled, error = dispatcher.dispatch(
        room,
        "p2",
        {"action": "shot", "data": {"potted_balls": ["red", "pink"], "foul": 6}},
    )

    assert handled is True
    assert error is None
    assert frame.scores["p2"] == 6
    assert frame.current_turn == "p2"
    assert frame.current_break == 0
    assert frame.object_ball == "red"


def test_undo_restores_previous_frame_state() -> None:
    manager = MatchroomManager()
    dispatcher = MatchroomActionDispatcher()
    room = _create_room_with_two_players(manager, "room_undo")

    assert room.match is not None
    assert room.current_frame_id is not None
    frame = room.match.frames[room.current_frame_id]

    handled, error = dispatcher.dispatch(
        room,
        "p2",
        {"action": "shot", "data": {"potted_balls": ["red"], "foul": 0}},
    )
    assert handled is True
    assert error is None
    assert frame.scores["p1"] == 1

    handled, error = dispatcher.dispatch(
        room,
        "p2",
        {"action": "undo", "data": {}},
    )

    assert handled is True
    assert error is None
    assert frame.scores["p1"] == 0
    assert frame.reds_remaining == 15
    assert frame.object_ball == "red"
    assert frame.points_remaining == 147
    assert len(frame.history) == 0


def test_dispatch_rejects_player_at_table_under_opp_score_keeper() -> None:
    manager = MatchroomManager()
    dispatcher = MatchroomActionDispatcher()
    room = _create_room_with_two_players(manager, "room_keeper", score_keeper="opp")

    handled, error = dispatcher.dispatch(
        room,
        "p1",
        {"action": "shot", "data": {"potted_balls": ["red"], "foul": 0}},
    )

    assert handled is False
    assert error == "You are not allowed to keep score in this turn."


def test_dispatch_concede_marks_winner_and_match_score() -> None:
    manager = MatchroomManager()
    dispatcher = MatchroomActionDispatcher()
    room = _create_room_with_two_players(manager, "room_concede")

    assert room.match is not None
    assert room.current_frame_id is not None
    frame = room.match.frames[room.current_frame_id]

    handled, error = dispatcher.dispatch(room, "p1", {"action": "concede", "data": {}})

    assert handled is True
    assert error is None
    assert frame.winner_key == "p2"
    assert frame.status.value == "finished"
    assert room.match.match_scores["p2"] == 1


def test_dispatch_next_frame_creates_new_frame_and_rotates_opening_turn() -> None:
    manager = MatchroomManager()
    dispatcher = MatchroomActionDispatcher()
    room = _create_room_with_two_players(manager, "room_next_frame")

    assert room.match is not None
    assert room.current_frame_id is not None

    first_frame_id = room.current_frame_id
    first_frame = room.match.frames[first_frame_id]

    handled, error = dispatcher.dispatch(room, "p1", {"action": "concede", "data": {}})
    assert handled is True
    assert error is None
    assert first_frame.status.value == "finished"

    handled, error = dispatcher.dispatch(room, "p1", {"action": "next_frame", "data": {}})
    assert handled is True
    assert error is None
    assert room.current_frame_id == first_frame_id

    handled, error = dispatcher.dispatch(room, "p2", {"action": "next_frame", "data": {}})
    assert handled is True
    assert error is None

    assert room.current_frame_id is not None
    assert room.current_frame_id != first_frame_id
    assert room.match is not None
    assert len(room.match.frames) == 2

    next_frame = room.match.frames[room.current_frame_id]
    assert next_frame.opening_turn == "p2"
    assert next_frame.current_turn == "p2"
    assert next_frame.scores == {"p1": 0, "p2": 0}
    assert next_frame.status.value == "ready"
    assert next_frame.winner_key is None
    assert next_frame.history == []
    assert room.pending_next_frame_confirmations == set()
