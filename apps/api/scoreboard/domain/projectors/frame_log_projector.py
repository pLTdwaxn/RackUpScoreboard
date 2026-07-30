from __future__ import annotations

from scoreboard.domain.balls import BALL_POINTS
from scoreboard.domain.models.frame import Frame
from scoreboard.domain.models.frame_state import FrameStatus
from scoreboard.domain.models.player import Player


class FrameLogProjector:
    """Builds a readable frame log from the current undoable frame history."""

    def project(self, frame: Frame | None, players: list[Player]) -> list[dict]:
        if frame is None:
            return []

        players_by_key = {player.session_key: player for player in players}
        visits: list[dict] = []

        for history_entry in frame.history:
            actor_key = history_entry["actor"]
            outcome = self._outcome_for_history_entry(history_entry)
            action = outcome["action"]

            visit = visits[-1] if visits and visits[-1]["player_key"] == actor_key else None
            if (
                visit is None
                or visit["result"] == "foul"
                or action in {"pass_shot", "reset_shot", "declare_free_ball", "log_break"}
            ):
                visit = self._new_visit(history_entry, actor_key, players_by_key)
                visits.append(visit)

            visit["history_ids"].append(history_entry["id"])
            visit["shot_count"] += 1
            visit["shots"].append(
                self._shot_detail_for_history_entry(
                    history_entry,
                    outcome,
                    actor_key,
                )
            )

            if action == "log_break":
                visit["break_points"] += outcome["break_points"]
                visit["foul_points"] += outcome["foul_points"]
                visit["result"] = "foul" if outcome["foul_points"] else "ended"
            elif outcome["foul_points"]:
                visit["foul_points"] += outcome["foul_points"]
                visit["result"] = "foul"
            elif action not in {"pass_shot", "reset_shot", "declare_free_ball"}:
                visit["potted_balls"].extend(outcome["potted_balls"])
                visit["scored_balls"].extend(outcome["scored_balls"])
                visit["free_ball_pots"].extend(outcome["free_ball_pots"])
                visit["break_points"] += outcome["break_points"]

        if visits:
            last_visit = visits[-1]
            lifecycle = frame.lifecycle_state
            turn = frame.turn_state
            if lifecycle.status == FrameStatus.FINISHED:
                last_visit["result"] = "frame_won" if lifecycle.winner_key == last_visit["player_key"] else "ended"
            elif last_visit["result"] != "foul" and turn.current_turn == last_visit["player_key"]:
                last_visit["result"] = "in_progress"

            if (
                lifecycle.status == FrameStatus.ACTIVE
                and turn.current_turn
                and turn.current_turn != last_visit["player_key"]
            ):
                visits.append(
                    self._new_turn_visit(
                        current_turn=turn.current_turn,
                        previous_history_id=frame.history[-1]["id"],
                        players_by_key=players_by_key,
                    )
                )
        elif frame.lifecycle_state.status in {FrameStatus.READY, FrameStatus.ACTIVE} and frame.turn_state.current_turn:
            visits.append(
                self._new_break_off_visit(
                    frame=frame,
                    players_by_key=players_by_key,
                )
            )

        for visit in visits:
            visit["facts"] = self._facts_for_visit(visit)

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
            "shots": [],
            "potted_balls": [],
            "scored_balls": [],
            "free_ball_pots": [],
            "shot_count": 0,
            "break_points": 0,
            "foul_points": 0,
            "result": "ended",
        }

    def _new_turn_visit(
        self,
        current_turn: str,
        previous_history_id: str,
        players_by_key: dict[str, Player],
    ) -> dict:
        player = players_by_key.get(current_turn)
        player_name = player.name if player else "Player"

        return {
            "id": f"turn:{previous_history_id}:{current_turn}",
            "type": "visit",
            "player_key": current_turn,
            "player_name": player_name,
            "history_ids": [],
            "shots": [],
            "potted_balls": [],
            "scored_balls": [],
            "free_ball_pots": [],
            "shot_count": 0,
            "break_points": 0,
            "foul_points": 0,
            "result": "in_progress",
            "synthetic_fact_kind": "turn_started",
        }

    def _new_break_off_visit(
        self,
        frame: Frame,
        players_by_key: dict[str, Player],
    ) -> dict:
        current_turn = frame.turn_state.current_turn
        player = players_by_key.get(current_turn)
        player_name = player.name if player else "Player"

        return {
            "id": f"break:{frame.id}:{current_turn}",
            "type": "visit",
            "player_key": current_turn,
            "player_name": player_name,
            "history_ids": [],
            "shots": [],
            "potted_balls": [],
            "scored_balls": [],
            "free_ball_pots": [],
            "shot_count": 0,
            "break_points": 0,
            "foul_points": 0,
            "result": "in_progress",
            "synthetic_fact_kind": "break_off",
        }

    def _outcome_for_history_entry(self, history_entry: dict) -> dict:
        outcome = history_entry.get("outcome")
        if isinstance(outcome, dict):
            action = outcome.get("action", "shot")
            potted_balls = list(outcome.get("potted_balls", []))
            return {
                "action": action,
                "potted_balls": potted_balls,
                "scored_balls": list(outcome.get("scored_balls", potted_balls)),
                "free_ball_pots": list(outcome.get("free_ball_pots", [])),
                "break_points": int(outcome.get("break_points", 0)),
                "foul_points": int(outcome.get("foul_points", 0)),
                "nominated_colour": outcome.get("nominated_colour"),
                "player_key": outcome.get("player_key"),
                "result": outcome.get("result") or self._default_result_for_action(action),
                "winner_key": outcome.get("winner_key"),
                "composition_status": outcome.get("composition_status", "missing" if action == "log_break" else None),
                "composition_suggestions": list(outcome.get("composition_suggestions", [])),
            }

        event = history_entry.get("event", {})
        action = event.get("action", "shot")
        data = event.get("data", event)
        foul_points = int(data.get("foul", 0))
        potted_balls = list(data.get("potted_balls", ()))
        return {
            "action": action,
            "potted_balls": [] if foul_points else potted_balls,
            "scored_balls": [] if foul_points else potted_balls,
            "free_ball_pots": [],
            "break_points": 0 if foul_points else sum(BALL_POINTS.get(ball, 0) for ball in potted_balls),
            "foul_points": foul_points,
            "nominated_colour": data.get("nominated_colour"),
            "player_key": None,
            "result": self._default_result_for_action(action, foul_points, potted_balls),
            "winner_key": None,
            "composition_status": "missing" if action == "log_break" else None,
            "composition_suggestions": [],
        }

    def _default_result_for_action(
        self,
        action: str,
        foul_points: int = 0,
        potted_balls: list[str] | None = None,
    ) -> str:
        if action == "pass_shot":
            return "passed"
        if action == "reset_shot":
            return "reset"
        if action == "declare_free_ball":
            return "declared"
        if action == "log_break":
            return "summary_break"
        if foul_points:
            return "foul"
        return "scoring" if potted_balls else "no_score"

    def _shot_detail_for_history_entry(
        self,
        history_entry: dict,
        outcome: dict,
        actor_key: str,
    ) -> dict:
        detail = {
            "history_id": history_entry["id"],
            "action": outcome["action"],
            "potted_balls": outcome["potted_balls"],
            "scored_balls": outcome["scored_balls"],
            "free_ball_pots": outcome["free_ball_pots"],
            "break_points": outcome["break_points"],
            "foul_points": outcome["foul_points"],
            "facts": self._facts_for_shot_detail(actor_key, outcome),
        }
        if outcome["composition_status"] is not None:
            detail["composition_status"] = outcome["composition_status"]
            detail["composition_suggestions"] = outcome["composition_suggestions"]
        return detail

    def _facts_for_shot_detail(self, actor_key: str, outcome: dict) -> list[dict]:
        action = outcome["action"]
        if action == "pass_shot":
            return [
                {
                    "kind": "pass_shot",
                    "player_key": actor_key,
                    "result": outcome["result"],
                }
            ]

        if action == "reset_shot":
            return [
                {
                    "kind": "reset_shot",
                    "player_key": actor_key,
                    "result": outcome["result"],
                }
            ]

        if action == "declare_free_ball":
            return [
                {
                    "kind": "free_ball_nomination",
                    "player_key": actor_key,
                    "nominated_colour": outcome["nominated_colour"],
                    "result": outcome["result"],
                }
            ]

        if action == "log_break":
            return [
                {
                    "kind": "summary_break",
                    "player_key": actor_key,
                    "result": outcome["result"],
                    "break_points": outcome["break_points"],
                    "foul_points": outcome["foul_points"],
                    "composition_status": outcome["composition_status"],
                    "composition_suggestions": outcome["composition_suggestions"],
                }
            ]

        fact = {
            "kind": "shot_result",
            "player_key": actor_key,
            "result": outcome["result"],
            "potted_balls": outcome["potted_balls"],
            "scored_balls": outcome["scored_balls"],
            "free_ball_pots": outcome["free_ball_pots"],
            "break_points": outcome["break_points"],
            "foul_points": outcome["foul_points"],
            "winner_key": outcome["winner_key"],
        }
        if outcome["foul_points"] and outcome["player_key"]:
            fact["points_awarded_to_player_key"] = outcome["player_key"]

        return [fact]

    def _facts_for_visit(self, visit: dict) -> list[dict]:
        synthetic_fact_kind = visit.pop("synthetic_fact_kind", None)
        if synthetic_fact_kind:
            return [
                {
                    "kind": synthetic_fact_kind,
                    "player_key": visit["player_key"],
                    "result": visit["result"],
                }
            ]

        if self._is_action_only_visit(visit):
            return list(visit["shots"][0]["facts"])

        return [
            {
                "kind": "visit_summary",
                "player_key": visit["player_key"],
                "history_ids": list(visit["history_ids"]),
                "shot_count": visit["shot_count"],
                "potted_balls": list(visit["potted_balls"]),
                "scored_balls": list(visit["scored_balls"]),
                "free_ball_pots": list(visit["free_ball_pots"]),
                "break_points": visit["break_points"],
                "foul_points": visit["foul_points"],
                "result": visit["result"],
            }
        ]

    def _is_action_only_visit(self, visit: dict) -> bool:
        if visit["shot_count"] != 1 or visit["break_points"] or visit["foul_points"]:
            return False

        return visit["shots"][0]["action"] in {"pass_shot", "reset_shot", "declare_free_ball"}
