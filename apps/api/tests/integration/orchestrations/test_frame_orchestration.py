import pytest

from scoreboard.domain.models.frame import Frame
from scoreboard.domain.models.frame_state import FramePhase, FrameStatus
from scoreboard.domain.orchestrators.frame_orchestrator import (
    ActionPayload,
    FrameOrchestrator,
)
from scoreboard.domain.projectors.payloads import frame_payload

PLAYER_ONE = "player-one"
PLAYER_TWO = "player-two"


@pytest.fixture
def frame() -> Frame:
    return Frame(
        id="frame-1",
        match_id="match-1",
        scores={PLAYER_ONE: 12, PLAYER_TWO: 5},
        current_turn=PLAYER_ONE,
    )


@pytest.fixture
def orchestrator() -> FrameOrchestrator:
    return FrameOrchestrator()


def test_legal_shot_flows_through_every_processor_and_commits_effects(
    orchestrator: FrameOrchestrator,
    frame: Frame,
) -> None:
    orchestrator.orchestrate(
        frame,
        ActionPayload(potted_balls=("red",)),
    )

    assert dict(frame.scoring_state.scores) == {PLAYER_ONE: 13, PLAYER_TWO: 5}
    assert frame.turn_state.current_turn == PLAYER_ONE
    assert frame.scoring_state.current_break == 1
    assert frame.table_state.phase is FramePhase.REDS
    assert frame.table_state.object_ball == "colour"
    assert frame.table_state.reds_remaining == 14


def test_declared_foul_scores_penalty_and_hands_turn_to_opponent(
    orchestrator: FrameOrchestrator,
    frame: Frame,
) -> None:
    orchestrator.orchestrate(
        frame,
        ActionPayload(potted_balls=(), foul=4),
    )

    assert dict(frame.scoring_state.scores) == {PLAYER_ONE: 12, PLAYER_TWO: 9}
    assert frame.turn_state.current_turn == PLAYER_TWO
    assert frame.scoring_state.current_break == 0
    assert frame.table_state.object_ball == "red"
    assert frame.turn_state.previously_fouled is True


def test_declared_foul_updates_highest_break_and_resets_current_break(
    orchestrator: FrameOrchestrator,
    frame: Frame,
) -> None:
    frame.scoring_state.current_break = 12
    frame.scoring_state.highest_break = 5

    orchestrator.orchestrate(frame, ActionPayload(potted_balls=(), foul=4))

    assert dict(frame.scoring_state.scores) == {PLAYER_ONE: 12, PLAYER_TWO: 9}
    assert frame.scoring_state.highest_break == 12
    assert frame.scoring_state.current_break == 0
    assert frame.turn_state.current_turn == PLAYER_TWO
    assert frame.table_state.object_ball == "red"


def test_illegal_colour_while_on_red_scores_calculated_penalty_and_removes_red(
    orchestrator: FrameOrchestrator,
    frame: Frame,
) -> None:
    orchestrator.orchestrate(
        frame,
        ActionPayload(potted_balls=("red", "black")),
    )

    assert dict(frame.scoring_state.scores) == {PLAYER_ONE: 12, PLAYER_TWO: 12}
    assert frame.table_state.reds_remaining == 14
    assert frame.turn_state.current_turn == PLAYER_TWO
    assert frame.table_state.object_ball == "red"


def test_red_potted_when_colour_is_on_is_foul_and_removes_red(
    orchestrator: FrameOrchestrator,
    frame: Frame,
) -> None:
    frame.table_state.object_ball = "colour"

    orchestrator.orchestrate(frame, ActionPayload(potted_balls=("red",)))

    assert dict(frame.scoring_state.scores) == {PLAYER_ONE: 12, PLAYER_TWO: 9}
    assert frame.table_state.reds_remaining == 14
    assert frame.turn_state.current_turn == PLAYER_TWO
    assert frame.table_state.object_ball == "red"


def test_declared_foul_on_legal_pot_uses_declared_penalty_without_removing_red(
    orchestrator: FrameOrchestrator,
    frame: Frame,
) -> None:
    orchestrator.orchestrate(frame, ActionPayload(potted_balls=("red",), foul=7))

    assert dict(frame.scoring_state.scores) == {PLAYER_ONE: 12, PLAYER_TWO: 12}
    assert frame.table_state.reds_remaining == 15
    assert frame.turn_state.current_turn == PLAYER_TWO
    assert frame.table_state.object_ball == "red"


