from scoreboard.domain.models.frame import Frame
from scoreboard.domain.models.player import Player
from scoreboard.domain.projectors.frame_log_projector import FrameLogProjector


def _player(key: str, name: str) -> Player:
    return Player(id=key, session_key=key, name=name)


def _frame() -> Frame:
    return Frame(
        id="frame-1",
        match_id="match-1",
        scores={"p1": 0, "p2": 0},
        current_turn="p1",
    )


def _history_entry(id: str, actor: str, potted_balls: list[str], foul: int = 0) -> dict:
    return {
        "id": id,
        "actor": actor,
        "event": {
            "potted_balls": potted_balls,
            "foul": foul,
        },
        "state_before": {},
    }


def test_frame_log_projector_returns_empty_log_without_frame() -> None:
    projector = FrameLogProjector()

    assert projector.project(None, []) == []


def test_frame_log_projector_groups_consecutive_shots_by_visit() -> None:
    frame = _frame()
    frame.history = [
        _history_entry("h1", "p1", ["red"]),
        _history_entry("h2", "p1", ["black"]),
    ]

    log = FrameLogProjector().project(frame, [_player("p1", "Player 1")])

    assert log == [
        {
            "id": "h1",
            "type": "visit",
            "player_key": "p1",
            "player_name": "Player 1",
            "history_ids": ["h1", "h2"],
            "potted_balls": ["red", "black"],
            "shot_count": 2,
            "break_points": 8,
            "foul_points": 0,
            "result": "in_progress",
            "message": "Player 1: 8 break",
        }
    ]


def test_frame_log_projector_splits_visits_by_player_and_marks_foul() -> None:
    frame = _frame()
    frame.current_turn = "p2"
    frame.history = [
        _history_entry("h1", "p1", ["red"]),
        _history_entry("h2", "p1", ["pink"], 6),
        _history_entry("h3", "p2", []),
    ]

    log = FrameLogProjector().project(
        frame,
        [
            _player("p1", "Player 1"),
            _player("p2", "Player 2"),
        ],
    )

    assert log == [
        {
            "id": "h1",
            "type": "visit",
            "player_key": "p1",
            "player_name": "Player 1",
            "history_ids": ["h1", "h2"],
            "potted_balls": ["red"],
            "shot_count": 2,
            "break_points": 1,
            "foul_points": 6,
            "result": "foul",
            "message": "Player 1: 1 break, foul 6",
        },
        {
            "id": "h3",
            "type": "visit",
            "player_key": "p2",
            "player_name": "Player 2",
            "history_ids": ["h3"],
            "potted_balls": [],
            "shot_count": 1,
            "break_points": 0,
            "foul_points": 0,
            "result": "in_progress",
            "message": "Player 2: no score",
        },
    ]
