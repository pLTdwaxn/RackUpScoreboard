from types import SimpleNamespace

from scoreboard.domain.models.frame import Frame
from scoreboard.domain.processors.foul_processor import (
    FoulProcessor,
    FoulResult,
    SetPreviouslyFouledEffect,
)


def make_frame() -> Frame:
    return Frame(
        id="frame-test",
        match_id="match-test",
        scores={"p1": 0, "p2": 0},
        current_turn="p1",
    )


def test_foul_processor_classifies_declared_foul_and_sets_foul_flag():
    context = SimpleNamespace(
        frame=make_frame(),
        payload=SimpleNamespace(action="shot", potted_balls=(), foul=4),
    )

    effects = FoulProcessor().process(context)

    assert isinstance(context.foul_result, FoulResult)
    assert context.foul_result.is_foul is True
    assert context.foul_result.points_awarded == 4
    assert context.foul_result.fouled_with == ()
    assert len(effects) == 1
    assert isinstance(effects[0], SetPreviouslyFouledEffect)
    assert effects[0].value is True


def test_foul_processor_calculates_penalty_from_illegal_potted_balls():
    context = SimpleNamespace(
        frame=make_frame(),
        payload=SimpleNamespace(action="shot", potted_balls=("red", "black"), foul=0),
    )

    FoulProcessor().process(context)

    assert context.foul_result.is_foul is True
    assert context.foul_result.points_awarded == 7
    assert context.foul_result.fouled_with == ("red", "black")
