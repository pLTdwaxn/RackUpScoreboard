from __future__ import annotations

from typing import TYPE_CHECKING, Protocol

from scoreboard.domain.frame_calculation.rule_state import calculate_frame_rule_state
from scoreboard.domain.models.frame_state import FrameStatus

if TYPE_CHECKING:
    from scoreboard.domain.models.frame import Frame


class FrameResetShotState(Protocol):
    frame: "Frame"


class FrameResetShotService:
    def can_reset_shot(self, state: FrameResetShotState) -> tuple[bool, str | None]:
        if state.frame.lifecycle_state.status != FrameStatus.ACTIVE:
            return False, "Current frame is not active."

        if not state.frame.turn_state.previously_fouled:
            return False, "Cannot reset shot when the previous shot was not foul and a miss."

        if not state.frame.history:
            return False, "No shot is available to reset."

        last_entry = state.frame.history[-1]
        outcome = last_entry.get("outcome") or {}
        if outcome.get("action") != "shot" or outcome.get("result") != "foul":
            return False, "Only the most recent fouled shot can be reset."

        state_before = last_entry.get("state_before") or {}
        if not state_before.get("miss_rule_available", True):
            return False, "Foul and a miss is not available when snookers are required before the shot."

        if not state.frame.rule_state.miss_rule_available:
            return False, "Foul and a miss is not available when snookers are required after the shot."

        return True, None

    def reset_shot(self, state: FrameResetShotState) -> bool:
        can_reset, _ = self.can_reset_shot(state)
        if not can_reset:
            return False

        state_before = state.frame.history[-1]["state_before"]
        frame = state.frame

        frame.turn_state.current_turn = state_before["current_turn"]
        frame.turn_state.opening_turn = state_before["opening_turn"]
        frame.turn_state.previously_fouled = False

        frame.table_state.phase = frame.table_state.phase.__class__(state_before["frame_phase"])
        frame.table_state.reds_remaining = state_before["reds_remaining"]
        frame.table_state.colours_on_table = dict(state_before["colours_on_table"])
        frame.table_state.object_ball = state_before["object_ball"]
        frame.table_state.free_ball_nominated_colour = state_before.get("free_ball_nominated_colour")
        frame.table_state.free_ball_object_ball = state_before.get("free_ball_object_ball")

        frame.rule_state = calculate_frame_rule_state(frame)
        return True
