from __future__ import annotations

from scoreboard.domain.models.frame import Frame
from scoreboard.services.frame_action_policy import FrameActionPolicy


class ActionAvailabilityProjector:
    """Projects backend action rules into UI-friendly availability flags."""

    def __init__(self, frame_action_policy: FrameActionPolicy | None = None) -> None:
        self._frame_action_policy = frame_action_policy or FrameActionPolicy()

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

        can_reset, reason = self._frame_action_policy.can_reset_shot(frame)
        return {
            "available": can_reset,
            "reason": reason,
        }
