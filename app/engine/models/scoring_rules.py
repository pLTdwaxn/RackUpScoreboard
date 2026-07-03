from __future__ import annotations

from math import ceil
from typing import TYPE_CHECKING

from app.engine.rules.messages import BALL_POINTS, COLOUR_ORDER, ShotMessage

if TYPE_CHECKING:
    from app.engine.models.room_state import MatchRoom


class ScoringRules:
    def penalty_points(self, event: ShotMessage, illegal_balls: list[str]) -> int:
        if event.foul > 0:
            return event.foul

        illegal_values = [BALL_POINTS[ball] for ball in illegal_balls if ball in BALL_POINTS]
        return max([4, *illegal_values]) if illegal_values else 4

    def points_remaining(self, room: MatchRoom) -> int:
        if room.reds_remaining > 0:
            remaining = (8 * room.reds_remaining) + sum(BALL_POINTS[c] for c in COLOUR_ORDER)

            # After a red is potted, the incoming colour attempt is still available
            # in this visit until a miss/foul or successful colour pot resolves it.
            if room.object_ball == "colour":
                remaining += BALL_POINTS["black"]

            return remaining

        return sum(BALL_POINTS[colour] for colour, on_table in room.colours_on_table.items() if on_table)

    def snooker_required(self, room: MatchRoom) -> int:
        if len(room.players) < 2:
            return 0

        pink_on_table = room.colours_on_table.get("pink", False)
        if not pink_on_table:
            return 0

        leading_score = max(room.scores.values(), default=0)
        trailing_score = min(room.scores.values(), default=0)
        gap = leading_score - trailing_score
        if gap <= 0:
            return 0

        remaining = self.points_remaining(room)
        if remaining >= gap:
            return 0

        shortfall = gap - remaining

        # Baseline model: 4 foul points per successful snooker.
        # With reds on, account for a nominal free-ball red-black (+8) swing.
        gain_per_snooker = 12 if room.reds_remaining > 0 else 4
        return ceil(shortfall / gain_per_snooker)
