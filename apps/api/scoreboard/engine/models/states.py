from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Dict, List, Optional

from scoreboard.engine.rules.messages import COLOUR_ORDER, RED_BALL

if TYPE_CHECKING:
    from scoreboard.engine.models.participant import Participant


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
    reds_remaining: int = 15
    colours_on_table: Dict[str, bool] = field(default_factory=lambda: {ball: True for ball in COLOUR_ORDER})
    object_ball: str = RED_BALL
    history: List[dict] = field(default_factory=list)
