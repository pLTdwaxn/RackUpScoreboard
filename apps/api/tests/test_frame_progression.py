from scoreboard.domain.models.frame import Frame, FramePhase, FrameStatus
from scoreboard.domain.rules.frame_runner import FrameRunner


def make_frame() -> Frame:
    return Frame(
        id="frame-test",
        match_id="match-test",
        scores={"p1": 0, "p2": 0},
        current_turn="p1",
    )


def test_process_shot_without_pot_with_declared_foul_updates_break_and_turn():
    frame = make_frame()
    frame.current_break = 12
    frame.highest_break = 5

    FrameRunner().process_shot(frame, (), foul_points=4)

    assert frame.scores["p2"] == 4
    assert frame.highest_break == 12
    assert frame.current_break == 0
    assert frame.current_turn == "p2"
    assert frame.object_ball == "red"


def test_process_shot_colour_on_with_red_is_foul_and_red_is_removed():
    frame = make_frame()
    frame.object_ball = "colour"

    FrameRunner().process_shot(frame, ("red",), foul_points=0)

    assert frame.scores["p2"] == 4
    assert frame.reds_remaining == 14
    assert frame.current_turn == "p2"
    assert frame.object_ball == "red"


def test_process_shot_declared_foul_on_legal_pot_uses_declared_penalty_only():
    frame = make_frame()

    FrameRunner().process_shot(frame, ("red",), foul_points=7)

    assert frame.scores["p2"] == 7
    assert frame.reds_remaining == 15
    assert frame.current_turn == "p2"
    assert frame.object_ball == "red"


def test_process_shot_last_black_in_colours_tie_respots_black():
    frame = make_frame()
    frame.phase = FramePhase.COLOURS
    frame.reds_remaining = 0
    frame.object_ball = "black"
    frame.colours_on_table = {
        "yellow": False,
        "green": False,
        "brown": False,
        "blue": False,
        "pink": False,
        "black": True,
    }
    # Keep scores level after potting black so the black is respotted.
    frame.scores["p1"] = 0
    frame.scores["p2"] = 7

    FrameRunner().process_shot(frame, ("black",), foul_points=0)

    assert frame.phase == FramePhase.RESPOTTED_BLACK
    assert frame.object_ball == "black"
    assert frame.status != FrameStatus.FINISHED


def test_process_shot_last_black_in_colours_with_gap_finishes_frame():
    frame = make_frame()
    frame.phase = FramePhase.COLOURS
    frame.reds_remaining = 0
    frame.object_ball = "black"
    frame.scores["p1"] = 10
    frame.scores["p2"] = 0
    frame.colours_on_table = {
        "yellow": False,
        "green": False,
        "brown": False,
        "blue": False,
        "pink": False,
        "black": True,
    }

    FrameRunner().process_shot(frame, ("black",), foul_points=0)

    assert frame.status == FrameStatus.FINISHED
    assert frame.winner_key == "p1"


def test_process_non_pot_advances_to_next_colour_in_colours_phase():
    frame = make_frame()
    frame.reds_remaining = 0
    frame.phase = FramePhase.COLOURS
    frame.object_ball = "green"
    frame.colours_on_table = {
        "yellow": False,
        "green": False,
        "brown": True,
        "blue": True,
        "pink": True,
        "black": True,
    }

    FrameRunner().process_non_pot(frame, ())

    assert frame.current_turn == "p2"
    assert frame.object_ball == "brown"


def test_process_non_pot_on_yellow_in_colours_phase_keeps_yellow_for_next_player():
    frame = make_frame()
    frame.reds_remaining = 0
    frame.phase = FramePhase.COLOURS
    frame.object_ball = "yellow"
    frame.colours_on_table = {
        "yellow": True,
        "green": True,
        "brown": True,
        "blue": True,
        "pink": True,
        "black": True,
    }

    FrameRunner().process_non_pot(frame, ())

    assert frame.current_turn == "p2"
    assert frame.object_ball == "yellow"


