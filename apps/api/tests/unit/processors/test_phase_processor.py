from scoreboard.domain.models.frame import Frame, FramePhase
from scoreboard.domain.orchestrators.contracts import ActionPayload, FrameCalculationContext
from scoreboard.domain.processors.foul_processor import FoulResult
from scoreboard.domain.processors.phase_processor import PhaseProcessor, PhaseResult, UpdatePhaseEffect
from scoreboard.domain.processors.score_processor import ScoreResult
from scoreboard.domain.processors.turn_processor import TurnResult


def make_frame() -> Frame:
    return Frame(
        id="frame-test",
        match_id="match-test",
        scores={"p1": 0, "p2": 0},
        current_turn="p1",
    )


def test_phase_processor_enters_colours_after_last_red_and_turn_change():
    frame = make_frame()
    frame.reds_remaining = 1
    context = FrameCalculationContext(
        frame=frame,
        payload=ActionPayload(action="shot", potted_balls=(), foul=0),
        foul_result=FoulResult(is_foul=False),
        score_result=ScoreResult(player="p1", points=0, reds_removed=1),
        turn_result=TurnResult(next_player="p2"),
    )

    effects = PhaseProcessor().process(context)

    assert isinstance(context.phase_result, PhaseResult)
    assert context.phase_result.phase is FramePhase.COLOURS
    assert len(effects) == 1
    assert isinstance(effects[0], UpdatePhaseEffect)
