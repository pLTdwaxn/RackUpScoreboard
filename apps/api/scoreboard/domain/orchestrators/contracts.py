from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass
from typing import Optional, Protocol

from scoreboard.domain.models.frame import Frame

from ..processors.results import (
    BreakResult,
    FoulResult,
    FrameRuleStateResult,
    NextBallResult,
    PhaseResult,
    ScoreResult,
    TurnResult,
    WinConditionResult,
)
from .effects.contracts import FrameEffect


@dataclass
class ActionPayload:
    potted_balls: tuple[str, ...]
    foul: int = 0
    action: str = "shot"
    nominated_colour: str | None = None


@dataclass
class ActionOutcome:
    action: str
    result: str
    player_key: str | None = None
    potted_balls: tuple[str, ...] = ()
    break_points: int = 0
    foul_points: int = 0
    winner_key: str | None = None
    nominated_colour: str | None = None

    def to_dict(self) -> dict:
        return {
            "action": self.action,
            "result": self.result,
            "player_key": self.player_key,
            "potted_balls": list(self.potted_balls),
            "break_points": self.break_points,
            "foul_points": self.foul_points,
            "winner_key": self.winner_key,
            "nominated_colour": self.nominated_colour,
        }


@dataclass
class FrameCalculationContext:
    frame: Frame
    payload: ActionPayload

    foul_result: Optional[FoulResult] = None
    score_result: Optional[ScoreResult] = None
    turn_result: Optional[TurnResult] = None
    break_result: Optional[BreakResult] = None
    phase_result: Optional[PhaseResult] = None
    next_ball_result: Optional[NextBallResult] = None
    win_condition_result: Optional[WinConditionResult] = None
    frame_rule_state_result: Optional[FrameRuleStateResult] = None
    pending_effects: tuple[FrameEffect, ...] = ()

    def require_foul_result(self, processor_name: str) -> FoulResult:
        if self.foul_result is None:
            raise RuntimeError(f"{processor_name} requires FoulProcessor to run first.")
        return self.foul_result

    def require_score_result(self, processor_name: str) -> ScoreResult:
        if self.score_result is None:
            raise RuntimeError(f"{processor_name} requires ScoreProcessor to run first.")
        return self.score_result

    def require_turn_result(self, processor_name: str) -> TurnResult:
        if self.turn_result is None:
            raise RuntimeError(f"{processor_name} requires TurnProcessor to run first.")
        return self.turn_result

    def require_phase_result(self, processor_name: str) -> PhaseResult:
        if self.phase_result is None:
            raise RuntimeError(f"{processor_name} requires PhaseProcessor to run first.")
        return self.phase_result

    def require_next_ball_result(self, processor_name: str) -> NextBallResult:
        if self.next_ball_result is None:
            raise RuntimeError(f"{processor_name} requires NextBallProcessor to run first.")
        return self.next_ball_result


class FrameProcessor(Protocol):
    def process(self, context: FrameCalculationContext) -> Sequence[FrameEffect]: ...
