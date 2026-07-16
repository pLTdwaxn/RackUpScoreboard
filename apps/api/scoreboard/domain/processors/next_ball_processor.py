from __future__ import annotations

from dataclasses import dataclass

from scoreboard.domain.models.frame import Frame, FramePhase

from ..rules import COLOUR_BALLS, RED_BALL


class NextBallProcessor:
    def process(self, context):
        frame = context.frame
        shot = context.payload
        phase = context.phase_result

        if phase.finishes_frame or phase.respot_black:
            result = NextBallResult(ball=frame.object_ball)
            context.next_ball_result = result
            return []

        if shot.action == "declare_free_ball":
            result = NextBallResult(ball=shot.nominated_colour or frame.object_ball)
            context.next_ball_result = result
            return [DeclareFreeBallEffect(result)]

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
        score = context.score_result
        future_reds = max(0, frame.reds_remaining - score.reds_removed)

        if shot.action == "pass_shot" or context.foul_result.is_foul or not shot.potted_balls:
            return self._advance_after_turn_change(frame, future_reds)

        if frame.object_ball == RED_BALL:
            return "colour"

        colour = score.potted_ball or frame.object_ball
        if frame.phase == FramePhase.REDS:
            return RED_BALL if future_reds > 0 else "yellow"

        return self.remaining_colour_after(frame, colour)

    def _advance_after_turn_change(self, frame: Frame, future_reds: int) -> str | None:
        if future_reds > 0:
            return RED_BALL

        if frame.phase == FramePhase.REDS:
            return "yellow"

        if frame.phase == FramePhase.COLOURS:
            if frame.object_ball != "black" and frame.colours_on_table.get(frame.object_ball, False):
                return frame.object_ball

            return self.remaining_colour_after(frame, frame.object_ball)

        if frame.phase == FramePhase.RESPOTTED_BLACK:
            return None

        return frame.object_ball

    def remaining_colour_after(self, frame: Frame, colour: str) -> str | None:
        try:
            index = COLOUR_BALLS.index(colour)
        except ValueError:
            return None

        for next_colour in COLOUR_BALLS[index + 1 :]:
            if frame.colours_on_table.get(next_colour, False):
                return next_colour
        return None

    def _should_respot_black(self, context) -> bool:
        frame = context.frame
        score = context.score_result
        if frame.phase != FramePhase.COLOURS:
            return False
        if frame.object_ball != "black" and score.potted_ball != "black":
            return False

        scores = dict(frame.scores)
        if score.is_scoring_shot:
            scores[frame.current_turn] += score.points

        values = list(scores.values())
        return max(values, default=0) - min(values, default=0) == 0


@dataclass
class UpdateNextBallEffect:
    result: NextBallResult

    def apply(self, frame: Frame):
        frame.object_ball = self.result.ball
        frame.recalculate_score_context()


@dataclass
class RespotBlackEffect:
    def apply(self, frame: Frame) -> None:
        frame.respot_black()


@dataclass
class DeclareFreeBallEffect:
    result: "NextBallResult"

    def apply(self, frame: Frame) -> None:
        if self.result.ball is not None:
            frame.declare_free_ball(self.result.ball)


@dataclass
class NextBallResult:
    ball: str | None
    finishes_frame: bool = False
    respot_black: bool = False


next_ball_processor = NextBallProcessor()
