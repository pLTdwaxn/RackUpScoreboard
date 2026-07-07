"""Public engine exports and compatibility import surface."""

from scoreboard.engine.models.match_session import MatchSession
from scoreboard.engine.models.participant import (
    AnonymousParticipant,
    Participant,
    VerifiedParticipant,
)
from scoreboard.engine.runtime.room_manager import MatchSessionManager, session_manager

__all__ = [
    "AnonymousParticipant",
    "MatchSession",
    "MatchSessionManager",
    "Participant",
    "VerifiedParticipant",
    "session_manager",
]
