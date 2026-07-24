from typing import cast

from scoreboard.domain.models.frame import Frame
from scoreboard.domain.orchestrators.contracts import ActionPayload, FrameCalculationContext
from scoreboard.domain.orchestrators.outcome_factory import ActionOutcomeFactory
from scoreboard.domain.processors.results import FoulResult, FreeBallPot, ScoreResult, WinConditionResult


def make_context(
    *,
    payload: ActionPayload,
    foul_result: FoulResult | None = None,
    score_result: ScoreResult | None = None,
    win_condition_result: WinConditionResult | None = None,
) -> FrameCalculationContext:
    return FrameCalculationContext(
        frame=cast(Frame, None),
        payload=payload,
        foul_result=foul_result,
        score_result=score_result,
        win_condition_result=win_condition_result,
    )


def test_outcome_factory_maps_pass_shot() -> None:
    outcome = ActionOutcomeFactory().from_context(
        make_context(payload=ActionPayload(action="pass_shot", potted_balls=()))
    )

    assert outcome.to_dict()["result"] == "passed"


def test_outcome_factory_maps_declared_free_ball() -> None:
    outcome = ActionOutcomeFactory().from_context(
        make_context(
            payload=ActionPayload(
                action="declare_free_ball",
                potted_balls=(),
                nominated_colour="blue",
            )
        )
    )

    assert outcome.to_dict() == {
        "action": "declare_free_ball",
        "result": "declared",
        "player_key": None,
        "potted_balls": [],
        "scored_balls": [],
        "free_ball_pots": [],
        "break_points": 0,
        "foul_points": 0,
        "winner_key": None,
        "nominated_colour": "blue",
    }


def test_outcome_factory_maps_foul() -> None:
    outcome = ActionOutcomeFactory().from_context(
        make_context(
            payload=ActionPayload(action="shot", potted_balls=()),
            foul_result=FoulResult(is_foul=True, points_awarded=5),
            score_result=ScoreResult(player="p2", points=5),
        )
    )

    assert outcome.result == "foul"
    assert outcome.player_key == "p2"
    assert outcome.foul_points == 5


def test_outcome_factory_maps_frame_won() -> None:
    outcome = ActionOutcomeFactory().from_context(
        make_context(
            payload=ActionPayload(action="shot", potted_balls=("black",)),
            score_result=ScoreResult(player="p1", points=7, break_points=7, scored_balls=("black",)),
            win_condition_result=WinConditionResult(finishes_frame=True, winner_key="p1"),
        )
    )

    assert outcome.result == "frame_won"
    assert outcome.potted_balls == ("black",)
    assert outcome.scored_balls == ("black",)
    assert outcome.break_points == 7
    assert outcome.winner_key == "p1"


def test_outcome_factory_maps_scoring_and_no_score() -> None:
    scoring = ActionOutcomeFactory().from_context(
        make_context(
            payload=ActionPayload(action="shot", potted_balls=("red",)),
            score_result=ScoreResult(player="p1", points=1, break_points=1, scored_balls=("red",)),
        )
    )
    no_score = ActionOutcomeFactory().from_context(
        make_context(
            payload=ActionPayload(action="shot", potted_balls=()),
            score_result=ScoreResult(player="p1", points=0),
        )
    )

    assert scoring.result == "scoring"
    assert scoring.potted_balls == ("red",)
    assert scoring.scored_balls == ("red",)
    assert no_score.result == "no_score"
    assert no_score.potted_balls == ()
    assert no_score.scored_balls == ()


def test_outcome_factory_maps_free_ball_scoring_metadata() -> None:
    outcome = ActionOutcomeFactory().from_context(
        make_context(
            payload=ActionPayload(action="shot", potted_balls=("blue", "red")),
            score_result=ScoreResult(
                player="p1",
                points=2,
                break_points=2,
                scored_balls=("red", "red"),
                free_ball_pots=(FreeBallPot(potted_ball="blue", counts_as="red"),),
            ),
        )
    )

    assert outcome.to_dict()["potted_balls"] == ["blue", "red"]
    assert outcome.to_dict()["scored_balls"] == ["red", "red"]
    assert outcome.to_dict()["free_ball_pots"] == [{"potted_ball": "blue", "counts_as": "red"}]
