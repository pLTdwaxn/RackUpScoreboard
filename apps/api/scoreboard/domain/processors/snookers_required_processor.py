from __future__ import annotations

from collections.abc import Sequence
from typing import TYPE_CHECKING

from scoreboard.domain.orchestrators.effects.frame_effects import UpdateSnookersRequiredEffect

from .results import SnookersRequiredResult

if TYPE_CHECKING:
    from scoreboard.domain.orchestrators.contracts import FrameCalculationContext
    from scoreboard.domain.orchestrators.effects.contracts import FrameEffect


class SnookersRequiredProcessor:
    def process(self, context: FrameCalculationContext) -> Sequence[FrameEffect]:
        result = SnookersRequiredResult(count=context.frame.snookers_required)
        context.snookers_required_result = result
        return [UpdateSnookersRequiredEffect(result)]


snookers_required_processor = SnookersRequiredProcessor()
