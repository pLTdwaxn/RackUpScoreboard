from __future__ import annotations

from collections.abc import Sequence
from typing import TYPE_CHECKING

from scoreboard.domain.frame_calculation.helpers import opponent_key
from scoreboard.domain.orchestrators.effects.frame_effects import (
    AwardPenaltyEffect,
    BumpBreakEffect,
    ResetBreakEffect,
    ScorePointsEffect,
    SetPreviouslyFouledEffect,
    UpdateHighestBreakEffect,
    UpdateTurnEffect,
)

from .results import BreakResult, FoulResult, ScoreResult, TurnResult

if TYPE_CHECKING:
    from scoreboard.domain.orchestrators.contracts import FrameCalculationContext
    from scoreboard.domain.orchestrators.effects.contracts import FrameEffect


class SummaryBreakProcessor:
    def process(self, context: FrameCalculationContext) -> Sequence[FrameEffect]:
        frame = context.frame
        payload = context.payload

        assert payload.action == "log_break"

        points = payload.break_points
        foul_points = payload.foul
        opponent = opponent_key(frame)
        current_turn = frame.turn_state.current_turn
        next_player = opponent or current_turn

        context.foul_result = FoulResult(
            is_foul=foul_points > 0,
            points_awarded=foul_points,
        )
        context.score_result = ScoreResult(
            player=current_turn,
            points=points,
            break_points=points,
            is_scoring_shot=points > 0,
        )
        context.turn_result = TurnResult(next_player=next_player)
        context.break_result = BreakResult(
            break_points=frame.scoring_state.current_break + points,
            break_increment=points,
            update_highest=True,
            reset_break=True,
        )

        effects: list[FrameEffect] = []
        if points:
            effects.append(ScorePointsEffect(points))
            effects.append(BumpBreakEffect(points))
        if foul_points:
            effects.append(AwardPenaltyEffect(foul_points))
        effects.extend(
            [
                UpdateHighestBreakEffect(),
                ResetBreakEffect(),
                SetPreviouslyFouledEffect(foul_points > 0),
                UpdateTurnEffect(context.turn_result),
            ]
        )
        return effects


summary_break_processor = SummaryBreakProcessor()
