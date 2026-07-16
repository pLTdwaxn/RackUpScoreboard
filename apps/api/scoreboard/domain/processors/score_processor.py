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
            if frame.free_ball_nominated_colour:
                effects.append(ClearFreeBallEffect())
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
            return [ClearFreeBallEffect()] if frame.free_ball_nominated_colour else []

        equivalent_potted_balls = self._object_ball_equivalent_potted_balls(frame, shot.potted_balls)
        nominated_colour = frame.free_ball_nominated_colour
        free_ball_potted = bool(nominated_colour and nominated_colour in shot.potted_balls)

        if frame.object_ball == RED_BALL:
            reds_potted = equivalent_potted_balls.count(RED_BALL)
            actual_reds_potted = shot.potted_balls.count(RED_BALL)
            points = reds_potted * BALL_POINTS[RED_BALL]
            effects = []
            if actual_reds_potted:
                effects.append(RemoveRedsEffect(actual_reds_potted))
            if free_ball_potted:
                effects.append(ScorePointsEffect(points))
            else:
                effects.append(ScoreRedsEffect(reds_potted))
            if free_ball_potted and nominated_colour:
                effects.append(RespotColoursEffect((nominated_colour,)))
            if frame.free_ball_nominated_colour:
                effects.append(ClearFreeBallEffect())
            result = ScoreResult(
                player=frame.current_turn,
                points=points,
                reds_removed=actual_reds_potted,
                break_points=points,
                potted_ball=RED_BALL,
                is_scoring_shot=True,
            )
            context.score_result = result
            return effects

        colour = equivalent_potted_balls[0]
        points = BALL_POINTS[colour]
        effects = [ScorePointsEffect(points)]
        actual_colour = shot.potted_balls[0]
        if free_ball_potted and nominated_colour:
            effects.append(RespotColoursEffect((nominated_colour,)))
        else:
            effects.insert(0, RemoveColoursEffect((actual_colour,)))
            if frame.phase == FramePhase.REDS:
                effects.append(RespotColoursEffect((actual_colour,)))
        if frame.free_ball_nominated_colour:
            effects.append(ClearFreeBallEffect())

        result = ScoreResult(
            player=frame.current_turn,
            points=points,
            break_points=points,
            colours_removed=() if free_ball_potted else (actual_colour,),
            colours_respotted=(
                (nominated_colour,)
                if free_ball_potted and nominated_colour
                else (actual_colour,)
                if frame.phase == FramePhase.REDS
                else ()
            ),
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

    def _object_ball_equivalent_potted_balls(self, frame: Frame, potted_balls: tuple[str, ...]) -> tuple[str, ...]:
        nominated_colour = frame.free_ball_nominated_colour
        object_ball = frame.free_ball_object_ball
        if not nominated_colour or not object_ball:
            return potted_balls

        return tuple(object_ball if ball == nominated_colour else ball for ball in potted_balls)


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
class ScorePointsEffect:
    points: int

    def apply(self, frame: Frame) -> None:
        frame.scores[frame.current_turn] += self.points
        frame.recalculate_score_context()


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
class ClearFreeBallEffect:
    def apply(self, frame: Frame) -> None:
        frame.clear_free_ball()


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
