from __future__ import annotations

from typing import TYPE_CHECKING, Mapping

if TYPE_CHECKING:
    from scoreboard.engine.models.participant import Participant


class PlayerModel:
    @staticmethod
    def payload(
        players: list[Participant],
        scores: Mapping[str, int],
        match_scores: Mapping[str, int],
    ) -> list[dict]:
        return [
            {
                **player.to_dict(),
                "match_score": match_scores.get(player.session_key, 0),
                "current_frame_score": scores.get(player.session_key, 0),
                "highest_break": None,
            }
            for player in players
        ]

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
