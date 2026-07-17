from unittest.mock import ANY, Mock, call

from scoreboard.domain.orchestrators.contracts import ActionPayload, FrameCalculationContext
from scoreboard.domain.orchestrators.frame_pipeline import FramePipeline


def test_frame_pipeline_calls_processors_in_order_and_collects_effects() -> None:
    frame = Mock()
    context = FrameCalculationContext(frame=frame, payload=ActionPayload(potted_balls=("red",)))

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

    effects = FramePipeline([processor_a, processor_b, processor_c]).calculate(context)

    assert effects == [effect_a, effect_b, effect_c]
    assert parent.mock_calls == [
        call.processor_a.process(ANY),
        call.processor_b.process(ANY),
        call.processor_c.process(ANY),
    ]


def test_frame_pipeline_exposes_pending_effects_to_processors() -> None:
    frame = Mock()
    context = FrameCalculationContext(frame=frame, payload=ActionPayload(potted_balls=("red",)))

    effect = Mock(name="effect")
    score_processor = Mock()
    score_processor.process.return_value = [effect]

    observed_pending_effects = []
    observer_processor = Mock()

    def observe_pending_effects(observed_context):
        observed_pending_effects.append(observed_context.pending_effects)
        return []

    observer_processor.process.side_effect = observe_pending_effects

    FramePipeline([score_processor, observer_processor]).calculate(context)

    assert observed_pending_effects == [(effect,)]
    assert context.pending_effects == (effect,)
