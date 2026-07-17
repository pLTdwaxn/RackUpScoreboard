from __future__ import annotations

from typing import TYPE_CHECKING, Protocol

from scoreboard.domain.frame_calculation.rule_state import calculate_frame_rule_state

if TYPE_CHECKING:
    from scoreboard.domain.models.frame import Frame
    from scoreboard.domain.models.match import Match


class FrameUndoState(Protocol):
    frame: "Frame"
    match: "Match"


class FrameUndoService:
    def restore(self, state: FrameUndoState, snapshot: dict) -> None:
        frame = state.frame
        frame.scoring_state.scores = dict(snapshot["scores"])
        state.match.match_scores = dict(snapshot["match_scores"])
        frame.scoring_state.highest_break = snapshot["highest_break"]
        frame.scoring_state.current_break = snapshot["current_break"]
        frame.turn_state.current_turn = snapshot["current_turn"]
        frame.turn_state.opening_turn = snapshot["opening_turn"]
        frame.lifecycle_state.winner_key = snapshot["winner_key"]
        frame.lifecycle_state.status = frame.lifecycle_state.status.__class__(snapshot["frame_status"])
        frame.table_state.phase = frame.table_state.phase.__class__(snapshot["frame_phase"])
        state.match.is_finished = snapshot["is_finished"]
        state.match.frames_to_win = snapshot["frames_to_win"]
        frame.table_state.reds_remaining = snapshot["reds_remaining"]
        frame.table_state.colours_on_table = dict(snapshot["colours_on_table"])
        frame.table_state.object_ball = snapshot["object_ball"]
        frame.table_state.free_ball_nominated_colour = snapshot.get("free_ball_nominated_colour")
        frame.table_state.free_ball_object_ball = snapshot.get("free_ball_object_ball")
        frame.turn_state.previously_fouled = snapshot["previously_fouled"]
        frame.rule_state = calculate_frame_rule_state(frame)

    def undo(self, state: FrameUndoState) -> bool:
        if not state.frame.history:
            return False

        last_entry = state.frame.history.pop()
        self.restore(state, last_entry["state_before"])
        return True
