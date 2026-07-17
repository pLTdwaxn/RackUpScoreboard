from types import SimpleNamespace

from scoreboard.domain.models.frame import Frame
from scoreboard.domain.models.match import Match
from scoreboard.services.frame_history_service import FrameHistoryService


def make_state() -> SimpleNamespace:
    frame = Frame(
        id="frame-test",
        match_id="match-test",
        scores={"p1": 0, "p2": 0},
        current_turn="p1",
    )
    match = Match(
        id="match-test",
        matchroom_id="room-test",
        player_ids=["p1", "p2"],
        frames={frame.id: frame},
        frames_to_win=3,
    )
    return SimpleNamespace(frame=frame, match=match)


def test_snapshot_captures_frame_match_and_rule_state() -> None:
    state = make_state()
    state.frame.scoring_state.scores["p1"] = 12
    state.match.match_scores["p1"] = 1
    state.frame.turn_state.previously_fouled = True

    snapshot = FrameHistoryService().snapshot(state)

    assert snapshot["scores"] == {"p1": 12, "p2": 0}
    assert snapshot["match_scores"] == {"p1": 1, "p2": 0}
    assert snapshot["current_turn"] == "p1"
    assert snapshot["previously_fouled"] is True
    assert snapshot["points_remaining"] == 147
    assert snapshot["snookers_required"] == 0
    assert snapshot["miss_rule_available"] is True


def test_snapshot_is_isolated_from_later_mutations() -> None:
    state = make_state()
    service = FrameHistoryService()

    snapshot = service.snapshot(state)
    state.frame.scoring_state.scores["p1"] = 99
    state.match.match_scores["p2"] = 2
    state.frame.table_state.colours_on_table["yellow"] = False

    assert snapshot["scores"] == {"p1": 0, "p2": 0}
    assert snapshot["match_scores"] == {"p1": 0, "p2": 0}
    assert snapshot["colours_on_table"]["yellow"] is True


def test_push_appends_deep_copied_history_entry() -> None:
    state = make_state()
    service = FrameHistoryService()
    event = {"action": "shot", "data": {"potted_balls": ["red"], "foul": 0}}
    outcome = {"action": "shot", "result": "scoring", "potted_balls": ["red"]}

    service.push(state, "p1", event, outcome)
    event["data"]["potted_balls"].append("blue")
    outcome["potted_balls"].append("blue")

    assert len(state.frame.history) == 1
    history_entry = state.frame.history[0]
    assert history_entry["id"]
    assert history_entry["actor"] == "p1"
    assert history_entry["event"] == {"action": "shot", "data": {"potted_balls": ["red"], "foul": 0}}
    assert history_entry["outcome"] == {"action": "shot", "result": "scoring", "potted_balls": ["red"]}
    assert history_entry["state_before"]["scores"] == {"p1": 0, "p2": 0}
