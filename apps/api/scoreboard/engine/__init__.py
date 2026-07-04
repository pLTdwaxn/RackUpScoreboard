"""Public engine exports and compatibility import surface."""

from scoreboard.engine.models.participant import (
    AnonymousParticipant,
    Participant,
    VerifiedParticipant,
)
from scoreboard.engine.models.room_state import MatchRoom
from scoreboard.engine.runtime.room_manager import MatchRoomManager, room_manager

__all__ = [
    "AnonymousParticipant",
    "MatchRoom",
    "MatchRoomManager",
    "Participant",
    "VerifiedParticipant",
    "room_manager",
]
