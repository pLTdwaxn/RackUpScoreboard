from statemachine import State, StateMachine

from scoreboard.domain.models.frame import Frame
from scoreboard.domain.models.match import Match
from scoreboard.domain.models.matchroom import Matchroom
from scoreboard.domain.models.player import Player
from scoreboard.services.action_services import (
    FramePhaseTransitionService,
    MatchResultService,
    NextFrameService,
    OpponentResolver,
    ScoreKeeperPolicy,
)


class SimpleFrameStateMachine(StateMachine):
    ready = State(initial=True, value="ready")
    active = State(value="active", final=True)

    shot = ready.to(active)


def make_matchroom(score_keeper: str = "opp") -> Matchroom:
    return Matchroom(
        id="room-1",
        players=[
            Player(id="player-1", session_key="p1", name="Player 1"),
            Player(id="player-2", session_key="p2", name="Player 2"),
        ],
        score_keeper=score_keeper,
    )


def test_score_keeper_policy_covers_supported_modes() -> None:
    frame = Frame(id="frame-1", match_id="match-1", scores={}, current_turn="p1")
    policy = ScoreKeeperPolicy()
    unsupported_room = make_matchroom()
    unsupported_room.score_keeper = "unsupported"

    assert policy.can_player_keep_score(make_matchroom("self"), frame, "p1") is True
    assert policy.can_player_keep_score(make_matchroom("self"), frame, "p2") is False
    assert policy.can_player_keep_score(make_matchroom("opp"), frame, "p1") is False
    assert policy.can_player_keep_score(make_matchroom("opp"), frame, "p2") is True
    assert policy.can_player_keep_score(Matchroom(id="solo", players=[], score_keeper="opp"), frame, "p1") is True
    assert policy.can_player_keep_score(make_matchroom("ref"), frame, "p2") is False
    assert policy.can_player_keep_score(make_matchroom("any"), frame, "p1") is True
    assert policy.can_player_keep_score(unsupported_room, frame, "p1") is False


def test_frame_phase_transition_service_reports_unsupported_and_disallowed_actions() -> None:
    frame = Frame(id="frame-1", match_id="match-1", scores={})
    service = FramePhaseTransitionService(SimpleFrameStateMachine())

    transitioned, error = service.transition(frame, "missing")
    assert transitioned is False
    assert error == "Unsupported action: missing"

    transitioned, error = service.transition(frame, "shot")
    assert transitioned is True
    assert error is None
    assert frame.lifecycle_state.status.value == "active"

    transitioned, error = service.transition(frame, "shot")
    assert transitioned is False
    assert error == "Action 'shot' is not allowed while frame is 'active'."


def test_opponent_resolver_returns_other_player() -> None:
    assert OpponentResolver().resolve(make_matchroom(), "p1") == "p2"


def test_match_result_service_marks_match_finished_at_target_score() -> None:
    match = Match(id="match-1", matchroom_id="room-1", player_ids=["p1", "p2"], frames_to_win=1)

    MatchResultService().record_finished_frame_result(match, "p1")

    assert match.match_scores["p1"] == 1
    assert match.is_finished is True


def test_next_frame_service_starts_frame_with_alternating_opening_turn() -> None:
    frame = Frame(
        id="frame-1",
        match_id="match-1",
        scores={"p1": 0, "p2": 0},
        current_turn="p1",
        opening_turn="p1",
    )
    match = Match(
        id="match-1",
        matchroom_id="room-1",
        player_ids=["p1", "p2"],
        frames={frame.id: frame},
    )
    matchroom = make_matchroom()
    matchroom.match = match
    matchroom.current_frame_id = frame.id

    NextFrameService().start_next_frame(frame, match, matchroom)

    fresh_frame = match.frames[matchroom.current_frame_id]
    assert fresh_frame.id != frame.id
    assert fresh_frame.turn_state.opening_turn == "p2"
    assert fresh_frame.turn_state.current_turn == "p2"