def test_consecutive_shots_use_state_committed_by_previous_orchestration(
    orchestrator: FrameOrchestrator,
    frame: Frame,
) -> None:
    orchestrator.orchestrate(frame, ActionPayload(potted_balls=(), foul=4))
    orchestrator.orchestrate(frame, ActionPayload(potted_balls=("red",)))

    assert dict(frame.scoring_state.scores) == {PLAYER_ONE: 12, PLAYER_TWO: 10}
    assert frame.turn_state.current_turn == PLAYER_TWO
    assert frame.scoring_state.current_break == 1
    assert frame.table_state.object_ball == "colour"


def test_calculation_failure_does_not_commit_any_accumulated_effects(
    orchestrator: FrameOrchestrator,
    frame: Frame,
) -> None:
    initial_payload = frame_payload(frame)

    class FailingProcessor:
        def process(self, context):
            raise RuntimeError("calculation failed")

    orchestrator.processors.insert(1, FailingProcessor())

    with pytest.raises(RuntimeError, match="calculation failed"):
        orchestrator.orchestrate(frame, ActionPayload(potted_balls=("red",)))

    assert frame_payload(frame) == initial_payload


def test_final_black_pot_with_tied_score_respots_black(
    orchestrator: FrameOrchestrator,
    frame: Frame,
) -> None:
    frame.table_state.phase = FramePhase.COLOURS
    frame.table_state.reds_remaining = 0
    frame.table_state.object_ball = "black"
    frame.scoring_state.scores[PLAYER_ONE] = 0
    frame.scoring_state.scores[PLAYER_TWO] = 7
    frame.table_state.colours_on_table = {
        "yellow": False,
        "green": False,
        "brown": False,
        "blue": False,
        "pink": False,
        "black": True,
    }

    orchestrator.orchestrate(frame, ActionPayload(potted_balls=("black",)))

    assert frame.table_state.phase is FramePhase.RESPOTTED_BLACK
    assert frame.table_state.object_ball == "black"
    assert frame.lifecycle_state.status is not FrameStatus.FINISHED


def test_final_black_pot_with_score_gap_finishes_frame(
    orchestrator: FrameOrchestrator,
    frame: Frame,
) -> None:
    frame.table_state.phase = FramePhase.COLOURS
    frame.table_state.reds_remaining = 0
    frame.table_state.object_ball = "black"
    frame.scoring_state.scores[PLAYER_ONE] = 10
    frame.scoring_state.scores[PLAYER_TWO] = 0
    frame.table_state.colours_on_table = {
        "yellow": False,
        "green": False,
        "brown": False,
        "blue": False,
        "pink": False,
        "black": True,
    }

    orchestrator.orchestrate(frame, ActionPayload(potted_balls=("black",)))

    assert frame.lifecycle_state.status is FrameStatus.FINISHED
    assert frame.lifecycle_state.winner_key == PLAYER_ONE


def test_non_pot_in_colours_advances_to_next_available_colour(
    orchestrator: FrameOrchestrator,
    frame: Frame,
) -> None:
    frame.table_state.reds_remaining = 0
    frame.table_state.phase = FramePhase.COLOURS
    frame.table_state.object_ball = "green"
    frame.table_state.colours_on_table = {
        "yellow": False,
        "green": False,
        "brown": True,
        "blue": True,
        "pink": True,
        "black": True,
    }

    orchestrator.orchestrate(frame, ActionPayload(potted_balls=()))

    assert frame.turn_state.current_turn == PLAYER_TWO
    assert frame.table_state.object_ball == "brown"


def test_non_pot_in_colours_keeps_object_ball_when_still_on_table(
    orchestrator: FrameOrchestrator,
    frame: Frame,
) -> None:
    frame.table_state.reds_remaining = 0
    frame.table_state.phase = FramePhase.COLOURS
    frame.table_state.object_ball = "yellow"
    frame.table_state.colours_on_table = {
        "yellow": True,
        "green": True,
        "brown": True,
        "blue": True,
        "pink": True,
        "black": True,
    }

    orchestrator.orchestrate(frame, ActionPayload(potted_balls=()))

    assert frame.turn_state.current_turn == PLAYER_TWO
    assert frame.table_state.object_ball == "yellow"


