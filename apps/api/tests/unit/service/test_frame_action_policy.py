import pytest

from scoreboard.domain.models.frame import Frame
from scoreboard.services.frame_action_policy import (
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
