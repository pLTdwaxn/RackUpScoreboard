import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def clean_engine():
    from scoreboard.engine.runtime.connection_registry import connection_registry
    from scoreboard.engine.services.matchroom_manager import matchroom_manager

    for matchroom in matchroom_manager.active_matchrooms.values():
        matchroom.pending_next_frame_confirmations.clear()
    matchroom_manager.active_matchrooms.clear()
    connection_registry._connections.clear()
    yield matchroom_manager


@pytest.fixture
def client(clean_engine):
    from scoreboard.main import app

    return TestClient(app)
