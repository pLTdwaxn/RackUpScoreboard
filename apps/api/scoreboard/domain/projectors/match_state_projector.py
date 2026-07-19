from __future__ import annotations

from scoreboard.domain.projectors.action_availability_projector import ActionAvailabilityProjector
from scoreboard.domain.projectors.frame_log_projector import FrameLogProjector
from scoreboard.domain.projectors.payloads import (
    frame_payload,
    match_payload,
    matchroom_payload,
    player_payload,
)


class MatchStateProjector:
    """Builds read payloads from aggregate state for transport boundaries."""

    def __init__(
        self,
        frame_log_projector: FrameLogProjector | None = None,
        action_availability_projector: ActionAvailabilityProjector | None = None,
    ) -> None:
        self._frame_log_projector = frame_log_projector or FrameLogProjector()
        self._action_availability_projector = action_availability_projector or ActionAvailabilityProjector()

    def state_payload(self, matchroom) -> dict:
        match = matchroom.match
        current_frame = match.frames[matchroom.current_frame_id] if match and matchroom.current_frame_id else None
        players = matchroom.players

        scores = current_frame.scoring_state.scores if current_frame else {}
        match_scores = match.match_scores if match else {}

        return {
            "matchroom": matchroom_payload(matchroom),
            "players": [player_payload(player, scores, match_scores) for player in players if player],
            "match": match_payload(match) if match else None,
            "current_frame": frame_payload(current_frame) if current_frame else None,
            "frame_log": self._frame_log_projector.project(current_frame, players),
            "available_actions": self._action_availability_projector.project(current_frame),
            "score_keeper": matchroom.score_keeper,
            "match_scores": match_scores,
            "next_frame_confirmations": sorted(matchroom.pending_next_frame_confirmations),
        }
