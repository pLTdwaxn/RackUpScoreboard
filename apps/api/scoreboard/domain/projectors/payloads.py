from __future__ import annotations

from typing import Mapping

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
    return {
        "status": frame.status.value,
        "scores": dict(frame.scores),
        "phase": frame.phase.value,
        "reds_remaining": frame.reds_remaining,
        "colours_on_table": dict(frame.colours_on_table),
        "object_ball": frame.object_ball,
        "free_ball": (
            {
                "nominated_colour": frame.free_ball_nominated_colour,
                "object_ball": frame.free_ball_object_ball,
            }
            if frame.free_ball_nominated_colour and frame.free_ball_object_ball
            else None
        ),
        "current_turn": frame.current_turn,
        "current_break": frame.current_break,
        "previously_fouled": frame.previously_fouled,
        "points_remaining": frame.points_remaining,
        "points_gap": frame.points_gap(),
        "snookers_required": frame.snookers_required,
        "highest_break": frame.highest_break if frame.highest_break > 0 else None,
        "opening_turn": frame.opening_turn,
        "winner_key": frame.winner_key,
    }
