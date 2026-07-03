import pytest

from app.engine.rules.validator import validate_event


@pytest.mark.parametrize(
    "event",
    [
        {"action": "pot", "points": 1},
        {"action": "pot", "points": 7},
        {"action": "miss"},
        {"action": "foul"},
        {"action": "frame_conceded"},
        {"action": "link_match_model", "match_id": "abc123"},
    ],
)
def test_validate_event_accepts_supported_actions(event):
    validate_event(event)


@pytest.mark.parametrize(
    "event, expected_error",
    [
        ({"action": "invalid_action"}, "Unsupported action: invalid_action"),
        ({"action": None}, "Unsupported action: None"),
        ({}, "Unsupported action: None"),
    ],
)
def test_validate_event_rejects_unknown_actions(event, expected_error):
    with pytest.raises(ValueError, match=expected_error):
        validate_event(event)


@pytest.mark.parametrize(
    "points",
    [
        "7",
        7.0,
        None,
        [],
        {},
    ],
)
def test_validate_event_requires_integer_points_for_pot(points):
    with pytest.raises(ValueError, match="Pot action requires integer 'points'."):
        validate_event({"action": "pot", "points": points})
