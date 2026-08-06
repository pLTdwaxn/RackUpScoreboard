from scoreboard.domain.models.frame import Frame
from scoreboard.domain.projectors.payloads import frame_payload


def test_frame_payload_suppresses_table_derived_values_for_unresolved_summary_break() -> None:
    frame = Frame(
        id="frame-1",
        match_id="match-1",
        scores={"p1": 35, "p2": 4},
        current_turn="p2",
    )
    frame.history = [
        {
            "id": "h1",
            "actor": "p1",
            "event": {
                "action": "log_break",
                "data": {"points": 35, "foul": 4},
            },
            "outcome": {
                "action": "log_break",
                "result": "summary_break",
                "break_points": 35,
                "foul_points": 4,
                "composition_status": "missing",
            },
            "state_before": {},
        }
    ]

    payload = frame_payload(frame)

    assert payload["detail_level"] == "partially_detailed"
    assert payload["has_summary_entries"] is True
    assert payload["has_unresolved_compositions"] is True
    assert payload["has_unresolved_table_state"] is True
    assert payload["unresolved_summary_entry_ids"] == ["h1"]
    assert payload["reds_remaining"] is None
    assert payload["points_remaining"] is None
    assert payload["snookers_required"] is None


def test_frame_payload_keeps_table_derived_values_without_summary_breaks() -> None:
    frame = Frame(
        id="frame-1",
        match_id="match-1",
        scores={"p1": 0, "p2": 0},
        current_turn="p1",
    )

    payload = frame_payload(frame)

    assert payload["detail_level"] == "shot_by_shot"
    assert payload["has_summary_entries"] is False
    assert payload["has_unresolved_compositions"] is False
    assert payload["has_unresolved_table_state"] is False
    assert payload["unresolved_summary_entry_ids"] == []
    assert payload["reds_remaining"] == 15
    assert payload["points_remaining"] == 147
    assert payload["snookers_required"] == 0


def test_frame_payload_keeps_table_derived_values_for_foul_only_summary_break() -> None:
    frame = Frame(
        id="frame-1",
        match_id="match-1",
        scores={"p1": 0, "p2": 4},
        current_turn="p2",
    )
    frame.history = [
        {
            "id": "h1",
            "actor": "p1",
            "event": {
                "action": "log_break",
                "data": {"points": 0, "foul": 4},
            },
            "outcome": {
                "action": "log_break",
                "result": "foul",
                "break_points": 0,
                "foul_points": 4,
            },
            "state_before": {},
        }
    ]

    payload = frame_payload(frame)

    assert payload["detail_level"] == "partially_detailed"
    assert payload["has_summary_entries"] is True
    assert payload["has_unresolved_compositions"] is False
    assert payload["has_unresolved_table_state"] is False
    assert payload["unresolved_summary_entry_ids"] == []
    assert payload["reds_remaining"] == 15
    assert payload["points_remaining"] == 147
    assert payload["snookers_required"] == 0
