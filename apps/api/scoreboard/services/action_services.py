from __future__ import annotations

from statemachine import StateMachine
from statemachine.exceptions import TransitionNotAllowed

from scoreboard.domain.models.frame import Frame
from scoreboard.domain.models.frame_state import FrameStatus
from scoreboard.domain.models.match import Match
from scoreboard.domain.models.matchroom import Matchroom
from scoreboard.factories.frame_factory import FrameFactory


class ScoreKeeperPolicy:
    def can_player_keep_score(
        self,
        matchroom: Matchroom,
        frame: Frame,
        actor_key: str,
    ) -> bool:
        current_turn = frame.turn_state.current_turn
        is_at_table = current_turn == actor_key

        if matchroom.score_keeper == "self":
            return is_at_table
        if matchroom.score_keeper == "opp":
            if len(matchroom.players) < 2:
                return True
            return bool(current_turn) and not is_at_table
        if matchroom.score_keeper == "ref":
            return False
        if matchroom.score_keeper == "any":
            return True

        return False


class FramePhaseTransitionService:
    def __init__(self, phase_machine: StateMachine) -> None:
        self._phase_machine = phase_machine

    def transition(self, frame: Frame, action: str) -> tuple[bool, str | None]:
        lifecycle = frame.lifecycle_state
        self._phase_machine.current_state_value = lifecycle.status.value
        trigger = getattr(self._phase_machine, action, None)
        if trigger is None:
            return False, f"Unsupported action: {action}"

        try:
            trigger()
        except TransitionNotAllowed:
            return (
                False,
                f"Action '{action}' is not allowed while frame is '{lifecycle.status.value}'.",
            )

        lifecycle.status = FrameStatus(self._phase_machine.current_state_value)
        return True, None


class OpponentResolver:
    def resolve(self, matchroom: Matchroom, actor_key: str) -> str:
        return next(player.session_key for player in matchroom.players if player.session_key != actor_key)


class MatchResultService:
    def record_finished_frame_result(self, match: Match, winner_key: str) -> None:
        match.match_scores[winner_key] = match.match_scores.get(winner_key, 0) + 1
        if match.frames_to_win and match.match_scores[winner_key] >= match.frames_to_win:
            match.is_finished = True


class NextFrameService:
    def start_next_frame(
        self,
        frame: Frame,
        match: Match,
        matchroom: Matchroom,
    ) -> None:
        current_opening_turn = frame.turn_state.opening_turn or frame.turn_state.current_turn
        player_keys = [player.session_key for player in matchroom.players]
        next_opening_turn = next(
            (key for key in player_keys if key != current_opening_turn),
            current_opening_turn,
        )

        fresh_frame = FrameFactory.create_frame(
            {
                "opening_turn": next_opening_turn,
                "current_turn": next_opening_turn,
            },
            match.id,
            player_keys,
        )
        match.frames[fresh_frame.id] = fresh_frame
        matchroom.current_frame_id = fresh_frame.id
