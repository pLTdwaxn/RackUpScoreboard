# tests/conftest.py
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def mock_rackup_client():
    """Provides a mock service client handle for tests that still reference it."""

    mock = MagicMock()
    mock.fetch_tournament_match = AsyncMock(
        return_value={
            "match_id": "999",
            "player1_id": "42",
            "player2_id": "7",
            "player1_name": "RonnieO",
            "player2_name": "Judd_The_Ace",
        }
    )
    mock.sync_final_frame = AsyncMock(return_value=True)
    yield mock


@pytest.fixture
def clean_engine():
    from scoreboard.engine import session_manager
    from scoreboard.engine.runtime.connection_registry import connection_registry

    session_manager.active_sessions.clear()
    connection_registry._connections.clear()
    yield session_manager


@pytest.fixture
def client(clean_engine):
    from scoreboard.main import app

    return TestClient(app)
