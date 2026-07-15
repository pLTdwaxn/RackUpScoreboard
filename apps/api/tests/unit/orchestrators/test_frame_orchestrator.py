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
