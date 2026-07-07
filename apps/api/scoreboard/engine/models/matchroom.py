from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from scoreboard.engine.models.participant import Participant
    from scoreboard.engine.models.states import FrameStatus


@dataclass
class MatchroomModel:
    match_id: str
    players: list[Participant]
    score_keeper: str

    def add_player(self, player: Participant) -> None:
        if len(self.players) < 2:
            self.players.append(player)

    def payload(self, history_depth: int, frame_phase: FrameStatus) -> dict:
        return {
            "id": self.match_id,
            "status": "active" if self.players else "pending",
            "score_keeper": self.score_keeper,
            "history_depth": history_depth,
            "frame_phase": frame_phase.value,
        }
