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

    def orchestrate(self, frame: Frame, payload: ActionPayload):

        context = FrameCalculationContext(frame=frame, payload=payload)

        effects = []

        for processor in self.processors:
            processor_effects = processor.process(context)

            effects.extend(processor_effects)

        # Commit only after successful calculation
        frame.apply(effects)


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
