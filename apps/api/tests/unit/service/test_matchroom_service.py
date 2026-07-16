from scoreboard.domain.services.matchroom_service import MatchroomService
from scoreboard.repositories.matchroom_repository import MatchroomRepository


class CountingMatchroomRepository(MatchroomRepository):
    def __init__(self) -> None:
        super().__init__()
        self.save_count = 0

    def save(self, matchroom) -> None:
        self.save_count += 1
        super().save(matchroom)


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


def test_save_matchroom_delegates_to_repository() -> None:
    repository = CountingMatchroomRepository()
    matchroom_service = MatchroomService(repository=repository)
    room = matchroom_service.connect_player_to_matchroom(
        {"id": "room_sync"},
        {"id": "", "session_key": "p1", "display_name": "P1"},
        {"id": "", "match_importance": "practice match", "frames_to_win": 3},
    )
    save_count_after_create = repository.save_count

    matchroom_service.save_matchroom(room)

    assert repository.save_count == save_count_after_create + 1
    assert repository.get(room.id) is room
