from __future__ import annotations

from scoreboard.domain.processors import (
    break_processor,
    declare_free_ball_processor,
    foul_processor,
    next_ball_processor,
    pass_shot_processor,
    phase_processor,
    score_processor,
    snookers_required_processor,
    turn_processor,
    win_condition_processor,
)

from .contracts import FrameCalculationContext, FrameProcessor
from .effects.contracts import FrameEffect


class FramePipeline:
    processors: list[FrameProcessor]

    def __init__(self, processors: tuple[FrameProcessor, ...] | list[FrameProcessor]) -> None:
        self.processors = list(processors)

    def calculate(self, context: FrameCalculationContext) -> list[FrameEffect]:
        effects: list[FrameEffect] = []
        for processor in self.processors:
            effects.extend(processor.process(context))
        return effects


SHOT_PIPELINE_PROCESSORS: tuple[FrameProcessor, ...] = (
    foul_processor,
    score_processor,
    turn_processor,
    break_processor,
    phase_processor,
    next_ball_processor,
    win_condition_processor,
    snookers_required_processor,
)

PASS_SHOT_PIPELINE_PROCESSORS: tuple[FrameProcessor, ...] = (
    pass_shot_processor,
    turn_processor,
    break_processor,
    phase_processor,
    next_ball_processor,
    win_condition_processor,
    snookers_required_processor,
)

DECLARE_FREE_BALL_PIPELINE_PROCESSORS: tuple[FrameProcessor, ...] = (
    declare_free_ball_processor,
    snookers_required_processor,
)
