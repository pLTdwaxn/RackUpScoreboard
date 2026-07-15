from __future__ import annotations

from dataclasses import dataclass

from scoreboard.domain.models.frame import Frame


class BreakProcessor:
    def process(self, context):
        frame = context.frame
        shot = context.payload
        foul = context.foul_result
        score = context.score_result

        if shot.action == "declare_free_ball":
            result = BreakResult(break_points=frame.current_break)
            context.break_result = result
            return []

        if foul.finishes_frame or foul.respots_black:
            result = BreakResult(
                break_points=frame.current_break,
                update_highest=True,
                reset_break=False,
            )
            context.break_result = result
            return [UpdateHighestBreakEffect(), PreserveBreakEffect(result)]

        if foul.is_foul or shot.action == "skip" or not shot.potted_balls:
            result = BreakResult(
                break_points=0,
                update_highest=True,
                reset_break=True,
            )
            context.break_result = result
            return [UpdateHighestBreakEffect(), ResetBreakEffect()]

        result = BreakResult(
            break_points=frame.current_break + score.break_points,
            break_increment=score.break_points,
        )
        context.break_result = result
        return [BumpBreakEffect(score.break_points)]


@dataclass
class BumpBreakEffect:
    increment: int

    def apply(self, frame: Frame) -> None:
        frame.bump_current_break(self.increment)


@dataclass
class UpdateHighestBreakEffect:
    def apply(self, frame: Frame) -> None:
        if frame.highest_break < frame.current_break:
            frame.update_highest_break(frame.current_break)


@dataclass
class ResetBreakEffect:
    def apply(self, frame: Frame) -> None:
        frame.reset_current_break()


@dataclass
class PreserveBreakEffect:
    result: BreakResult

    def apply(self, frame: Frame) -> None:
        frame.current_break = self.result.break_points


@dataclass
class BreakResult:
    break_points: int
    break_increment: int = 0
    update_highest: bool = False
    reset_break: bool = False


break_processor = BreakProcessor()
