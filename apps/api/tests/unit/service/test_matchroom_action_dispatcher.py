from scoreboard.domain.services.matchroom_service import MatchroomService
from scoreboard.repositories.matchroom_repository import MatchroomRepository
from scoreboard.services.matchroom_action_dispatcher import (
    MatchroomActionDispatcher,
)


def test_dispatcher_reconciles_roster_then_no_pot_switches_turn() -> None:
    matchroom_service = MatchroomService(repository=MatchroomRepository())
    dispatcher = MatchroomActionDispatcher()

    room = matchroom_service.connect_player_to_matchroom(
        {"id": "room_dispatch"},
        {"id": "", "session_key": "p1", "display_name": "P1"},
        {"id": "", "match_importance": "practice match", "frames_to_win": 3},
    )
    matchroom_service.connect_player_to_matchroom(
        {"id": room.id},
        {"id": "", "session_key": "p2", "display_name": "P2"},
        {"id": "", "match_importance": "practice match", "frames_to_win": 3},
    )

    assert room.match is not None
    assert room.current_frame_id is not None
    frame = room.match.frames[room.current_frame_id]

    # With default score_keeper='opp', p2 records p1's miss.
    handled, error = dispatcher.dispatch(
        room,
        "p2",
        {"action": "shot", "data": {"potted_balls": [], "foul": 0}},
    )

    assert handled is True
    assert error is None
    assert frame.turn_state.current_turn == "p2"


def test_dispatcher_logs_summary_break_through_history() -> None:
    matchroom_service = MatchroomService(repository=MatchroomRepository())
    dispatcher = MatchroomActionDispatcher()

    room = matchroom_service.connect_player_to_matchroom(
        {"id": "room_log_break"},
        {"id": "", "session_key": "p1", "display_name": "P1"},
        {"id": "", "match_importance": "practice match", "frames_to_win": 3},
    )
    matchroom_service.connect_player_to_matchroom(
        {"id": room.id},
        {"id": "", "session_key": "p2", "display_name": "P2"},
        {"id": "", "match_importance": "practice match", "frames_to_win": 3},
    )

    assert room.match is not None
    assert room.current_frame_id is not None
    frame = room.match.frames[room.current_frame_id]

    handled, error = dispatcher.dispatch(
        room,
        "p2",
        {"action": "log_break", "data": {"points": 35, "foul": 4}},
    )

    assert handled is True
    assert error is None
    assert frame.scoring_state.scores == {"p1": 35, "p2": 4}
    assert frame.turn_state.current_turn == "p2"
    assert frame.turn_state.previously_fouled is True
    assert len(frame.history) == 1
    assert frame.history[0]["event"] == {
        "action": "log_break",
        "data": {"points": 35, "foul": 4},
    }
    assert frame.history[0]["outcome"]["composition_status"] == "missing"
    assert frame.history[0]["outcome"]["composition_suggestions"]
