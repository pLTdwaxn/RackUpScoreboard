from __future__ import annotations

from dataclasses import dataclass

BALL_POINTS = {
    "red": 1,
    "yellow": 2,
    "green": 3,
    "brown": 4,
    "blue": 5,
    "pink": 6,
    "black": 7,
}

COLOUR_ORDER = ("yellow", "green", "brown", "blue", "pink", "black")
RED_BALL = "red"


@dataclass(frozen=True)
class ShotMessage:
    # potted: bool
    potted_balls: tuple[str, ...]
    foul: int = 0

    @classmethod
    def from_dict(cls, payload: dict) -> "ShotMessage":
        return cls(
            # potted=bool(payload.get("potted", False)),
            potted_balls=tuple(payload.get("potted_balls", ())),
            foul=int(payload.get("foul", 0)),
        )
