from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import TYPE_CHECKING, Dict, List, Optional

from ..rules import COLOUR_BALLS, RED_BALL

if TYPE_CHECKING:
    from scoreboard.engine.models.participant import Participant


class FrameStatus(str, Enum):
    READY = "ready"
    ACTIVE = "active"
    FINISHED = "finished"


@dataclass
class RoomState:
    match_id: str
    players: List[Participant]


@dataclass
class MatchState:
    frames_to_win: Optional[int] = 0
    match_type: str = "standard"
    is_finished: bool = False


@dataclass
class FrameState:
    scores: Dict[str, int]
    highest_break: int = 0
    current_break: int = 0
    current_turn: str = ""
    phase: FrameStatus = FrameStatus.READY
    reds_remaining: int = 15
    colours_on_table: Dict[str, bool] = field(default_factory=lambda: {ball: True for ball in COLOUR_BALLS})
    object_ball: str = RED_BALL
    history: List[dict] = field(default_factory=list)
