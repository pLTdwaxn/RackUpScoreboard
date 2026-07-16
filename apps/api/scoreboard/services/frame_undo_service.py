from __future__ import annotations

from copy import deepcopy
from typing import TYPE_CHECKING, Protocol
from uuid import uuid4

if TYPE_CHECKING:
    from scoreboard.domain.models.frame import Frame
    from scoreboard.domain.models.match import Match


class FrameUndoState(Protocol):
    frame: "Frame"
    match: "Match"


class FrameUndoService:
    def snapshot(self, state: FrameUndoState) -> dict:
        return {
            # Persist plain values to avoid deep-copying reactive score objects.
            "scores": dict(state.frame.scores),
            "match_scores": dict(state.match.match_scores),
            "highest_break": state.frame.highest_break,
            "current_break": state.frame.current_break,
            "current_turn": state.frame.current_turn,
            "opening_turn": state.frame.opening_turn,
            "winner_key": state.frame.winner_key,
            "frame_status": state.frame.status.value,
            "frame_phase": state.frame.phase.value,
            "is_finished": state.match.is_finished,
            "frames_to_win": state.match.frames_to_win,
            "reds_remaining": state.frame.reds_remaining,
            "colours_on_table": dict(state.frame.colours_on_table),
            "object_ball": state.frame.object_ball,
            "free_ball_nominated_colour": state.frame.free_ball_nominated_colour,
            "free_ball_object_ball": state.frame.free_ball_object_ball,
            "previously_fouled": state.frame.previously_fouled,
        }

    def restore(self, state: FrameUndoState, snapshot: dict) -> None:
        state.frame.replace_scores(snapshot["scores"])
        state.match.match_scores = dict(snapshot["match_scores"])
        state.frame.highest_break = snapshot["highest_break"]
        state.frame.current_break = snapshot["current_break"]
        state.frame.current_turn = snapshot["current_turn"]
        state.frame._opening_turn = snapshot["opening_turn"]
        state.frame.winner_key = snapshot["winner_key"]
        state.frame.status = state.frame.status.__class__(snapshot["frame_status"])
        state.frame.phase = state.frame.phase.__class__(snapshot["frame_phase"])
        state.match.is_finished = snapshot["is_finished"]
        state.match.frames_to_win = snapshot["frames_to_win"]
        state.frame.reds_remaining = snapshot["reds_remaining"]
        state.frame.colours_on_table = dict(snapshot["colours_on_table"])
        state.frame.object_ball = snapshot["object_ball"]
        state.frame.free_ball_nominated_colour = snapshot.get("free_ball_nominated_colour")
        state.frame.free_ball_object_ball = snapshot.get("free_ball_object_ball")
        state.frame.previously_fouled = snapshot["previously_fouled"]
        state.frame.recalculate_score_context()

    def push(
        self,
        state: FrameUndoState,
        actor_session_key: str,
        event: dict,
        outcome: dict | None = None,
        state_before: dict | None = None,
    ) -> None:
        state.frame.history.append(
            {
                "id": uuid4().hex,
                "actor": actor_session_key,
                "event": deepcopy(event),
                "outcome": deepcopy(outcome) if outcome is not None else None,
                "state_before": state_before or self.snapshot(state),
            }
        )

    def undo(self, state: FrameUndoState) -> bool:
        if not state.frame.history:
            return False

        last_entry = state.frame.history.pop()
        self.restore(state, last_entry["state_before"])
        return True
