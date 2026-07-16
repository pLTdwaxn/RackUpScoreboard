from __future__ import annotations

from scoreboard.domain.projectors.frame_log_projector import FrameLogProjector


class MatchStateProjector:
    """Builds read payloads from aggregate state for transport boundaries."""

    def __init__(self, frame_log_projector: FrameLogProjector | None = None) -> None:
        self._frame_log_projector = frame_log_projector or FrameLogProjector()

    def state_payload(self, matchroom) -> dict:
        match = matchroom.match
        current_frame = match.frames[matchroom.current_frame_id] if match and matchroom.current_frame_id else None
        players = matchroom.players

        scores = current_frame.scores if current_frame else {}
        match_scores = match.match_scores if match else {}
        matchroom_payload = matchroom.payload()
        players_payload = [player.payload(scores, match_scores) for player in players if player]
        match_payload = match.payload() if match else None
        frame_payload = current_frame.payload() if current_frame else None

        return {
            "matchroom": matchroom_payload,
            "players": players_payload,
            "match": match_payload,
            "current_frame": frame_payload,
            "frame_log": self._frame_log_projector.project(current_frame, players),
            "match_scores": match_scores,
            "next_frame_confirmations": sorted(matchroom.pending_next_frame_confirmations),
        }
