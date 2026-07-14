from __future__ import annotations

from dataclasses import dataclass
from typing import Mapping


@dataclass
class Player:
    id: str  # External ID pointing to a player record in RackUp
    session_key: str  # For anonymous players, this can be the same as id
    name: str
    identity_type: str
    role: str

    def __init__(
        self,
        id: str,
        session_key: str,
        name: str,
        identity_type: str = "anonymous",
        role: str = "player",
    ) -> None:
        self.id = id
        self.session_key = session_key
        self.name = name
        self.identity_type = identity_type
        self.role = role

    # Need dedicated serialiser serivce
    def payload(
        self,
        scores: Mapping[str, int],
        match_scores: Mapping[str, int],
    ) -> dict:
        return {
            **self.__dict__,
            "match_score": match_scores.get(self.session_key, 0),
            "current_frame_score": scores.get(self.session_key, 0),
            "highest_break": None,  # Placeholder for future implementation
        }

    @staticmethod
    def state_payload(players_payload: list[dict], current_turn: str) -> list[dict]:
        return [
            {
                "key": player["key"],
                "is_at_table": player["key"] == current_turn,
                "current_frame_score": player["current_frame_score"],
            }
            for player in players_payload
        ]
