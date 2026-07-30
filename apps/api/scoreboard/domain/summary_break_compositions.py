from __future__ import annotations

from collections import Counter

from scoreboard.domain.balls import BALL_POINTS, COLOUR_BALLS, RED_BALL


def suggest_summary_break_compositions(points: int, limit: int = 5) -> list[dict]:
    suggestions: list[dict] = []
    max_reds = min(15, points)

    for reds in range(max_reds, -1, -1):
        for colours in range(reds, -1, -1):
            colour_points = points - reds
            if colour_points < 0:
                continue
            colour_sequence = _colour_sequence(colour_points, colours)
            if colour_sequence is None:
                continue

            balls = _interleave_reds_and_colours(reds, colour_sequence)
            if not balls:
                continue

            suggestions.append(
                {
                    "id": f"suggestion_{len(suggestions) + 1}",
                    "label": _composition_label(balls),
                    "balls": balls,
                }
            )
            if len(suggestions) >= limit:
                return suggestions

    return suggestions


def _colour_sequence(points: int, count: int) -> list[str] | None:
    if count == 0:
        return [] if points == 0 else None

    colours_by_preference = tuple(reversed(COLOUR_BALLS))
    minimum = count * BALL_POINTS["yellow"]
    maximum = count * BALL_POINTS["black"]
    if points < minimum or points > maximum:
        return None

    def search(remaining_points: int, remaining_count: int) -> list[str] | None:
        if remaining_count == 0:
            return [] if remaining_points == 0 else None

        for colour in colours_by_preference:
            value = BALL_POINTS[colour]
            next_points = remaining_points - value
            if next_points < (remaining_count - 1) * BALL_POINTS["yellow"]:
                continue
            if next_points > (remaining_count - 1) * BALL_POINTS["black"]:
                continue
            suffix = search(next_points, remaining_count - 1)
            if suffix is not None:
                return [colour, *suffix]

        return None

    return search(points, count)


def _interleave_reds_and_colours(reds: int, colours: list[str]) -> list[str]:
    balls: list[str] = []
    for index in range(reds):
        balls.append(RED_BALL)
        if index < len(colours):
            balls.append(colours[index])
    if reds == 0:
        balls.extend(colours)
    return balls


def _composition_label(balls: list[str]) -> str:
    counts = Counter(balls)
    parts = []
    for ball in (RED_BALL, *COLOUR_BALLS):
        count = counts.get(ball, 0)
        if count:
            parts.append(f"{count} {ball}{'' if count == 1 else 's'}")
    return ", ".join(parts)
