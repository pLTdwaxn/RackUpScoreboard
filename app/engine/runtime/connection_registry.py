from __future__ import annotations

from typing import Dict

from fastapi import WebSocket


class MatchConnectionRegistry:
    def __init__(self):
        self._connections: Dict[str, Dict[str, WebSocket]] = {}

    async def register(self, match_id: str, session_key: str, websocket: WebSocket):
        match_connections = self._connections.setdefault(match_id, {})
        match_connections[session_key] = websocket
        await websocket.accept()

    def remove(self, match_id: str, session_key: str):
        match_connections = self._connections.get(match_id)
        if not match_connections:
            return
        match_connections.pop(session_key, None)
        if not match_connections:
            self._connections.pop(match_id, None)

    def get(self, match_id: str) -> Dict[str, WebSocket]:
        return self._connections.get(match_id, {})


connection_registry = MatchConnectionRegistry()
