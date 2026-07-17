from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

from scoreboard.domain.balls import BALL_POINTS, RED_BALL
from scoreboard.domain.frame_calculation.helpers import opponent_key
from scoreboard.domain.models.frame import Frame
from scoreboard.domain.models.frame_state import FramePhase, FrameRuleState, FrameStatus

if TYPE_CHECKING:
    from scoreboard.domain.processors.results import (
        BreakResult,
        NextBallResult,
        PhaseResult,
        TurnResult,
        WinConditionResult,
    )


@dataclass
class AwardPenaltyEffect:
    points: int

    def apply(self, frame: Frame) -> None:
        opponent = opponent_key(frame)
        if opponent is None:
            return
        frame.scoring_state.scores[opponent] += self.points


@dataclass
class BumpBreakEffect:
    increment: int

    def apply(self, frame: Frame) -> None:
        frame.scoring_state.current_break += self.increment


@dataclass
class ClearFreeBallEffect:
    def apply(self, frame: Frame) -> None:
        frame.table_state.free_ball_nominated_colour = None
        frame.table_state.free_ball_object_ball = None


@dataclass
class DeclareFreeBallEffect:
    result: NextBallResult

    def apply(self, frame: Frame) -> None:
        if self.result.ball is not None:
            frame.table_state.free_ball_nominated_colour = self.result.ball
            frame.table_state.free_ball_object_ball = (
                self.result.ball if frame.table_state.object_ball == "colour" else frame.table_state.object_ball
            )
            frame.turn_state.previously_fouled = False


@dataclass
class FinishFrameEffect:
    result: WinConditionResult

    def apply(self, frame: Frame) -> None:
        frame.lifecycle_state.status = FrameStatus.FINISHED
        frame.lifecycle_state.winner_key = self.result.winner_key


@dataclass
class PreserveBreakEffect:
    result: BreakResult

    def apply(self, frame: Frame) -> None:
        frame.scoring_state.current_break = self.result.break_points


@dataclass
class RemoveColoursEffect:
    colours: tuple[str, ...]

    def apply(self, frame: Frame) -> None:
        for colour in self.colours:
            if colour in frame.table_state.colours_on_table:
                frame.table_state.colours_on_table[colour] = False


@dataclass
class RemoveRedsEffect:
    count: int

    def apply(self, frame: Frame) -> None:
        frame.table_state.reds_remaining = max(0, frame.table_state.reds_remaining - self.count)


@dataclass
class ResetBreakEffect:
    def apply(self, frame: Frame) -> None:
        frame.scoring_state.current_break = 0


@dataclass
class RespotBlackEffect:
    def apply(self, frame: Frame) -> None:
        frame.table_state.phase = FramePhase.RESPOTTED_BLACK
        frame.table_state.object_ball = "black"
        frame.table_state.colours_on_table["black"] = True


@dataclass
class RespotColoursEffect:
    colours: tuple[str, ...]

    def apply(self, frame: Frame) -> None:
        for colour in self.colours:
            if colour in frame.table_state.colours_on_table:
                frame.table_state.colours_on_table[colour] = True


@dataclass
class SetFrameRuleStateEffect:
    rule_state: FrameRuleState

    def apply(self, frame: Frame) -> None:
        frame.rule_state = self.rule_state


@dataclass
class ScoreColourEffect:
    colour: str

    def apply(self, frame: Frame) -> None:
        if self.colour in BALL_POINTS:
            frame.scoring_state.scores[frame.turn_state.current_turn] += BALL_POINTS[self.colour]


@dataclass
class ScorePointsEffect:
    points: int

    def apply(self, frame: Frame) -> None:
        frame.scoring_state.scores[frame.turn_state.current_turn] += self.points


@dataclass
class ScoreRedsEffect:
    count: int

    def apply(self, frame: Frame) -> None:
        frame.scoring_state.scores[frame.turn_state.current_turn] += self.count * BALL_POINTS[RED_BALL]


@dataclass
class SetPreviouslyFouledEffect:
    value: bool

    def apply(self, frame: Frame) -> None:
        frame.turn_state.previously_fouled = self.value


@dataclass
class UpdateHighestBreakEffect:
    def apply(self, frame: Frame) -> None:
        if frame.scoring_state.highest_break < frame.scoring_state.current_break:
            frame.scoring_state.highest_break = frame.scoring_state.current_break


@dataclass
class UpdateNextBallEffect:
    result: NextBallResult

    def apply(self, frame: Frame) -> None:
        if self.result.ball is None:
            return
        frame.table_state.object_ball = self.result.ball


@dataclass
class UpdatePhaseEffect:
    result: PhaseResult

    def apply(self, frame: Frame) -> None:
        frame.table_state.phase = self.result.phase


@dataclass
class UpdateTurnEffect:
    result: TurnResult

    def apply(self, frame: Frame) -> None:
        frame.turn_state.current_turn = self.result.next_player
