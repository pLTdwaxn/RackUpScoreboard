from __future__ import annotations

from typing import Protocol

from scoreboard.domain.models.matchroom import Matchroom


class MatchroomStore(Protocol):
    def get(self, matchroom_id: str) -> Matchroom | None: ...

    def save(self, matchroom: Matchroom) -> None: ...

    def delete(self, matchroom_id: str) -> None: ...

    def clear(self) -> None: ...
