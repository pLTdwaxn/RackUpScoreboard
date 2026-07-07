from __future__ import annotations

from copy import deepcopy
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from scoreboard.engine.models.match_session import MatchSession


class HistoryManager:
    def snapshot(self, session: MatchSession) -> dict:
        return {
            # Persist plain values to avoid deep-copying reactive score objects.
            "scores": dict(session.frame.scores),
            "highest_break": session.frame.highest_break,
            "current_break": session.frame.current_break,
            "current_turn": session.frame.current_turn,
            "frame_phase": session.frame.phase.value,
            "is_finished": session.match.is_finished,
            "frames_to_win": session.match.frames_to_win,
            "reds_remaining": session.frame.reds_remaining,
            "colours_on_table": dict(session.frame.colours_on_table),
            "object_ball": session.frame.object_ball,
        }

    def restore(self, session: MatchSession, snapshot: dict) -> None:
        session.frame.replace_scores(snapshot["scores"])
        session.frame.highest_break = snapshot["highest_break"]
        session.frame.current_break = snapshot["current_break"]
        session.frame.current_turn = snapshot["current_turn"]
        session.frame.phase = session.frame.phase.__class__(snapshot["frame_phase"])
        session.match.is_finished = snapshot["is_finished"]
        session.match.frames_to_win = snapshot["frames_to_win"]
        session.frame.reds_remaining = snapshot["reds_remaining"]
        session.frame.colours_on_table = dict(snapshot["colours_on_table"])
        session.frame.object_ball = snapshot["object_ball"]
        session.frame.recalculate_score_context()

    def push(self, session: MatchSession, actor_session_key: str, event: dict) -> None:
        session.frame.history.append(
            {
                "actor": actor_session_key,
                "event": deepcopy(event),
                "state_before": self.snapshot(session),
            }
        )

    def undo(self, session: MatchSession) -> bool:
        if not session.frame.history:
            return False

        last_entry = session.frame.history.pop()
        self.restore(session, last_entry["state_before"])
        return True
