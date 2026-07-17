from unittest.mock import ANY, Mock, call

from scoreboard.domain.orchestrators.frame_orchestrator import (
    ActionPayload,
    FrameOrchestrator,
)


class TestFrameOrchestrator:
    def test_orchestrate_calls_processors_in_order(self):
        frame = Mock()
        payload = ActionPayload(potted_balls=("red",), foul=0)

        effect_a = Mock(name="effect_a")
        effect_b = Mock(name="effect_b")
        effect_c = Mock(name="effect_c")

        processor_a = Mock()
        processor_a.process.return_value = [effect_a]

        processor_b = Mock()
        processor_b.process.return_value = [effect_b, effect_c]

        processor_c = Mock()
        processor_c.process.return_value = []

        parent = Mock()
        parent.attach_mock(processor_a, "processor_a")
        parent.attach_mock(processor_b, "processor_b")
        parent.attach_mock(processor_c, "processor_c")

        orchestrator = FrameOrchestrator()
        orchestrator.processors = [
            processor_a,
            processor_b,
            processor_c,
        ]

        orchestrator.orchestrate(frame, payload)

        assert parent.mock_calls == [
            call.processor_a.process(ANY),
            call.processor_b.process(ANY),
            call.processor_c.process(ANY),
        ]

    def test_orchestrate_routes_pass_shot_to_pass_shot_pipeline(self):
        frame = Mock()
        outcome = Mock()
        outcome_factory = Mock()
        outcome_factory.from_context.return_value = outcome
        shot_processor = Mock()
        pass_shot_processor = Mock()
        free_ball_processor = Mock()
        shot_processor.process.return_value = []
        pass_shot_processor.process.return_value = []
        free_ball_processor.process.return_value = []

        orchestrator = FrameOrchestrator(
            processors=(shot_processor,),
            pass_shot_processors=(pass_shot_processor,),
            declare_free_ball_processors=(free_ball_processor,),
            outcome_factory=outcome_factory,
        )

        result = orchestrator.orchestrate(frame, ActionPayload(action="pass_shot", potted_balls=()))

        assert result is outcome
        pass_shot_processor.process.assert_called_once()
        shot_processor.process.assert_not_called()
        free_ball_processor.process.assert_not_called()

    def test_orchestrate_routes_declared_free_ball_to_free_ball_pipeline(self):
        frame = Mock()
        outcome = Mock()
        outcome_factory = Mock()
        outcome_factory.from_context.return_value = outcome
        shot_processor = Mock()
        pass_shot_processor = Mock()
        free_ball_processor = Mock()
        shot_processor.process.return_value = []
        pass_shot_processor.process.return_value = []
        free_ball_processor.process.return_value = []

        orchestrator = FrameOrchestrator(
            processors=(shot_processor,),
            pass_shot_processors=(pass_shot_processor,),
            declare_free_ball_processors=(free_ball_processor,),
            outcome_factory=outcome_factory,
        )

        result = orchestrator.orchestrate(
            frame,
            ActionPayload(action="declare_free_ball", potted_balls=(), nominated_colour="blue"),
        )

        assert result is outcome
        free_ball_processor.process.assert_called_once()
        shot_processor.process.assert_not_called()
        pass_shot_processor.process.assert_not_called()