def test_non_pot_in_respotted_black_phase_finishes_frame_without_winner_on_tie(
    orchestrator: FrameOrchestrator,
    frame: Frame,
) -> None:
    frame.table_state.reds_remaining = 0
    frame.table_state.phase = FramePhase.RESPOTTED_BLACK
    frame.table_state.object_ball = "black"
    frame.scoring_state.scores[PLAYER_ONE] = 12
    frame.scoring_state.scores[PLAYER_TWO] = 12

    orchestrator.orchestrate(frame, ActionPayload(potted_balls=()))

    assert frame.lifecycle_state.status is FrameStatus.FINISHED
    assert frame.lifecycle_state.winner_key is None


def test_foul_on_black_in_colours_with_tie_respots_without_switching_turn(
    orchestrator: FrameOrchestrator,
    frame: Frame,
) -> None:
    frame.table_state.phase = FramePhase.COLOURS
    frame.table_state.reds_remaining = 0
    frame.table_state.object_ball = "black"
    frame.scoring_state.current_break = 6
    frame.scoring_state.highest_break = 0
    frame.scoring_state.scores[PLAYER_ONE] = 4
    frame.scoring_state.scores[PLAYER_TWO] = 0

    orchestrator.orchestrate(frame, ActionPayload(potted_balls=(), foul=4))

    assert frame.table_state.phase is FramePhase.RESPOTTED_BLACK
    assert frame.table_state.object_ball == "black"
    assert frame.turn_state.current_turn == PLAYER_ONE
    assert frame.scoring_state.current_break == 6
    assert frame.scoring_state.highest_break == 6


def test_foul_on_black_in_colours_with_score_gap_finishes_without_switching_turn(
    orchestrator: FrameOrchestrator,
    frame: Frame,
) -> None:
    frame.table_state.phase = FramePhase.COLOURS
    frame.table_state.reds_remaining = 0
    frame.table_state.object_ball = "black"
    frame.scoring_state.scores[PLAYER_ONE] = 0
    frame.scoring_state.scores[PLAYER_TWO] = 0

    orchestrator.orchestrate(frame, ActionPayload(potted_balls=(), foul=4))

    assert frame.lifecycle_state.status is FrameStatus.FINISHED
    assert frame.lifecycle_state.winner_key == PLAYER_TWO
    assert frame.turn_state.current_turn == PLAYER_ONE


def test_non_pot_from_last_red_enters_colours_and_sets_yellow(
    orchestrator: FrameOrchestrator,
    frame: Frame,
) -> None:
    frame.table_state.reds_remaining = 0
    frame.table_state.phase = FramePhase.REDS
    frame.table_state.object_ball = "colour"

    orchestrator.orchestrate(frame, ActionPayload(potted_balls=()))

    assert frame.turn_state.current_turn == PLAYER_TWO
    assert frame.table_state.phase is FramePhase.COLOURS
    assert frame.table_state.object_ball == "yellow"


def test_non_pot_in_colours_without_next_colour_respots_black_on_tie(
    orchestrator: FrameOrchestrator,
    frame: Frame,
) -> None:
    frame.table_state.reds_remaining = 0
    frame.table_state.phase = FramePhase.COLOURS
    frame.table_state.object_ball = "black"
    frame.scoring_state.scores[PLAYER_ONE] = 0
    frame.scoring_state.scores[PLAYER_TWO] = 0
    frame.table_state.colours_on_table = {
        "yellow": False,
        "green": False,
        "brown": False,
        "blue": False,
        "pink": False,
        "black": True,
    }

    orchestrator.orchestrate(frame, ActionPayload(potted_balls=()))

    assert frame.table_state.phase is FramePhase.RESPOTTED_BLACK
    assert frame.table_state.object_ball == "black"


def test_specific_colour_mismatch_is_foul_with_potted_colour_value(
    orchestrator: FrameOrchestrator,
    frame: Frame,
) -> None:
    frame.table_state.object_ball = "green"
    frame.scoring_state.scores[PLAYER_ONE] = 0
    frame.scoring_state.scores[PLAYER_TWO] = 0

    orchestrator.orchestrate(frame, ActionPayload(potted_balls=("blue",)))

    assert dict(frame.scoring_state.scores) == {PLAYER_ONE: 0, PLAYER_TWO: 5}
    assert frame.turn_state.current_turn == PLAYER_TWO
    assert frame.table_state.object_ball == "red"


