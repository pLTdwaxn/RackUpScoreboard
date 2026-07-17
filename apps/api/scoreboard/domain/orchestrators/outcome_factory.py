from scoreboard.domain.orchestrators.contracts import ActionOutcome, FrameCalculationContext


class ActionOutcomeFactory:
    def from_context(self, context: FrameCalculationContext) -> ActionOutcome:
        payload = context.payload
        score = context.score_result
        foul = context.foul_result
        win = context.win_condition_result

        if payload.action == "pass_shot":
            return ActionOutcome(action="pass_shot", result="passed")

        if payload.action == "declare_free_ball":
            return ActionOutcome(
                action="declare_free_ball",
                result="declared",
                nominated_colour=payload.nominated_colour,
            )

        if foul and foul.is_foul:
            return ActionOutcome(
                action=payload.action,
                result="foul",
                player_key=score.player if score else None,
                foul_points=foul.points_awarded,
                winner_key=win.winner_key if win and win.finishes_frame else None,
            )

        if win and win.finishes_frame:
            return ActionOutcome(
                action=payload.action,
                result="frame_won",
                player_key=score.player if score else None,
                potted_balls=payload.potted_balls,
                break_points=score.break_points if score else 0,
                winner_key=win.winner_key,
            )

        return ActionOutcome(
            action=payload.action,
            result="scoring" if score and score.break_points else "no_score",
            player_key=score.player if score else None,
            potted_balls=payload.potted_balls if score and score.break_points else (),
            break_points=score.break_points if score else 0,
        )


action_outcome_factory = ActionOutcomeFactory()
