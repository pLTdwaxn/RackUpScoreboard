from scoreboard.domain.models.frame import Frame
from scoreboard.domain.models.frame_state import FrameStatus
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


def _history_entry(
    id: str,
    actor: str,
    potted_balls: list[str],
    foul: int = 0,
    outcome: dict | None = None,
) -> dict:
    return {
        "id": id,
        "actor": actor,
        "event": {
            "potted_balls": potted_balls,
            "foul": foul,
        },
        "outcome": outcome,
        "state_before": {},
    }


def _pass_shot_entry(id: str, actor: str) -> dict:
    return {
        "id": id,
        "actor": actor,
        "event": {
            "action": "pass_shot",
            "data": {},
        },
        "outcome": {
            "action": "pass_shot",
            "result": "passed",
            "player_key": None,
            "potted_balls": [],
            "break_points": 0,
            "foul_points": 0,
            "winner_key": None,
            "nominated_colour": None,
        },
        "state_before": {},
    }


def _declare_free_ball_entry(id: str, actor: str, nominated_colour: str) -> dict:
    return {
        "id": id,
        "actor": actor,
        "event": {
            "action": "declare_free_ball",
            "data": {"nominated_colour": nominated_colour},
        },
        "outcome": {
            "action": "declare_free_ball",
            "result": "declared",
            "player_key": None,
            "potted_balls": [],
            "break_points": 0,
            "foul_points": 0,
            "winner_key": None,
            "nominated_colour": nominated_colour,
        },
        "state_before": {},
    }


def _shot_outcome(
    *,
    result: str,
    player_key: str,
    potted_balls: list[str] | None = None,
    scored_balls: list[str] | None = None,
    free_ball_pots: list[dict] | None = None,
    break_points: int = 0,
    foul_points: int = 0,
) -> dict:
    outcome = {
        "action": "shot",
        "result": result,
        "player_key": player_key,
        "potted_balls": potted_balls or [],
        "break_points": break_points,
        "foul_points": foul_points,
        "winner_key": None,
        "nominated_colour": None,
    }
    if scored_balls is not None:
        outcome["scored_balls"] = scored_balls
    if free_ball_pots is not None:
        outcome["free_ball_pots"] = free_ball_pots
    return outcome


def test_frame_log_projector_returns_empty_log_without_frame() -> None:
    projector = FrameLogProjector()

    assert projector.project(None, []) == []


def test_frame_log_projector_groups_consecutive_shots_by_visit() -> None:
    frame = _frame()
    frame.history = [
        _history_entry(
            "h1",
            "p1",
            ["red"],
            outcome=_shot_outcome(result="scoring", player_key="p1", potted_balls=["red"], break_points=1),
        ),
        _history_entry(
            "h2",
            "p1",
            ["black"],
            outcome=_shot_outcome(result="scoring", player_key="p1", potted_balls=["black"], break_points=7),
        ),
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
            "scored_balls": ["red", "black"],
            "free_ball_pots": [],
            "shot_count": 2,
            "break_points": 8,
            "foul_points": 0,
            "result": "in_progress",
            "message": "Player 1: break 8",
        }
    ]


def test_frame_log_projector_splits_visits_by_player_and_marks_foul() -> None:
    frame = _frame()
    frame.turn_state.current_turn = "p2"
    frame.history = [
        _history_entry(
            "h1",
            "p1",
            ["red"],
            outcome=_shot_outcome(result="scoring", player_key="p1", potted_balls=["red"], break_points=1),
        ),
        _history_entry(
            "h2",
            "p1",
            ["pink"],
            6,
            outcome=_shot_outcome(result="foul", player_key="p2", foul_points=6),
        ),
        _history_entry(
            "h3",
            "p2",
            [],
            outcome=_shot_outcome(result="no_score", player_key="p2"),
        ),
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
            "scored_balls": ["red"],
            "free_ball_pots": [],
            "shot_count": 2,
            "break_points": 1,
            "foul_points": 6,
            "result": "foul",
            "message": "Player 1: break 1, foul 6",
        },
        {
            "id": "h3",
            "type": "visit",
            "player_key": "p2",
            "player_name": "Player 2",
            "history_ids": ["h3"],
            "potted_balls": [],
            "scored_balls": [],
            "free_ball_pots": [],
            "shot_count": 1,
            "break_points": 0,
            "foul_points": 0,
            "result": "in_progress",
            "message": "Player 2: no score",
        },
    ]


