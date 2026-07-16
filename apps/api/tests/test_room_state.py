from scoreboard.domain.services.matchroom_service import MatchroomService
from scoreboard.repositories.matchroom_repository import MatchroomRepository
from scoreboard.services.matchroom_action_dispatcher import (
    MatchroomActionDispatcher,
)


def make_matchroom_service() -> MatchroomService:
    return MatchroomService(repository=MatchroomRepository())


def _create_room_with_two_players(
    matchroom_service: MatchroomService,
    room_id: str,
    score_keeper: str = "opp",
):
    room = matchroom_service.connect_player_to_matchroom(
        {"id": room_id, "score_keeper": score_keeper},
        {"id": "", "session_key": "p1", "display_name": "Player 1"},
        {"id": "", "match_importance": "practice match", "frames_to_win": 3},
    )
    matchroom_service.connect_player_to_matchroom(
        {"id": room.id, "score_keeper": score_keeper},
        {"id": "", "session_key": "p2", "display_name": "Player 2"},
        {"id": "", "match_importance": "practice match", "frames_to_win": 3},
    )
    return room


def test_state_payload_exposes_matchroom_match_and_current_frame() -> None:
    matchroom_service = make_matchroom_service()
    room = _create_room_with_two_players(matchroom_service, "room_payload")

    payload = room.state_payload()

    assert payload["matchroom"]["id"] == room.id
    assert payload["match"]["frames_to_win"] == 3
    assert payload["current_frame"]["reds_remaining"] == 15
    assert payload["current_frame"]["object_ball"] == "red"
    assert payload["frame_log"] == []
    assert payload["players"][0]["session_key"] == "p1"
    assert payload["players"][1]["session_key"] == "p2"


def test_dispatch_shot_updates_scores_break_and_history() -> None:
    matchroom_service = make_matchroom_service()
    dispatcher = MatchroomActionDispatcher()
    room = _create_room_with_two_players(matchroom_service, "room_scoring")

    assert room.match is not None
    assert room.current_frame_id is not None
    frame = room.match.frames[room.current_frame_id]

    handled, error = dispatcher.dispatch(
        room,
        "p2",
        {
            "action_id": "action-1",
            "action": "shot",
            "data": {"potted_balls": ["red"], "foul": 0},
        },
    )

    assert handled is True
    assert error is None
    assert frame.scores["p1"] == 1
    assert frame.object_ball == "colour"
    assert frame.reds_remaining == 14
    assert frame.current_break == 1
    assert len(frame.history) == 1
    assert frame.history[0]["id"]
    assert isinstance(frame.history[0]["id"], str)
    assert frame.history[0]["id"] != "action-1"
    assert frame.history[0]["outcome"] == {
        "action": "shot",
        "result": "scoring",
        "player_key": "p1",
        "potted_balls": ["red"],
        "break_points": 1,
        "foul_points": 0,
        "winner_key": None,
        "nominated_colour": None,
    }


def test_dispatch_foul_awards_opponent_and_switches_turn() -> None:
    matchroom_service = make_matchroom_service()
    dispatcher = MatchroomActionDispatcher()
    room = _create_room_with_two_players(matchroom_service, "room_foul")

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
    assert frame.history[0]["outcome"] == {
        "action": "shot",
        "result": "foul",
        "player_key": "p2",
        "potted_balls": [],
        "break_points": 0,
        "foul_points": 6,
        "winner_key": None,
        "nominated_colour": None,
    }


