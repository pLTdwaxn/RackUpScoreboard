from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class MatchModel:
    frames_to_win: Optional[int] = 0
    match_type: str = "standard"
    is_finished: bool = False
    match_scores: dict[str, int] = field(default_factory=dict)

    def payload(self, match_id: str, highest_break: int) -> dict:
        frames_to_win = self.frames_to_win if self.frames_to_win and self.frames_to_win > 0 else None

        return {
            "id": match_id,
            "name": match_id,
            "frames_to_win": frames_to_win,
            "winning_condition": (f"First to {frames_to_win}" if frames_to_win else "Open frame"),
            "match_importance": "Practice Match",
            "status": "finished" if self.is_finished else "in_progress",
            "highest_break": highest_break if highest_break > 0 else None,
        }
