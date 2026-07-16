from __future__ import annotations

from scoreboard.repositories import factory
from scoreboard.repositories.matchroom_repository import MatchroomRepository


def test_create_matchroom_repository_uses_in_memory_repository_for_test_env(monkeypatch) -> None:
    monkeypatch.setattr(factory.settings, "ENV", "test")
    monkeypatch.setattr(factory.settings, "STUB_REDIS", False)

    repository = factory.create_matchroom_repository()

    assert isinstance(repository, MatchroomRepository)
