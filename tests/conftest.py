# tests/conftest.py
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def mock_rackup_client():
    """Globally mocks the client reference exactly where the WebSocket router consumes it."""
    # Target the exact module execution file namespace
    with patch("app.api.websocket.RackUpServiceClient") as mock:
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
    from app.engine.snooker import room_manager

    room_manager.active_rooms.clear()
    yield room_manager


@pytest.fixture
def client(clean_engine):
    from app.main import app

    return TestClient(app)
