from collections.abc import Sequence
from typing import TYPE_CHECKING

from scoreboard.domain.frame_calculation.helpers import leading_player_key, scores_after_points
from scoreboard.domain.orchestrators.effects.frame_effects import FinishFrameEffect

from .results import WinConditionResult

if TYPE_CHECKING:
    from scoreboard.domain.orchestrators.contracts import FrameCalculationContext
    from scoreboard.domain.orchestrators.effects.contracts import FrameEffect


class WinConditionProcessor:
    def process(self, context: "FrameCalculationContext") -> Sequence["FrameEffect"]:
        foul = context.require_foul_result("WinConditionProcessor")
        phase = context.require_phase_result("WinConditionProcessor")
        next_ball = context.require_next_ball_result("WinConditionProcessor")

        finishes_frame = foul.finishes_frame or phase.finishes_frame or next_ball.finishes_frame
        if not finishes_frame:
            result = WinConditionResult(finishes_frame=False)
            context.win_condition_result = result
            return []

        result = WinConditionResult(
            finishes_frame=True,
            winner_key=self._winner_after_effects(context),
        )
        context.win_condition_result = result
        return [FinishFrameEffect(result)]

    def _winner_after_effects(self, context) -> str | None:
        scores = dict(context.frame.scoring_state.scores)
        score = context.require_score_result("WinConditionProcessor")

        if score.is_scoring_shot:
            scores = scores_after_points(scores, score.player, score.points)
        elif context.require_foul_result("WinConditionProcessor").is_foul:
            scores = scores_after_points(scores, score.player, score.points)

        return leading_player_key(scores)


win_condition_processor = WinConditionProcessor()