def test_legal_blue_frame_log_uses_orchestrated_break_points() -> None:
    matchroom_service = make_matchroom_service()
    dispatcher = MatchroomActionDispatcher()
    room = _create_room_with_two_players(matchroom_service, "room_legal_blue_log")

    assert room.match is not None
    assert room.current_frame_id is not None
    frame = room.match.frames[room.current_frame_id]
    frame.status = frame.status.__class__("active")
    frame.object_ball = "blue"

    handled, error = dispatcher.dispatch(
        room,
        "p2",
        {"action": "shot", "data": {"potted_balls": ["blue"], "foul": 0}},
    )

    assert handled is True
    assert error is None
    assert frame.history[0]["outcome"] == {
        "action": "shot",
        "result": "scoring",
        "player_key": "p1",
        "potted_balls": ["blue"],
        "break_points": 5,
        "foul_points": 0,
        "winner_key": None,
        "nominated_colour": None,
    }
    assert room.state_payload()["frame_log"] == [
        {
            "id": room.state_payload()["frame_log"][0]["id"],
            "type": "visit",
            "player_key": "p1",
            "player_name": "Player 1",
            "history_ids": room.state_payload()["frame_log"][0]["history_ids"],
            "potted_balls": ["blue"],
            "shot_count": 1,
            "break_points": 5,
            "foul_points": 0,
            "result": "in_progress",
            "message": "Player 1: break 5",
        }
    ]


def test_dispatch_pass_shot_adds_frame_log_entry_and_can_be_undone() -> None:
    matchroom_service = make_matchroom_service()
    dispatcher = MatchroomActionDispatcher()
    room = _create_room_with_two_players(matchroom_service, "room_pass_shot")

    assert room.match is not None
    assert room.current_frame_id is not None
    frame = room.match.frames[room.current_frame_id]

    handled, error = dispatcher.dispatch(
        room,
        "p2",
        {"action": "shot", "data": {"potted_balls": [], "foul": 4}},
    )
    assert handled is True
    assert error is None
    assert frame.current_turn == "p2"
    assert frame.previously_fouled is True

    handled, error = dispatcher.dispatch(
        room,
        "p1",
        {"action": "pass_shot", "data": {}},
    )

    assert handled is True
    assert error is None
    assert frame.current_turn == "p1"
    assert frame.previously_fouled is False
    assert len(frame.history) == 2
    assert frame.history[1]["actor"] == "p2"
    assert frame.history[1]["event"] == {"action": "pass_shot", "data": {}}
    assert frame.history[1]["outcome"] == {
        "action": "pass_shot",
        "result": "passed",
        "player_key": None,
        "potted_balls": [],
        "break_points": 0,
        "foul_points": 0,
        "winner_key": None,
        "nominated_colour": None,
    }
    assert room.state_payload()["frame_log"][1]["message"] == "Player 2: passed shot back"

    handled, error = dispatcher.dispatch(
        room,
        "p1",
        {"action": "undo", "data": {}},
    )

    assert handled is True
    assert error is None
    assert frame.current_turn == "p2"
    assert frame.previously_fouled is True
    assert len(frame.history) == 1


def test_dispatch_declare_free_ball_adds_history_outcome_and_can_be_undone() -> None:
    matchroom_service = make_matchroom_service()
    dispatcher = MatchroomActionDispatcher()
    room = _create_room_with_two_players(matchroom_service, "room_free_ball")

    assert room.match is not None
    assert room.current_frame_id is not None
    frame = room.match.frames[room.current_frame_id]

    handled, error = dispatcher.dispatch(
        room,
        "p2",
        {"action": "shot", "data": {"potted_balls": [], "foul": 4}},
    )
    assert handled is True
    assert error is None
    assert frame.current_turn == "p2"
    assert frame.object_ball == "red"
    assert frame.previously_fouled is True

    handled, error = dispatcher.dispatch(
        room,
        "p1",
        {"action": "declare_free_ball", "data": {"nominated_colour": "blue"}},
    )

    assert handled is True
    assert error is None
    assert frame.current_turn == "p2"
    assert frame.object_ball == "red"
    assert frame.free_ball_nominated_colour == "blue"
    assert frame.free_ball_object_ball == "red"
    assert frame.previously_fouled is False
    assert len(frame.history) == 2
    assert frame.history[1]["actor"] == "p2"
    assert frame.history[1]["event"] == {
        "action": "declare_free_ball",
        "data": {"nominated_colour": "blue"},
    }
    assert frame.history[1]["outcome"] == {
        "action": "declare_free_ball",
        "result": "declared",
        "player_key": None,
        "potted_balls": [],
        "break_points": 0,
        "foul_points": 0,
        "winner_key": None,
        "nominated_colour": "blue",
    }

    handled, error = dispatcher.dispatch(
        room,
        "p1",
        {"action": "undo", "data": {}},
    )

    assert handled is True
    assert error is None
    assert frame.current_turn == "p2"
    assert frame.object_ball == "red"
    assert frame.free_ball_nominated_colour is None
    assert frame.free_ball_object_ball is None
    assert frame.previously_fouled is True
    assert len(frame.history) == 1