def test_free_ball_colour_counts_as_ball_on_during_colours_phase(
    orchestrator: FrameOrchestrator,
    frame: Frame,
) -> None:
    frame.table_state.phase = FramePhase.COLOURS
    frame.table_state.object_ball = "yellow"
    frame.table_state.colours_on_table = {
        "yellow": True,
        "green": True,
        "brown": True,
        "blue": True,
        "pink": True,
        "black": True,
    }

    orchestrator.orchestrate(
        frame,
        ActionPayload(action="declare_free_ball", potted_balls=(), nominated_colour="green"),
    )
    orchestrator.orchestrate(frame, ActionPayload(potted_balls=("green",)))

    assert dict(frame.scoring_state.scores) == {PLAYER_ONE: 14, PLAYER_TWO: 5}
    assert frame.scoring_state.current_break == 2
    assert frame.table_state.colours_on_table["yellow"] is True
    assert frame.table_state.colours_on_table["green"] is True
    assert frame.table_state.object_ball == "green"
    assert frame.table_state.free_ball_nominated_colour is None
    assert frame.table_state.free_ball_object_ball is None


def test_pink_potted_then_final_black_missed_with_large_gap_finishes_frame(
    orchestrator: FrameOrchestrator,
    frame: Frame,
) -> None:
    frame.table_state.phase = FramePhase.COLOURS
    frame.table_state.reds_remaining = 0
    frame.table_state.object_ball = "pink"
    frame.scoring_state.scores[PLAYER_ONE] = 20
    frame.scoring_state.scores[PLAYER_TWO] = 0
    frame.table_state.colours_on_table = {
        "yellow": False,
        "green": False,
        "brown": False,
        "blue": False,
        "pink": True,
        "black": True,
    }

    orchestrator.orchestrate(frame, ActionPayload(potted_balls=("pink",)))
    orchestrator.orchestrate(frame, ActionPayload(potted_balls=()))

    assert frame.table_state.object_ball == "black"
    assert frame.lifecycle_state.status is FrameStatus.FINISHED
    assert frame.lifecycle_state.winner_key == PLAYER_ONE


def test_foul_on_black_in_respotted_black_phase_finishes_immediately(
    orchestrator: FrameOrchestrator,
    frame: Frame,
) -> None:
    frame.table_state.phase = FramePhase.RESPOTTED_BLACK
    frame.table_state.reds_remaining = 0
    frame.table_state.object_ball = "black"
    frame.scoring_state.scores[PLAYER_ONE] = 0
    frame.scoring_state.scores[PLAYER_TWO] = 0

    orchestrator.orchestrate(frame, ActionPayload(potted_balls=(), foul=4))

    assert frame.lifecycle_state.status is FrameStatus.FINISHED
    assert frame.lifecycle_state.winner_key == PLAYER_TWO
    assert frame.turn_state.current_turn == PLAYER_ONE


@pytest.mark.parametrize(
    ("potted_balls", "expected_scores", "expected_turn", "expected_break"),
    [
        ((), {PLAYER_ONE: 12, PLAYER_TWO: 5}, PLAYER_TWO, 0),
        (("red",), {PLAYER_ONE: 13, PLAYER_TWO: 5}, PLAYER_ONE, 1),
        (("red", "black", "pink"), {PLAYER_ONE: 12, PLAYER_TWO: 12}, PLAYER_TWO, 0),
    ],
)
def test_shot_payload_is_carried_across_the_full_pipeline(
    orchestrator: FrameOrchestrator,
    frame: Frame,
    potted_balls: tuple[str, ...],
    expected_scores: dict[str, int],
    expected_turn: str,
    expected_break: int,
) -> None:
    orchestrator.orchestrate(frame, ActionPayload(potted_balls=potted_balls))

    assert dict(frame.scoring_state.scores) == expected_scores
    assert frame.turn_state.current_turn == expected_turn
    assert frame.scoring_state.current_break == expected_break
