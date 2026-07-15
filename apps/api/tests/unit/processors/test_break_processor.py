from types import SimpleNamespace

from scoreboard.domain.models.frame import Frame
from scoreboard.domain.processors.break_processor import (
    BreakProcessor,
    BumpBreakEffect,
    ResetBreakEffect,
    UpdateHighestBreakEffect,
)
from scoreboard.domain.processors.foul_processor import FoulResult
from scoreboard.domain.processors.score_processor import ScoreResult


def make_context(**overrides):
    context = {
        "frame": Frame(
            id="frame-test",
            match_id="match-test",
            scores={"p1": 0, "p2": 0},
            current_turn="p1",
        ),
        "payload": SimpleNamespace(action="shot", potted_balls=("red",), foul=0),
        "foul_result": FoulResult(is_foul=False),
        "score_result": ScoreResult(player="p1", points=1, break_points=1),
    }
    context.update(overrides)
    return SimpleNamespace(**context)


def test_break_processor_bumps_break_for_scoring_shot():
    context = make_context()

    effects = BreakProcessor().process(context)

    assert context.break_result.break_points == 1
    assert len(effects) == 1
    assert isinstance(effects[0], BumpBreakEffect)
    assert effects[0].increment == 1


def test_break_processor_updates_highest_and_resets_on_miss():
    context = make_context(
        payload=SimpleNamespace(action="shot", potted_balls=(), foul=0),
        score_result=ScoreResult(player="p1", points=0),
    )

    effects = BreakProcessor().process(context)

    assert context.break_result.reset_break is True
    assert [type(effect) for effect in effects] == [UpdateHighestBreakEffect, ResetBreakEffect]
