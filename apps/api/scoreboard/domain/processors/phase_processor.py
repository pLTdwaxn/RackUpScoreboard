from __future__ import annotations

from collections.abc import Sequence
from typing import TYPE_CHECKING

from scoreboard.domain.balls import RED_BALL
from scoreboard.domain.models.frame_state import FramePhase
from scoreboard.domain.orchestrators.effects.frame_effects import RespotBlackEffect, UpdatePhaseEffect

from .results import PhaseResult

if TYPE_CHECKING:
    from scoreboard.domain.orchestrators.contracts import FrameCalculationContext
    from scoreboard.domain.orchestrators.effects.contracts import FrameEffect


class PhaseProcessor:
    def process(self, context: FrameCalculationContext) -> Sequence[FrameEffect]:
        frame = context.frame
        table = frame.table_state
        foul = context.require_foul_result("PhaseProcessor")
        score = context.require_score_result("PhaseProcessor")

        if foul.respots_black:
            result = PhaseResult(FramePhase.RESPOTTED_BLACK, respot_black=True)
            context.phase_result = result
            return [RespotBlackEffect()]

        if foul.finishes_frame or table.phase == FramePhase.RESPOTTED_BLACK and self._turn_changes(context):
            result = PhaseResult(table.phase, finishes_frame=True)
            context.phase_result = result
            return []

        phase = table.phase
        future_reds = max(0, table.reds_remaining - score.reds_removed)

        if table.phase == FramePhase.REDS and future_reds == 0 and self._advances_after_turn_change(context):
            phase = FramePhase.COLOURS
        elif table.phase == FramePhase.REDS and score.potted_ball != RED_BALL and future_reds == 0:
            phase = FramePhase.COLOURS

        result = PhaseResult(phase)
        context.phase_result = result
        return [UpdatePhaseEffect(result)] if phase != table.phase else []

    def _turn_changes(self, context) -> bool:
        return context.require_turn_result("PhaseProcessor").next_player != context.frame.turn_state.current_turn

    def _advances_after_turn_change(self, context) -> bool:
        shot = context.payload
        return (
            context.require_foul_result("PhaseProcessor").is_foul or shot.action == "pass_shot" or not shot.potted_balls
        )


phase_processor = PhaseProcessor()
