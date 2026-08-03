import pytest

from scoreboard.domain.models.frame import Frame
from scoreboard.domain.models.frame_state import FrameStatus
from scoreboard.services.frame_action_policy import (
    FRAME_NOT_ACTIVE_ERROR,
    FREE_BALL_REQUIRES_FOUL_ERROR,
    PASS_SHOT_REQUIRES_FOUL_ERROR,
    RESET_REQUIRES_FOUL_AND_MISS_ERROR,
    RESET_REQUIRES_MISS_AVAILABLE_AFTER_ERROR,
    RESET_REQUIRES_MISS_AVAILABLE_BEFORE_ERROR,
    RESET_REQUIRES_RECENT_FOUL_ERROR,
    RESET_REQUIRES_SHOT_ERROR,
    SUMMARY_BREAK_VISIT_STARTED_ERROR,
    FrameActionPolicy,
)


def make_frame() -> Frame:
    return Frame(
        id="frame-test",
        match_id="match-test",
        scores={"p1": 0, "p2": 0},
        current_turn="p1",
    )


def history_entry(actor: str, action: str = "shot") -> dict:
    return {
        "actor": actor,
        "outcome": {
            "action": action,
            "result": "scoring",
        },
    }


def foul_shot_history_entry(state_before: dict | None = None) -> dict:
    return {
        "actor": "p1",
        "outcome": {
            "action": "shot",
            "result": "foul",
        },
        "state_before": state_before
        or {
            "miss_rule_available": True,
        },
    }


def test_can_start_summary_break_allows_empty_visit() -> None:
    frame = make_frame()

    assert FrameActionPolicy().can_start_summary_break(frame) == (True, None)


def test_can_start_summary_break_allows_new_turn_after_opponent_entry() -> None:
    frame = make_frame()
    frame.history.append(history_entry("p2"))

    assert FrameActionPolicy().can_start_summary_break(frame) == (True, None)


@pytest.mark.parametrize("action", ["shot", "pass_shot", "declare_free_ball"])
def test_can_start_summary_break_blocks_after_current_turn_detail(action: str) -> None:
    frame = make_frame()
    frame.history.append(history_entry("p1", action))

    assert FrameActionPolicy().can_start_summary_break(frame) == (
        False,
        SUMMARY_BREAK_VISIT_STARTED_ERROR,
    )


def test_can_start_summary_break_ignores_resolution_entries() -> None:
    frame = make_frame()
    frame.history.extend(
        [
            history_entry("p2"),
            history_entry("p1", "resolve_break_composition"),
        ]
    )

    assert FrameActionPolicy().can_start_summary_break(frame) == (True, None)


def test_can_declare_free_ball_requires_active_frame() -> None:
    frame = make_frame()
    frame.turn_state.previously_fouled = True

    assert FrameActionPolicy().can_declare_free_ball(frame) == (
        False,
        FRAME_NOT_ACTIVE_ERROR,
    )


def test_can_declare_free_ball_requires_previous_foul() -> None:
    frame = make_frame()
    frame.lifecycle_state.status = FrameStatus.ACTIVE

    assert FrameActionPolicy().can_declare_free_ball(frame) == (
        False,
        FREE_BALL_REQUIRES_FOUL_ERROR,
    )


def test_can_declare_free_ball_allows_active_frame_after_foul() -> None:
    frame = make_frame()
    frame.lifecycle_state.status = FrameStatus.ACTIVE
    frame.turn_state.previously_fouled = True

    assert FrameActionPolicy().can_declare_free_ball(frame) == (True, None)


def test_can_pass_shot_requires_active_frame() -> None:
    frame = make_frame()
    frame.turn_state.previously_fouled = True

    assert FrameActionPolicy().can_pass_shot(frame) == (
        False,
        FRAME_NOT_ACTIVE_ERROR,
    )


def test_can_pass_shot_requires_previous_foul() -> None:
    frame = make_frame()
    frame.lifecycle_state.status = FrameStatus.ACTIVE

    assert FrameActionPolicy().can_pass_shot(frame) == (
        False,
        PASS_SHOT_REQUIRES_FOUL_ERROR,
    )


def test_can_pass_shot_allows_active_frame_after_foul() -> None:
    frame = make_frame()
    frame.lifecycle_state.status = FrameStatus.ACTIVE
    frame.turn_state.previously_fouled = True

    assert FrameActionPolicy().can_pass_shot(frame) == (True, None)


def test_can_reset_shot_requires_active_frame() -> None:
    frame = make_frame()
    frame.turn_state.previously_fouled = True

    assert FrameActionPolicy().can_reset_shot(frame) == (
        False,
        FRAME_NOT_ACTIVE_ERROR,
    )


def test_can_reset_shot_requires_previous_foul_and_miss() -> None:
    frame = make_frame()
    frame.lifecycle_state.status = FrameStatus.ACTIVE

    assert FrameActionPolicy().can_reset_shot(frame) == (
        False,
        RESET_REQUIRES_FOUL_AND_MISS_ERROR,
    )


def test_can_reset_shot_requires_history() -> None:
    frame = make_frame()
    frame.lifecycle_state.status = FrameStatus.ACTIVE
    frame.turn_state.previously_fouled = True

    assert FrameActionPolicy().can_reset_shot(frame) == (
        False,
        RESET_REQUIRES_SHOT_ERROR,
    )


def test_can_reset_shot_requires_latest_entry_to_be_fouled_shot() -> None:
    frame = make_frame()
    frame.lifecycle_state.status = FrameStatus.ACTIVE
    frame.turn_state.previously_fouled = True
    frame.history.append(history_entry("p1", "pass_shot"))

    assert FrameActionPolicy().can_reset_shot(frame) == (
        False,
        RESET_REQUIRES_RECENT_FOUL_ERROR,
    )


def test_can_reset_shot_requires_miss_rule_before_foul() -> None:
    frame = make_frame()
    frame.lifecycle_state.status = FrameStatus.ACTIVE
    frame.turn_state.previously_fouled = True
    frame.history.append(foul_shot_history_entry({"miss_rule_available": False}))

    assert FrameActionPolicy().can_reset_shot(frame) == (
        False,
        RESET_REQUIRES_MISS_AVAILABLE_BEFORE_ERROR,
    )


def test_can_reset_shot_requires_miss_rule_after_foul() -> None:
    frame = make_frame()
    frame.lifecycle_state.status = FrameStatus.ACTIVE
    frame.turn_state.previously_fouled = True
    frame.history.append(foul_shot_history_entry())
    frame.rule_state.miss_rule_available = False

    assert FrameActionPolicy().can_reset_shot(frame) == (
        False,
        RESET_REQUIRES_MISS_AVAILABLE_AFTER_ERROR,
    )


def test_can_reset_shot_allows_recent_fouled_shot_with_miss_available() -> None:
    frame = make_frame()
    frame.lifecycle_state.status = FrameStatus.ACTIVE
    frame.turn_state.previously_fouled = True
    frame.history.append(foul_shot_history_entry())

    assert FrameActionPolicy().can_reset_shot(frame) == (True, None)
