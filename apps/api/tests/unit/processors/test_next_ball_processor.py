from types import SimpleNamespace

from scoreboard.domain.models.frame import Frame
from scoreboard.domain.processors.foul_processor import FoulResult
from scoreboard.domain.processors.next_ball_processor import (
    NextBallProcessor,
    NextBallResult,
    UpdateNextBallEffect,
)
from scoreboard.domain.processors.phase_processor import PhaseResult
from scoreboard.domain.processors.score_processor import ScoreResult
from scoreboard.domain.rules import RED_BALL


def make_frame() -> Frame:
    return Frame(
        id="frame-test",
        match_id="match-test",
        scores={"p1": 0, "p2": 0},
        current_turn="p1",
    )


def test_next_ball_processor_sets_colour_after_legal_red():
    context = SimpleNamespace(
        frame=make_frame(),
        payload=SimpleNamespace(action="shot", potted_balls=("red",), foul=0),
        foul_result=FoulResult(is_foul=False),
        phase_result=PhaseResult(phase=make_frame().phase),
        score_result=ScoreResult(player="p1", points=1, reds_removed=1, potted_ball=RED_BALL),
    )

    effects = NextBallProcessor().process(context)

    assert isinstance(context.next_ball_result, NextBallResult)
    assert context.next_ball_result.ball == "colour"
    assert len(effects) == 1
    assert isinstance(effects[0], UpdateNextBallEffect)


def test_next_ball_processor_uses_nomination_for_free_ball():
    frame = make_frame()
    context = SimpleNamespace(
        frame=frame,
        payload=SimpleNamespace(action="declare_free_ball", nominated_colour="blue", potted_balls=(), foul=0),
        foul_result=FoulResult(is_foul=False),
        phase_result=PhaseResult(phase=frame.phase),
        score_result=ScoreResult(player="p1", points=0),
    )

    NextBallProcessor().process(context)

    assert context.next_ball_result.ball == "blue"
