from __future__ import annotations

from typing import TYPE_CHECKING

from scoreboard.domain.frame_calculation.frame_rule_state_calculator import FrameRuleStateCalculator
from scoreboard.domain.models.frame_state import FrameRuleState

if TYPE_CHECKING:
    from scoreboard.domain.models.frame import Frame


def calculate_frame_rule_state(
    frame: Frame,
    calculator: FrameRuleStateCalculator | None = None,
) -> FrameRuleState:
    calculator = calculator or FrameRuleStateCalculator()
    snookers_required = calculator.snookers_required(frame)
    return FrameRuleState(
        points_remaining=calculator.points_remaining(frame),
        snookers_required=snookers_required,
        miss_rule_available=snookers_required == 0,
    )
