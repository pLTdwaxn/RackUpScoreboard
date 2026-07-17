from scoreboard.domain.models.frame import Frame
from scoreboard.domain.rules import COLOUR_BALLS


def opponent_key(frame: Frame) -> str | None:
    for player_key in frame.scores:
        if player_key != frame.current_turn:
            return player_key
    return None


def object_ball_equivalent_potted_balls(frame: Frame, potted_balls: tuple[str, ...]) -> tuple[str, ...]:
    nominated_colour = frame.free_ball_nominated_colour
    object_ball = frame.free_ball_object_ball
    if not nominated_colour or not object_ball:
        return potted_balls

    return tuple(object_ball if ball == nominated_colour else ball for ball in potted_balls)


def score_gap(scores: dict[str, int]) -> int:
    values = list(scores.values())
    return max(values, default=0) - min(values, default=0)


def scores_after_points(scores: dict[str, int], player_key: str, points: int) -> dict[str, int]:
    next_scores = dict(scores)
    next_scores[player_key] = next_scores.get(player_key, 0) + points
    return next_scores


def scores_after_penalty(frame: Frame, points_awarded: int) -> dict[str, int]:
    opponent = opponent_key(frame)
    if opponent is None:
        return dict(frame.scores)
    return scores_after_points(dict(frame.scores), opponent, points_awarded)


def remaining_colour_after(frame: Frame, colour: str) -> str | None:
    try:
        index = COLOUR_BALLS.index(colour)
    except ValueError:
        return None

    for next_colour in COLOUR_BALLS[index + 1 :]:
        if frame.colours_on_table.get(next_colour, False):
            return next_colour
    return None


def leading_player_key(scores: dict[str, int]) -> str | None:
    if not scores:
        return None

    highest_score = max(scores.values())
    leaders = [player_key for player_key, player_score in scores.items() if player_score == highest_score]
    if len(leaders) != 1:
        return None
    return leaders[0]
