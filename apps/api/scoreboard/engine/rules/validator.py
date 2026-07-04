from __future__ import annotations

from scoreboard.engine.rules.messages import BALL_POINTS, ShotMessage

VALID_FACTUAL_FIELDS = {"potted_balls", "foul"}


def validate_event(event: dict) -> None:
    if event.get("undo") is True:
        if set(event.keys()) - {"undo"}:
            raise ValueError("Undo message cannot include legacy action fields.")
        return

    if "action" in event:
        raise ValueError(f"Unsupported action: {event.get('action')}")

    if not VALID_FACTUAL_FIELDS.intersection(event.keys()):
        raise ValueError("Unsupported message shape.")

    validate_factual_event(event)


def validate_factual_event(event: dict) -> None:
    if not VALID_FACTUAL_FIELDS.issubset(event.keys()):
        missing = sorted(VALID_FACTUAL_FIELDS - set(event.keys()))
        raise ValueError(f"Missing factual event fields: {', '.join(missing)}")

    shot = ShotMessage.from_dict(event)

    if not isinstance(event.get("potted_balls"), list):
        raise ValueError("Factual event requires list 'potted_balls'.")

    for ball in shot.potted_balls:
        if ball not in BALL_POINTS:
            raise ValueError(f"Unsupported potted ball: {ball}")

    if not isinstance(shot.foul, int) or shot.foul < 0:
        raise ValueError("Factual event requires non-negative integer 'foul'.")
