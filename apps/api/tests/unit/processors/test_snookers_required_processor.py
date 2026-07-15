from unittest.mock import Mock

from scoreboard.domain.processors.snookers_required_processor import (
    SnookersRequiredProcessor,
    SnookersRequiredResult,
    UpdateSnookersRequiredEffect,
)


def test_snookers_required_processor_recalculates_after_prior_effects_apply():
    context = Mock()
    context.frame.snookers_required = 2

    effects = SnookersRequiredProcessor().process(context)

    assert isinstance(context.snookers_required_result, SnookersRequiredResult)
    assert context.snookers_required_result.count == 2
    assert len(effects) == 1
    assert isinstance(effects[0], UpdateSnookersRequiredEffect)

    effects[0].apply(context.frame)

    context.frame.recalculate_score_context.assert_called_once_with()
