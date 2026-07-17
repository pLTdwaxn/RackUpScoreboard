from __future__ import annotations

from math import ceil
from typing import TYPE_CHECKING

from scoreboard.domain.balls import BALL_POINTS, COLOUR_BALLS

if TYPE_CHECKING:
    from scoreboard.domain.models.frame import Frame


class FrameRuleStateCalculator:
    def points_remaining(self, frame: Frame) -> int:
        table = frame.table_state

        effective_reds_remaining = table.reds_remaining
        if table.free_ball_object_ball == "red":
            effective_reds_remaining += 1

        if effective_reds_remaining > 0:
            remaining = (8 * effective_reds_remaining) + sum(BALL_POINTS[c] for c in COLOUR_BALLS)

            # After a red is potted, the incoming colour attempt is still available
            # in this visit until a miss/foul or successful colour pot resolves it.
            if table.object_ball == "colour":
                remaining += BALL_POINTS["black"]

            return remaining

        return sum(BALL_POINTS[colour] for colour, on_table in table.colours_on_table.items() if on_table)

    def snookers_required(self, frame: Frame) -> int:
        scoring = frame.scoring_state
        table = frame.table_state

        if len(scoring.scores) < 2:
            return 0

        pink_on_table = table.colours_on_table.get("pink", False)
        if not pink_on_table:
            return 0

        leading_score = max(scoring.scores.values(), default=0)
        trailing_score = min(scoring.scores.values(), default=0)
        gap = leading_score - trailing_score
        if gap <= 0:
            return 0

        remaining = self.points_remaining(frame)
        if remaining >= gap:
            return 0

        shortfall = gap - remaining

        # Baseline model: 4 foul points per successful snooker.
        # With reds on, account for a nominal free-ball red-black (+8) swing.
        gain_per_snooker = 12 if table.reds_remaining > 0 else 4
        return ceil(shortfall / gain_per_snooker)
