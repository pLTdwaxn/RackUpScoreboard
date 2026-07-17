from __future__ import annotations

from dataclasses import dataclass

from scoreboard.domain.models.frame import Frame, FrameStatus
from scoreboard.domain.processors.results import (
    BreakResult,
    NextBallResult,
    PhaseResult,
    SnookersRequiredResult,
    TurnResult,
    WinConditionResult,
)


@dataclass
class AwardPenaltyEffect:
    points: int

    def apply(self, frame: Frame) -> None:
        frame.award_penalty(self.points)


@dataclass
class BumpBreakEffect:
    increment: int

    def apply(self, frame: Frame) -> None:
        frame.bump_current_break(self.increment)


@dataclass
class ClearFreeBallEffect:
    def apply(self, frame: Frame) -> None:
        frame.clear_free_ball()


@dataclass
class DeclareFreeBallEffect:
    result: NextBallResult

    def apply(self, frame: Frame) -> None:
        if self.result.ball is not None:
            frame.declare_free_ball(self.result.ball)


@dataclass
class FinishFrameEffect:
    result: WinConditionResult

    def apply(self, frame: Frame) -> None:
        frame.status = FrameStatus.FINISHED
        frame.winner_key = self.result.winner_key


@dataclass
class PreserveBreakEffect:
    result: BreakResult

    def apply(self, frame: Frame) -> None:
        frame.current_break = self.result.break_points


@dataclass
class RemoveColoursEffect:
    colours: tuple[str, ...]

    def apply(self, frame: Frame) -> None:
        frame.remove_colours(self.colours)


@dataclass
class RemoveRedsEffect:
    count: int

    def apply(self, frame: Frame) -> None:
        frame.remove_reds(self.count)


@dataclass
class ResetBreakEffect:
    def apply(self, frame: Frame) -> None:
        frame.reset_current_break()


@dataclass
class RespotBlackEffect:
    def apply(self, frame: Frame) -> None:
        frame.respot_black()


@dataclass
class RespotColoursEffect:
    colours: tuple[str, ...]

    def apply(self, frame: Frame) -> None:
        frame.respot_colours(self.colours)


@dataclass
class ScoreColourEffect:
    colour: str

    def apply(self, frame: Frame) -> None:
        frame.score_colour(self.colour)


@dataclass
class ScorePointsEffect:
    points: int

    def apply(self, frame: Frame) -> None:
        frame.scores[frame.current_turn] += self.points
        frame.recalculate_score_context()


@dataclass
class ScoreRedsEffect:
    count: int

    def apply(self, frame: Frame) -> None:
        frame.score_reds(self.count)


@dataclass
class SetPreviouslyFouledEffect:
    value: bool

    def apply(self, frame: Frame) -> None:
        frame.set_previously_fouled(self.value)


@dataclass
class UpdateHighestBreakEffect:
    def apply(self, frame: Frame) -> None:
        if frame.highest_break < frame.current_break:
            frame.update_highest_break(frame.current_break)


@dataclass
class UpdateNextBallEffect:
    result: NextBallResult

    def apply(self, frame: Frame) -> None:
        if self.result.ball is None:
            return
        frame.object_ball = self.result.ball
        frame.recalculate_score_context()


@dataclass
class UpdatePhaseEffect:
    result: PhaseResult

    def apply(self, frame: Frame) -> None:
        frame.phase = self.result.phase
        frame.recalculate_score_context()


@dataclass
class UpdateSnookersRequiredEffect:
    result: SnookersRequiredResult

    def apply(self, frame: Frame) -> None:
        frame.recalculate_score_context()


@dataclass
class UpdateTurnEffect:
    result: TurnResult

    def apply(self, frame: Frame) -> None:
        frame.current_turn = self.result.next_player
