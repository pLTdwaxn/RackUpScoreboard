import json

import pytest

from scoreboard.runtime.broadcast import broadcast_to_connections


class RecordingWebSocket:
    def __init__(self) -> None:
        self.messages: list[str] = []

    async def send_text(self, message: str) -> None:
        self.messages.append(message)


class FailingWebSocket:
    async def send_text(self, message: str) -> None:
        raise RuntimeError("socket closed")


@pytest.mark.anyio
async def test_broadcast_sends_message_to_all_open_connections() -> None:
    first = RecordingWebSocket()
    second = RecordingWebSocket()

    await broadcast_to_connections(
        {"p1": first, "p2": second},
        {"type": "game_state", "current_turn": "p1"},
    )

    assert json.loads(first.messages[0]) == {"type": "game_state", "current_turn": "p1"}
    assert json.loads(second.messages[0]) == {"type": "game_state", "current_turn": "p1"}


@pytest.mark.anyio
async def test_broadcast_ignores_connections_that_fail_to_send() -> None:
    open_socket = RecordingWebSocket()

    await broadcast_to_connections(
        {"closed": FailingWebSocket(), "open": open_socket},
        {"type": "player_status_change"},
    )

    assert json.loads(open_socket.messages[0]) == {"type": "player_status_change"}
