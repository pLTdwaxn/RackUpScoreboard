from dataclasses import dataclass

from scoreboard.domain.models.frame import Frame, FramePhase
from scoreboard.domain.rules import BALL_POINTS, COLOUR_BALLS, RED_BALL


class FoulProcessor:
    def process(self, context):
        frame = context.frame
        shot = context.payload

        if shot.action == "skip":
            context.foul_result = FoulResult(is_foul=False)
            return [SetPreviouslyFouledEffect(False)]

        if shot.action != "shot":
            result = FoulResult(is_foul=False)
            context.foul_result = result
            return []

        fouled_with = self._fouled_with(frame, shot.potted_balls)
        declared_foul = shot.foul > 0

        if fouled_with:
            points_awarded = max(BALL_POINTS[ball] for ball in fouled_with)
            points_awarded = max(4, min(7, points_awarded))
        elif declared_foul:
            points_awarded = shot.foul
        else:
            points_awarded = 0

        is_foul = bool(fouled_with or declared_foul)
        result = FoulResult(
            is_foul=is_foul,
            points_awarded=points_awarded,
            fouled_with=fouled_with,
            respots_black=is_foul and self._respots_black(frame, points_awarded),
            finishes_frame=is_foul and self._finishes_frame(frame, points_awarded),
        )
        context.foul_result = result
        return [SetPreviouslyFouledEffect(result.is_foul and not result.respots_black and not result.finishes_frame)]

    def _fouled_with(self, frame: Frame, potted_balls: tuple[str, ...]) -> tuple[str, ...]:
        if not potted_balls:
            return ()

        if frame.object_ball == RED_BALL:
            return potted_balls if any(ball in COLOUR_BALLS for ball in potted_balls) else ()

        if frame.object_ball == "colour":
            if len(potted_balls) != 1 or potted_balls[0] == RED_BALL or potted_balls[0] not in COLOUR_BALLS:
                return potted_balls
            return ()

        if len(potted_balls) != 1 or potted_balls[0] == RED_BALL or potted_balls[0] != frame.object_ball:
            return potted_balls

        return ()

    def _scores_after_penalty(self, frame: Frame, points_awarded: int) -> dict[str, int]:
        scores = dict(frame.scores)
        opponent_keys = [player_key for player_key in scores if player_key != frame.current_turn]
        if opponent_keys:
            scores[opponent_keys[0]] += points_awarded
        return scores

    def _points_gap_after_penalty(self, frame: Frame, points_awarded: int) -> int:
        scores = list(self._scores_after_penalty(frame, points_awarded).values())
        return max(scores, default=0) - min(scores, default=0)

    def _respots_black(self, frame: Frame, points_awarded: int) -> bool:
        return (
            frame.object_ball == "black"
            and frame.phase == FramePhase.COLOURS
            and self._points_gap_after_penalty(frame, points_awarded) == 0
        )

    def _finishes_frame(self, frame: Frame, points_awarded: int) -> bool:
        if frame.object_ball != "black":
            return False
        if frame.phase == FramePhase.RESPOTTED_BLACK:
            return True
        return frame.phase == FramePhase.COLOURS and not self._respots_black(frame, points_awarded)


@dataclass
class FoulResult:
    is_foul: bool
    points_awarded: int = 0
    fouled_with: tuple[str, ...] = ()
    respots_black: bool = False
    finishes_frame: bool = False


@dataclass
class SetPreviouslyFouledEffect:
    value: bool

    def apply(self, frame: Frame) -> None:
        frame.set_previously_fouled(self.value)


foul_processor = FoulProcessor()
