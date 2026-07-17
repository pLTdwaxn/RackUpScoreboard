from __future__ import annotations

from collections.abc import Sequence
from typing import TYPE_CHECKING

from scoreboard.domain.orchestrators.effects.frame_effects import (
    BumpBreakEffect,
    PreserveBreakEffect,
    ResetBreakEffect,
    UpdateHighestBreakEffect,
)

from .results import BreakResult

if TYPE_CHECKING:
    from scoreboard.domain.orchestrators.contracts import FrameCalculationContext
    from scoreboard.domain.orchestrators.effects.contracts import FrameEffect


class BreakProcessor:
    def process(self, context: FrameCalculationContext) -> Sequence[FrameEffect]:
        frame = context.frame
        shot = context.payload
        foul = context.require_foul_result("BreakProcessor")
        score = context.require_score_result("BreakProcessor")

        if foul.finishes_frame or foul.respots_black:
            result = BreakResult(
                break_points=frame.current_break,
                update_highest=True,
                reset_break=False,
            )
            context.break_result = result
            return [UpdateHighestBreakEffect(), PreserveBreakEffect(result)]

        if foul.is_foul or shot.action == "pass_shot" or not shot.potted_balls:
            result = BreakResult(
                break_points=0,
                update_highest=True,
                reset_break=True,
            )
            context.break_result = result
            return [UpdateHighestBreakEffect(), ResetBreakEffect()]

        result = BreakResult(
            break_points=frame.current_break + score.break_points,
            break_increment=score.break_points,
        )
        context.break_result = result
        return [BumpBreakEffect(score.break_points)]


break_processor = BreakProcessor()
