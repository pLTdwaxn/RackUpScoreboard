from scoreboard.domain.models.frame import Frame
from scoreboard.domain.models.frame_state import FrameStatus
from scoreboard.domain.models.player import Player
from scoreboard.domain.projectors.frame_summary_projector import FrameSummaryProjector


def test_frame_summary_projector_returns_empty_summary_until_frame_is_finished() -> None:
    frame = Frame(
        id="frame-1",
        match_id="match-1",
        scores={"p1": 0, "p2": 0},
        current_turn="p1",
    )

    summary = FrameSummaryProjector().project(frame, [_player("p1"), _player("p2")])

    assert summary == []


def test_frame_summary_projector_reports_per_player_finished_frame_stats() -> None:
    frame = Frame(
        id="frame-1",
        match_id="match-1",
        scores={"p1": 22, "p2": 10},
        current_turn="p1",
    )
    frame.lifecycle_state.status = FrameStatus.FINISHED
    frame.lifecycle_state.winner_key = "p1"
    frame.history = [
        _history_entry(
            "h1",
            "p1",
            {
                "action": "shot",
                "result": "scoring",
                "player_key": "p1",
                "potted_balls": ["red"],
                "scored_balls": ["red"],
                "break_points": 1,
                "foul_points": 0,
            },
        ),
        _history_entry(
            "h2",
            "p1",
            {
                "action": "shot",
                "result": "scoring",
                "player_key": "p1",
                "potted_balls": ["black"],
                "scored_balls": ["black"],
                "break_points": 7,
                "foul_points": 0,
            },
        ),
        _history_entry(
            "h3",
            "p1",
            {
                "action": "shot",
                "result": "foul",
                "player_key": "p2",
                "potted_balls": [],
                "scored_balls": [],
                "break_points": 0,
                "foul_points": 4,
            },
        ),
        _history_entry(
            "h4",
            "p2",
            {
                "action": "log_break",
                "result": "summary_break",
                "player_key": "p2",
                "potted_balls": [],
                "scored_balls": [],
                "break_points": 6,
                "foul_points": 0,
                "composition_status": "missing",
            },
        ),
    ]

    summary = FrameSummaryProjector().project(frame, [_player("p1"), _player("p2")])

    assert summary == [
        {
            "player_key": "p1",
            "score": 22,
            "result": "won",
            "visits": 1,
            "highest_break": 8,
            "foul_points_conceded": 4,
        },
        {
            "player_key": "p2",
            "score": 10,
            "result": "lost",
            "visits": 1,
            "highest_break": 6,
            "foul_points_conceded": 0,
        },
    ]


def test_frame_summary_projector_reports_score_only_for_conceded_frame_without_history() -> None:
    frame = Frame(
        id="frame-1",
        match_id="match-1",
        scores={"p1": 12, "p2": 20},
        current_turn="p1",
    )
    frame.lifecycle_state.status = FrameStatus.FINISHED
    frame.lifecycle_state.winner_key = "p2"

    summary = FrameSummaryProjector().project(frame, [_player("p1"), _player("p2")])

    assert summary == [
        {
            "player_key": "p1",
            "score": 12,
            "result": "lost",
            "visits": 0,
            "highest_break": 0,
            "foul_points_conceded": 0,
        },
        {
            "player_key": "p2",
            "score": 20,
            "result": "won",
            "visits": 0,
            "highest_break": 0,
            "foul_points_conceded": 0,
        },
    ]


def _player(session_key: str) -> Player:
    return Player(id=session_key, session_key=session_key, name=session_key)


def _history_entry(history_id: str, actor: str, outcome: dict) -> dict:
    return {
        "id": history_id,
        "actor": actor,
        "event": {"action": outcome["action"], "data": {}},
        "outcome": outcome,
        "state_before": {},
    }
