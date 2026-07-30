from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class ShotMessage:
    potted_balls: tuple[str, ...]
    foul: int = 0

    @classmethod
    def from_dict(cls, payload: dict) -> "ShotMessage":
        return cls(
            potted_balls=tuple(payload.get("potted_balls", ())),
            foul=int(payload.get("foul", 0)),
        )


@dataclass(frozen=True)
class SummaryBreakMessage:
    points: int
    foul: int = 0

    @classmethod
    def from_dict(cls, payload: dict) -> "SummaryBreakMessage":
        return cls(
            points=int(payload.get("points", 0)),
            foul=int(payload.get("foul", 0)),
        )
