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


def _summary_break_entry(
    id: str,
    actor: str,
    points: int,
    foul: int = 0,
) -> dict:
    return {
        "id": id,
        "actor": actor,
        "event": {
            "action": "log_break",
            "data": {"points": points, "foul": foul},
        },
        "outcome": {
            "action": "log_break",
            "result": "summary_break",
            "player_key": actor,
            "potted_balls": [],
            "scored_balls": [],
            "free_ball_pots": [],
            "break_points": points,
            "foul_points": foul,
            "winner_key": None,
            "nominated_colour": None,
            "composition_status": "missing",
            "composition_suggestions": [
                {
                    "id": "suggestion_1",
                    "label": "5 reds, 1 yellow, 4 blacks",
                    "balls": ["red", "black", "red", "black", "red", "black", "red", "black", "red", "yellow"],
                }
            ],
        },
        "state_before": {},
    }


def _without_facts(value):
    if isinstance(value, list):
        return [_without_facts(item) for item in value]
    if isinstance(value, dict):
        return {key: _without_facts(item) for key, item in value.items() if key != "facts"}
    return value


def test_frame_log_projector_returns_empty_log_without_frame() -> None:
    projector = FrameLogProjector()

    assert projector.project(None, []) == []


def test_frame_log_projector_adds_break_off_marker_for_ready_frame_without_history() -> None:
    frame = _frame()
    frame.turn_state.current_turn = "p1"

    log = FrameLogProjector().project(frame, [_player("p1", "Player 1")])

    assert _without_facts(log) == [
        {
            "id": "break:frame-1:p1",
            "type": "visit",
            "player_key": "p1",
            "player_name": "Player 1",
            "history_ids": [],
            "shots": [],
            "potted_balls": [],
            "scored_balls": [],
            "free_ball_pots": [],
            "shot_count": 0,
            "break_points": 0,
            "foul_points": 0,
            "result": "in_progress",
        }
    ]
    assert log[0]["facts"] == [
        {
            "kind": "break_off",
            "player_key": "p1",
            "result": "in_progress",
        }
    ]


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

    assert _without_facts(log) == [
        {
            "id": "h1",
            "type": "visit",
            "player_key": "p1",
            "player_name": "Player 1",
            "history_ids": ["h1", "h2"],
            "shots": [
                {
                    "history_id": "h1",
                    "action": "shot",
                    "potted_balls": ["red"],
                    "scored_balls": ["red"],
                    "free_ball_pots": [],
                    "break_points": 1,
                    "foul_points": 0,
                },
                {
                    "history_id": "h2",
                    "action": "shot",
                    "potted_balls": ["black"],
                    "scored_balls": ["black"],
                    "free_ball_pots": [],
                    "break_points": 7,
                    "foul_points": 0,
                },
            ],
            "potted_balls": ["red", "black"],
            "scored_balls": ["red", "black"],
            "free_ball_pots": [],
            "shot_count": 2,
            "break_points": 8,
            "foul_points": 0,
            "result": "in_progress",
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

    assert _without_facts(log) == [
        {
            "id": "h1",
            "type": "visit",
            "player_key": "p1",
            "player_name": "Player 1",
            "history_ids": ["h1", "h2"],
            "shots": [
                {
                    "history_id": "h1",
                    "action": "shot",
                    "potted_balls": ["red"],
                    "scored_balls": ["red"],
                    "free_ball_pots": [],
                    "break_points": 1,
                    "foul_points": 0,
                },
                {
                    "history_id": "h2",
                    "action": "shot",
                    "potted_balls": [],
                    "scored_balls": [],
                    "free_ball_pots": [],
                    "break_points": 0,
                    "foul_points": 6,
                },
            ],
            "potted_balls": ["red"],
            "scored_balls": ["red"],
            "free_ball_pots": [],
            "shot_count": 2,
            "break_points": 1,
            "foul_points": 6,
            "result": "foul",
        },
        {
            "id": "h3",
            "type": "visit",
            "player_key": "p2",
            "player_name": "Player 2",
            "history_ids": ["h3"],
            "shots": [
                {
                    "history_id": "h3",
                    "action": "shot",
                    "potted_balls": [],
                    "scored_balls": [],
                    "free_ball_pots": [],
                    "break_points": 0,
                    "foul_points": 0,
                }
            ],
            "potted_balls": [],
            "scored_balls": [],
            "free_ball_pots": [],
            "shot_count": 1,
            "break_points": 0,
            "foul_points": 0,
            "result": "in_progress",
        },
    ]


def test_frame_log_projector_adds_new_turn_marker_when_next_player_has_not_shot() -> None:
    frame = _frame()
    frame.lifecycle_state.status = FrameStatus.ACTIVE
    frame.turn_state.current_turn = "p2"
    frame.history = [
        _history_entry(
            "h1",
            "p1",
            [],
            outcome=_shot_outcome(result="no_score", player_key="p1"),
        )
    ]

    log = FrameLogProjector().project(
        frame,
        [
            _player("p1", "Player 1"),
            _player("p2", "Player 2"),
        ],
    )

    assert _without_facts(log[-1]) == {
        "id": "turn:h1:p2",
        "type": "visit",
        "player_key": "p2",
        "player_name": "Player 2",
        "history_ids": [],
        "shots": [],
        "potted_balls": [],
        "scored_balls": [],
        "free_ball_pots": [],
        "shot_count": 0,
        "break_points": 0,
        "foul_points": 0,
        "result": "in_progress",
    }
    assert log[-1]["facts"] == [
        {
            "kind": "turn_started",
            "player_key": "p2",
            "result": "in_progress",
        }
    ]


def test_frame_log_projector_renders_pass_shot_as_visit() -> None:
    frame = _frame()
    frame.lifecycle_state.status = FrameStatus.ACTIVE
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

    assert _without_facts(log) == [
        {
            "id": "h1",
            "type": "visit",
            "player_key": "p1",
            "player_name": "Player 1",
            "history_ids": ["h1"],
            "shots": [
                {
                    "history_id": "h1",
                    "action": "shot",
                    "potted_balls": [],
                    "scored_balls": [],
                    "free_ball_pots": [],
                    "break_points": 0,
                    "foul_points": 4,
                }
            ],
            "potted_balls": [],
            "scored_balls": [],
            "free_ball_pots": [],
            "shot_count": 1,
            "break_points": 0,
            "foul_points": 4,
            "result": "foul",
        },
        {
            "id": "h2",
            "type": "visit",
            "player_key": "p2",
            "player_name": "Player 2",
            "history_ids": ["h2"],
            "shots": [
                {
                    "history_id": "h2",
                    "action": "pass_shot",
                    "potted_balls": [],
                    "scored_balls": [],
                    "free_ball_pots": [],
                    "break_points": 0,
                    "foul_points": 0,
                }
            ],
            "potted_balls": [],
            "scored_balls": [],
            "free_ball_pots": [],
            "shot_count": 1,
            "break_points": 0,
            "foul_points": 0,
            "result": "ended",
        },
        {
            "id": "turn:h2:p1",
            "type": "visit",
            "player_key": "p1",
            "player_name": "Player 1",
            "history_ids": [],
            "shots": [],
            "potted_balls": [],
            "scored_balls": [],
            "free_ball_pots": [],
            "shot_count": 0,
            "break_points": 0,
            "foul_points": 0,
            "result": "in_progress",
        },
    ]
    assert log[1]["facts"] == [
        {
            "kind": "pass_shot",
            "player_key": "p2",
            "result": "passed",
        }
    ]
    assert log[2]["facts"] == [
        {
            "kind": "turn_started",
            "player_key": "p1",
            "result": "in_progress",
        }
    ]


def test_frame_log_projector_facts_mark_frame_win() -> None:
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
    assert log[0]["facts"][0]["result"] == "frame_won"


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
    assert log[0]["facts"][0]["foul_points"] == 5


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
    assert log[0]["facts"] == [
        {
            "kind": "free_ball_nomination",
            "player_key": "p2",
            "nominated_colour": "blue",
            "result": "declared",
        }
    ]


def test_frame_log_projector_projects_summary_break_visit() -> None:
    frame = _frame()
    frame.lifecycle_state.status = FrameStatus.ACTIVE
    frame.turn_state.current_turn = "p2"
    frame.history = [_summary_break_entry("h1", "p1", points=35, foul=4)]

    log = FrameLogProjector().project(
        frame,
        [
            _player("p1", "Player 1"),
            _player("p2", "Player 2"),
        ],
    )

    assert _without_facts(log) == [
        {
            "id": "h1",
            "type": "visit",
            "player_key": "p1",
            "player_name": "Player 1",
            "history_ids": ["h1"],
            "shots": [
                {
                    "history_id": "h1",
                    "action": "log_break",
                    "potted_balls": [],
                    "scored_balls": [],
                    "free_ball_pots": [],
                    "break_points": 35,
                    "foul_points": 4,
                    "composition_status": "missing",
                    "composition_suggestions": [
                        {
                            "id": "suggestion_1",
                            "label": "5 reds, 1 yellow, 4 blacks",
                            "balls": [
                                "red",
                                "black",
                                "red",
                                "black",
                                "red",
                                "black",
                                "red",
                                "black",
                                "red",
                                "yellow",
                            ],
                        }
                    ],
                }
            ],
            "potted_balls": [],
            "scored_balls": [],
            "free_ball_pots": [],
            "shot_count": 1,
            "break_points": 35,
            "foul_points": 4,
            "result": "foul",
        },
        {
            "id": "turn:h1:p2",
            "type": "visit",
            "player_key": "p2",
            "player_name": "Player 2",
            "history_ids": [],
            "shots": [],
            "potted_balls": [],
            "scored_balls": [],
            "free_ball_pots": [],
            "shot_count": 0,
            "break_points": 0,
            "foul_points": 0,
            "result": "in_progress",
        },
    ]
    assert log[0]["facts"] == [
        {
            "kind": "visit_summary",
            "player_key": "p1",
            "history_ids": ["h1"],
            "shot_count": 1,
            "potted_balls": [],
            "scored_balls": [],
            "free_ball_pots": [],
            "break_points": 35,
            "foul_points": 4,
            "result": "foul",
        }
    ]
    assert log[0]["shots"][0]["facts"] == [
        {
            "kind": "summary_break",
            "player_key": "p1",
            "result": "summary_break",
            "break_points": 35,
            "foul_points": 4,
            "composition_status": "missing",
            "composition_suggestions": [
                {
                    "id": "suggestion_1",
                    "label": "5 reds, 1 yellow, 4 blacks",
                    "balls": ["red", "black", "red", "black", "red", "black", "red", "black", "red", "yellow"],
                }
            ],
        }
    ]


def test_frame_log_projector_summarises_break_after_declared_free_ball_is_potted() -> None:
    frame = _frame()
    frame.history = [
        _declare_free_ball_entry("h1", "p1", "green"),
        _history_entry(
            "h2",
            "p1",
            ["green"],
            outcome=_shot_outcome(
                result="scoring",
                player_key="p1",
                potted_balls=["green"],
                scored_balls=["red"],
                free_ball_pots=[{"potted_ball": "green", "counts_as": "red"}],
                break_points=1,
            ),
        ),
        _history_entry(
            "h3",
            "p1",
            ["brown"],
            outcome=_shot_outcome(result="scoring", player_key="p1", potted_balls=["brown"], break_points=4),
        ),
    ]

    log = FrameLogProjector().project(frame, [_player("p1", "Player 1")])

    assert log[0]["history_ids"] == ["h1", "h2", "h3"]
    assert log[0]["potted_balls"] == ["green", "brown"]
    assert log[0]["break_points"] == 5
    assert [shot["facts"][0]["kind"] for shot in log[0]["shots"]] == [
        "free_ball_nomination",
        "shot_result",
        "shot_result",
    ]
    assert log[0]["facts"][0]["break_points"] == 5


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
    assert _without_facts(log[0]["shots"]) == [
        {
            "history_id": "h1",
            "action": "shot",
            "potted_balls": ["blue", "red"],
            "scored_balls": ["red", "red"],
            "free_ball_pots": [{"potted_ball": "blue", "counts_as": "red"}],
            "break_points": 2,
            "foul_points": 0,
        }
    ]
    assert log[0]["facts"] == [
        {
            "kind": "visit_summary",
            "player_key": "p1",
            "history_ids": ["h1"],
            "shot_count": 1,
            "potted_balls": ["blue", "red"],
            "scored_balls": ["red", "red"],
            "free_ball_pots": [{"potted_ball": "blue", "counts_as": "red"}],
            "break_points": 2,
            "foul_points": 0,
            "result": "in_progress",
        }
    ]
    assert log[0]["shots"][0]["facts"] == [
        {
            "kind": "shot_result",
            "player_key": "p1",
            "result": "scoring",
            "potted_balls": ["blue", "red"],
            "scored_balls": ["red", "red"],
            "free_ball_pots": [{"potted_ball": "blue", "counts_as": "red"}],
            "break_points": 2,
            "foul_points": 0,
            "winner_key": None,
        }
    ]
