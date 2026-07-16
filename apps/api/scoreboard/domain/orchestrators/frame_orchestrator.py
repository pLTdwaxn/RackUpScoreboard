from dataclasses import dataclass
from typing import List, Optional, Protocol

from scoreboard.domain.models.frame import Frame

from ..processors import (
    BreakResult,
    FoulResult,
    NextBallResult,
    PhaseResult,
    ScoreResult,
    SnookersRequiredResult,
    TurnResult,
    WinConditionResult,
    break_processor,
    foul_processor,
    next_ball_processor,
    phase_processor,
    score_processor,
    snookers_required_processor,
    turn_processor,
    win_condition_processor,
)
from .effects.frame_effect import FrameEffect

# ============================================================
# Shot Input
# ============================================================


@dataclass
class ActionPayload:
    potted_balls: tuple[str, ...]
    foul: int = 0
    action: str = "shot"
    nominated_colour: str | None = None


@dataclass
class ActionOutcome:
    action: str
    result: str
    player_key: str | None = None
    potted_balls: tuple[str, ...] = ()
    break_points: int = 0
    foul_points: int = 0
    winner_key: str | None = None
    nominated_colour: str | None = None

    def to_dict(self) -> dict:
        return {
            "action": self.action,
            "result": self.result,
            "player_key": self.player_key,
            "potted_balls": list(self.potted_balls),
            "break_points": self.break_points,
            "foul_points": self.foul_points,
            "winner_key": self.winner_key,
            "nominated_colour": self.nominated_colour,
        }


# ============================================================
# Calculation Context
# ============================================================


@dataclass
class FrameCalculationContext:
    frame: Frame
    payload: ActionPayload

    foul_result: Optional[FoulResult] = None
    score_result: Optional[ScoreResult] = None
    turn_result: Optional[TurnResult] = None
    break_result: Optional[BreakResult] = None
    phase_result: Optional[PhaseResult] = None
    next_ball_result: Optional[NextBallResult] = None
    win_condition_result: Optional[WinConditionResult] = None
    snookers_result: Optional[SnookersRequiredResult] = None


# ============================================================
# Processor Interface
# ============================================================


class ShotProcessor(Protocol):
    def process(self, context: FrameCalculationContext) -> List[FrameEffect]: ...


# ============================================================
# Orchestrator
# ============================================================


class FrameOrchestrator:
    def __init__(self):

        self.processors = [
            foul_processor,
            score_processor,
            turn_processor,
            break_processor,
            phase_processor,
            next_ball_processor,
            win_condition_processor,
            snookers_required_processor,
        ]

    def orchestrate(self, frame: Frame, payload: ActionPayload) -> ActionOutcome:

        context = FrameCalculationContext(frame=frame, payload=payload)

        effects = []

        for processor in self.processors:
            processor_effects = processor.process(context)

            effects.extend(processor_effects)

        # Commit only after successful calculation
        frame.apply(effects)
        return self._outcome_from_context(context)

    def _outcome_from_context(self, context: FrameCalculationContext) -> ActionOutcome:
        payload = context.payload
        score = context.score_result
        foul = context.foul_result
        win = context.win_condition_result

        if payload.action == "pass_shot":
            return ActionOutcome(action="pass_shot", result="passed")

        if payload.action == "declare_free_ball":
            return ActionOutcome(
                action="declare_free_ball",
                result="declared",
                nominated_colour=payload.nominated_colour,
            )

        if foul and foul.is_foul:
            return ActionOutcome(
                action=payload.action,
                result="foul",
                player_key=score.player if score else None,
                foul_points=foul.points_awarded,
                winner_key=win.winner_key if win and win.finishes_frame else None,
            )

        if win and win.finishes_frame:
            return ActionOutcome(
                action=payload.action,
                result="frame_won",
                player_key=score.player if score else None,
                potted_balls=payload.potted_balls,
                break_points=score.break_points if score else 0,
                winner_key=win.winner_key,
            )

        return ActionOutcome(
            action=payload.action,
            result="scoring" if score and score.break_points else "no_score",
            player_key=score.player if score else None,
            potted_balls=payload.potted_balls if score and score.break_points else (),
            break_points=score.break_points if score else 0,
        )


# ============================================================
# Usage
# ============================================================

# frame = Frame(
#     player_scores={Player.RED: 40, Player.YELLOW: 55},
#     current_player=Player.RED,
#     phase=FramePhase.REDS,
# )


# shot = ActionPayload(player=Player.RED, ball_hit=Ball.RED, balls_potted=[Ball.RED])


# orchestrator = FrameOrchestrator()

# orchestrator.orchestrate(frame, shot)

frame_orchestrator = FrameOrchestrator()
