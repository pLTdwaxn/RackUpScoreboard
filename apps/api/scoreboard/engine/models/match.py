from __future__ import annotations

from dataclasses import dataclass
from enum import Enum

from scoreboard.engine.models.frame import FrameModel


class MatchStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    FINISHED = "finished"


@dataclass
class MatchModel:
    id: str  # External ID pointing to a match record in RackUp
    matchroom_id: str
    player_ids: list[str]  # List of player session keys
    frames: dict[str, FrameModel]  # List of frame IDs
    match_importance: str
    frames_to_win: int
    is_finished: bool  # Replace with status field to indicate if the match is finished or not
    status: MatchStatus
    match_scores: dict[str, int]

    def __init__(
        self,
        id: str,  # External ID pointing to a match record in RackUp
        matchroom_id: str,
        player_ids: list[str] | None = None,
        frames: dict[str, FrameModel] | None = None,
        match_importance: str = "Practice Match",
        frames_to_win: int = 0,
        status: MatchStatus = MatchStatus.PENDING,
    ) -> None:
        self.id = id
        self.matchroom_id = matchroom_id
        self.player_ids = player_ids or []
        self.frames = frames or {}
        self.match_importance = match_importance
        self.frames_to_win = frames_to_win or 0  # 0 indicates a practice match with no frame limit
        self.is_finished = False  # To deprecate
        self.status = status
        self.match_scores = {player_id: 0 for player_id in self.player_ids}

    def add_player(self, player_id: str) -> None:
        if len(self.player_ids) < 2:
            self.player_ids.append(player_id)

    # def _highest_break(self) -> int:
    # return max((frame.highest_break for frame in self.frames), default=0)

    def payload(self) -> dict:
        return {
            "id": None,  # Placeholder for future implementation
            "name": None,  # Placeholder for future implementation
            "match_importance": "Practice Match",
            "frames_to_win": self.frames_to_win,
            "status": self.status.value,
            "match_scores": self.match_scores,
        }
