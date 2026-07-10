from __future__ import annotations

from dataclasses import dataclass

from scoreboard.engine.models.frame import FrameModel
from scoreboard.engine.models.frame_progression import FrameProgression
from scoreboard.engine.models.history_manager import HistoryManager
from scoreboard.engine.models.match import MatchModel
from scoreboard.engine.models.matchroom import MatchroomModel
from scoreboard.engine.models.states import FrameStatus
from scoreboard.engine.rules.messages import ShotMessage
from scoreboard.engine.services.action_services import (
    FramePhaseTransitionService,
    MatchResultService,
    NextFrameService,
    OpponentResolver,
    ScoreKeeperPolicy,
)


@dataclass
class ActionContext:
    actor_key: str
    data: dict
    frame: FrameModel
    match: MatchModel
    matchroom: MatchroomModel
    pending_next_frame_confirmations: set[str]
    frame_progression: FrameProgression
    score_keeper_policy: ScoreKeeperPolicy
    transition_service: FramePhaseTransitionService
    opponent_resolver: OpponentResolver
    match_result_service: MatchResultService
    next_frame_service: NextFrameService


class ShotActionHandler:
    def __init__(self, history_manager: HistoryManager | None = None) -> None:
        self._history_manager = history_manager or HistoryManager()

    def handle(self, context: ActionContext) -> tuple[bool, str | None]:
        if not context.score_keeper_policy.can_player_keep_score(
            context.matchroom,
            context.frame,
            context.actor_key,
        ):
            return False, "You are not allowed to keep score in this turn."

        transitioned, transition_error = context.transition_service.transition(
            context.frame,
            "shot",
        )
        if not transitioned:
            return False, transition_error

        shot = ShotMessage.from_dict(context.data)
        scoring_player_key = context.frame.current_turn or context.actor_key
        was_finished = context.frame.status == FrameStatus.FINISHED

        self._history_manager.push(context, scoring_player_key, context.data)

        context.frame_progression.process_shot(
            context.frame,
            shot.potted_balls,
            foul_points=shot.foul,
        )

        if not was_finished and context.frame.status == FrameStatus.FINISHED and context.frame.winner_key:
            context.pending_next_frame_confirmations.clear()
            context.match_result_service.record_finished_frame_result(
                context.match,
                context.frame.winner_key,
            )

        return True, None


class UndoActionHandler:
    def __init__(self, history_manager: HistoryManager | None = None) -> None:
        self._history_manager = history_manager or HistoryManager()

    def handle(self, context: ActionContext) -> tuple[bool, str | None]:
        if not self._history_manager.undo(context):
            return False, "No prior message to undo."

        transitioned, transition_error = context.transition_service.transition(
            context.frame,
            "undo",
        )
        if not transitioned:
            return False, transition_error

        return True, None


class ConcedeActionHandler:
    def handle(self, context: ActionContext) -> tuple[bool, str | None]:
        if len(context.matchroom.players) < 2:
            return False, "Cannot concede when there is no opponent."

        if context.frame.status != FrameStatus.ACTIVE and context.frame.status != FrameStatus.READY:
            return False, "Current frame is not in progress."

        winner_key = context.opponent_resolver.resolve(
            context.matchroom,
            context.actor_key,
        )
        context.pending_next_frame_confirmations.clear()
        context.frame.winner_key = winner_key
        context.frame.status = FrameStatus.FINISHED
        context.match_result_service.record_finished_frame_result(
            context.match,
            winner_key,
        )

        return True, None


class NextFrameActionHandler:
    def handle(self, context: ActionContext) -> tuple[bool, str | None]:
        if context.frame.status != FrameStatus.FINISHED:
            return False, "Current frame is not finished yet."

        if not context.frame.winner_key:
            return False, "Current frame is finished but winner is missing."

        if context.match.is_finished:
            return False, "Match is already finished."

        context.pending_next_frame_confirmations.add(context.actor_key)
        if len(context.pending_next_frame_confirmations) < len(context.matchroom.players):
            return True, None

        context.next_frame_service.start_next_frame(context.frame, context.match, context.matchroom)
        context.pending_next_frame_confirmations.clear()
        return True, None
