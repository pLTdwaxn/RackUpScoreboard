from __future__ import annotations

from typing import Optional

from scoreboard.engine.models.frame import FrameModel, FramePhase

from ..rules import BALL_POINTS, COLOUR_BALLS, RED_BALL


class FrameProgression:
    def _update_highest_break_if_needed(self, frame: FrameModel) -> None:
        if frame.highest_break < frame.current_break:
            frame.update_highest_break(frame.current_break)

    def _finish_or_respot_black(self, frame: FrameModel, colour: str) -> None:
        if colour == "black" and frame.points_gap() == 0:
            frame.respot_black()
        else:
            frame.finish_with_resolved_winner()

    def _advance_after_turn_change(self, frame: FrameModel) -> None:
        if frame.reds_remaining > 0:
            frame.set_object_ball(RED_BALL)
            return

        if frame.phase == FramePhase.REDS:
            frame.enter_colours_phase()
            frame.set_object_ball("yellow")
        elif frame.phase == FramePhase.COLOURS:
            if frame.object_ball != "black" and frame.colours_on_table.get(frame.object_ball, False):
                frame.set_object_ball(frame.object_ball)
                return

            next_colour = self.remaining_colour_after(frame, frame.object_ball)
            if next_colour:
                frame.set_object_ball(next_colour)
            else:
                self._finish_or_respot_black(frame, frame.object_ball)
        elif frame.phase == FramePhase.RESPOTTED_BLACK:
            frame.finish_with_resolved_winner()

    def process_shot(
        self,
        frame: FrameModel,
        potted_balls: tuple[str, ...],
        foul_points: int | None = None,
    ) -> None:
        if not potted_balls:
            if foul_points is not None and foul_points > 0:
                self.process_foul(frame, (), foul_points)
            else:
                self.process_non_pot(frame, potted_balls)
            return

        if frame.object_ball == RED_BALL:
            if any(ball in COLOUR_BALLS for ball in potted_balls):
                self.process_foul(frame, potted_balls, None)
                return
        elif frame.object_ball == "colour":
            if len(potted_balls) != 1 or potted_balls[0] == RED_BALL or potted_balls[0] not in COLOUR_BALLS:
                self.process_foul(frame, potted_balls, None)
                return
        elif len(potted_balls) != 1 or potted_balls[0] == RED_BALL or potted_balls[0] != frame.object_ball:
            self.process_foul(frame, potted_balls, None)
            return

        if foul_points is not None and foul_points > 0:
            self.process_foul(frame, (), foul_points)
            return

        frame.set_previously_fouled(False)

        if frame.object_ball == RED_BALL:
            reds_potted = potted_balls.count(RED_BALL)
            score = reds_potted * BALL_POINTS[RED_BALL]
            frame.remove_reds(reds_potted)
            frame.score_reds(reds_potted)
            frame.bump_current_break(score)
            frame.set_object_ball("colour")
            return

        # colour-on branch
        colour = potted_balls[0]
        frame.remove_colours((colour,))
        frame.score_colour(colour)
        frame.bump_current_break(BALL_POINTS[colour])

        if frame.phase == FramePhase.REDS:
            frame.respot_colours((colour,))
            if frame.reds_remaining > 0:
                frame.set_object_ball(RED_BALL)
            else:
                frame.enter_colours_phase()
                frame.set_object_ball("yellow")
            return

        next_colour = self.remaining_colour_after(frame, colour)
        if next_colour:
            frame.set_object_ball(next_colour)
        else:
            self._finish_or_respot_black(frame, colour)

    def process_non_pot(self, frame: FrameModel, potted_balls: tuple[str, ...]) -> None:
        self._update_highest_break_if_needed(frame)
        frame.switch_turn()
        frame.reset_current_break()
        frame.set_previously_fouled(False)
        self._advance_after_turn_change(frame)

    # Fouls are either player-declared or calculated with the potted balls.
    # So there are two scenarios to handle.
    # {"potted_balls": ["red", "yellow"], "foul": 4} when object ball = red
    # {"potted_balls": [], "foul": 4} could be fouls not calculable from potted balls,
    #   e.g. illegal contacting, hitting non-object ball first, etc.
    # The frontend will send in the foul points,
    #   but we rely on the backend to calculate the foul points from the potted balls if possible.
    def process_foul(self, frame: FrameModel, fouled_with: tuple[str, ...], foul_points: int | None) -> None:
        if fouled_with:
            penalty_points = max(BALL_POINTS[ball] for ball in fouled_with)
            penalty_points = max(4, min(7, penalty_points))
            # If reds potted legally, remove them from the table.
            reds_potted = fouled_with.count(RED_BALL)
            frame.remove_reds(reds_potted)
            frame.award_penalty(penalty_points)
        else:
            penalty_points = foul_points if foul_points is not None else 4
            frame.award_penalty(penalty_points)

        self._update_highest_break_if_needed(frame)

        if frame.object_ball == "black":
            if frame.phase == FramePhase.COLOURS:
                if frame.points_gap() == 0:
                    frame.respot_black()
                    return
                frame.finish_with_resolved_winner()
                return

            if frame.phase == FramePhase.RESPOTTED_BLACK:
                frame.finish_with_resolved_winner()
                return

        frame.switch_turn()
        frame.reset_current_break()
        frame.set_previously_fouled(True)
        self._advance_after_turn_change(frame)

    def process_pass_shot(self, frame: FrameModel) -> None:
        frame.switch_turn()
        frame.reset_current_break()
        frame.set_previously_fouled(False)
        self._advance_after_turn_change(frame)

    def process_declare_free_ball(self, frame: FrameModel, nominated_colour: str) -> None:
        frame.set_object_ball(nominated_colour)

    def remaining_colour_after(self, frame: FrameModel, colour: str) -> Optional[str]:
        try:
            index = COLOUR_BALLS.index(colour)
        except ValueError:
            return None

        for next_colour in COLOUR_BALLS[index + 1 :]:
            if frame.colours_on_table.get(next_colour, False):
                return next_colour
        return None
