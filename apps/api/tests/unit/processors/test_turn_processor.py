from types import SimpleNamespace

from scoreboard.domain.processors.foul_processor import FoulResult
from scoreboard.domain.processors.turn_processor import (
    TurnProcessor,
    TurnResult,
    UpdateTurnEffect,
)


def make_frame():
    return SimpleNamespace(scores={"player1": 0, "player2": 0}, current_turn="player1")


def test_turn_processor_keeps_current_turn_after_legal_pot():
    context = SimpleNamespace(
        payload=SimpleNamespace(action="shot", potted_balls=("red",)),
        foul_result=FoulResult(is_foul=False),
        frame=make_frame(),
    )

    effects = TurnProcessor().process(context)

    assert isinstance(context.turn_result, TurnResult)
    assert context.turn_result.next_player == "player1"
    assert len(effects) == 1
    assert isinstance(effects[0], UpdateTurnEffect)


def test_turn_processor_switches_to_other_player_on_foul():
    context = SimpleNamespace(
        payload=SimpleNamespace(action="shot", potted_balls=()),
        foul_result=FoulResult(is_foul=True),
        frame=make_frame(),
    )

    TurnProcessor().process(context)

    assert context.turn_result.next_player == "player2"
