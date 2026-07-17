from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Optional

from scoreboard.domain.models.frame import Frame


class MatchStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    FINISHED = "finished"


class MatchState:
    frames_to_win: Optional[int] = 0
    match_type: str = "standard"
    is_finished: bool = False


@dataclass
class Match:
    id: str  # External ID pointing to a match record in RackUp
    matchroom_id: str
    player_ids: list[str]  # List of player session keys
    frames: dict[str, Frame]  # List of frame IDs
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
        frames: dict[str, Frame] | None = None,
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
