from __future__ import annotations

from scoreboard.domain.models.frame import Frame
from scoreboard.domain.models.frame_state import FrameStatus
from scoreboard.domain.models.player import Player
from scoreboard.domain.projectors.frame_log_projector import FrameLogProjector


class FrameSummaryProjector:
    """Builds factual per-player stats for a finished frame."""

    def __init__(self, frame_log_projector: FrameLogProjector | None = None) -> None:
        self._frame_log_projector = frame_log_projector or FrameLogProjector()

    def project(self, frame: Frame | None, players: list[Player]) -> list[dict]:
        if frame is None or frame.lifecycle_state.status != FrameStatus.FINISHED:
            return []

        summaries = {
            player.session_key: {
                "player_key": player.session_key,
                "score": frame.scoring_state.scores.get(player.session_key, 0),
                "result": self._result_for_player(frame, player.session_key),
                "visits": 0,
                "highest_break": 0,
                "foul_points_conceded": 0,
            }
            for player in players
        }

        for visit in self._frame_log_projector.project(frame, players):
            player_key = visit["player_key"]
            if player_key not in summaries:
                continue

            summaries[player_key]["visits"] += 1
            summaries[player_key]["highest_break"] = max(
                summaries[player_key]["highest_break"],
                visit["break_points"],
            )

            foul_points = visit["foul_points"]
            if foul_points:
                summaries[player_key]["foul_points_conceded"] += foul_points

        return [summaries[player.session_key] for player in players if player.session_key in summaries]

    def _result_for_player(self, frame: Frame, player_key: str) -> str:
        winner_key = frame.lifecycle_state.winner_key
        if winner_key is None:
            return "drawn"
        if winner_key == player_key:
            return "won"
        return "lost"
