from __future__ import annotations

from scoreboard.domain.models.frame import Frame
from scoreboard.domain.models.frame_state import FrameStatus

FRAME_NOT_ACTIVE_ERROR = "Current frame is not active."
FREE_BALL_REQUIRES_FOUL_ERROR = "Cannot declare a free ball when the player has not fouled."
PASS_SHOT_REQUIRES_FOUL_ERROR = "Cannot pass shot when the player has not fouled."
RESET_REQUIRES_FOUL_AND_MISS_ERROR = "Cannot reset shot when the previous shot was not foul and a miss."
RESET_REQUIRES_MISS_AVAILABLE_AFTER_ERROR = (
    "Foul and a miss is not available when snookers are required after the shot."
)
RESET_REQUIRES_MISS_AVAILABLE_BEFORE_ERROR = (
    "Foul and a miss is not available when snookers are required before the shot."
)
RESET_REQUIRES_RECENT_FOUL_ERROR = "Only the most recent fouled shot can be reset."
RESET_REQUIRES_SHOT_ERROR = "No shot is available to reset."
SUMMARY_BREAK_VISIT_STARTED_ERROR = "Manual break logging is only available before shot-by-shot logging starts."


class FrameActionPolicy:
    def can_declare_free_ball(self, frame: Frame) -> tuple[bool, str | None]:
        if frame.lifecycle_state.status != FrameStatus.ACTIVE:
            return False, FRAME_NOT_ACTIVE_ERROR

        if not frame.turn_state.previously_fouled:
            return False, FREE_BALL_REQUIRES_FOUL_ERROR

        return True, None

    def can_pass_shot(self, frame: Frame) -> tuple[bool, str | None]:
        if frame.lifecycle_state.status != FrameStatus.ACTIVE:
            return False, FRAME_NOT_ACTIVE_ERROR

        if not frame.turn_state.previously_fouled:
            return False, PASS_SHOT_REQUIRES_FOUL_ERROR

        return True, None

    def can_reset_shot(self, frame: Frame) -> tuple[bool, str | None]:
        if frame.lifecycle_state.status != FrameStatus.ACTIVE:
            return False, FRAME_NOT_ACTIVE_ERROR

        if not frame.turn_state.previously_fouled:
            return False, RESET_REQUIRES_FOUL_AND_MISS_ERROR

        if not frame.history:
            return False, RESET_REQUIRES_SHOT_ERROR

        last_entry = frame.history[-1]
        outcome = last_entry.get("outcome") or {}
        if outcome.get("action") != "shot" or outcome.get("result") != "foul":
            return False, RESET_REQUIRES_RECENT_FOUL_ERROR

        state_before = last_entry.get("state_before") or {}
        if not state_before.get("miss_rule_available", True):
            return False, RESET_REQUIRES_MISS_AVAILABLE_BEFORE_ERROR

        if not frame.rule_state.miss_rule_available:
            return False, RESET_REQUIRES_MISS_AVAILABLE_AFTER_ERROR

        return True, None

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
