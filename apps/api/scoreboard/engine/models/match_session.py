from __future__ import annotations

from statemachine import State, StateMachine
from statemachine.exceptions import TransitionNotAllowed

from scoreboard.engine.action_handlers import ConcedeActionHandler, NextFrameActionHandler
from scoreboard.engine.models.frame import FrameModel
from scoreboard.engine.models.frame_progression import FrameProgression
from scoreboard.engine.models.history_manager import HistoryManager
from scoreboard.engine.models.match import MatchModel
from scoreboard.engine.models.match_state_projector import MatchStateProjector
from scoreboard.engine.models.matchroom import MatchroomModel
from scoreboard.engine.models.participant import Participant
from scoreboard.engine.models.states import FrameStatus
from scoreboard.engine.rules.messages import ShotMessage
from scoreboard.engine.rules.validator import validate_event

VALID_SCORE_KEEPERS = {"self", "opp", "ref", "any"}


class FrameStatusStateMachine(StateMachine):
    ready = State(initial=True, value=FrameStatus.READY.value)
    active = State(value=FrameStatus.ACTIVE.value)

    shot = ready.to(active) | active.to(active)
    undo = ready.to(ready) | active.to(ready)


class MatchSession:
    """Coordinates command processing over matchroom/match/frame aggregates."""

    def __init__(self, match_id: str, p1: Participant, score_keeper: str = "opp"):
        self._history_manager = HistoryManager()
        self._frame_progression = FrameProgression()
        self._state_projector = MatchStateProjector()
        self._phase_machine = FrameStatusStateMachine()
        self.pending_next_frame_confirmations: set[str] = set()
        normalized_score_keeper = score_keeper if score_keeper in VALID_SCORE_KEEPERS else "opp"

        self.matchroom = MatchroomModel(
            match_id=match_id,
            players=[p1],
            score_keeper=normalized_score_keeper,
        )
        self.match = MatchModel()
        self.match.match_scores = {p1.session_key: 0}
        self.frame = FrameModel(
            scores={p1.session_key: 0},
            current_turn=p1.session_key,
            opening_turn=p1.session_key,
        )

    def add_opponent(self, p2: Participant) -> None:
        if len(self.matchroom.players) < 2:
            self.matchroom.add_player(p2)
            self.frame.scores[p2.session_key] = 0
            self.match.match_scores[p2.session_key] = 0

    def _opponent_key(self, session_key: str) -> str:
        return next(p.session_key for p in self.matchroom.players if p.session_key != session_key)

    def _snapshot_state(self) -> dict:
        return self._history_manager.snapshot(self)

    def _restore_state(self, snapshot: dict) -> None:
        self._history_manager.restore(self, snapshot)

    def _push_history(self, actor_session_key: str, event: dict) -> None:
        self._history_manager.push(self, actor_session_key, event)

    def _sync_phase_machine(self) -> None:
        self._phase_machine.current_state_value = self.frame.status.value

    def _transition_phase(self, action: str) -> tuple[bool, str | None]:
        self._sync_phase_machine()
        trigger = getattr(self._phase_machine, action, None)
        if trigger is None:
            return False, f"Unsupported action: {action}"

        try:
            trigger()
        except TransitionNotAllowed:
            return (
                False,
                f"Action '{action}' is not allowed while frame is '{self.frame.status.value}'.",
            )

        self.frame.status = FrameStatus(self._phase_machine.current_state_value)
        return True, None

    def can_player_keep_score(self, session_key: str) -> bool:
        is_at_table = self.frame.current_turn == session_key

        if self.matchroom.score_keeper == "self":
            return is_at_table
        if self.matchroom.score_keeper == "opp":
            if len(self.matchroom.players) < 2:
                return True
            return bool(self.frame.current_turn) and not is_at_table
        if self.matchroom.score_keeper == "ref":
            return False
        if self.matchroom.score_keeper == "any":
            return True

        return False

    def apply_factual_event(self, session_key: str, event: dict) -> None:
        shot = ShotMessage.from_dict(event)
        self._push_history(session_key, event)

        self._frame_progression.process_shot(
            self.frame,
            shot.potted_balls,
            foul_points=shot.foul,
        )

    def undo_last_event(self) -> bool:
        return self._history_manager.undo(self)

    def _handle_shot_action(self, session_key: str, data: dict) -> tuple[bool, str | None]:
        if not self.can_player_keep_score(session_key):
            return False, "You are not allowed to keep score in this turn."

        transitioned, transition_error = self._transition_phase("shot")
        if not transitioned:
            return False, transition_error

        scoring_player_key = self.frame.current_turn or session_key
        self.apply_factual_event(scoring_player_key, data)
        return True, None

    def _handle_undo_action(self) -> tuple[bool, str | None]:
        if not self.undo_last_event():
            return False, "No prior message to undo."

        transitioned, transition_error = self._transition_phase("undo")
        if not transitioned:
            return False, transition_error

        return True, None

    def _handle_concede_action(self, session_key: str) -> tuple[bool, str | None]:
        return ConcedeActionHandler().handle(self, session_key)

    def _handle_next_frame_action(self, session_key: str) -> tuple[bool, str | None]:
        return NextFrameActionHandler().handle(self, session_key)

    def process_event(self, session_key: str, event: dict) -> tuple[bool, str | None]:
        try:
            validate_event(event)
        except ValueError as exc:
            return False, str(exc)

        action = event.get("action")
        if not isinstance(action, str):
            return False, f"Unsupported action: {action}"
        data = event.get("data", {})

        match action:
            case "shot":
                return self._handle_shot_action(session_key, data)
            case "undo":
                return self._handle_undo_action()
            case "concede":
                return self._handle_concede_action(session_key)
            case "next_frame":
                return self._handle_next_frame_action(session_key)
            case _:
                return False, f"Unsupported action: {action}"

    def apply_event(self, session_key: str, event: dict) -> bool:
        handled, error = self.process_event(session_key, event)
        if error:
            raise ValueError(error)
        return handled

    def state_payload(self) -> dict:
        return self._state_projector.state_payload(self)
