from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum

from scoreboard.domain.balls import COLOUR_BALLS, RED_BALL


class FrameStatus(str, Enum):
    READY = "ready"
    ACTIVE = "active"
    FINISHED = "finished"


class FramePhase(str, Enum):
    REDS = "reds"
    COLOURS = "colours"
    RESPOTTED_BLACK = "respotted_black"


@dataclass
class FrameRuleState:
    points_remaining: int = 147
    snookers_required: int = 0
    miss_rule_available: bool = True


@dataclass
class FrameTableState:
    phase: FramePhase = FramePhase.REDS
    reds_remaining: int = 15
    colours_on_table: dict[str, bool] = field(default_factory=lambda: {ball: True for ball in COLOUR_BALLS})
    object_ball: str = RED_BALL
    free_ball_nominated_colour: str | None = None
    free_ball_object_ball: str | None = None


@dataclass
class FrameScoringState:
    scores: dict[str, int] = field(default_factory=dict)
    current_break: int = 0
    highest_break: int = 0


@dataclass
class FrameTurnState:
    current_turn: str = ""
    opening_turn: str = ""
    previously_fouled: bool = False


@dataclass
class FrameLifecycleState:
    status: FrameStatus = FrameStatus.READY
    winner_key: str | None = None