def test_frame_log_projector_renders_pass_shot_as_visit() -> None:
    frame = _frame()
    frame.turn_state.current_turn = "p1"
    frame.history = [
        _history_entry(
            "h1",
            "p1",
            ["red"],
            4,
            outcome=_shot_outcome(result="foul", player_key="p2", foul_points=4),
        ),
        _pass_shot_entry("h2", "p2"),
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
            "history_ids": ["h1"],
            "potted_balls": [],
            "scored_balls": [],
            "free_ball_pots": [],
            "shot_count": 1,
            "break_points": 0,
            "foul_points": 4,
            "result": "foul",
            "message": "Player 1: foul 4",
        },
        {
            "id": "h2",
            "type": "visit",
            "player_key": "p2",
            "player_name": "Player 2",
            "history_ids": ["h2"],
            "potted_balls": [],
            "scored_balls": [],
            "free_ball_pots": [],
            "shot_count": 1,
            "break_points": 0,
            "foul_points": 0,
            "result": "ended",
            "message": "Player 2: passed shot back",
        },
    ]


def test_frame_log_projector_message_mentions_frame_win() -> None:
    frame = _frame()
    frame.lifecycle_state.status = FrameStatus.FINISHED
    frame.lifecycle_state.winner_key = "p1"
    frame.history = [
        _history_entry(
            "h1",
            "p1",
            ["black"],
            outcome=_shot_outcome(result="frame_won", player_key="p1", potted_balls=["black"], break_points=7),
        )
    ]

    log = FrameLogProjector().project(frame, [_player("p1", "Player 1")])

    assert log[0]["result"] == "frame_won"
    assert log[0]["message"] == "Player 1: won the frame"


def test_frame_log_projector_uses_outcome_for_wrong_ball_foul() -> None:
    frame = _frame()
    frame.turn_state.current_turn = "p2"
    frame.history = [
        _history_entry(
            "h1",
            "p1",
            ["blue"],
            0,
            outcome=_shot_outcome(result="foul", player_key="p2", foul_points=5),
        )
    ]

    log = FrameLogProjector().project(
        frame,
        [
            _player("p1", "Player 1"),
            _player("p2", "Player 2"),
        ],
    )

    assert log[0]["potted_balls"] == []
    assert log[0]["scored_balls"] == []
    assert log[0]["free_ball_pots"] == []
    assert log[0]["break_points"] == 0
    assert log[0]["foul_points"] == 5
    assert log[0]["result"] == "foul"
    assert log[0]["message"] == "Player 1: foul 5"


def test_frame_log_projector_renders_declared_free_ball_as_visit() -> None:
    frame = _frame()
    frame.turn_state.current_turn = "p1"
    frame.history = [_declare_free_ball_entry("h1", "p2", "blue")]

    log = FrameLogProjector().project(
        frame,
        [
            _player("p1", "Player 1"),
            _player("p2", "Player 2"),
        ],
    )

    assert log[0]["potted_balls"] == []
    assert log[0]["scored_balls"] == []
    assert log[0]["free_ball_pots"] == []
    assert log[0]["break_points"] == 0
    assert log[0]["foul_points"] == 0
    assert log[0]["result"] == "ended"
    assert log[0]["message"] == "Player 2: nominated blue free ball"


def test_frame_log_projector_projects_free_ball_scoring_metadata() -> None:
    frame = _frame()
    frame.history = [
        _history_entry(
            "h1",
            "p1",
            ["blue", "red"],
            outcome=_shot_outcome(
                result="scoring",
                player_key="p1",
                potted_balls=["blue", "red"],
                scored_balls=["red", "red"],
                free_ball_pots=[{"potted_ball": "blue", "counts_as": "red"}],
                break_points=2,
            ),
        )
    ]

    log = FrameLogProjector().project(frame, [_player("p1", "Player 1")])

    assert log[0]["potted_balls"] == ["blue", "red"]
    assert log[0]["scored_balls"] == ["red", "red"]
    assert log[0]["free_ball_pots"] == [{"potted_ball": "blue", "counts_as": "red"}]
    assert log[0]["break_points"] == 2
