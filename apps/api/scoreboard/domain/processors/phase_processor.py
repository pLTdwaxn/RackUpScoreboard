from __future__ import annotations

from dataclasses import dataclass

from scoreboard.domain.models.frame import Frame, FramePhase
from scoreboard.domain.rules import RED_BALL


class PhaseProcessor:
    def process(self, context):
        frame = context.frame
        foul = context.foul_result
        score = context.score_result
        shot = context.payload

        if shot.action == "declare_free_ball":
            result = PhaseResult(frame.phase)
            context.phase_result = result
            return []

        if foul.respots_black:
            result = PhaseResult(FramePhase.RESPOTTED_BLACK, respot_black=True)
            context.phase_result = result
            return [RespotBlackEffect()]

        if foul.finishes_frame or frame.phase == FramePhase.RESPOTTED_BLACK and self._turn_changes(context):
            result = PhaseResult(frame.phase, finishes_frame=True)
            context.phase_result = result
            return []

        phase = frame.phase
        future_reds = max(0, frame.reds_remaining - score.reds_removed)

        if frame.phase == FramePhase.REDS and future_reds == 0 and self._advances_after_turn_change(context):
            phase = FramePhase.COLOURS
        elif frame.phase == FramePhase.REDS and score.potted_ball != RED_BALL and future_reds == 0:
            phase = FramePhase.COLOURS

        result = PhaseResult(phase)
        context.phase_result = result
        return [UpdatePhaseEffect(result)] if phase != frame.phase else []

    def _turn_changes(self, context) -> bool:
        return context.turn_result.next_player != context.frame.current_turn

    def _advances_after_turn_change(self, context) -> bool:
        shot = context.payload
        return context.foul_result.is_foul or shot.action == "skip" or not shot.potted_balls


@dataclass
class UpdatePhaseEffect:
    result: PhaseResult

    def apply(self, frame: Frame):
        frame.phase = self.result.phase
        frame.recalculate_score_context()


@dataclass
class RespotBlackEffect:
    def apply(self, frame: Frame) -> None:
        frame.respot_black()


@dataclass
class PhaseResult:
    phase: FramePhase
    finishes_frame: bool = False
    respot_black: bool = False


phase_processor = PhaseProcessor()
