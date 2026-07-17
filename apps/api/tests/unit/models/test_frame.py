from scoreboard.domain.balls import COLOUR_BALLS, RED_BALL
from scoreboard.domain.models.frame import Frame
from scoreboard.domain.models.frame_state import (
    FrameLifecycleState,
    FramePhase,
    FrameRuleState,
    FrameScoringState,
    FrameStatus,
    FrameTableState,
    FrameTurnState,
)


def make_frame() -> Frame:
    return Frame(
        id="frame-test",
        match_id="match-test",
        scores={"p1": 0, "p2": 0},
        current_turn="p1",
    )


def test_frame_initializes_table_turn_and_break_state() -> None:
    frame = make_frame()

    assert frame.id == "frame-test"
    assert frame.match_id == "match-test"
    assert isinstance(frame.scoring_state, FrameScoringState)
    assert dict(frame.scoring_state.scores) == {"p1": 0, "p2": 0}
    assert isinstance(frame.scoring_state.scores, dict)
    assert isinstance(frame.turn_state, FrameTurnState)
    assert frame.turn_state.current_turn == "p1"
    assert frame.turn_state.opening_turn == "p1"
    assert frame.turn_state.previously_fouled is False
    assert frame.scoring_state.current_break == 0
    assert frame.scoring_state.highest_break == 0
    assert isinstance(frame.lifecycle_state, FrameLifecycleState)
    assert frame.lifecycle_state.status is FrameStatus.READY
    assert frame.lifecycle_state.winner_key is None
    assert isinstance(frame.table_state, FrameTableState)
    assert frame.table_state.phase is FramePhase.REDS
    assert frame.table_state.reds_remaining == 15
    assert frame.table_state.colours_on_table == {colour: True for colour in COLOUR_BALLS}
    assert frame.table_state.object_ball == RED_BALL
    assert isinstance(frame.rule_state, FrameRuleState)
    assert frame.rule_state.points_remaining == 147
    assert frame.rule_state.snookers_required == 0
    assert frame.rule_state.miss_rule_available is True


def test_frame_scoring_state_can_be_updated_directly() -> None:
    frame = make_frame()

    frame.scoring_state.scores = {"p1": 10, "p2": 4}
    frame.scoring_state.current_break = 6
    frame.scoring_state.highest_break = 22

    assert frame.scoring_state == FrameScoringState(
        scores={"p1": 10, "p2": 4},
        current_break=6,
        highest_break=22,
    )


def test_frame_table_state_can_be_updated_directly() -> None:
    frame = make_frame()

    frame.table_state.phase = FramePhase.COLOURS
    frame.table_state.reds_remaining = 0
    frame.table_state.colours_on_table = {"yellow": True, "green": False}
    frame.table_state.object_ball = "yellow"
    frame.table_state.free_ball_nominated_colour = "blue"
    frame.table_state.free_ball_object_ball = "red"

    assert frame.table_state == FrameTableState(
        phase=FramePhase.COLOURS,
        reds_remaining=0,
        colours_on_table={"yellow": True, "green": False},
        object_ball="yellow",
        free_ball_nominated_colour="blue",
        free_ball_object_ball="red",
    )


def test_frame_turn_state_can_be_updated_directly() -> None:
    frame = make_frame()

    frame.turn_state.current_turn = "p2"
    frame.turn_state.opening_turn = "p2"
    frame.turn_state.previously_fouled = True

    assert frame.turn_state == FrameTurnState(
        current_turn="p2",
        opening_turn="p2",
        previously_fouled=True,
    )


def test_frame_lifecycle_state_can_be_updated_directly() -> None:
    frame = make_frame()

    frame.lifecycle_state.status = FrameStatus.FINISHED
    frame.lifecycle_state.winner_key = "p1"

    assert frame.lifecycle_state == FrameLifecycleState(
        status=FrameStatus.FINISHED,
        winner_key="p1",
    )


def test_frame_rule_state_can_be_updated_directly() -> None:
    frame = make_frame()

    frame.rule_state.points_remaining = 42
    frame.rule_state.snookers_required = 3
    frame.rule_state.miss_rule_available = False

    assert frame.rule_state == FrameRuleState(
        points_remaining=42,
        snookers_required=3,
        miss_rule_available=False,
    )


def test_scoring_state_uses_plain_dict() -> None:
    frame = make_frame()

    frame.scoring_state.scores = {"p1": 10, "p2": 3}

    assert isinstance(frame.scoring_state.scores, dict)
    assert dict(frame.scoring_state.scores) == {"p1": 10, "p2": 3}
