from __future__ import annotations

from math import ceil
from typing import TYPE_CHECKING

from . import BALL_POINTS, COLOUR_BALLS

if TYPE_CHECKING:
    from scoreboard.domain.models.frame import Frame


class SnookerCalculator:
    def points_remaining(self, frame: Frame) -> int:
        if frame.reds_remaining > 0:
            remaining = (8 * frame.reds_remaining) + sum(BALL_POINTS[c] for c in COLOUR_BALLS)

            # After a red is potted, the incoming colour attempt is still available
            # in this visit until a miss/foul or successful colour pot resolves it.
            if frame.object_ball == "colour":
                remaining += BALL_POINTS["black"]

            return remaining

        return sum(BALL_POINTS[colour] for colour, on_table in frame.colours_on_table.items() if on_table)

    def snookers_required(self, frame: Frame) -> int:
        if len(frame.scores) < 2:
            return 0

        pink_on_table = frame.colours_on_table.get("pink", False)
        if not pink_on_table:
            return 0

        leading_score = max(frame.scores.values(), default=0)
        trailing_score = min(frame.scores.values(), default=0)
        gap = leading_score - trailing_score
        if gap <= 0:
            return 0

        remaining = self.points_remaining(frame)
        if remaining >= gap:
            return 0

        shortfall = gap - remaining

        # Baseline model: 4 foul points per successful snooker.
        # With reds on, account for a nominal free-ball red-black (+8) swing.
        gain_per_snooker = 12 if frame.reds_remaining > 0 else 4
        return ceil(shortfall / gain_per_snooker)
