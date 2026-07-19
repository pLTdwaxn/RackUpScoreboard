import os

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("ENV", "test")
os.environ.setdefault("STUB_REDIS", "true")


@pytest.fixture
def clean_engine():
    from scoreboard.domain.services.matchroom_service import matchroom_service
    from scoreboard.runtime.connection_registry import matchroom_connection_registry

    for matchroom in getattr(matchroom_service.repository, "_matchrooms", {}).values():
        matchroom.pending_next_frame_confirmations.clear()
    matchroom_service.repository.clear()
    matchroom_connection_registry._connections.clear()
    yield matchroom_service


@pytest.fixture
def client(clean_engine):
    from scoreboard.main import app

    return TestClient(app)


@pytest.fixture
def connect_player(client):
    def _connect(
        display_name: str,
        matchroom_id: str | None = None,
        score_keeper: str | None = None,
    ) -> dict:
        payload = {"display_name": display_name}
        if matchroom_id is not None:
            payload["matchroom_id"] = matchroom_id
        if score_keeper is not None:
            payload["score_keeper"] = score_keeper

        response = client.post("/connect", json=payload)
        assert response.status_code == 200
        return response.json()

    return _connect


@pytest.fixture
def copying_matchroom_repository(monkeypatch):
    from scoreboard.domain.models.matchroom import Matchroom
    from scoreboard.domain.services.matchroom_service import matchroom_service
    from scoreboard.repositories.matchroom_serializer import (
        deserialize_matchroom,
        serialize_matchroom,
    )

    class CopyingMatchroomRepository:
        def __init__(self):
            self._matchrooms: dict[str, dict] = {}

        def get(self, matchroom_id: str) -> Matchroom | None:
            data = self._matchrooms.get(matchroom_id)
            if data is None:
                return None
            return deserialize_matchroom(data)

        def save(self, matchroom: Matchroom) -> None:
            self._matchrooms[matchroom.id] = serialize_matchroom(matchroom)

        def delete(self, matchroom_id: str) -> None:
            self._matchrooms.pop(matchroom_id, None)

        def clear(self) -> None:
            self._matchrooms.clear()

    repository = CopyingMatchroomRepository()
    monkeypatch.setattr(matchroom_service, "repository", repository)
    return repository
