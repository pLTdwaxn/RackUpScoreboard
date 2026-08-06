from __future__ import annotations

from typing import Mapping

from scoreboard.domain.frame_calculation.helpers import score_gap
from scoreboard.domain.models.frame import Frame
from scoreboard.domain.models.match import Match
from scoreboard.domain.models.matchroom import Matchroom
from scoreboard.domain.models.player import Player


def matchroom_payload(matchroom: Matchroom) -> dict:
    return {
        "id": matchroom.id,
        "room_code": matchroom.room_code,
        "club_id": None,
        "table_id": None,
        "status": matchroom.status.value,
        "score_keeper": matchroom.score_keeper,
    }


def player_payload(
    player: Player,
    scores: Mapping[str, int],
    match_scores: Mapping[str, int],
) -> dict:
    return {
        **player.__dict__,
        "match_score": match_scores.get(player.session_key, 0),
        "current_frame_score": scores.get(player.session_key, 0),
        "highest_break": None,
    }


def match_payload(match: Match) -> dict:
    return {
        "id": None,
        "name": None,
        "match_importance": "Practice Match",
        "frames_to_win": match.frames_to_win,
        "status": match.status.value,
        "match_scores": match.match_scores,
    }


def frame_payload(frame: Frame) -> dict:
    scoring = frame.scoring_state
    table = frame.table_state
    turn = frame.turn_state
    lifecycle = frame.lifecycle_state
    rules = frame.rule_state
    unresolved_summary_entry_ids = unresolved_table_state_history_ids(frame)
    has_unresolved_table_state = bool(unresolved_summary_entry_ids)
    return {
        "status": lifecycle.status.value,
        "scores": dict(scoring.scores),
        "phase": table.phase.value,
        "reds_remaining": None if has_unresolved_table_state else table.reds_remaining,
        "colours_on_table": dict(table.colours_on_table),
        "object_ball": table.object_ball,
        "free_ball": (
            {
                "nominated_colour": table.free_ball_nominated_colour,
                "object_ball": table.free_ball_object_ball,
            }
            if table.free_ball_nominated_colour and table.free_ball_object_ball
            else None
        ),
        "current_turn": turn.current_turn,
        "current_break": scoring.current_break,
        "previously_fouled": turn.previously_fouled,
        "points_remaining": None if has_unresolved_table_state else rules.points_remaining,
        "points_gap": score_gap(scoring.scores),
        "snookers_required": None if has_unresolved_table_state else rules.snookers_required,
        "detail_level": "partially_detailed" if has_summary_entries(frame) else "shot_by_shot",
        "has_summary_entries": has_summary_entries(frame),
        "has_unresolved_compositions": has_unresolved_table_state,
        "has_unresolved_table_state": has_unresolved_table_state,
        "unresolved_summary_entry_ids": unresolved_summary_entry_ids,
        "highest_break": scoring.highest_break if scoring.highest_break > 0 else None,
        "opening_turn": turn.opening_turn,
        "winner_key": lifecycle.winner_key,
    }


def has_summary_entries(frame: Frame) -> bool:
    return any(_history_action(history_entry) == "log_break" for history_entry in frame.history)


def unresolved_table_state_history_ids(frame: Frame) -> list[str]:
    return [
        history_entry["id"]
        for history_entry in frame.history
        if _history_action(history_entry) == "log_break" and _requires_composition_resolution(history_entry)
    ]


def _history_action(history_entry: dict) -> str:
    outcome = history_entry.get("outcome")
    if isinstance(outcome, dict) and isinstance(outcome.get("action"), str):
        return outcome["action"]

    event = history_entry.get("event", {})
    if isinstance(event, dict):
        return event.get("action", "shot")

    return "shot"


def _composition_status(history_entry: dict) -> str:
    outcome = history_entry.get("outcome")
    if isinstance(outcome, dict) and isinstance(outcome.get("composition_status"), str):
        return outcome["composition_status"]

    return "missing"


def _requires_composition_resolution(history_entry: dict) -> bool:
    return _break_points(history_entry) > 0 and _composition_status(history_entry) != "resolved"


def _break_points(history_entry: dict) -> int:
    outcome = history_entry.get("outcome")
    if isinstance(outcome, dict):
        return int(outcome.get("break_points", 0))

    event = history_entry.get("event", {})
    if isinstance(event, dict):
        data = event.get("data", {})
        if isinstance(data, dict):
            return int(data.get("points", 0))

    return 0
