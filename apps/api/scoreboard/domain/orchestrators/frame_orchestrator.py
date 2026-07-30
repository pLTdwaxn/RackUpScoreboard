from scoreboard.domain.models.frame import Frame

from .contracts import (
    ActionOutcome,
    ActionPayload,
    FrameCalculationContext,
    FrameProcessor,
)
from .effects.contracts import FrameEffect
from .frame_pipeline import (
    DECLARE_FREE_BALL_PIPELINE_PROCESSORS,
    LOG_BREAK_PIPELINE_PROCESSORS,
    PASS_SHOT_PIPELINE_PROCESSORS,
    SHOT_PIPELINE_PROCESSORS,
    FramePipeline,
)
from .outcome_factory import ActionOutcomeFactory, action_outcome_factory


class FrameOrchestrator:
    def __init__(
        self,
        processors: tuple[FrameProcessor, ...] = SHOT_PIPELINE_PROCESSORS,
        pass_shot_processors: tuple[FrameProcessor, ...] = PASS_SHOT_PIPELINE_PROCESSORS,
        declare_free_ball_processors: tuple[FrameProcessor, ...] = DECLARE_FREE_BALL_PIPELINE_PROCESSORS,
        log_break_processors: tuple[FrameProcessor, ...] = LOG_BREAK_PIPELINE_PROCESSORS,
        outcome_factory: ActionOutcomeFactory = action_outcome_factory,
    ):
        self.shot_pipeline = FramePipeline(processors)
        self.pass_shot_pipeline = FramePipeline(pass_shot_processors)
        self.declare_free_ball_pipeline = FramePipeline(declare_free_ball_processors)
        self.log_break_pipeline = FramePipeline(log_break_processors)
        self.outcome_factory = outcome_factory

    @property
    def processors(self) -> list[FrameProcessor]:
        return self.shot_pipeline.processors

    @processors.setter
    def processors(self, processors: list[FrameProcessor]) -> None:
        self.shot_pipeline = FramePipeline(processors)

    def orchestrate(self, frame: Frame, payload: ActionPayload) -> ActionOutcome:
        if payload.action == "pass_shot":
            return self.pass_shot(frame, payload)
        if payload.action == "declare_free_ball":
            return self.declare_free_ball(frame, payload)
        if payload.action == "log_break":
            return self.log_break(frame, payload)

        return self.orchestrate_shot(frame, payload)

    def orchestrate_shot(self, frame: Frame, payload: ActionPayload) -> ActionOutcome:
        return self._orchestrate(frame, payload, self.shot_pipeline)

    def pass_shot(self, frame: Frame, payload: ActionPayload) -> ActionOutcome:
        return self._orchestrate(frame, payload, self.pass_shot_pipeline)

    def declare_free_ball(self, frame: Frame, payload: ActionPayload) -> ActionOutcome:
        return self._orchestrate(frame, payload, self.declare_free_ball_pipeline)

    def log_break(self, frame: Frame, payload: ActionPayload) -> ActionOutcome:
        return self._orchestrate(frame, payload, self.log_break_pipeline)

    def _orchestrate(
        self,
        frame: Frame,
        payload: ActionPayload,
        pipeline: FramePipeline,
    ) -> ActionOutcome:
        context = FrameCalculationContext(frame=frame, payload=payload)

        effects = pipeline.calculate(context)
        self._apply_effects(frame, effects)
        return self.outcome_factory.from_context(context)

    def _apply_effects(self, frame: Frame, effects: list[FrameEffect]) -> None:
        for effect in effects:
            effect.apply(frame)


frame_orchestrator = FrameOrchestrator()
