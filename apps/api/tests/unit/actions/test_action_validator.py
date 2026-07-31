import pytest

from scoreboard.domain.actions.validator import validate_event


@pytest.mark.parametrize(
    "event",
    [
        {"action": "shot", "data": {"potted_balls": ["red"], "foul": 0}},
        {"action": "shot", "data": {"potted_balls": [], "foul": 0}},
        {"action": "undo", "data": {}},
        {"action": "pass_shot", "data": {}},
        {"action": "reset_shot", "data": {}},
        {"action": "declare_free_ball", "data": {"nominated_colour": "blue"}},
        {"action": "log_break", "data": {"points": 35, "foul": 4}},
        {
            "action": "resolve_break_composition",
            "data": {"entry_id": "history-1", "suggestion_id": "suggestion_1"},
        },
        {"action": "concede", "data": {}},
        {"action": "next_frame", "data": {}},
    ],
)
def test_validate_event_accepts_supported_messages(event):
    validate_event(event)


@pytest.mark.parametrize(
    "event, expected_error",
    [
        (
            {"action": "invalid_action", "data": {}},
            "Unsupported action: invalid_action",
        ),
        ({"action": None, "data": {}}, "Unsupported action: None"),
        ({}, "Unsupported action: None"),
    ],
)
def test_validate_event_rejects_legacy_or_empty_messages(event, expected_error):
    with pytest.raises(ValueError, match=expected_error):
        validate_event(event)


@pytest.mark.parametrize(
    "event",
    [
        {"action": "undo", "data": {"player": "player1"}},
        {"action": "undo", "data": {"action": "shot"}},
    ],
)
def test_validate_event_rejects_undo_with_extra_fields(event):
    with pytest.raises(ValueError, match="Undo action does not accept payload data."):
        validate_event(event)


@pytest.mark.parametrize(
    "event, expected_error",
    [
        (
            {"action": "pass_shot", "data": {"nominated_colour": "blue"}},
            "Pass shot action does not accept payload data.",
        ),
        (
            {"action": "reset_shot", "data": {"nominated_colour": "blue"}},
            "Reset shot action does not accept payload data.",
        ),
        (
            {"action": "declare_free_ball", "data": {}},
            "Missing free ball payload fields: nominated_colour",
        ),
        (
            {"action": "declare_free_ball", "data": {"nominated_colour": "red"}},
            "Unsupported nominated colour: red",
        ),
        (
            {
                "action": "declare_free_ball",
                "data": {"nominated_colour": "blue", "foul": 4},
            },
            "Unsupported free ball payload fields: foul",
        ),
        (
            {"action": "log_break", "data": {"points": 35}},
            "Missing log break payload fields: foul",
        ),
        (
            {"action": "log_break", "data": {"points": 156, "foul": 0}},
            "Log break payload requires integer 'points' between 0 and 155.",
        ),
        (
            {"action": "log_break", "data": {"points": 35, "foul": 8}},
            "Log break payload requires integer 'foul' between 0 and 7.",
        ),
        (
            {"action": "log_break", "data": {"points": 0, "foul": 0}},
            "Log break payload requires non-zero points or foul.",
        ),
        (
            {"action": "resolve_break_composition", "data": {"entry_id": "history-1"}},
            "Missing resolve break composition payload fields: suggestion_id",
        ),
        (
            {
                "action": "resolve_break_composition",
                "data": {"entry_id": "", "suggestion_id": "suggestion_1"},
            },
            "Resolve break composition payload requires non-empty 'entry_id'.",
        ),
        (
            {
                "action": "resolve_break_composition",
                "data": {"entry_id": "history-1", "suggestion_id": ""},
            },
            "Resolve break composition payload requires non-empty 'suggestion_id'.",
        ),
    ],
)
def test_validate_event_rejects_invalid_non_shot_messages(event, expected_error):
    with pytest.raises(ValueError, match=expected_error):
        validate_event(event)


@pytest.mark.parametrize(
    "event, expected_error",
    [
        (
            {
                "action": "shot",
                "data": {
                    "potted_balls": ["purple"],
                    "foul": 0,
                },
            },
            "Unsupported potted ball: purple",
        ),
        (
            {"action": "shot", "data": {"potted_balls": "red", "foul": 0}},
            "Shot payload requires list 'potted_balls'.",
        ),
    ],
)
def test_validate_event_rejects_invalid_factual_messages(event, expected_error):
    with pytest.raises(ValueError, match=expected_error):
        validate_event(event)
