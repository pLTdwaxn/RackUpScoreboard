from scoreboard.domain.models.frame import Frame
from scoreboard.domain.orchestrators.contracts import ActionPayload, FrameCalculationContext
from scoreboard.domain.processors.foul_processor import FoulResult
from scoreboard.domain.processors.score_processor import (
    AwardPenaltyEffect,
    RemoveRedsEffect,
    ScoreProcessor,
    ScoreRedsEffect,
    ScoreResult,
)


def make_frame() -> Frame:
    return Frame(
        id="frame-test",
        match_id="match-test",
        scores={"p1": 0, "p2": 0},
        current_turn="p1",
    )


def test_score_processor_scores_legal_red_and_removes_it():
    context = FrameCalculationContext(
        frame=make_frame(),
        payload=ActionPayload(action="shot", potted_balls=("red",), foul=0),
        foul_result=FoulResult(is_foul=False),
    )

    effects = ScoreProcessor().process(context)

    assert isinstance(context.score_result, ScoreResult)
    assert context.score_result.player == "p1"
    assert context.score_result.points == 1
    assert context.score_result.break_points == 1
    assert context.score_result.scored_balls == ("red",)
    assert context.score_result.free_ball_pots == ()
    assert context.score_result.reds_removed == 1
    assert [type(effect) for effect in effects] == [RemoveRedsEffect, ScoreRedsEffect]


def test_score_processor_awards_foul_penalty_to_opponent_and_removes_fouled_reds():
    context = FrameCalculationContext(
        frame=make_frame(),
        payload=ActionPayload(action="shot", potted_balls=("red", "black"), foul=0),
        foul_result=FoulResult(is_foul=True, points_awarded=7, fouled_with=("red", "black")),
    )

    effects = ScoreProcessor().process(context)

    assert context.score_result.player == "p2"
    assert context.score_result.points == 7
    assert context.score_result.reds_removed == 1
    assert [type(effect) for effect in effects] == [RemoveRedsEffect, AwardPenaltyEffect]


def test_score_processor_removes_red_potted_during_declared_foul():
    context = FrameCalculationContext(
        frame=make_frame(),
        payload=ActionPayload(action="shot", potted_balls=("red",), foul=7),
        foul_result=FoulResult(is_foul=True, points_awarded=7, fouled_with=()),
    )

    effects = ScoreProcessor().process(context)

    assert context.score_result.player == "p2"
    assert context.score_result.points == 7
    assert context.score_result.reds_removed == 1
    assert [type(effect) for effect in effects] == [RemoveRedsEffect, AwardPenaltyEffect]


def test_score_processor_reports_free_ball_colour_as_object_ball():
    frame = make_frame()
    frame.table_state.free_ball_nominated_colour = "blue"
    frame.table_state.free_ball_object_ball = "red"
    context = FrameCalculationContext(
        frame=frame,
        payload=ActionPayload(action="shot", potted_balls=("blue",), foul=0),
        foul_result=FoulResult(is_foul=False),
    )

    ScoreProcessor().process(context)

    assert isinstance(context.score_result, ScoreResult)
    assert context.score_result.break_points == 1
    assert context.score_result.scored_balls == ("red",)
    assert [pot.to_dict() for pot in context.score_result.free_ball_pots] == [
        {"potted_ball": "blue", "counts_as": "red"}
    ]


def test_score_processor_reports_free_ball_and_actual_red_as_two_scored_reds():
    frame = make_frame()
    frame.table_state.free_ball_nominated_colour = "blue"
    frame.table_state.free_ball_object_ball = "red"
    context = FrameCalculationContext(
        frame=frame,
        payload=ActionPayload(action="shot", potted_balls=("blue", "red"), foul=0),
        foul_result=FoulResult(is_foul=False),
    )

    ScoreProcessor().process(context)

    assert isinstance(context.score_result, ScoreResult)
    assert context.score_result.break_points == 2
    assert context.score_result.scored_balls == ("red", "red")
    assert [pot.to_dict() for pot in context.score_result.free_ball_pots] == [
        {"potted_ball": "blue", "counts_as": "red"}
    ]
