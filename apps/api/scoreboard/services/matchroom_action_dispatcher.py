from __future__ import annotations

from statemachine import State, StateMachine

from scoreboard.action_handlers import (
    ActionContext,
    ConcedeActionHandler,
    DeclareFreeBallActionHandler,
    NextFrameActionHandler,
    PassShotActionHandler,
    ResetShotActionHandler,
    ShotActionHandler,
    UndoActionHandler,
)
from scoreboard.domain.actions.validator import validate_event
from scoreboard.domain.models.frame_state import FrameStatus
from scoreboard.domain.models.matchroom import Matchroom
from scoreboard.domain.orchestrators.frame_orchestrator import FrameOrchestrator
from scoreboard.services.action_services import (
    FramePhaseTransitionService,
    MatchResultService,
    NextFrameService,
    OpponentResolver,
    ScoreKeeperPolicy,
)


class FrameStatusStateMachine(StateMachine):
    ready = State(initial=True, value=FrameStatus.READY.value)
    active = State(value=FrameStatus.ACTIVE.value)

    shot = ready.to(active) | active.to(active)
    undo = ready.to(ready) | active.to(ready)
    pass_shot = active.to(active)
    reset_shot = active.to(active)
    declare_free_ball = active.to(active)


class MatchroomActionDispatcher:
    """Dispatches room actions to handlers without coupling transport to domain logic."""

    def __init__(self) -> None:
        self._frame_orchestrator = FrameOrchestrator()
        self._score_keeper_policy = ScoreKeeperPolicy()
        self._opponent_resolver = OpponentResolver()
        self._match_result_service = MatchResultService()
        self._next_frame_service = NextFrameService()
        self._action_handlers = {
            "shot": ShotActionHandler(),
            "pass_shot": PassShotActionHandler(),
            "reset_shot": ResetShotActionHandler(),
            "declare_free_ball": DeclareFreeBallActionHandler(),
            "undo": UndoActionHandler(),
            "concede": ConcedeActionHandler(),
            "next_frame": NextFrameActionHandler(),
        }

    def _reconcile_roster_for_active_frame(self, matchroom: Matchroom) -> tuple[bool, str | None]:
        match = matchroom.match
        if match is None:
            return False, "Matchroom has no active match."

        current_frame_id = matchroom.current_frame_id
        if not current_frame_id:
            return False, "Matchroom has no active frame."

        frame = match.frames.get(current_frame_id)
        if frame is None:
            return False, "Active frame is missing from match state."

        for player in matchroom.players:
            player_key = player.session_key
            if player_key not in match.player_ids:
                match.add_player(player_key)
            match.match_scores.setdefault(player_key, 0)
            frame.scoring_state.scores.setdefault(player_key, 0)

        return True, None

    def dispatch(self, matchroom: Matchroom, actor_key: str, event: dict) -> tuple[bool, str | None]:
        try:
            validate_event(event)
        except ValueError as exc:
            return False, str(exc)

        reconciled, reconcile_error = self._reconcile_roster_for_active_frame(matchroom)
        if not reconciled:
            return False, reconcile_error

        match = matchroom.match
        if match is None:
            return False, "Matchroom has no active match."

        current_frame_id = matchroom.current_frame_id
        if not current_frame_id:
            return False, "Matchroom has no active frame."

        frame = match.frames.get(current_frame_id)
        if frame is None:
            return False, "Active frame is missing from match state."

        action = event.get("action")
        if not isinstance(action, str):
            return False, f"Unsupported action: {action}"

        handler = self._action_handlers.get(action)
        if handler is None:
            return False, f"Unsupported action: {action}"

        pending_confirmations = matchroom.pending_next_frame_confirmations
        transition_service = FramePhaseTransitionService(FrameStatusStateMachine())

        context = ActionContext(
            actor_key=actor_key,
            data=event.get("data", {}),
            frame=frame,
            match=match,
            matchroom=matchroom,
            pending_next_frame_confirmations=pending_confirmations,
            frame_orchestrator=self._frame_orchestrator,
            score_keeper_policy=self._score_keeper_policy,
            transition_service=transition_service,
            opponent_resolver=self._opponent_resolver,
            match_result_service=self._match_result_service,
            next_frame_service=self._next_frame_service,
        )

        return handler.handle(context)


matchroom_action_dispatcher = MatchroomActionDispatcher()
