from __future__ import annotations

from dataclasses import dataclass

from scoreboard.domain.models.frame import Frame


class SnookersRequiredProcessor:
    def process(self, context):
        result = SnookersRequiredResult(count=context.frame.snookers_required)
        context.snookers_required_result = result
        return [UpdateSnookersRequiredEffect(result)]


@dataclass
class UpdateSnookersRequiredEffect:
    result: SnookersRequiredResult

    def apply(self, frame: Frame):
        frame.recalculate_score_context()


@dataclass
class SnookersRequiredResult:
    count: int


snookers_required_processor = SnookersRequiredProcessor()
