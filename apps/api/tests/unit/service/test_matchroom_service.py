from scoreboard.domain.services.matchroom_service import MatchroomService
from scoreboard.repositories.matchroom_repository import MatchroomRepository


def test_second_player_join_updates_room_membership_only() -> None:
    matchroom_service = MatchroomService(repository=MatchroomRepository())

    room = matchroom_service.connect_player_to_matchroom(
        {"id": "room_sync"},
        {"id": "", "session_key": "p1", "display_name": "P1"},
        {"id": "", "match_importance": "practice match", "frames_to_win": 3},
    )

    matchroom_service.connect_player_to_matchroom(
        {"id": room.id},
        {"id": "", "session_key": "p2", "display_name": "P2"},
        {"id": "", "match_importance": "practice match", "frames_to_win": 3},
    )

    assert len(room.players) == 2
    assert room.players[1].session_key == "p2"
