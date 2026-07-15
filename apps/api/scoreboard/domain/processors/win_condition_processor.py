from dataclasses import dataclass

from scoreboard.domain.models.frame import Frame, FrameStatus


class WinConditionProcessor:
    def process(self, context):
        finishes_frame = (
            context.foul_result.finishes_frame
            or context.phase_result.finishes_frame
            or context.next_ball_result.finishes_frame
        )
        if not finishes_frame:
            result = WinConditionResult(finishes_frame=False)
            context.win_condition_result = result
            return []

        result = WinConditionResult(
            finishes_frame=True,
            winner_key=self._winner_after_effects(context),
        )
        context.win_condition_result = result
        return [FinishFrameEffect(result)]

    def _winner_after_effects(self, context) -> str | None:
        scores = dict(context.frame.scores)
        score = context.score_result

        if score.is_scoring_shot:
            scores[score.player] = scores.get(score.player, 0) + score.points
        elif context.foul_result.is_foul:
            scores[score.player] = scores.get(score.player, 0) + score.points

        if not scores:
            return None

        highest_score = max(scores.values())
        leaders = [player_key for player_key, player_score in scores.items() if player_score == highest_score]
        if len(leaders) != 1:
            return None
        return leaders[0]


@dataclass
class FinishFrameEffect:
    result: "WinConditionResult"

    def apply(self, frame: Frame) -> None:
        frame.status = FrameStatus.FINISHED
        frame.winner_key = self.result.winner_key


@dataclass
class WinConditionResult:
    finishes_frame: bool
    winner_key: str | None = None


win_condition_processor = WinConditionProcessor()
