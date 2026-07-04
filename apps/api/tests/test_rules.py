import pytest

from scoreboard.engine.rules.validator import validate_event


@pytest.mark.parametrize(
    "event",
    [
        {"potted": True, "potted_balls": ["red"], "foul": 0},
        {"potted": False, "potted_balls": [], "foul": 0},
        {"player": "player2", "potted": False, "potted_balls": [], "foul": 0},
        {"undo": True},
    ],
)
def test_validate_event_accepts_supported_messages(event):
    validate_event(event)


@pytest.mark.parametrize(
    "event, expected_error",
    [
        ({"action": "invalid_action"}, "Unsupported action: invalid_action"),
        ({"action": None}, "Unsupported action: None"),
        ({}, "Unsupported message shape."),
    ],
)
def test_validate_event_rejects_legacy_or_empty_messages(event, expected_error):
    with pytest.raises(ValueError, match=expected_error):
        validate_event(event)


@pytest.mark.parametrize(
    "event",
    [
        {"undo": True, "action": "pot"},
        {"undo": True, "player": "player1"},
    ],
)
def test_validate_event_rejects_undo_with_extra_fields(event):
    with pytest.raises(ValueError, match="Undo message cannot include legacy action fields."):
        validate_event(event)


@pytest.mark.parametrize(
    "event, expected_error",
    [
        (
            {
                "potted": True,
                "potted_balls": ["purple"],
                "foul": 0,
            },
            "Unsupported potted ball: purple",
        ),
        (
            {"potted": True, "potted_balls": "red", "foul": 0},
            "Factual event requires list 'potted_balls'.",
        ),
    ],
)
def test_validate_event_rejects_invalid_factual_messages(event, expected_error):
    with pytest.raises(ValueError, match=expected_error):
        validate_event(event)
