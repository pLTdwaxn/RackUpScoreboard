from __future__ import annotations

from statemachine import StateMachine
from statemachine.exceptions import TransitionNotAllowed

from scoreboard.engine.models.frame import FrameModel
from scoreboard.engine.models.match import MatchModel
from scoreboard.engine.models.matchroom import MatchroomModel
from scoreboard.engine.models.states import FrameStatus


class ScoreKeeperPolicy:
    def can_player_keep_score(
        self,
        matchroom: MatchroomModel,
        frame: FrameModel,
        actor_key: str,
    ) -> bool:
        is_at_table = frame.current_turn == actor_key

        if matchroom.score_keeper == "self":
            return is_at_table
        if matchroom.score_keeper == "opp":
            if len(matchroom.players) < 2:
                return True
            return bool(frame.current_turn) and not is_at_table
        if matchroom.score_keeper == "ref":
            return False
        if matchroom.score_keeper == "any":
            return True

        return False


class FramePhaseTransitionService:
    def __init__(self, phase_machine: StateMachine) -> None:
        self._phase_machine = phase_machine

    def transition(self, frame: FrameModel, action: str) -> tuple[bool, str | None]:
        self._phase_machine.current_state_value = frame.status.value
        trigger = getattr(self._phase_machine, action, None)
        if trigger is None:
            return False, f"Unsupported action: {action}"

        try:
            trigger()
        except TransitionNotAllowed:
            return (
                False,
                f"Action '{action}' is not allowed while frame is '{frame.status.value}'.",
            )

        frame.status = FrameStatus(self._phase_machine.current_state_value)
        return True, None


class OpponentResolver:
    def resolve(self, matchroom: MatchroomModel, actor_key: str) -> str:
        return next(player.session_key for player in matchroom.players if player.session_key != actor_key)


class MatchResultService:
    def record_finished_frame_result(self, match: MatchModel, winner_key: str) -> None:
        match.match_scores[winner_key] = match.match_scores.get(winner_key, 0) + 1
        if match.frames_to_win and match.match_scores[winner_key] >= match.frames_to_win:
            match.is_finished = True


class NextFrameService:
    def start_next_frame(self, frame: FrameModel, matchroom: MatchroomModel) -> None:
        current_opening_turn = frame.opening_turn or frame.current_turn
        player_keys = [player.session_key for player in matchroom.players]
        next_opening_turn = next(
            (key for key in player_keys if key != current_opening_turn),
            current_opening_turn,
        )

        fresh_frame = FrameModel(
            scores={player.session_key: 0 for player in matchroom.players},
            current_turn=next_opening_turn,
            opening_turn=next_opening_turn,
        )
        frame.__dict__.clear()
        frame.__dict__.update(fresh_frame.__dict__)
