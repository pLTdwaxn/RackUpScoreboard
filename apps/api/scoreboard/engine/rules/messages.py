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
