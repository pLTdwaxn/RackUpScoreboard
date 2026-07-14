from scoreboard.services.matchroom_action_dispatcher import (
    MatchroomActionDispatcher,
)
from scoreboard.services.matchroom_manager import MatchroomManager


def test_dispatcher_reconciles_roster_then_no_pot_switches_turn() -> None:
    manager = MatchroomManager()
    dispatcher = MatchroomActionDispatcher()

    room = manager.get_or_create_matchroom(
        {"id": "room_dispatch"},
        {"id": "", "session_key": "p1", "display_name": "P1"},
        {"id": "", "match_importance": "practice match", "frames_to_win": 3},
    )
    manager.get_or_create_matchroom(
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
    assert frame.current_turn == "p2"
