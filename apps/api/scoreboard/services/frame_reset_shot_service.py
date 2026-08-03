from __future__ import annotations

from typing import TYPE_CHECKING, Protocol

from scoreboard.domain.frame_calculation.rule_state import calculate_frame_rule_state

if TYPE_CHECKING:
    from scoreboard.domain.models.frame import Frame


class FrameResetShotState(Protocol):
    frame: "Frame"


class FrameResetShotService:
    def reset_shot(self, state: FrameResetShotState) -> bool:
        if not state.frame.history:
            return False

        state_before = state.frame.history[-1].get("state_before")
        if not state_before:
            return False

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
