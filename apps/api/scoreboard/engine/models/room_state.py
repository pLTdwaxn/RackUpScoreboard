from __future__ import annotations

from copy import deepcopy
from typing import Dict, List, Optional

from scoreboard.engine.models.history_manager import HistoryManager
from scoreboard.engine.models.participant import Participant
from scoreboard.engine.models.scoring_rules import ScoringRules
from scoreboard.engine.models.states import FrameState, MatchState, RoomState
from scoreboard.engine.models.table_progression import TableProgression
from scoreboard.engine.rules.messages import BALL_POINTS, RED_BALL, ShotMessage

VALID_SCORE_KEEPERS = {"self", "opp", "ref", "any"}


class MatchRoom:
    """Holds match state independent from transport details."""

    def __init__(self, match_id: str, p1: Participant, score_keeper: str = "opp"):
        self._history_manager = HistoryManager()
        self._table_progression = TableProgression()
        self._scoring_rules = ScoringRules()
        self.score_keeper = score_keeper if score_keeper in VALID_SCORE_KEEPERS else "opp"

        self.room_state = RoomState(match_id=match_id, players=[p1])
        self.match_state = MatchState()
        self.frame_state = FrameState(
            scores={p1.session_key: 0},
            current_turn=p1.session_key,
        )

    @property
    def match_id(self) -> str:
        return self.room_state.match_id

    @match_id.setter
    def match_id(self, value: str) -> None:
        self.room_state.match_id = value

    @property
    def players(self) -> List[Participant]:
        return self.room_state.players

    @players.setter
    def players(self, value: List[Participant]) -> None:
        self.room_state.players = value

    @property
    def frames_to_win(self) -> Optional[int]:
        return self.match_state.frames_to_win

    @frames_to_win.setter
    def frames_to_win(self, value: Optional[int]) -> None:
        self.match_state.frames_to_win = value

    @property
    def is_finished(self) -> bool:
        return self.match_state.is_finished

    @is_finished.setter
    def is_finished(self, value: bool) -> None:
        self.match_state.is_finished = value

    @property
    def match_type(self) -> str:
        return self.match_state.match_type

    @match_type.setter
    def match_type(self, value: str) -> None:
        self.match_state.match_type = value

    @property
    def scores(self) -> Dict[str, int]:
        return self.frame_state.scores

    @scores.setter
    def scores(self, value: Dict[str, int]) -> None:
        self.frame_state.scores = value

    @property
    def highest_break(self) -> int:
        return self.frame_state.highest_break

    @highest_break.setter
    def highest_break(self, value: int) -> None:
        self.frame_state.highest_break = value

    @property
    def current_break(self) -> int:
        return self.frame_state.current_break

    @current_break.setter
    def current_break(self, value: int) -> None:
        self.frame_state.current_break = value

    @property
    def current_turn(self) -> str:
        return self.frame_state.current_turn

    @current_turn.setter
    def current_turn(self, value: str) -> None:
        self.frame_state.current_turn = value

    @property
    def reds_remaining(self) -> int:
        return self.frame_state.reds_remaining

    @reds_remaining.setter
    def reds_remaining(self, value: int) -> None:
        self.frame_state.reds_remaining = value

    @property
    def colours_on_table(self) -> Dict[str, bool]:
        return self.frame_state.colours_on_table

    @colours_on_table.setter
    def colours_on_table(self, value: Dict[str, bool]) -> None:
        self.frame_state.colours_on_table = value

    @property
    def object_ball(self) -> str:
        return self.frame_state.object_ball

    @object_ball.setter
    def object_ball(self, value: str) -> None:
        self.frame_state.object_ball = value

    @property
    def history(self) -> List[dict]:
        return self.frame_state.history

    @history.setter
    def history(self, value: List[dict]) -> None:
        self.frame_state.history = value

    def add_opponent(self, p2: Participant):
        if len(self.players) < 2:
            self.players.append(p2)
            self.scores[p2.session_key] = 0

    def _opponent_key(self, session_key: str) -> str:
        return next(p.session_key for p in self.players if p.session_key != session_key)

    def _snapshot_state(self) -> dict:
        return self._history_manager.snapshot(self)

    def _restore_state(self, snapshot: dict):
        self._history_manager.restore(self, snapshot)

    def _push_history(self, actor_session_key: str, event: dict):
        self._history_manager.push(self, actor_session_key, event)

    def _highest_break_if_needed(self):
        if self.current_break > self.highest_break:
            self.highest_break = self.current_break

    def _remaining_colour_after(self, colour: str) -> Optional[str]:
        return self._table_progression.remaining_colour_after(self, colour)

    def _first_remaining_colour(self) -> Optional[str]:
        return self._table_progression.first_remaining_colour(self)

    def _remove_potted_balls(self, potted_balls: tuple[str, ...]):
        self._table_progression.remove_potted_balls(self, potted_balls)

    def _illegal_balls_for_target(self, potted_balls: tuple[str, ...]) -> list[str]:
        return self._table_progression.illegal_balls_for_target(self, potted_balls)

    def _advance_object_ball_after_legal_shot(self, potted_balls: tuple[str, ...]):
        self._table_progression.advance_object_ball_after_legal_shot(self, potted_balls)

    def _penalty_points(self, event: ShotMessage, illegal_balls: list[str]) -> int:
        return self._scoring_rules.penalty_points(event, illegal_balls)

    def _broadcast_state(self) -> dict:
        points_remaining = self.points_remaining()
        snookers_required = self.snooker_required()
        match_payload = self._match_payload()
        frame_payload = self._frame_payload(points_remaining, snookers_required)
        table_payload = self.table_state()

        return {
            "players": self._players_payload(),
            "scores": self.scores,
            "current_turn": self.current_turn,
            "current_break": self.current_break,
            "match_id": self.match_id,
            "match_importance": match_payload["match_importance"],
            "winning_condition": match_payload["winning_condition"],
            "match": match_payload,
            "frame": frame_payload,
            "table": table_payload,
            "points_remaining": points_remaining,
            "snooker_required": snookers_required,
            "score_keeper": self.score_keeper,
            "history_depth": len(self.history),
        }

    def can_player_keep_score(self, session_key: str) -> bool:
        is_at_table = self.current_turn == session_key

        if self.score_keeper == "self":
            return is_at_table
        if self.score_keeper == "opp":
            if len(self.players) < 2:
                return True
            return bool(self.current_turn) and not is_at_table
        if self.score_keeper == "ref":
            return False
        if self.score_keeper == "any":
            return True

        return False

    def table_state(self) -> dict:
        return {
            "reds_remaining": self.reds_remaining,
            "colours_on_table": deepcopy(self.colours_on_table),
            "object_ball": self.object_ball,
            "current_turn": self.current_turn,
            "current_break": self.current_break,
            "points_remaining": self.points_remaining(),
        }

    def _players_payload(self) -> list[dict]:
        return [
            {
                **player.to_dict(),
                "match_score": 0,
                "current_frame_score": self.scores.get(player.session_key, 0),
                "highest_break": None,
            }
            for player in self.players
        ]

    def _match_payload(self) -> dict:
        frames_to_win = self.frames_to_win if self.frames_to_win and self.frames_to_win > 0 else None

        return {
            "id": self.match_id,
            "name": self.match_id,
            "frames_to_win": frames_to_win,
            "winning_condition": (f"First to {frames_to_win}" if frames_to_win else "Open frame"),
            "match_importance": "Practice Match",
            "highest_break": self.highest_break if self.highest_break > 0 else None,
        }

    def _frame_payload(self, points_remaining: int, snookers_required: int) -> dict:
        scores = list(self.scores.values())
        leading_score = max(scores, default=0)
        trailing_score = min(scores, default=0)

        return {
            "points_remaining": points_remaining,
            "points_gap": leading_score - trailing_score,
            "snookers_required": snookers_required,
            "highest_break": self.highest_break if self.highest_break > 0 else None,
        }

    def points_remaining(self) -> int:
        return self._scoring_rules.points_remaining(self)

    def snooker_required(self) -> int:
        return self._scoring_rules.snooker_required(self)

    def apply_factual_event(self, session_key: str, event: dict):
        shot = ShotMessage.from_dict(event)
        self._push_history(session_key, event)

        potted_balls = tuple(ball for ball in shot.potted_balls if ball in BALL_POINTS)
        illegal_balls = self._illegal_balls_for_target(potted_balls)
        legal_balls = tuple(ball for ball in potted_balls if ball not in illegal_balls)
        is_foul = shot.foul > 0 or bool(illegal_balls)

        if not potted_balls and not is_foul:
            self.current_break = 0
            self.current_turn = self._opponent_key(session_key)
            if self.reds_remaining > 0:
                self.object_ball = RED_BALL
            self._highest_break_if_needed()
            return

        self._remove_potted_balls(potted_balls)

        if is_foul:
            penalty_points = self._penalty_points(shot, illegal_balls)
            self.scores[self._opponent_key(session_key)] += penalty_points
            self.current_break = 0
            self.current_turn = self._opponent_key(session_key)
            self._highest_break_if_needed()
            return

        legal_points = sum(BALL_POINTS[ball] for ball in legal_balls)
        self.scores[session_key] += legal_points
        self.current_break += legal_points
        self._advance_object_ball_after_legal_shot(legal_balls)
        self._highest_break_if_needed()

    def undo_last_event(self) -> bool:
        return self._history_manager.undo(self)

    def apply_event(self, session_key: str, event: dict) -> bool:
        self.apply_factual_event(session_key, event)
        return True

    def get_sync_payload(self) -> dict:
        return {
            "match_id": self.match_id,
            "scores": self.scores,
            "players": [p.to_dict() for p in self.players],
        }

    def state_payload(self) -> dict:
        payload = self._broadcast_state()
        payload["is_finished"] = self.is_finished
        return payload
