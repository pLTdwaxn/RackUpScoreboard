from __future__ import annotations

from typing import Dict

from fastapi import WebSocket


class MatchroomConnectionRegistry:
    def __init__(self):
        self._connections: Dict[str, Dict[str, WebSocket]] = {}

    async def register(self, matchroom_id: str, session_key: str, websocket: WebSocket):
        matchroom_connections = self._connections.setdefault(matchroom_id, {})
        matchroom_connections[session_key] = websocket
        await websocket.accept()

    def remove(self, matchroom_id: str, session_key: str):
        matchroom_connections = self._connections.get(matchroom_id)
        if not matchroom_connections:
            return
        matchroom_connections.pop(session_key, None)
        if not matchroom_connections:
            self._connections.pop(matchroom_id, None)

    def get(self, matchroom_id: str) -> Dict[str, WebSocket]:
        return self._connections.get(matchroom_id, {})


matchroom_connection_registry = MatchroomConnectionRegistry()
