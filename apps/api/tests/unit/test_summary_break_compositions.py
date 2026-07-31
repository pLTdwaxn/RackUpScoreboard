from scoreboard.domain.balls import BALL_POINTS
from scoreboard.domain.summary_break_compositions import suggest_summary_break_compositions


def test_suggest_summary_break_compositions_returns_matching_totals() -> None:
    suggestions = suggest_summary_break_compositions(35)

    assert suggestions
    assert len(suggestions) == 267
    assert suggestions[0] == {
        "id": "suggestion_1",
        "label": "5 reds, 1 yellow, 4 blacks",
        "balls": ["red", "black", "red", "black", "red", "black", "red", "black", "red", "yellow"],
    }
    assert suggestions[-1]["id"] == "suggestion_267"
    assert all(sum(BALL_POINTS[ball] for ball in suggestion["balls"]) == 35 for suggestion in suggestions)
    assert all(_has_valid_red_colour_shape(suggestion["balls"]) for suggestion in suggestions)
    assert len({suggestion["label"] for suggestion in suggestions}) == len(suggestions)


def test_suggest_summary_break_compositions_handles_single_red() -> None:
    assert suggest_summary_break_compositions(1)[0] == {
        "id": "suggestion_1",
        "label": "1 red",
        "balls": ["red"],
    }


def test_suggest_summary_break_compositions_rejects_consecutive_red_only_breaks() -> None:
    suggestions = suggest_summary_break_compositions(15)

    assert suggestions
    assert suggestions[0] == {
        "id": "suggestion_1",
        "label": "2 reds, 1 pink, 1 black",
        "balls": ["red", "black", "red", "pink"],
    }
    assert all(suggestion["balls"] != ["red"] * 15 for suggestion in suggestions)
    assert all(sum(BALL_POINTS[ball] for ball in suggestion["balls"]) == 15 for suggestion in suggestions)
    assert all(_has_valid_red_colour_shape(suggestion["balls"]) for suggestion in suggestions)


def _has_valid_red_colour_shape(balls: list[str]) -> bool:
    expected_red = True
    trailing_red_seen = False

    for index, ball in enumerate(balls):
        if expected_red:
            if ball != "red":
                return False
            trailing_red_seen = index == len(balls) - 1
            expected_red = False
            continue

        if ball == "red":
            return False
        expected_red = True

    return expected_red or trailing_red_seen
