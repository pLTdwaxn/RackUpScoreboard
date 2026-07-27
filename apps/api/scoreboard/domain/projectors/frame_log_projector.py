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
            if visit is None or visit["result"] == "foul" or action in {"pass_shot", "reset_shot", "declare_free_ball"}:
                visit = self._new_visit(history_entry, actor_key, players_by_key)
                visits.append(visit)

            visit["history_ids"].append(history_entry["id"])
            visit["shot_count"] += 1
            visit["shots"].append(
                self._shot_detail_for_history_entry(
                    history_entry,
                    outcome,
                    actor_key,
                    visit["player_name"],
                )
            )

            if action == "pass_shot":
                visit["message_override"] = f"{visit['player_name']}: passed shot back"
                visit["message_override_action"] = action
            elif action == "reset_shot":
                visit["message_override"] = f"{visit['player_name']}: reset shot"
                visit["message_override_action"] = action
            elif action == "declare_free_ball":
                visit["message_override"] = f"{visit['player_name']}: nominated {outcome['nominated_colour']} free ball"
                visit["message_override_action"] = action
            elif outcome["foul_points"]:
                self._clear_declare_free_ball_message_override(visit)
                visit["foul_points"] += outcome["foul_points"]
                visit["result"] = "foul"
            else:
                self._clear_declare_free_ball_message_override(visit)
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

        for visit in visits:
            visit["message"] = visit.pop("message_override", None) or self._message_for_visit(visit)
            visit["facts"] = self._facts_for_visit(visit)
            visit.pop("message_override_action", None)

        return visits

    def _clear_declare_free_ball_message_override(self, visit: dict) -> None:
        if visit.get("message_override_action") == "declare_free_ball":
            visit.pop("message_override", None)
            visit.pop("message_override_action", None)

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
            "message": "",
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
        if foul_points:
            return "foul"
        return "scoring" if potted_balls else "no_score"

    def _shot_detail_for_history_entry(
        self,
        history_entry: dict,
        outcome: dict,
        actor_key: str,
        player_name: str,
    ) -> dict:
        return {
            "history_id": history_entry["id"],
            "action": outcome["action"],
            "potted_balls": outcome["potted_balls"],
            "scored_balls": outcome["scored_balls"],
            "free_ball_pots": outcome["free_ball_pots"],
            "break_points": outcome["break_points"],
            "foul_points": outcome["foul_points"],
            "facts": self._facts_for_shot_detail(actor_key, outcome),
            "message": self._message_for_shot_detail(player_name, outcome),
        }

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

    def _message_for_shot_detail(self, player_name: str, outcome: dict) -> str:
        action = outcome["action"]
        if action == "pass_shot":
            return f"{player_name} passed the shot back."
        if action == "reset_shot":
            return f"{player_name} reset the shot."
        if action == "declare_free_ball":
            return f"{player_name} nominated the {outcome['nominated_colour']} free ball."
        if outcome["foul_points"]:
            return f"{player_name} fouled for {outcome['foul_points']}."
        if not outcome["potted_balls"]:
            return f"{player_name} did not score."

        return f"{player_name} potted {self._potted_balls_phrase(outcome)}."

    def _potted_balls_phrase(self, outcome: dict) -> str:
        free_ball_pots = list(outcome["free_ball_pots"])
        phrases: list[str] = []

        for ball in outcome["potted_balls"]:
            free_ball_pot_index = next(
                (index for index, pot in enumerate(free_ball_pots) if pot.get("potted_ball") == ball),
                None,
            )
            if free_ball_pot_index is None:
                phrases.append(self._ball_phrase(ball))
                continue

            free_ball_pot = free_ball_pots.pop(free_ball_pot_index)
            phrases.append(f"{self._ball_phrase(ball)} as {self._ball_phrase(free_ball_pot['counts_as'])}")

        return self._join_phrases(phrases)

    def _ball_phrase(self, ball: str) -> str:
        if ball == "red":
            return "a red"
        return f"the {ball}"

    def _join_phrases(self, phrases: list[str]) -> str:
        if len(phrases) <= 1:
            return phrases[0] if phrases else "nothing"
        if len(phrases) == 2:
            return f"{phrases[0]} and {phrases[1]}"
        return f"{', '.join(phrases[:-1])}, and {phrases[-1]}"

    def _message_for_visit(self, visit: dict) -> str:
        player_name = visit["player_name"]
        break_points = visit["break_points"]
        foul_points = visit["foul_points"]

        if visit["result"] == "frame_won":
            return f"{player_name}: won the frame"
        if foul_points and break_points:
            return f"{player_name}: break {break_points}, foul {foul_points}"
        if foul_points:
            return f"{player_name}: foul {foul_points}"
        if break_points:
            return f"{player_name}: break {break_points}"
        return f"{player_name}: no score"

    def _facts_for_visit(self, visit: dict) -> list[dict]:
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
