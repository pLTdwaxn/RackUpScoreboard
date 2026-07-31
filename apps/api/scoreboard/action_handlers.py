from __future__ import annotations

from dataclasses import dataclass

from scoreboard.domain.actions.messages import (
    ResolveBreakCompositionMessage,
    ShotMessage,
    SummaryBreakMessage,
)
from scoreboard.domain.models.frame import Frame
from scoreboard.domain.models.frame_state import FrameStatus
from scoreboard.domain.models.match import Match
from scoreboard.domain.models.matchroom import Matchroom
from scoreboard.domain.orchestrators.frame_orchestrator import (
    ActionOutcome,
    ActionPayload,
    FrameOrchestrator,
)
from scoreboard.services.action_services import (
    FramePhaseTransitionService,
    MatchResultService,
    NextFrameService,
    OpponentResolver,
    ScoreKeeperPolicy,
)
from scoreboard.services.frame_history_service import FrameHistoryService
from scoreboard.services.frame_reset_shot_service import FrameResetShotService
from scoreboard.services.frame_undo_service import FrameUndoService
from scoreboard.services.summary_break_composition_resolver import SummaryBreakCompositionResolver


@dataclass
class ActionContext:
    actor_key: str
    data: dict
    frame: Frame
    match: Match
    matchroom: Matchroom
    pending_next_frame_confirmations: set[str]
    frame_orchestrator: FrameOrchestrator
    score_keeper_policy: ScoreKeeperPolicy
    transition_service: FramePhaseTransitionService
    opponent_resolver: OpponentResolver
    match_result_service: MatchResultService
    next_frame_service: NextFrameService


class ShotActionHandler:
    def __init__(self, frame_history_service: FrameHistoryService | None = None) -> None:
        self._frame_history_service = frame_history_service or FrameHistoryService()

    def handle(self, context: ActionContext) -> tuple[bool, str | None]:
        allowed, error = ensure_actor_can_keep_score(context)
        if not allowed:
            return False, error

        state_before = self._frame_history_service.snapshot(context)

        transitioned, transition_error = context.transition_service.transition(
            context.frame,
            "shot",
        )
        if not transitioned:
            return False, transition_error

        shot = ShotMessage.from_dict(context.data)
        frame_turn = context.frame.turn_state
        frame_lifecycle = context.frame.lifecycle_state
        scoring_player_key = frame_turn.current_turn or context.actor_key
        was_finished = frame_lifecycle.status == FrameStatus.FINISHED

        outcome = context.frame_orchestrator.orchestrate(
            context.frame,
            ActionPayload(
                action="shot",
                potted_balls=shot.potted_balls,
                foul=shot.foul,
            ),
        )

        self._frame_history_service.push(
            context,
            scoring_player_key,
            context.data,
            outcome.to_dict(),
            state_before,
        )

        if not was_finished and frame_lifecycle.status == FrameStatus.FINISHED and frame_lifecycle.winner_key:
            context.pending_next_frame_confirmations.clear()
            context.match_result_service.record_finished_frame_result(
                context.match,
                frame_lifecycle.winner_key,
            )

        return True, None


class LogBreakActionHandler:
    def __init__(self, frame_history_service: FrameHistoryService | None = None) -> None:
        self._frame_history_service = frame_history_service or FrameHistoryService()

    def handle(self, context: ActionContext) -> tuple[bool, str | None]:
        allowed, error = ensure_actor_can_keep_score(context)
        if not allowed:
            return False, error

        state_before = self._frame_history_service.snapshot(context)

        transitioned, transition_error = context.transition_service.transition(
            context.frame,
            "log_break",
        )
        if not transitioned:
            return False, transition_error

        summary_break = SummaryBreakMessage.from_dict(context.data)
        frame_turn = context.frame.turn_state
        frame_lifecycle = context.frame.lifecycle_state
        scoring_player_key = frame_turn.current_turn or context.actor_key
        was_finished = frame_lifecycle.status == FrameStatus.FINISHED

        outcome = context.frame_orchestrator.orchestrate(
            context.frame,
            ActionPayload(
                action="log_break",
                break_points=summary_break.points,
                foul=summary_break.foul,
            ),
        )

        self._frame_history_service.push(
            context,
            scoring_player_key,
            {"action": "log_break", "data": dict(context.data)},
            outcome.to_dict(),
            state_before,
        )

        if not was_finished and frame_lifecycle.status == FrameStatus.FINISHED and frame_lifecycle.winner_key:
            context.pending_next_frame_confirmations.clear()
            context.match_result_service.record_finished_frame_result(
                context.match,
                frame_lifecycle.winner_key,
            )

        return True, None


