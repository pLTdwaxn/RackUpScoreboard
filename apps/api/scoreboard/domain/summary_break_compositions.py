from __future__ import annotations

from collections import Counter
from dataclasses import dataclass

from scoreboard.domain.balls import BALL_POINTS, COLOUR_BALLS, RED_BALL


@dataclass(frozen=True)
class _CompositionCandidate:
    balls: list[str]
    reds: int
    colours: list[str]

    @property
    def average_colour_points(self) -> float:
        if not self.colours:
            return 0
        return sum(BALL_POINTS[colour] for colour in self.colours) / len(self.colours)


def suggest_summary_break_compositions(points: int) -> list[dict]:
    candidates: list[_CompositionCandidate] = []
    max_reds = min(15, points)

    for reds in range(max_reds, -1, -1):
        colour_counts = _valid_colour_counts_for_reds(reds)
        for colours in colour_counts:
            colour_points = points - reds
            if colour_points < 0:
                continue
            for colour_sequence in _colour_sequences(colour_points, colours):
                balls = _interleave_reds_and_colours(reds, colour_sequence)
                if not balls:
                    continue

                candidates.append(_CompositionCandidate(balls=balls, reds=reds, colours=colour_sequence))

    ranked_candidates = sorted(
        candidates,
        key=lambda candidate: (
            candidate.average_colour_points,
            len(candidate.colours),
            candidate.reds,
        ),
        reverse=True,
    )

    return [
        {
            "id": f"suggestion_{index + 1}",
            "label": _composition_label(candidate.balls),
            "balls": candidate.balls,
        }
        for index, candidate in enumerate(ranked_candidates)
    ]


def _valid_colour_counts_for_reds(reds: int) -> tuple[int, ...]:
    if reds == 0:
        return (0,)
    if reds == 1:
        return (1, 0)
    return (reds, reds - 1)


def _colour_sequences(points: int, count: int) -> list[list[str]]:
    if count == 0:
        return [[]] if points == 0 else []

    colours_by_preference = tuple(reversed(COLOUR_BALLS))
    minimum = count * BALL_POINTS["yellow"]
    maximum = count * BALL_POINTS["black"]
    if points < minimum or points > maximum:
        return []

    def search(remaining_points: int, remaining_count: int, start_index: int) -> list[list[str]]:
        if remaining_count == 0:
            return [[]] if remaining_points == 0 else []

        sequences: list[list[str]] = []
        for index in range(start_index, len(colours_by_preference)):
            colour = colours_by_preference[index]
            value = BALL_POINTS[colour]
            next_points = remaining_points - value
            if next_points < (remaining_count - 1) * BALL_POINTS["yellow"]:
                continue
            if next_points > (remaining_count - 1) * BALL_POINTS["black"]:
                continue
            for suffix in search(next_points, remaining_count - 1, index):
                sequences.append([colour, *suffix])

        return sequences

    return search(points, count, 0)


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
