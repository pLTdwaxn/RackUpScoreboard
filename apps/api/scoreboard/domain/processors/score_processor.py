from collections.abc import Sequence
from typing import TYPE_CHECKING

from scoreboard.domain.balls import BALL_POINTS, RED_BALL
from scoreboard.domain.frame_calculation.helpers import object_ball_equivalent_potted_balls, opponent_key
from scoreboard.domain.models.frame_state import FramePhase
from scoreboard.domain.orchestrators.effects.frame_effects import (
    AwardPenaltyEffect,
    ClearFreeBallEffect,
    RemoveColoursEffect,
    RemoveRedsEffect,
    RespotColoursEffect,
    ScorePointsEffect,
    ScoreRedsEffect,
)

from .results import ScoreResult

if TYPE_CHECKING:
    from scoreboard.domain.orchestrators.contracts import FrameCalculationContext
    from scoreboard.domain.orchestrators.effects.contracts import FrameEffect


class ScoreProcessor:
    def process(self, context: "FrameCalculationContext") -> Sequence["FrameEffect"]:
        frame = context.frame
        table = frame.table_state
        turn = frame.turn_state
        foul = context.require_foul_result("ScoreProcessor")
        shot = context.payload

        assert shot.action == "shot"

        effects: list["FrameEffect"] = []

        if foul.is_foul:
            reds_removed = foul.fouled_with.count(RED_BALL)
            if reds_removed:
                effects.append(RemoveRedsEffect(reds_removed))
            effects.append(AwardPenaltyEffect(foul.points_awarded))
            if table.free_ball_nominated_colour:
                effects.append(ClearFreeBallEffect())
            result = ScoreResult(
                player=opponent_key(frame) or turn.current_turn,
                points=foul.points_awarded,
                reds_removed=reds_removed,
                is_scoring_shot=False,
            )
            context.score_result = result
            return effects

        if not shot.potted_balls:
            result = ScoreResult(player=turn.current_turn, points=0)
            context.score_result = result
            return [ClearFreeBallEffect()] if table.free_ball_nominated_colour else []

        equivalent_potted_balls = object_ball_equivalent_potted_balls(frame, shot.potted_balls)
        nominated_colour = table.free_ball_nominated_colour
        free_ball_potted = bool(nominated_colour and nominated_colour in shot.potted_balls)

        if table.object_ball == RED_BALL:
            reds_potted = equivalent_potted_balls.count(RED_BALL)
            actual_reds_potted = shot.potted_balls.count(RED_BALL)
            points = reds_potted * BALL_POINTS[RED_BALL]
            effects: list["FrameEffect"] = []
            if actual_reds_potted:
                effects.append(RemoveRedsEffect(actual_reds_potted))
            if free_ball_potted:
                effects.append(ScorePointsEffect(points))
            else:
                effects.append(ScoreRedsEffect(reds_potted))
            if free_ball_potted and nominated_colour:
                effects.append(RespotColoursEffect((nominated_colour,)))
            if table.free_ball_nominated_colour:
                effects.append(ClearFreeBallEffect())
            result = ScoreResult(
                player=turn.current_turn,
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
        effects: list["FrameEffect"] = [ScorePointsEffect(points)]
        actual_colour = shot.potted_balls[0]
        if free_ball_potted and nominated_colour:
            effects.append(RespotColoursEffect((nominated_colour,)))
        else:
            effects.insert(0, RemoveColoursEffect((actual_colour,)))
            if table.phase == FramePhase.REDS:
                effects.append(RespotColoursEffect((actual_colour,)))
        if table.free_ball_nominated_colour:
            effects.append(ClearFreeBallEffect())

        result = ScoreResult(
            player=turn.current_turn,
            points=points,
            break_points=points,
            colours_removed=() if free_ball_potted else (actual_colour,),
            colours_respotted=(
                (nominated_colour,)
                if free_ball_potted and nominated_colour
                else (actual_colour,)
                if table.phase == FramePhase.REDS
                else ()
            ),
            potted_ball=colour,
            is_scoring_shot=True,
        )
        context.score_result = result
        return effects


score_processor = ScoreProcessor()
