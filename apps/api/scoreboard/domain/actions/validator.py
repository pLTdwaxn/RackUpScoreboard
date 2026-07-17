from __future__ import annotations

from scoreboard.domain.actions.messages import ShotMessage
from scoreboard.domain.balls import BALL_POINTS, COLOUR_BALLS

VALID_ACTIONS = {
    "shot",
    "undo",
    "pass_shot",
    "reset_shot",
    "declare_free_ball",
    "concede",
    "next_frame",
}
VALID_SHOT_FIELDS = {"potted_balls", "foul"}
VALID_FREE_BALL_FIELDS = {"nominated_colour"}


def validate_event(event: dict) -> None:
    if not isinstance(event, dict):
        raise ValueError("Message must be a JSON object.")

    if set(event.keys()) - {"action", "data", "action_id"}:
        raise ValueError("Message envelope accepts only 'action', 'data', and 'action_id'.")

    action = event.get("action")
    if action not in VALID_ACTIONS:
        raise ValueError(f"Unsupported action: {action}")

    data = event.get("data", {})
    if not isinstance(data, dict):
        raise ValueError("Action payload requires object 'data'.")

    if action == "undo":
        if data:
            raise ValueError("Undo action does not accept payload data.")
        return

    if action in {"concede", "next_frame"}:
        if data:
            raise ValueError(f"{action} action does not accept payload data.")
        return

    if action == "pass_shot":
        if data:
            raise ValueError("Pass shot action does not accept payload data.")
        return

    if action == "reset_shot":
        if data:
            raise ValueError("Reset shot action does not accept payload data.")
        return

    if action == "declare_free_ball":
        validate_declare_free_ball_data(data)
        return

    validate_shot_data(data)


def validate_declare_free_ball_data(data: dict) -> None:
    extra_fields = set(data.keys()) - VALID_FREE_BALL_FIELDS
    if extra_fields:
        raise ValueError(f"Unsupported free ball payload fields: {', '.join(sorted(extra_fields))}")

    if not VALID_FREE_BALL_FIELDS.issubset(data.keys()):
        missing = sorted(VALID_FREE_BALL_FIELDS - set(data.keys()))
        raise ValueError(f"Missing free ball payload fields: {', '.join(missing)}")

    nominated_colour = data.get("nominated_colour")
    if nominated_colour not in COLOUR_BALLS:
        raise ValueError(f"Unsupported nominated colour: {nominated_colour}")


def validate_shot_data(data: dict) -> None:
    extra_fields = set(data.keys()) - VALID_SHOT_FIELDS
    if extra_fields:
        raise ValueError(f"Unsupported shot payload fields: {', '.join(sorted(extra_fields))}")

    if not VALID_SHOT_FIELDS.issubset(data.keys()):
        missing = sorted(VALID_SHOT_FIELDS - set(data.keys()))
        raise ValueError(f"Missing shot payload fields: {', '.join(missing)}")

    if not isinstance(data.get("potted_balls"), list):
        raise ValueError("Shot payload requires list 'potted_balls'.")

    shot = ShotMessage.from_dict(data)

    for ball in shot.potted_balls:
        if ball not in BALL_POINTS:
            raise ValueError(f"Unsupported potted ball: {ball}")

    if not isinstance(shot.foul, int) or shot.foul < 0:
        raise ValueError("Shot payload requires non-negative integer 'foul'.")
