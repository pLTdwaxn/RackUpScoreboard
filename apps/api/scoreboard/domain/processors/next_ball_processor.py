from __future__ import annotations

from collections.abc import Sequence
from typing import TYPE_CHECKING

from scoreboard.domain.models.frame import Frame, FramePhase
from scoreboard.domain.orchestrators.effects.frame_effects import (
    RespotBlackEffect,
    UpdateNextBallEffect,
)
from scoreboard.domain.rules.frame_helpers import remaining_colour_after, score_gap, scores_after_points

from ..rules import RED_BALL
from .results import NextBallResult

if TYPE_CHECKING:
    from scoreboard.domain.orchestrators.contracts import FrameCalculationContext
    from scoreboard.domain.orchestrators.effects.contracts import FrameEffect


class NextBallProcessor:
    def process(self, context: FrameCalculationContext) -> Sequence[FrameEffect]:
        frame = context.frame
        phase = context.require_phase_result("NextBallProcessor")

        if phase.finishes_frame or phase.respot_black:
            result = NextBallResult(ball=frame.object_ball)
            context.next_ball_result = result
            return []

        ball = self._next_ball(context)
        respot_black = ball is None and self._should_respot_black(context)
        result = NextBallResult(
            ball="black" if respot_black else ball,
            finishes_frame=ball is None and not respot_black,
            respot_black=respot_black,
        )
        context.next_ball_result = result
        if respot_black:
            return [RespotBlackEffect()]
        if ball is None:
            return []
        return [UpdateNextBallEffect(result)]

    def _next_ball(self, context) -> str | None:
        frame = context.frame
        shot = context.payload
        score = context.require_score_result("NextBallProcessor")

        future_reds = max(0, frame.reds_remaining - score.reds_removed)

        foul = context.require_foul_result("NextBallProcessor")

        if shot.action == "pass_shot" or foul.is_foul or not shot.potted_balls:
            return self._advance_after_turn_change(frame, future_reds)

        if frame.object_ball == RED_BALL:
            return "colour"

        colour = score.potted_ball or frame.object_ball
        if frame.phase == FramePhase.REDS:
            return RED_BALL if future_reds > 0 else "yellow"

        return remaining_colour_after(frame, colour)

    def _advance_after_turn_change(self, frame: Frame, future_reds: int) -> str | None:
        if future_reds > 0:
            return RED_BALL

        if frame.phase == FramePhase.REDS:
            return "yellow"

        if frame.phase == FramePhase.COLOURS:
            if frame.object_ball != "black" and frame.colours_on_table.get(frame.object_ball, False):
                return frame.object_ball

            return remaining_colour_after(frame, frame.object_ball)

        if frame.phase == FramePhase.RESPOTTED_BLACK:
            return None

        return frame.object_ball

    def _should_respot_black(self, context) -> bool:
        frame = context.frame
        score = context.require_score_result("NextBallProcessor")

        if frame.phase != FramePhase.COLOURS:
            return False
        if frame.object_ball != "black" and score.potted_ball != "black":
            return False

        scores = dict(frame.scores)
        if score.is_scoring_shot:
            scores = scores_after_points(scores, frame.current_turn, score.points)

        return score_gap(scores) == 0


next_ball_processor = NextBallProcessor()
