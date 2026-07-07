from __future__ import annotations

from typing import TYPE_CHECKING

from scoreboard.engine.models.player import PlayerModel

if TYPE_CHECKING:
    from scoreboard.engine.models.match_session import MatchSession


class MatchStateProjector:
    """Builds read payloads from aggregate state for transport boundaries."""

    def state_payload(self, session: MatchSession) -> dict:

        matchroom_payload = session.matchroom.payload(
            len(session.frame.history),
            session.frame.status,  # was: session.frame.phase
        )
        players_payload = PlayerModel.payload(
            session.matchroom.players,
            session.frame.scores,
        )
        match_payload = session.match.payload(
            session.matchroom.match_id,
            session.frame.highest_break,
        )
        frame_payload = session.frame.payload()
        table_payload = session.frame.table_payload()

        return {
            "matchroom": matchroom_payload,
            "players": players_payload,
            "players_state": PlayerModel.state_payload(
                players_payload,
                session.frame.current_turn,
            ),
            "scores": dict(session.frame.scores),
            "current_turn": session.frame.current_turn,
            "current_break": session.frame.current_break,
            "match_id": session.matchroom.match_id,
            "match_importance": match_payload["match_importance"],
            "winning_condition": match_payload["winning_condition"],
            "match": match_payload,
            "frame": frame_payload,
            "table": table_payload,
            "points_remaining": session.frame.points_remaining,
            "snookers_required": session.frame.snookers_required,
            "score_keeper": session.matchroom.score_keeper,
            "history_depth": len(session.frame.history),
            "frame_phase": session.frame.phase.value,
            "is_finished": session.match.is_finished,
        }
