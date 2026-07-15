from dataclasses import dataclass

from scoreboard.domain.models.frame import Frame, FramePhase
from scoreboard.domain.rules import BALL_POINTS, RED_BALL


class ScoreProcessor:
    def process(self, context):
        frame = context.frame
        foul = context.foul_result
        shot = context.payload

        if shot.action != "shot":
            result = ScoreResult(player=frame.current_turn, points=0)
            context.score_result = result
            return []

        effects = []

        if foul.is_foul:
            reds_removed = foul.fouled_with.count(RED_BALL)
            if reds_removed:
                effects.append(RemoveRedsEffect(reds_removed))
            effects.append(AwardPenaltyEffect(foul.points_awarded))
            result = ScoreResult(
                player=self._opponent_key(frame) or frame.current_turn,
                points=foul.points_awarded,
                reds_removed=reds_removed,
                is_scoring_shot=False,
            )
            context.score_result = result
            return effects

        if not shot.potted_balls:
            result = ScoreResult(player=frame.current_turn, points=0)
            context.score_result = result
            return []

        if frame.object_ball == RED_BALL:
            reds_potted = shot.potted_balls.count(RED_BALL)
            points = reds_potted * BALL_POINTS[RED_BALL]
            result = ScoreResult(
                player=frame.current_turn,
                points=points,
                reds_removed=reds_potted,
                break_points=points,
                potted_ball=RED_BALL,
                is_scoring_shot=True,
            )
            context.score_result = result
            return [RemoveRedsEffect(reds_potted), ScoreRedsEffect(reds_potted)]

        colour = shot.potted_balls[0]
        points = BALL_POINTS[colour]
        effects = [RemoveColoursEffect((colour,)), ScoreColourEffect(colour)]
        if frame.phase == FramePhase.REDS:
            effects.append(RespotColoursEffect((colour,)))

        result = ScoreResult(
            player=frame.current_turn,
            points=points,
            break_points=points,
            colours_removed=(colour,),
            colours_respotted=(colour,) if frame.phase == FramePhase.REDS else (),
            potted_ball=colour,
            is_scoring_shot=True,
        )
        context.score_result = result
        return effects

    def _opponent_key(self, frame: Frame) -> str | None:
        for player_key in frame.scores:
            if player_key != frame.current_turn:
                return player_key
        return None


@dataclass
class RemoveRedsEffect:
    count: int

    def apply(self, frame: Frame) -> None:
        frame.remove_reds(self.count)


@dataclass
class ScoreRedsEffect:
    count: int

    def apply(self, frame: Frame) -> None:
        frame.score_reds(self.count)


@dataclass
class RemoveColoursEffect:
    colours: tuple[str, ...]

    def apply(self, frame: Frame) -> None:
        frame.remove_colours(self.colours)


@dataclass
class ScoreColourEffect:
    colour: str

    def apply(self, frame: Frame) -> None:
        frame.score_colour(self.colour)


@dataclass
class RespotColoursEffect:
    colours: tuple[str, ...]

    def apply(self, frame: Frame) -> None:
        frame.respot_colours(self.colours)


@dataclass
class AwardPenaltyEffect:
    points: int

    def apply(self, frame: Frame) -> None:
        frame.award_penalty(self.points)


@dataclass
class ScoreResult:
    player: str
    points: int
    reds_removed: int = 0
    break_points: int = 0
    colours_removed: tuple[str, ...] = ()
    colours_respotted: tuple[str, ...] = ()
    potted_ball: str | None = None
    is_scoring_shot: bool = False


score_processor = ScoreProcessor()
