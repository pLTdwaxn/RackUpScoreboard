from __future__ import annotations

VALID_ACTIONS = {
    "pot",
    "miss",
    "foul",
    "frame_conceded",
    "link_match_model",
}


def validate_event(event: dict) -> None:
    action = event.get("action")
    if action not in VALID_ACTIONS:
        raise ValueError(f"Unsupported action: {action}")

    if action == "pot":
        points = event.get("points")
        if not isinstance(points, int):
            raise ValueError("Pot action requires integer 'points'.")
