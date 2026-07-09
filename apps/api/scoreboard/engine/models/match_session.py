from __future__ import annotations

from statemachine import State, StateMachine

from scoreboard.engine.action_handlers import (
    ActionContext,
    ConcedeActionHandler,
    NextFrameActionHandler,
    ShotActionHandler,
    UndoActionHandler,
)
from scoreboard.engine.models.frame import FrameModel
from scoreboard.engine.models.frame_progression import FrameProgression
from scoreboard.engine.models.match import MatchModel
from scoreboard.engine.models.match_state_projector import MatchStateProjector
from scoreboard.engine.models.matchroom import MatchroomModel
from scoreboard.engine.models.participant import Participant
from scoreboard.engine.models.states import FrameStatus
from scoreboard.engine.rules.validator import validate_event
from scoreboard.engine.services.action_services import (
    FramePhaseTransitionService,
    MatchResultService,
    NextFrameService,
    OpponentResolver,
    ScoreKeeperPolicy,
)

VALID_SCORE_KEEPERS = {"self", "opp", "ref", "any"}


class FrameStatusStateMachine(StateMachine):
    ready = State(initial=True, value=FrameStatus.READY.value)
    active = State(value=FrameStatus.ACTIVE.value)

    shot = ready.to(active) | active.to(active)
    undo = ready.to(ready) | active.to(ready)


class MatchSession:
    """Coordinates command processing over matchroom/match/frame aggregates."""

    def __init__(self, match_id: str, p1: Participant, score_keeper: str = "opp"):
        self._frame_progression = FrameProgression()
        self._state_projector = MatchStateProjector()
        self._phase_machine = FrameStatusStateMachine()
        self._score_keeper_policy = ScoreKeeperPolicy()
        self._transition_service = FramePhaseTransitionService(self._phase_machine)
        self._opponent_resolver = OpponentResolver()
        self._match_result_service = MatchResultService()
        self._next_frame_service = NextFrameService()
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
        self._action_handlers = {
            "shot": ShotActionHandler(),
            "undo": UndoActionHandler(),
            "concede": ConcedeActionHandler(),
            "next_frame": NextFrameActionHandler(),
        }

    def add_opponent(self, p2: Participant) -> None:
        if len(self.matchroom.players) < 2:
            self.matchroom.add_player(p2)
            self.frame.scores[p2.session_key] = 0
            self.match.match_scores[p2.session_key] = 0

    def process_event(self, session_key: str, event: dict) -> tuple[bool, str | None]:
        try:
            validate_event(event)
        except ValueError as exc:
            return False, str(exc)

        action = event.get("action")
        if not isinstance(action, str):
            return False, f"Unsupported action: {action}"
        data = event.get("data", {})

        handler = self._action_handlers.get(action)
        if handler is None:
            return False, f"Unsupported action: {action}"

        context = ActionContext(
            actor_key=session_key,
            data=data,
            frame=self.frame,
            match=self.match,
            matchroom=self.matchroom,
            pending_next_frame_confirmations=self.pending_next_frame_confirmations,
            frame_progression=self._frame_progression,
            score_keeper_policy=self._score_keeper_policy,
            transition_service=self._transition_service,
            opponent_resolver=self._opponent_resolver,
            match_result_service=self._match_result_service,
            next_frame_service=self._next_frame_service,
        )

        return handler.handle(context)

    def apply_event(self, session_key: str, event: dict) -> bool:
        handled, error = self.process_event(session_key, event)
        if error:
            raise ValueError(error)
        return handled

    def state_payload(self) -> dict:
        return self._state_projector.state_payload(self)
