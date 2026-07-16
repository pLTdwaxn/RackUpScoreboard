from __future__ import annotations

import fnmatch

from scoreboard.domain.models.matchroom import Matchroom
from scoreboard.domain.services.matchroom_service import MatchroomService
from scoreboard.repositories.matchroom_repository import MatchroomRepository
from scoreboard.repositories.redis_matchroom_repository import RedisMatchroomRepository


class FakeRedis:
    def __init__(self) -> None:
        self.values: dict[str, str] = {}

    def get(self, key: str):
        return self.values.get(key)

    def set(self, key: str, value: str) -> None:
        self.values[key] = value

    def delete(self, *keys: str) -> None:
        for key in keys:
            self.values.pop(key, None)

    def scan(self, cursor: int = 0, match: str | None = None, count: int = 100):
        keys = [key for key in self.values if match is None or fnmatch.fnmatch(key, match)]
        return 0, keys[:count]


def _create_room() -> Matchroom:
    service = MatchroomService(repository=MatchroomRepository())
    room = service.connect_player_to_matchroom(
        {"id": "", "score_keeper": "opp"},
        {"id": "", "session_key": "p1", "display_name": "Player 1"},
        {"id": "", "match_importance": "practice match", "frames_to_win": 3},
    )
    service.connect_player_to_matchroom(
        {"id": room.id, "score_keeper": "opp"},
        {"id": "", "session_key": "p2", "display_name": "Player 2"},
        {"id": "", "match_importance": "practice match", "frames_to_win": 3},
    )
    return room


def test_redis_matchroom_repository_saves_and_rehydrates_matchroom() -> None:
    redis = FakeRedis()
    repository = RedisMatchroomRepository(
        redis_url="redis://example.invalid/0",
        key_prefix="test:scoreboard",
        client=redis,
    )
    room = _create_room()

    repository.save(room)
    restored = repository.get(room.id)

    assert restored is not None
    assert restored.id == room.id
    assert restored.players[0].session_key == "p1"
    assert restored.players[1].session_key == "p2"
    assert restored.match is not None
    assert restored.current_frame_id in restored.match.frames


def test_redis_matchroom_repository_delete_removes_matchroom() -> None:
    repository = RedisMatchroomRepository(
        redis_url="redis://example.invalid/0",
        key_prefix="test:scoreboard",
        client=FakeRedis(),
    )
    room = _create_room()

    repository.save(room)
    repository.delete(room.id)

    assert repository.get(room.id) is None


def test_redis_matchroom_repository_clear_removes_namespaced_matchrooms_only() -> None:
    redis = FakeRedis()
    redis.set("other:key", "kept")
    repository = RedisMatchroomRepository(
        redis_url="redis://example.invalid/0",
        key_prefix="test:scoreboard",
        client=redis,
    )

    repository.save(_create_room())
    repository.clear()

    assert redis.values == {"other:key": "kept"}
