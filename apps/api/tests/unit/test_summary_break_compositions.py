from scoreboard.domain.balls import BALL_POINTS
from scoreboard.domain.summary_break_compositions import suggest_summary_break_compositions


def test_suggest_summary_break_compositions_returns_matching_totals() -> None:
    suggestions = suggest_summary_break_compositions(35)

    assert suggestions
    assert all(sum(BALL_POINTS[ball] for ball in suggestion["balls"]) == 35 for suggestion in suggestions)


def test_suggest_summary_break_compositions_handles_single_red() -> None:
    assert suggest_summary_break_compositions(1)[0] == {
        "id": "suggestion_1",
        "label": "1 red",
        "balls": ["red"],
    }
