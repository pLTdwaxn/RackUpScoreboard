from __future__ import annotations

from scoreboard.domain.models.frame import Frame, FrameStatus
from scoreboard.domain.models.player import Player
from scoreboard.domain.rules.constants import BALL_POINTS


class FrameLogProjector:
    """Builds a readable frame log from the current undoable frame history."""

    def project(self, frame: Frame | None, players: list[Player]) -> list[dict]:
        if frame is None:
            return []

        players_by_key = {player.session_key: player for player in players}
        visits: list[dict] = []

        for history_entry in frame.history:
            actor_key = history_entry["actor"]
            event = history_entry.get("event", {})
            data = event.get("data", event)
            potted_balls = tuple(data.get("potted_balls", ()))
            foul_points = int(data.get("foul", 0))

            visit = visits[-1] if visits and visits[-1]["player_key"] == actor_key else None
            if visit is None or visit["result"] == "foul":
                visit = self._new_visit(history_entry, actor_key, players_by_key)
                visits.append(visit)

            visit["history_ids"].append(history_entry["id"])
            visit["shot_count"] += 1

            if foul_points:
                visit["foul_points"] += foul_points
                visit["result"] = "foul"
            else:
                visit["potted_balls"].extend(potted_balls)
                visit["break_points"] += sum(BALL_POINTS.get(ball, 0) for ball in potted_balls)

        if visits:
            last_visit = visits[-1]
            if frame.status == FrameStatus.FINISHED:
                last_visit["result"] = "frame_won" if frame.winner_key == last_visit["player_key"] else "ended"
            elif last_visit["result"] != "foul" and frame.current_turn == last_visit["player_key"]:
                last_visit["result"] = "in_progress"

        for visit in visits:
            visit["message"] = self._message_for_visit(visit)

        return visits

    def _new_visit(self, history_entry: dict, actor_key: str, players_by_key: dict[str, Player]) -> dict:
        player = players_by_key.get(actor_key)
        player_name = player.name if player else "Player"

        return {
            "id": history_entry["id"],
            "type": "visit",
            "player_key": actor_key,
            "player_name": player_name,
            "history_ids": [],
            "potted_balls": [],
            "shot_count": 0,
            "break_points": 0,
            "foul_points": 0,
            "result": "ended",
            "message": "",
        }

    def _message_for_visit(self, visit: dict) -> str:
        player_name = visit["player_name"]
        break_points = visit["break_points"]
        foul_points = visit["foul_points"]

        if foul_points and break_points:
            return f"{player_name}: {break_points} break, foul {foul_points}"
        if foul_points:
            return f"{player_name}: foul {foul_points}"
        if break_points:
            return f"{player_name}: {break_points} break"
        return f"{player_name}: no score"