class ResolveBreakCompositionActionHandler:
    def __init__(
        self,
        frame_history_service: FrameHistoryService | None = None,
        composition_resolver: SummaryBreakCompositionResolver | None = None,
    ) -> None:
        self._frame_history_service = frame_history_service or FrameHistoryService()
        self._composition_resolver = composition_resolver or SummaryBreakCompositionResolver()

    def handle(self, context: ActionContext) -> tuple[bool, str | None]:
        state_before = self._frame_history_service.snapshot(context)
        message = ResolveBreakCompositionMessage.from_dict(context.data)

        resolved, error, previous_outcome = self._composition_resolver.resolve(
            context.frame,
            message.entry_id,
            message.suggestion_id,
        )
        if not resolved:
            return False, error

        self._frame_history_service.push(
            context,
            context.actor_key,
            {"action": "resolve_break_composition", "data": dict(context.data)},
            {
                "action": "resolve_break_composition",
                "result": "resolved",
                "entry_id": message.entry_id,
                "suggestion_id": message.suggestion_id,
                "previous_outcome": previous_outcome,
            },
            state_before,
        )

        return True, None


def ensure_actor_can_keep_score(context: ActionContext) -> tuple[bool, str | None]:
    if context.score_keeper_policy.can_player_keep_score(
        context.matchroom,
        context.frame,
        context.actor_key,
    ):
        return True, None

    return False, "You are not allowed to keep score in this turn."


class UndoActionHandler:
    def __init__(self, frame_undo_service: FrameUndoService | None = None) -> None:
        self._frame_undo_service = frame_undo_service or FrameUndoService()

    def handle(self, context: ActionContext) -> tuple[bool, str | None]:
        if not self._frame_undo_service.undo(context):
            return False, "No prior message to undo."

        return True, None


class ConcedeActionHandler:
    def handle(self, context: ActionContext) -> tuple[bool, str | None]:
        if len(context.matchroom.players) < 2:
            return False, "Cannot concede when there is no opponent."

        lifecycle = context.frame.lifecycle_state
        if lifecycle.status != FrameStatus.ACTIVE and lifecycle.status != FrameStatus.READY:
            return False, "Current frame is not in progress."

        winner_key = context.opponent_resolver.resolve(
            context.matchroom,
            context.actor_key,
        )
        context.pending_next_frame_confirmations.clear()
        lifecycle.winner_key = winner_key
        lifecycle.status = FrameStatus.FINISHED
        context.match_result_service.record_finished_frame_result(
            context.match,
            winner_key,
        )

        return True, None


class NextFrameActionHandler:
    def handle(self, context: ActionContext) -> tuple[bool, str | None]:
        lifecycle = context.frame.lifecycle_state
        if lifecycle.status != FrameStatus.FINISHED:
            return False, "Current frame is not finished yet."

        if not lifecycle.winner_key:
            return False, "Current frame is finished but winner is missing."

        if context.match.is_finished:
            return False, "Match is already finished."

        context.pending_next_frame_confirmations.add(context.actor_key)
        if len(context.pending_next_frame_confirmations) < len(context.matchroom.players):
            return True, None

        context.next_frame_service.start_next_frame(context.frame, context.match, context.matchroom)
        context.pending_next_frame_confirmations.clear()
        return True, None


