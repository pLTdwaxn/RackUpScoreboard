from __future__ import annotations

from scoreboard.config import settings
from scoreboard.repositories.matchroom_repository import MatchroomRepository
from scoreboard.repositories.protocols import MatchroomStore


def create_matchroom_repository() -> MatchroomStore:
    if settings.ENV == "test":
        return MatchroomRepository()

    if settings.ENV == "dev" and settings.STUB_REDIS:
        return MatchroomRepository()

    from scoreboard.repositories.redis_matchroom_repository import RedisMatchroomRepository

    return RedisMatchroomRepository(
        redis_url=settings.REDIS_URL,
        key_prefix=settings.REDIS_KEY_PREFIX,
    )