def test_process_non_pot_in_respotted_black_phase_finishes_frame():
    frame = make_frame()
    frame.reds_remaining = 0
    frame.phase = FramePhase.RESPOTTED_BLACK
    frame.object_ball = "black"

    FrameRunner().process_non_pot(frame, ())

    assert frame.status == FrameStatus.FINISHED
    assert frame.winner_key is None


def test_process_foul_on_black_in_colours_with_tie_respots_without_switching_turn():
    frame = make_frame()
    frame.phase = FramePhase.COLOURS
    frame.reds_remaining = 0
    frame.object_ball = "black"
    frame.current_break = 6
    frame.highest_break = 0
    frame.scores["p1"] = 4
    frame.scores["p2"] = 0

    FrameRunner().process_foul(frame, (), foul_points=4)

    assert frame.phase == FramePhase.RESPOTTED_BLACK
    assert frame.object_ball == "black"
    assert frame.current_turn == "p1"
    assert frame.current_break == 6
    assert frame.highest_break == 6


def test_process_foul_on_black_in_colours_with_gap_finishes_without_switching_turn():
    frame = make_frame()
    frame.phase = FramePhase.COLOURS
    frame.reds_remaining = 0
    frame.object_ball = "black"

    FrameRunner().process_foul(frame, (), foul_points=4)

    assert frame.status == FrameStatus.FINISHED
    assert frame.winner_key == "p2"
    assert frame.current_turn == "p1"


def test_remaining_colour_after_invalid_or_missing_returns_none():
    progression = FrameRunner()
    frame = make_frame()
    frame.colours_on_table["black"] = False

    assert progression.remaining_colour_after(frame, "not_a_colour") is None
    assert progression.remaining_colour_after(frame, "pink") is None


def test_process_non_pot_from_last_red_enters_colours_and_sets_yellow():
    frame = make_frame()
    frame.reds_remaining = 0
    frame.phase = FramePhase.REDS
    frame.object_ball = "colour"

    FrameRunner().process_non_pot(frame, ())

    assert frame.current_turn == "p2"
    assert frame.phase == FramePhase.COLOURS
    assert frame.object_ball == "yellow"


def test_process_non_pot_in_colours_without_next_respots_black_on_tie():
    frame = make_frame()
    frame.reds_remaining = 0
    frame.phase = FramePhase.COLOURS
    frame.object_ball = "black"
    frame.colours_on_table = {
        "yellow": False,
        "green": False,
        "brown": False,
        "blue": False,
        "pink": False,
        "black": True,
    }
    # After switch turn, penalty target tie state is irrelevant here; keep points tied.
    frame.scores["p1"] = 0
    frame.scores["p2"] = 0

    FrameRunner().process_non_pot(frame, ())

    assert frame.phase == FramePhase.RESPOTTED_BLACK
    assert frame.object_ball == "black"


def test_process_shot_specific_colour_mismatch_is_foul():
    frame = make_frame()
    frame.object_ball = "green"

    FrameRunner().process_shot(frame, ("blue",), foul_points=0)

    assert frame.scores["p2"] == 5
    assert frame.current_turn == "p2"
    assert frame.object_ball == "red"


def test_process_shot_non_pot_on_final_black_then_finishes_when_gap_exceeds_seven():
    frame = make_frame()
    frame.phase = FramePhase.COLOURS
    frame.reds_remaining = 0
    frame.object_ball = "pink"
    frame.scores["p1"] = 20
    frame.scores["p2"] = 0
    frame.colours_on_table = {
        "yellow": False,
        "green": False,
        "brown": False,
        "blue": False,
        "pink": True,
        "black": True,
    }

    FrameRunner().process_shot(frame, ("pink",), foul_points=0)
    FrameRunner().process_non_pot(frame, ())

    assert frame.object_ball == "black"
    assert frame.status == FrameStatus.FINISHED
    assert frame.winner_key == "p1"


def test_process_foul_on_black_in_respotted_black_phase_finishes_immediately():
    frame = make_frame()
    frame.phase = FramePhase.RESPOTTED_BLACK
    frame.reds_remaining = 0
    frame.object_ball = "black"

    FrameRunner().process_foul(frame, (), foul_points=4)

    assert frame.status == FrameStatus.FINISHED
    assert frame.winner_key == "p2"
    assert frame.current_turn == "p1"
