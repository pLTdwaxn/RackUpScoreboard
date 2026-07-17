from __future__ import annotations

from copy import deepcopy
from typing import TYPE_CHECKING, Protocol
from uuid import uuid4

if TYPE_CHECKING:
    from scoreboard.domain.models.frame import Frame
    from scoreboard.domain.models.match import Match


class FrameHistoryState(Protocol):
    frame: "Frame"
    match: "Match"


class FrameHistoryService:
    def snapshot(self, state: FrameHistoryState) -> dict:
        frame = state.frame
        return {
            # Persist plain values so history snapshots are isolated from live score mutations.
            "scores": dict(frame.scoring_state.scores),
            "match_scores": dict(state.match.match_scores),
            "highest_break": frame.scoring_state.highest_break,
            "current_break": frame.scoring_state.current_break,
            "current_turn": frame.turn_state.current_turn,
            "opening_turn": frame.turn_state.opening_turn,
            "winner_key": frame.lifecycle_state.winner_key,
            "frame_status": frame.lifecycle_state.status.value,
            "frame_phase": frame.table_state.phase.value,
            "is_finished": state.match.is_finished,
            "frames_to_win": state.match.frames_to_win,
            "reds_remaining": frame.table_state.reds_remaining,
            "colours_on_table": dict(frame.table_state.colours_on_table),
            "object_ball": frame.table_state.object_ball,
            "free_ball_nominated_colour": frame.table_state.free_ball_nominated_colour,
            "free_ball_object_ball": frame.table_state.free_ball_object_ball,
            "previously_fouled": frame.turn_state.previously_fouled,
            "points_remaining": frame.rule_state.points_remaining,
            "snookers_required": frame.rule_state.snookers_required,
            "miss_rule_available": frame.rule_state.miss_rule_available,
        }

    def push(
        self,
        state: FrameHistoryState,
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
