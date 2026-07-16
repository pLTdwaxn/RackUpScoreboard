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
