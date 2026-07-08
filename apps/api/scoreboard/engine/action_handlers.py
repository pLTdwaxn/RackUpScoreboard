from __future__ import annotations

from scoreboard.engine.models.frame import FrameModel
from scoreboard.engine.models.states import FrameStatus


class ConcedeActionHandler:
    def handle(self, session, session_key: str) -> tuple[bool, str | None]:
        if len(session.matchroom.players) < 2:
            return False, "Cannot concede when there is no opponent."

        if session.frame.status != FrameStatus.ACTIVE and session.frame.status != FrameStatus.READY:
            return False, "Current frame is not in progress."

        winner_key = session._opponent_key(session_key)
        session.pending_next_frame_confirmations.clear()
        session.frame.winner_key = winner_key
        session.frame.status = FrameStatus.FINISHED
        session.match.match_scores[winner_key] = session.match.match_scores.get(winner_key, 0) + 1

        if session.match.frames_to_win and session.match.match_scores[winner_key] >= session.match.frames_to_win:
            session.match.is_finished = True

        return True, None


class NextFrameActionHandler:
    def handle(self, session, session_key: str) -> tuple[bool, str | None]:
        if session.frame.status != FrameStatus.FINISHED or not session.frame.winner_key:
            return False, "Current frame is not finished yet."

        if session.match.is_finished:
            return False, "Match is already finished."

        session.pending_next_frame_confirmations.add(session_key)
        if len(session.pending_next_frame_confirmations) < len(session.matchroom.players):
            return True, None

        current_opening_turn = session.frame.opening_turn or session.frame.current_turn
        player_keys = [player.session_key for player in session.matchroom.players]
        next_opening_turn = next(
            (key for key in player_keys if key != current_opening_turn),
            current_opening_turn,
        )

        session.frame = FrameModel(
            scores={player.session_key: 0 for player in session.matchroom.players},
            current_turn=next_opening_turn,
            opening_turn=next_opening_turn,
        )
        session.pending_next_frame_confirmations.clear()
        return True, None
