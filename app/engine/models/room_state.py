from __future__ import annotations

from typing import Dict, List, Optional

from app.engine.models.participant import Participant


class MatchRoom:
    """Holds match state independent from transport details."""

    def __init__(self, match_id: str, p1: Participant):
        self.match_id = match_id
        self.players: List[Participant] = [p1]
        self.scores: Dict[str, int] = {p1.session_key: 0}
        self.highest_break = 0
        self.current_break = 0
        self.current_turn = p1.session_key
        self.is_finished = False
        self.frames_to_win: Optional[int] = 0

    def add_opponent(self, p2: Participant):
        if len(self.players) < 2:
            self.players.append(p2)
            self.scores[p2.session_key] = 0

    def record_action(self, session_key: str, event: dict):
        action = event.get("action")
        if action == "pot":
            points = int(event.get("points", 0))
            self.scores[session_key] += points
            self.current_break += points
        elif action in ["miss", "foul"]:
            self.current_break = 0
            self.current_turn = next(p.session_key for p in self.players if p.session_key != session_key)

    def get_sync_payload(self) -> dict:
        return {
            "match_id": self.match_id,
            "scores": self.scores,
            "players": [p.to_dict() for p in self.players],
        }
