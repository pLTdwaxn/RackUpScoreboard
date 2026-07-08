import pytest

from scoreboard.engine.rules.validator import validate_event


@pytest.mark.parametrize(
    "event",
    [
        {"action": "shot", "data": {"potted_balls": ["red"], "foul": 0}},
        {"action": "shot", "data": {"potted_balls": [], "foul": 0}},
        {"action": "undo", "data": {}},
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