class PassShotActionHandler:
    def __init__(self, frame_history_service: FrameHistoryService | None = None) -> None:
        self._frame_history_service = frame_history_service or FrameHistoryService()

    def handle(self, context: ActionContext) -> tuple[bool, str | None]:
        allowed, error = ensure_actor_can_keep_score(context)
        if not allowed:
            return False, error

        lifecycle = context.frame.lifecycle_state
        turn = context.frame.turn_state
        if lifecycle.status != FrameStatus.ACTIVE:
            return False, "Current frame is not active."

        if not turn.previously_fouled:
            return False, "Cannot pass shot when the player has not fouled."

        state_before = self._frame_history_service.snapshot(context)
        passing_player_key = turn.current_turn or context.actor_key

        transitioned, transition_error = context.transition_service.transition(
            context.frame,
            "pass_shot",
        )
        if not transitioned:
            return False, transition_error

        outcome = context.frame_orchestrator.orchestrate(
            context.frame,
            ActionPayload(action="pass_shot", potted_balls=()),
        )

        self._frame_history_service.push(
            context,
            passing_player_key,
            {"action": "pass_shot", "data": {}},
            outcome.to_dict(),
            state_before,
        )

        return True, None


class ResetShotActionHandler:
    def __init__(
        self,
        frame_history_service: FrameHistoryService | None = None,
        frame_reset_shot_service: FrameResetShotService | None = None,
    ) -> None:
        self._frame_history_service = frame_history_service or FrameHistoryService()
        self._frame_reset_shot_service = frame_reset_shot_service or FrameResetShotService()

    def handle(self, context: ActionContext) -> tuple[bool, str | None]:
        allowed, error = ensure_actor_can_keep_score(context)
        if not allowed:
            return False, error

        turn = context.frame.turn_state
        can_reset, reset_error = self._frame_reset_shot_service.can_reset_shot(context)
        if not can_reset:
            return False, reset_error

        state_before = self._frame_history_service.snapshot(context)
        resetting_player_key = turn.current_turn or context.actor_key

        transitioned, transition_error = context.transition_service.transition(
            context.frame,
            "reset_shot",
        )
        if not transitioned:
            return False, transition_error

        if not self._frame_reset_shot_service.reset_shot(context):
            return False, "No shot is available to reset."

        self._frame_history_service.push(
            context,
            resetting_player_key,
            {"action": "reset_shot", "data": {}},
            ActionOutcome(action="reset_shot", result="reset").to_dict(),
            state_before,
        )
        return True, None


class DeclareFreeBallActionHandler:
    def __init__(self, frame_history_service: FrameHistoryService | None = None) -> None:
        self._frame_history_service = frame_history_service or FrameHistoryService()

    def handle(self, context: ActionContext) -> tuple[bool, str | None]:
        allowed, error = ensure_actor_can_keep_score(context)
        if not allowed:
            return False, error

        lifecycle = context.frame.lifecycle_state
        turn = context.frame.turn_state
        if lifecycle.status != FrameStatus.ACTIVE:
            return False, "Current frame is not active."

        if not turn.previously_fouled:
            return False, "Cannot declare a free ball when the player has not fouled."

        state_before = self._frame_history_service.snapshot(context)
        declaring_player_key = turn.current_turn or context.actor_key

        transitioned, transition_error = context.transition_service.transition(
            context.frame,
            "declare_free_ball",
        )
        if not transitioned:
            return False, transition_error

        nominated_colour = context.data.get("nominated_colour")
        if not nominated_colour:
            return False, "Nominated colour is missing."

        outcome = context.frame_orchestrator.orchestrate(
            context.frame,
            ActionPayload(
                action="declare_free_ball",
                potted_balls=(),
                nominated_colour=nominated_colour,
            ),
        )

        self._frame_history_service.push(
            context,
            declaring_player_key,
            {"action": "declare_free_ball", "data": dict(context.data)},
            outcome.to_dict(),
            state_before,
        )

        return True, None
