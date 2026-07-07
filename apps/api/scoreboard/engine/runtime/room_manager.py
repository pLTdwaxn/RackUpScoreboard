from __future__ import annotations

from typing import Dict

from scoreboard.engine.models.match_session import MatchSession
from scoreboard.engine.models.participant import Participant


class MatchSessionManager:
    def __init__(self):
        self.active_sessions: Dict[str, MatchSession] = {}

    def get_or_create_session(
        self,
        match_id: str,
        p1: Participant,
        score_keeper: str = "opp",
    ) -> MatchSession:
        if match_id not in self.active_sessions:
            self.active_sessions[match_id] = MatchSession(match_id, p1, score_keeper)
        return self.active_sessions[match_id]

    def close_session(self, match_id: str) -> None:
        if match_id in self.active_sessions:
            del self.active_sessions[match_id]


session_manager = MatchSessionManager()
