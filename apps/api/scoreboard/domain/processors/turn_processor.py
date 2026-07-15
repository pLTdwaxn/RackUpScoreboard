from dataclasses import dataclass

from scoreboard.domain.models.frame import Frame


@dataclass
class TurnResult:
    next_player: str


class TurnProcessor:
    def process(self, context):
        frame = context.frame
        shot = context.payload
        foul = context.foul_result

        if foul.finishes_frame or foul.respots_black:
            next_player = frame.current_turn
        elif shot.action == "skip":
            next_player = self._opponent_key(frame) or frame.current_turn
        elif shot.action == "declare_free_ball":
            next_player = frame.current_turn
        elif foul.is_foul or not shot.potted_balls:
            next_player = self._opponent_key(frame) or frame.current_turn
        else:
            next_player = frame.current_turn

        result = TurnResult(next_player)

        context.turn_result = result

        return [UpdateTurnEffect(result)]

    def _opponent_key(self, frame: Frame) -> str | None:
        for player_key in frame.scores:
            if player_key != frame.current_turn:
                return player_key
        return None


@dataclass
class UpdateTurnEffect:
    result: TurnResult

    def apply(self, frame: Frame) -> None:
        frame.current_turn = self.result.next_player


turn_processor = TurnProcessor()
