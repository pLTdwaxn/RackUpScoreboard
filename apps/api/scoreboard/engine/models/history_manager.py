from __future__ import annotations

from copy import deepcopy
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from scoreboard.engine.models.room_state import MatchRoom


class HistoryManager:
    def snapshot(self, room: MatchRoom) -> dict:
        return {
            "scores": deepcopy(room.scores),
            "highest_break": room.highest_break,
            "current_break": room.current_break,
            "current_turn": room.current_turn,
            "is_finished": room.is_finished,
            "frames_to_win": room.frames_to_win,
            "reds_remaining": room.reds_remaining,
            "colours_on_table": deepcopy(room.colours_on_table),
            "object_ball": room.object_ball,
        }

    def restore(self, room: MatchRoom, snapshot: dict) -> None:
        room.scores = deepcopy(snapshot["scores"])
        room.highest_break = snapshot["highest_break"]
        room.current_break = snapshot["current_break"]
        room.current_turn = snapshot["current_turn"]
        room.is_finished = snapshot["is_finished"]
        room.frames_to_win = snapshot["frames_to_win"]
        room.reds_remaining = snapshot["reds_remaining"]
        room.colours_on_table = deepcopy(snapshot["colours_on_table"])
        room.object_ball = snapshot["object_ball"]

    def push(self, room: MatchRoom, actor_session_key: str, event: dict) -> None:
        room.history.append(
            {
                "actor": actor_session_key,
                "event": deepcopy(event),
                "state_before": self.snapshot(room),
            }
        )

    def undo(self, room: MatchRoom) -> bool:
        if not room.history:
            return False

        last_entry = room.history.pop()
        self.restore(room, last_entry["state_before"])
        return True