def test_free_ball_colour_counts_as_extra_red_and_then_colour_is_on() -> None:
    matchroom_service = make_matchroom_service()
    dispatcher = MatchroomActionDispatcher()
    room = _create_room_with_two_players(matchroom_service, "room_free_ball_red")

    assert room.match is not None
    assert room.current_frame_id is not None
    frame = room.match.frames[room.current_frame_id]

    handled, error = dispatcher.dispatch(
        room,
        "p2",
        {"action": "shot", "data": {"potted_balls": [], "foul": 4}},
    )
    assert handled is True
    assert error is None

    handled, error = dispatcher.dispatch(
        room,
        "p1",
        {"action": "declare_free_ball", "data": {"nominated_colour": "green"}},
    )
    assert handled is True
    assert error is None
    assert frame.object_ball == "red"
    assert frame.free_ball_nominated_colour == "green"
    assert frame.free_ball_object_ball == "red"
    assert frame.points_remaining == 155

    handled, error = dispatcher.dispatch(
        room,
        "p1",
        {"action": "shot", "data": {"potted_balls": ["green"], "foul": 0}},
    )

    assert handled is True
    assert error is None
    assert frame.scores["p2"] == 5
    assert frame.current_break == 1
    assert frame.points_remaining == 154
    assert frame.reds_remaining == 15
    assert frame.colours_on_table["green"] is True
    assert frame.object_ball == "colour"
    assert frame.free_ball_nominated_colour is None
    assert frame.free_ball_object_ball is None
    assert frame.history[2]["outcome"] == {
        "action": "shot",
        "result": "scoring",
        "player_key": "p2",
        "potted_balls": ["green"],
        "break_points": 1,
        "foul_points": 0,
        "winner_key": None,
        "nominated_colour": None,
    }


def test_undo_restores_previous_frame_state() -> None:
    matchroom_service = make_matchroom_service()
    dispatcher = MatchroomActionDispatcher()
    room = _create_room_with_two_players(matchroom_service, "room_undo")

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
    assert frame.status.value == "ready"
    assert len(frame.history) == 0


def test_undo_restores_active_frame_status_after_later_shot() -> None:
    matchroom_service = make_matchroom_service()
    dispatcher = MatchroomActionDispatcher()
    room = _create_room_with_two_players(matchroom_service, "room_undo_active")

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
    assert frame.status.value == "active"

    handled, error = dispatcher.dispatch(
        room,
        "p2",
        {"action": "shot", "data": {"potted_balls": ["black"], "foul": 0}},
    )
    assert handled is True
    assert error is None
    assert frame.scores["p1"] == 8

    handled, error = dispatcher.dispatch(
        room,
        "p2",
        {"action": "undo", "data": {}},
    )

    assert handled is True
    assert error is None
    assert frame.status.value == "active"
    assert frame.scores["p1"] == 1
    assert frame.object_ball == "colour"
    assert len(frame.history) == 1


def test_dispatch_rejects_player_at_table_under_opp_score_keeper() -> None:
    matchroom_service = make_matchroom_service()
    dispatcher = MatchroomActionDispatcher()
    room = _create_room_with_two_players(matchroom_service, "room_keeper", score_keeper="opp")

    handled, error = dispatcher.dispatch(
        room,
        "p1",
        {"action": "shot", "data": {"potted_balls": ["red"], "foul": 0}},
    )

    assert handled is False
    assert error == "You are not allowed to keep score in this turn."


def test_dispatch_concede_marks_winner_and_match_score() -> None:
    matchroom_service = make_matchroom_service()
    dispatcher = MatchroomActionDispatcher()
    room = _create_room_with_two_players(matchroom_service, "room_concede")

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
    matchroom_service = make_matchroom_service()
    dispatcher = MatchroomActionDispatcher()
    room = _create_room_with_two_players(matchroom_service, "room_next_frame")

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
