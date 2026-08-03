from __future__ import annotations

from scoreboard.domain.models.frame import Frame

SUMMARY_BREAK_VISIT_STARTED_ERROR = "Manual break logging is only available before shot-by-shot logging starts."


class FrameActionPolicy:
    def can_start_summary_break(self, frame: Frame) -> tuple[bool, str | None]:
        current_turn = frame.turn_state.current_turn
        if not current_turn:
            return True, None

        for history_entry in reversed(frame.history):
            outcome = history_entry.get("outcome") or {}
            if outcome.get("action") == "resolve_break_composition":
                continue

            if history_entry.get("actor") == current_turn:
                return False, SUMMARY_BREAK_VISIT_STARTED_ERROR

            return True, None

        return True, None
