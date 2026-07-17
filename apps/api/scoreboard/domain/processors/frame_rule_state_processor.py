from __future__ import annotations

from collections.abc import Sequence
from copy import deepcopy
from typing import TYPE_CHECKING

from scoreboard.domain.frame_calculation.rule_state import calculate_frame_rule_state
from scoreboard.domain.orchestrators.effects.frame_effects import SetFrameRuleStateEffect

from .results import FrameRuleStateResult

if TYPE_CHECKING:
    from scoreboard.domain.orchestrators.contracts import FrameCalculationContext
    from scoreboard.domain.orchestrators.effects.contracts import FrameEffect


class FrameRuleStateProcessor:
    def process(self, context: FrameCalculationContext) -> Sequence[FrameEffect]:
        frame_after_pending_effects = deepcopy(context.frame)
        for effect in context.pending_effects:
            effect.apply(frame_after_pending_effects)

        rule_state = calculate_frame_rule_state(frame_after_pending_effects)
        context.frame_rule_state_result = FrameRuleStateResult(rule_state=rule_state)
        return [SetFrameRuleStateEffect(rule_state)]


frame_rule_state_processor = FrameRuleStateProcessor()
