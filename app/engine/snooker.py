# app/engine/snooker.py
import json
from typing import Dict, List, Optional

from fastapi import WebSocket


class Participant:
    """Base class defining the unified interface for any table competitor."""

    def __init__(self, session_key: str, display_name: str, identity_type: str):
        self.session_key = session_key  # Unique routing key (e.g. "user_42" or "anon_abc")
        self.display_name = display_name  # UI text string
        self.identity_type = identity_type  # "verified" or "anonymous"

    def to_dict(self) -> dict:
        return {
            "key": self.session_key,
            "name": self.display_name,
            "type": self.identity_type,
        }


class VerifiedParticipant(Participant):
    def __init__(self, user_id: str, username: str):
        super().__init__(
            session_key=f"user_{user_id}",
            display_name=username,
            identity_type="verified",
        )
        self.user_id = user_id


class AnonymousParticipant(Participant):
    def __init__(self, guest_slug: str, nickname: str):
        super().__init__(
            session_key=f"anon_{guest_slug}",
            display_name=nickname,
            identity_type="anonymous",
        )
        self.guest_slug = guest_slug


class MatchRoom:
    """An in-memory real-time session interacting polymorphically with Participants."""

    def __init__(self, matchroom_id: str, p1: Participant):
        self.matchroom_id = matchroom_id
        self.connections: Dict[str, WebSocket] = {}  # { session_key: WebSocket }

        # Array of polymorphic participant instances
        self.players: List[Participant] = [p1]

        # Unified score tracking bound directly to the unique session keys
        self.scores: Dict[str, int] = {p1.session_key: 0}
        self.current_break = 0
        self.current_turn = p1.session_key
        self.is_finished = False
        self.match_id: Optional[str] = None

    def add_opponent(self, p2: Participant):
        if len(self.players) < 2:
            self.players.append(p2)
            self.scores[p2.session_key] = 0

    async def register_connection(self, session_key: str, websocket: WebSocket):
        self.connections[session_key] = websocket
        await websocket.accept()

    def remove_connection(self, session_key: str):
        if session_key in self.connections:
            del self.connections[session_key]

    async def broadcast(self, message: dict):
        for ws in list(self.connections.values()):
            try:
                await ws.send_text(json.dumps(message))
            except Exception:
                pass

    def record_action(self, session_key: str, event: dict):
        action = event.get("action")
        if action == "pot":
            points = int(event.get("points", 0))
            self.scores[session_key] += points
            self.current_break += points
        elif action in ["miss", "foul"]:
            self.current_break = 0
            # Flip turn to the alternative session key in our players list
            self.current_turn = next(p.session_key for p in self.players if p.session_key != session_key)

    def get_sync_payload(self) -> dict:
        """Serializes the exact structural layout Django needs to deduplicate records."""
        return {
            "match_id": self.match_id,
            "scores": self.scores,
            "players": [p.to_dict() for p in self.players],
        }


class MatchRoomManager:
    def __init__(self):
        self.active_rooms: Dict[str, MatchRoom] = {}

    def get_or_create_room(self, matchroom_id: str, p1: Participant) -> MatchRoom:
        if matchroom_id not in self.active_rooms:
            self.active_rooms[matchroom_id] = MatchRoom(matchroom_id, p1)
        return self.active_rooms[matchroom_id]

    def close_room(self, matchroom_id: str):
        if matchroom_id in self.active_rooms:
            del self.active_rooms[matchroom_id]


room_manager = MatchRoomManager()
