from __future__ import annotations

from copy import deepcopy
from typing import TYPE_CHECKING

from scoreboard.domain.balls import RED_BALL
from scoreboard.domain.frame_calculation.rule_state import calculate_frame_rule_state
from scoreboard.domain.models.frame_state import FramePhase

if TYPE_CHECKING:
    from scoreboard.domain.models.frame import Frame


class SummaryBreakCompositionResolver:
    def resolve(self, frame: Frame, entry_id: str, suggestion_id: str) -> tuple[bool, str | None, dict | None]:
        history_entry = next((entry for entry in frame.history if entry.get("id") == entry_id), None)
        if history_entry is None:
            return False, "Summary break entry was not found.", None

        outcome = history_entry.get("outcome")
        if not isinstance(outcome, dict) or outcome.get("action") != "log_break":
            return False, "Frame log entry is not a summary break.", None

        if outcome.get("composition_status") == "resolved":
            return False, "Summary break composition is already resolved.", None

        suggestion = next(
            (
                item
                for item in outcome.get("composition_suggestions", [])
                if isinstance(item, dict) and item.get("id") == suggestion_id
            ),
            None,
        )
        if suggestion is None:
            return False, "Summary break composition suggestion was not found.", None

        balls = list(suggestion.get("balls", []))
        previous_outcome = deepcopy(outcome)
        outcome["composition_status"] = "resolved"
        outcome["resolved_composition"] = balls
        outcome["potted_balls"] = balls
        outcome["scored_balls"] = balls

        self._apply_table_state(frame, balls)
        return True, None, previous_outcome

    def restore_previous_outcome(self, frame: Frame, entry_id: str, previous_outcome: dict) -> None:
        history_entry = next((entry for entry in frame.history if entry.get("id") == entry_id), None)
        if history_entry is not None:
            history_entry["outcome"] = deepcopy(previous_outcome)

    def _apply_table_state(self, frame: Frame, balls: list[str]) -> None:
        reds_removed = sum(1 for ball in balls if ball == RED_BALL)
        frame.table_state.reds_remaining = max(0, frame.table_state.reds_remaining - reds_removed)

        if frame.table_state.reds_remaining == 0:
            frame.table_state.phase = FramePhase.COLOURS
            frame.table_state.object_ball = "yellow"
        else:
            frame.table_state.phase = FramePhase.REDS
            frame.table_state.object_ball = RED_BALL

        frame.rule_state = calculate_frame_rule_state(frame)
