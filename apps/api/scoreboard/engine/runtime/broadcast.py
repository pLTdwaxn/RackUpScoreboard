from __future__ import annotations

import json
from typing import Dict

from fastapi import WebSocket


async def broadcast_to_connections(connections: Dict[str, WebSocket], message: dict):
    for ws in list(connections.values()):
        try:
            await ws.send_text(json.dumps(message))
        except Exception:
            pass
