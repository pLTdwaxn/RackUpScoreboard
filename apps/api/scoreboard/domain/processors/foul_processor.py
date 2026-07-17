from collections.abc import Sequence
from typing import TYPE_CHECKING

from scoreboard.domain.balls import BALL_POINTS, COLOUR_BALLS, RED_BALL
from scoreboard.domain.frame_calculation.helpers import (
    object_ball_equivalent_potted_balls,
    score_gap,
    scores_after_penalty,
)
from scoreboard.domain.models.frame import Frame
from scoreboard.domain.models.frame_state import FramePhase
from scoreboard.domain.orchestrators.effects.frame_effects import SetPreviouslyFouledEffect

from .results import FoulResult

if TYPE_CHECKING:
    from scoreboard.domain.orchestrators.contracts import FrameCalculationContext
    from scoreboard.domain.orchestrators.effects.contracts import FrameEffect


class FoulProcessor:
    def process(self, context: "FrameCalculationContext") -> Sequence["FrameEffect"]:
        frame = context.frame
        shot = context.payload

        assert shot.action == "shot"

        fouled_with = self._fouled_with(frame, object_ball_equivalent_potted_balls(frame, shot.potted_balls))
        declared_foul = shot.foul > 0

        if fouled_with:
            points_awarded = max(BALL_POINTS[ball] for ball in fouled_with)
            points_awarded = max(4, min(7, points_awarded))
        elif declared_foul:
            points_awarded = shot.foul
        else:
            points_awarded = 0

        is_foul = bool(fouled_with or declared_foul)
        result = FoulResult(
            is_foul=is_foul,
            points_awarded=points_awarded,
            fouled_with=fouled_with,
            respots_black=is_foul and self._respots_black(frame, points_awarded),
            finishes_frame=is_foul and self._finishes_frame(frame, points_awarded),
        )
        context.foul_result = result
        return [SetPreviouslyFouledEffect(result.is_foul and not result.respots_black and not result.finishes_frame)]

    def _fouled_with(self, frame: Frame, potted_balls: tuple[str, ...]) -> tuple[str, ...]:
        table = frame.table_state
        if not potted_balls:
            return ()

        if table.object_ball == RED_BALL:
            return potted_balls if any(ball in COLOUR_BALLS for ball in potted_balls) else ()

        if table.object_ball == "colour":
            if len(potted_balls) != 1 or potted_balls[0] == RED_BALL or potted_balls[0] not in COLOUR_BALLS:
                return potted_balls
            return ()

        if len(potted_balls) != 1 or potted_balls[0] == RED_BALL or potted_balls[0] != table.object_ball:
            return potted_balls

        return ()

    def _points_gap_after_penalty(self, frame: Frame, points_awarded: int) -> int:
        return score_gap(scores_after_penalty(frame, points_awarded))

    def _respots_black(self, frame: Frame, points_awarded: int) -> bool:
        table = frame.table_state
        return (
            table.object_ball == "black"
            and table.phase == FramePhase.COLOURS
            and self._points_gap_after_penalty(frame, points_awarded) == 0
        )

    def _finishes_frame(self, frame: Frame, points_awarded: int) -> bool:
        table = frame.table_state
        if table.object_ball != "black":
            return False
        if table.phase == FramePhase.RESPOTTED_BLACK:
            return True
        return table.phase == FramePhase.COLOURS and not self._respots_black(frame, points_awarded)


foul_processor = FoulProcessor()
