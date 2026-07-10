from scoreboard.engine.services.matchroom_manager import MatchroomManager


def test_second_player_join_updates_room_membership_only() -> None:
    manager = MatchroomManager()

    room = manager.get_or_create_matchroom(
        {"id": "room_sync"},
        {"id": "", "session_key": "p1", "display_name": "P1"},
        {"id": "", "match_importance": "practice match", "frames_to_win": 3},
    )

    manager.get_or_create_matchroom(
        {"id": room.id},
        {"id": "", "session_key": "p2", "display_name": "P2"},
        {"id": "", "match_importance": "practice match", "frames_to_win": 3},
    )

    assert len(room.players) == 2
    assert room.players[1].session_key == "p2"
