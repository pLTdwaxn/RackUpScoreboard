from __future__ import annotations

from dataclasses import dataclass

from scoreboard.domain.models.frame import Frame
from scoreboard.services.frame_reset_shot_service import FrameResetShotService


@dataclass
class _FrameResetShotState:
    frame: Frame


class ActionAvailabilityProjector:
    """Projects backend action rules into UI-friendly availability flags."""

    def __init__(self, frame_reset_shot_service: FrameResetShotService | None = None) -> None:
        self._frame_reset_shot_service = frame_reset_shot_service or FrameResetShotService()

    def project(self, frame: Frame | None) -> dict:
        return {
            "reset_shot": self._reset_shot_availability(frame),
        }

    def _reset_shot_availability(self, frame: Frame | None) -> dict:
        if frame is None:
            return {
                "available": False,
                "reason": "No current frame.",
            }

        can_reset, reason = self._frame_reset_shot_service.can_reset_shot(_FrameResetShotState(frame))
        return {
            "available": can_reset,
            "reason": reason,
        }
