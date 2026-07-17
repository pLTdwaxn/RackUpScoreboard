from __future__ import annotations

from dataclasses import dataclass

from scoreboard.domain.models.frame_state import FramePhase, FrameRuleState


@dataclass
class BreakResult:
    break_points: int
    break_increment: int = 0
    update_highest: bool = False
    reset_break: bool = False


@dataclass
class FoulResult:
    is_foul: bool
    points_awarded: int = 0
    fouled_with: tuple[str, ...] = ()
    respots_black: bool = False
    finishes_frame: bool = False


@dataclass
class NextBallResult:
    ball: str | None
    finishes_frame: bool = False
    respot_black: bool = False


@dataclass
class PhaseResult:
    phase: FramePhase
    finishes_frame: bool = False
    respot_black: bool = False


@dataclass
class ScoreResult:
    player: str
    points: int
    reds_removed: int = 0
    break_points: int = 0
    colours_removed: tuple[str, ...] = ()
    colours_respotted: tuple[str, ...] = ()
    potted_ball: str | None = None
    is_scoring_shot: bool = False


@dataclass
class FrameRuleStateResult:
    rule_state: FrameRuleState


@dataclass
class TurnResult:
    next_player: str


@dataclass
class WinConditionResult:
    finishes_frame: bool
    winner_key: str | None = None
