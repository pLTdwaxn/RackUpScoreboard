from collections.abc import Sequence
from typing import TYPE_CHECKING

from scoreboard.domain.frame_calculation.helpers import opponent_key
from scoreboard.domain.orchestrators.effects.frame_effects import UpdateTurnEffect

from .results import TurnResult

if TYPE_CHECKING:
    from scoreboard.domain.orchestrators.contracts import FrameCalculationContext
    from scoreboard.domain.orchestrators.effects.contracts import FrameEffect


class TurnProcessor:
    def process(self, context: "FrameCalculationContext") -> Sequence["FrameEffect"]:
        frame = context.frame
        current_turn = frame.turn_state.current_turn
        shot = context.payload
        foul = context.require_foul_result("TurnProcessor")

        if foul.finishes_frame or foul.respots_black:
            next_player = current_turn
        elif shot.action == "pass_shot":
            next_player = opponent_key(frame) or current_turn
        elif foul.is_foul or not shot.potted_balls:
            next_player = opponent_key(frame) or current_turn
        else:
            next_player = current_turn

        result = TurnResult(next_player)

        context.turn_result = result

        return [UpdateTurnEffect(result)]


turn_processor = TurnProcessor()
