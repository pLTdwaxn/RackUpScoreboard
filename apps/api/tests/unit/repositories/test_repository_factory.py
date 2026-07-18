from __future__ import annotations

from scoreboard.repositories import factory
from scoreboard.repositories.matchroom_repository import MatchroomRepository
from scoreboard.repositories.redis_matchroom_repository import RedisMatchroomRepository


def test_create_matchroom_repository_uses_in_memory_repository_for_test_env(monkeypatch) -> None:
    monkeypatch.setattr(factory.settings, "ENV", "test")
    monkeypatch.setattr(factory.settings, "STUB_REDIS", False)

    repository = factory.create_matchroom_repository()

    assert isinstance(repository, MatchroomRepository)


def test_create_matchroom_repository_uses_in_memory_repository_for_stubbed_dev(monkeypatch) -> None:
    monkeypatch.setattr(factory.settings, "ENV", "dev")
    monkeypatch.setattr(factory.settings, "STUB_REDIS", True)

    repository = factory.create_matchroom_repository()

    assert isinstance(repository, MatchroomRepository)


def test_create_matchroom_repository_uses_redis_repository_outside_stubbed_env(monkeypatch) -> None:
    monkeypatch.setattr(factory.settings, "ENV", "prod")
    monkeypatch.setattr(factory.settings, "STUB_REDIS", False)
    monkeypatch.setattr(factory.settings, "REDIS_URL", "redis://example.invalid:6379/0")
    monkeypatch.setattr(factory.settings, "REDIS_KEY_PREFIX", "test:scoreboard")
    monkeypatch.setattr(RedisMatchroomRepository, "_create_client", staticmethod(lambda redis_url: object()))

    repository = factory.create_matchroom_repository()

    assert isinstance(repository, RedisMatchroomRepository)
