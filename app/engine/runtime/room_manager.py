from __future__ import annotations

from typing import Dict

from app.engine.models.participant import Participant
from app.engine.models.room_state import MatchRoom


class MatchRoomManager:
    def __init__(self):
        self.active_rooms: Dict[str, MatchRoom] = {}

    def get_or_create_room(self, match_id: str, p1: Participant) -> MatchRoom:
        if match_id not in self.active_rooms:
            self.active_rooms[match_id] = MatchRoom(match_id, p1)
        return self.active_rooms[match_id]

    def close_room(self, match_id: str):
        if match_id in self.active_rooms:
            del self.active_rooms[match_id]


room_manager = MatchRoomManager()
