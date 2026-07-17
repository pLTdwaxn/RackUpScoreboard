from types import SimpleNamespace

from scoreboard.domain.frame_calculation.rule_state import calculate_frame_rule_state
from scoreboard.domain.models.frame import Frame
from scoreboard.domain.models.frame_state import FramePhase
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
    frame.lifecycle_state.status = frame.lifecycle_state.status.__class__("active")
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


def test_can_reset_shot_requires_active_frame_and_previous_foul_and_miss() -> None:
    service = FrameResetShotService()
    frame = make_frame()
    frame.lifecycle_state.status = frame.lifecycle_state.status.__class__("ready")

    can_reset, reason = service.can_reset_shot(make_state(frame))
    assert can_reset is False
    assert reason == "Current frame is not active."

    frame.lifecycle_state.status = frame.lifecycle_state.status.__class__("active")
    frame.turn_state.previously_fouled = False

    can_reset, reason = service.can_reset_shot(make_state(frame))
    assert can_reset is False
    assert reason == "Cannot reset shot when the previous shot was not foul and a miss."


def test_can_reset_shot_requires_latest_history_entry_to_be_fouled_shot() -> None:
    service = FrameResetShotService()
    frame = make_frame()

    can_reset, reason = service.can_reset_shot(make_state(frame))
    assert can_reset is False
    assert reason == "No shot is available to reset."

    frame.history.append(
        {
            "outcome": {"action": "pass_shot", "result": "passed"},
            "state_before": {},
        }
    )

    can_reset, reason = service.can_reset_shot(make_state(frame))
    assert can_reset is False
    assert reason == "Only the most recent fouled shot can be reset."


def test_can_reset_shot_requires_miss_rule_before_and_after_foul() -> None:
    service = FrameResetShotService()
    frame = make_frame()
    state_before = foul_shot_history_entry()["state_before"]
    state_before["miss_rule_available"] = False
    frame.history.append(foul_shot_history_entry(state_before))

    can_reset, reason = service.can_reset_shot(make_state(frame))
    assert can_reset is False
    assert reason == "Foul and a miss is not available when snookers are required before the shot."

    frame.history.clear()
    state_before["miss_rule_available"] = True
    frame.history.append(foul_shot_history_entry(state_before))
    frame.rule_state.miss_rule_available = False

    can_reset, reason = service.can_reset_shot(make_state(frame))
    assert can_reset is False
    assert reason == "Foul and a miss is not available when snookers are required after the shot."


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
