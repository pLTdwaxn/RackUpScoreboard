from __future__ import annotations

from collections.abc import Sequence
from typing import TYPE_CHECKING

from scoreboard.domain.orchestrators.effects.frame_effects import DeclareFreeBallEffect, SetPreviouslyFouledEffect

from .results import FoulResult, NextBallResult, ScoreResult

if TYPE_CHECKING:
    from scoreboard.domain.orchestrators.contracts import FrameCalculationContext
    from scoreboard.domain.orchestrators.effects.contracts import FrameEffect


class PassShotProcessor:
    def process(self, context: FrameCalculationContext) -> Sequence[FrameEffect]:
        frame = context.frame
        context.foul_result = FoulResult(is_foul=False)
        context.score_result = ScoreResult(player=frame.turn_state.current_turn, points=0)
        return [SetPreviouslyFouledEffect(False)]


class DeclareFreeBallProcessor:
    def process(self, context: FrameCalculationContext) -> Sequence[FrameEffect]:
        frame = context.frame
        shot = context.payload
        result = NextBallResult(ball=shot.nominated_colour or frame.table_state.object_ball)
        context.next_ball_result = result
        return [DeclareFreeBallEffect(result)]


pass_shot_processor = PassShotProcessor()
declare_free_ball_processor = DeclareFreeBallProcessor()
