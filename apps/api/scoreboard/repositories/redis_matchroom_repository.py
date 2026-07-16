from __future__ import annotations

import json
from typing import Any

from scoreboard.domain.models.matchroom import Matchroom
from scoreboard.repositories.matchroom_serializer import (
    deserialize_matchroom,
    serialize_matchroom,
)


class RedisMatchroomRepository:
    def __init__(
        self,
        redis_url: str,
        key_prefix: str,
        client: Any | None = None,
    ) -> None:
        self._client = client or self._create_client(redis_url)
        self._key_prefix = key_prefix.rstrip(":")

    def get(self, matchroom_id: str) -> Matchroom | None:
        raw_matchroom = self._client.get(self._key(matchroom_id))
        if raw_matchroom is None:
            return None

        if isinstance(raw_matchroom, bytes):
            raw_matchroom = raw_matchroom.decode("utf-8")

        return deserialize_matchroom(json.loads(raw_matchroom))

    def save(self, matchroom: Matchroom) -> None:
        self._client.set(
            self._key(matchroom.id),
            json.dumps(serialize_matchroom(matchroom)),
        )

    def delete(self, matchroom_id: str) -> None:
        self._client.delete(self._key(matchroom_id))

    def clear(self) -> None:
        cursor = 0
        pattern = self._key("*")
        while True:
            cursor, keys = self._client.scan(cursor=cursor, match=pattern, count=100)
            if keys:
                self._client.delete(*keys)
            if cursor == 0:
                break

    def _key(self, matchroom_id: str) -> str:
        return f"{self._key_prefix}:matchroom:{matchroom_id}"

    @staticmethod
    def _create_client(redis_url: str):
        from redis import Redis

        return Redis.from_url(redis_url)
