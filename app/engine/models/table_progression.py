from __future__ import annotations

from typing import TYPE_CHECKING, Optional

from app.engine.rules.messages import COLOUR_ORDER, RED_BALL

if TYPE_CHECKING:
    from app.engine.models.room_state import MatchRoom


class TableProgression:
    def remaining_colour_after(self, room: MatchRoom, colour: str) -> Optional[str]:
        try:
            index = COLOUR_ORDER.index(colour)
        except ValueError:
            return None

        for next_colour in COLOUR_ORDER[index + 1 :]:
            if room.colours_on_table.get(next_colour, False):
                return next_colour
        return None

    def first_remaining_colour(self, room: MatchRoom) -> Optional[str]:
        for colour in COLOUR_ORDER:
            if room.colours_on_table.get(colour, False):
                return colour
        return None

    def remove_potted_balls(self, room: MatchRoom, potted_balls: tuple[str, ...]) -> None:
        for ball in potted_balls:
            if ball == RED_BALL and room.reds_remaining > 0:
                room.reds_remaining -= 1
            elif ball in room.colours_on_table:
                # Colours are respotted during reds and for the free colour
                # immediately after the final red.
                room.colours_on_table[ball] = room.reds_remaining > 0 or room.object_ball == "colour"

    def illegal_balls_for_target(self, room: MatchRoom, potted_balls: tuple[str, ...]) -> list[str]:
        if room.object_ball == RED_BALL:
            return [ball for ball in potted_balls if ball != RED_BALL]

        if room.object_ball == "colour":
            return [ball for ball in potted_balls if ball == RED_BALL]

        return [ball for ball in potted_balls if ball != room.object_ball]

    def advance_object_ball_after_legal_shot(self, room: MatchRoom, potted_balls: tuple[str, ...]) -> None:
        if room.object_ball == RED_BALL:
            room.object_ball = "colour"
            return

        if room.object_ball == "colour":
            if room.reds_remaining > 0:
                room.object_ball = RED_BALL
                return

            next_colour = self.first_remaining_colour(room)
            if next_colour:
                room.object_ball = next_colour
            return

        if room.object_ball in COLOUR_ORDER:
            next_colour = self.remaining_colour_after(room, room.object_ball)
            if next_colour:
                room.object_ball = next_colour
