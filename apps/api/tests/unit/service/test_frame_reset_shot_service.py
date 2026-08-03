from types import SimpleNamespace

from scoreboard.domain.frame_calculation.rule_state import calculate_frame_rule_state
from scoreboard.domain.models.frame import Frame
from scoreboard.domain.models.frame_state import FramePhase, FrameStatus
from scoreboard.services.frame_reset_shot_service import FrameResetShotService


def make_state(frame: Frame) -> SimpleNamespace:
    return SimpleNamespace(frame=frame)


def make_frame() -> Frame:
    frame = Frame(
        id="frame-test",
        match_id="match-test",
        scores={"p1": 0, "p2": 0},
        current_turn="p2",
    )
    frame.lifecycle_state.status = FrameStatus.ACTIVE
    frame.turn_state.previously_fouled = True
    return frame


def foul_shot_history_entry(state_before: dict | None = None) -> dict:
    return {
        "actor": "p2",
        "event": {"action": "shot", "data": {"potted_balls": [], "foul": 4}},
        "outcome": {
            "action": "shot",
            "result": "foul",
        },
        "state_before": state_before
        or {
            "current_turn": "p1",
            "opening_turn": "p1",
            "frame_phase": "reds",
            "reds_remaining": 15,
            "colours_on_table": {"yellow": True, "green": True},
            "object_ball": "red",
            "free_ball_nominated_colour": None,
            "free_ball_object_ball": None,
            "miss_rule_available": True,
        },
    }


def test_reset_shot_returns_false_without_restore_snapshot() -> None:
    service = FrameResetShotService()
    frame = make_frame()

    assert service.reset_shot(make_state(frame)) is False

    frame.history.append(
        {
            "outcome": {"action": "pass_shot", "result": "passed"},
            "state_before": {},
        }
    )

    assert service.reset_shot(make_state(frame)) is False


def test_reset_shot_restores_table_and_turn_without_changing_scores() -> None:
    service = FrameResetShotService()
    frame = make_frame()
    frame.scoring_state.scores = {"p1": 0, "p2": 4}
    frame.turn_state.current_turn = "p2"
    frame.turn_state.opening_turn = "p2"
    frame.turn_state.previously_fouled = True
    frame.table_state.phase = FramePhase.COLOURS
    frame.table_state.reds_remaining = 14
    frame.table_state.colours_on_table = {"yellow": False, "green": True}
    frame.table_state.object_ball = "yellow"
    frame.table_state.free_ball_nominated_colour = "blue"
    frame.table_state.free_ball_object_ball = "red"
    frame.history.append(foul_shot_history_entry())

    assert service.reset_shot(make_state(frame)) is True

    assert frame.scoring_state.scores == {"p1": 0, "p2": 4}
    assert frame.turn_state.current_turn == "p1"
    assert frame.turn_state.opening_turn == "p1"
    assert frame.turn_state.previously_fouled is False
    assert frame.table_state.phase == FramePhase.REDS
    assert frame.table_state.reds_remaining == 15
    assert frame.table_state.colours_on_table == {"yellow": True, "green": True}
    assert frame.table_state.object_ball == "red"
    assert frame.table_state.free_ball_nominated_colour is None
    assert frame.table_state.free_ball_object_ball is None
    assert frame.rule_state == calculate_frame_rule_state(frame)
