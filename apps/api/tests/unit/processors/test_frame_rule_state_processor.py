from scoreboard.domain.models.frame import Frame
from scoreboard.domain.orchestrators.contracts import ActionPayload, FrameCalculationContext
from scoreboard.domain.orchestrators.effects.frame_effects import RemoveRedsEffect, SetFrameRuleStateEffect
from scoreboard.domain.processors.frame_rule_state_processor import (
    FrameRuleStateProcessor,
    FrameRuleStateResult,
)


def make_frame() -> Frame:
    return Frame(
        id="frame-test",
        match_id="match-test",
        scores={"p1": 200, "p2": 0},
        current_turn="p1",
    )


def test_frame_rule_state_processor_calculates_rule_state_result():
    context = FrameCalculationContext(
        frame=make_frame(),
        payload=ActionPayload(potted_balls=()),
    )

    effects = FrameRuleStateProcessor().process(context)

    assert isinstance(context.frame_rule_state_result, FrameRuleStateResult)
    assert context.frame_rule_state_result.rule_state.snookers_required > 0
    assert context.frame_rule_state_result.rule_state.miss_rule_available is False
    assert len(effects) == 1
    assert isinstance(effects[0], SetFrameRuleStateEffect)

    effects[0].apply(context.frame)

    assert context.frame.rule_state == context.frame_rule_state_result.rule_state


def test_frame_rule_state_processor_projects_pending_effects_before_calculating():
    context = FrameCalculationContext(
        frame=Frame(
            id="frame-test",
            match_id="match-test",
            scores={"p1": 0, "p2": 0},
            current_turn="p1",
        ),
        payload=ActionPayload(potted_balls=("red",)),
        pending_effects=(RemoveRedsEffect(1),),
    )

    effects = FrameRuleStateProcessor().process(context)

    assert isinstance(effects[0], SetFrameRuleStateEffect)
    assert context.frame_rule_state_result is not None
    assert context.frame_rule_state_result.rule_state.points_remaining == 139
    assert context.frame.table_state.reds_remaining == 15
