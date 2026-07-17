from __future__ import annotations

from copy import deepcopy
from typing import Any

from scoreboard.domain.frame_calculation.rule_state import calculate_frame_rule_state
from scoreboard.domain.models.frame import Frame
from scoreboard.domain.models.frame_state import FramePhase, FrameStatus
from scoreboard.domain.models.match import Match, MatchStatus
from scoreboard.domain.models.matchroom import Matchroom, MatchroomStatus
from scoreboard.domain.models.player import Player


def serialize_player(player: Player) -> dict[str, Any]:
    return {
        "id": player.id,
        "session_key": player.session_key,
        "name": player.name,
        "identity_type": player.identity_type,
        "role": player.role,
    }


def deserialize_player(data: dict[str, Any]) -> Player:
    return Player(
        id=data["id"],
        session_key=data["session_key"],
        name=data["name"],
        identity_type=data.get("identity_type", "anonymous"),
        role=data.get("role", "player"),
    )


def serialize_frame(frame: Frame) -> dict[str, Any]:
    scoring = frame.scoring_state
    table = frame.table_state
    turn = frame.turn_state
    lifecycle = frame.lifecycle_state
    return {
        "id": frame.id,
        "match_id": frame.match_id,
        "scores": dict(scoring.scores),
        "current_turn": turn.current_turn,
        "opening_turn": turn.opening_turn,
        "winner_key": lifecycle.winner_key,
        "current_break": scoring.current_break,
        "highest_break": scoring.highest_break,
        "status": lifecycle.status.value,
        "phase": table.phase.value,
        "reds_remaining": table.reds_remaining,
        "colours_on_table": dict(table.colours_on_table),
        "object_ball": table.object_ball,
        "free_ball_nominated_colour": table.free_ball_nominated_colour,
        "free_ball_object_ball": table.free_ball_object_ball,
        "previously_fouled": turn.previously_fouled,
        "history": deepcopy(frame.history),
    }


def deserialize_frame(data: dict[str, Any]) -> Frame:
    frame = Frame(
        id=data["id"],
        match_id=data["match_id"],
        scores=data.get("scores", {}),
        current_turn=data.get("current_turn", ""),
        opening_turn=data.get("opening_turn", ""),
    )
    frame.lifecycle_state.winner_key = data.get("winner_key")
    frame.scoring_state.current_break = data.get("current_break", 0)
    frame.scoring_state.highest_break = data.get("highest_break", 0)
    frame.lifecycle_state.status = FrameStatus(data.get("status", FrameStatus.READY.value))
    frame.table_state.phase = FramePhase(data.get("phase", FramePhase.REDS.value))
    frame.table_state.reds_remaining = data.get("reds_remaining", 15)
    frame.table_state.colours_on_table = dict(data.get("colours_on_table", frame.table_state.colours_on_table))
    frame.table_state.object_ball = data.get("object_ball", frame.table_state.object_ball)
    frame.table_state.free_ball_nominated_colour = data.get("free_ball_nominated_colour")
    frame.table_state.free_ball_object_ball = data.get("free_ball_object_ball")
    frame.turn_state.previously_fouled = data.get("previously_fouled", False)
    frame.history = deepcopy(data.get("history", []))
    frame.rule_state = calculate_frame_rule_state(frame)
    return frame


def serialize_match(match: Match) -> dict[str, Any]:
    return {
        "id": match.id,
        "matchroom_id": match.matchroom_id,
        "player_ids": list(match.player_ids),
        "frames": {frame_id: serialize_frame(frame) for frame_id, frame in match.frames.items()},
        "match_importance": match.match_importance,
        "frames_to_win": match.frames_to_win,
        "is_finished": match.is_finished,
        "status": match.status.value,
        "match_scores": dict(match.match_scores),
    }


def deserialize_match(data: dict[str, Any]) -> Match:
    match = Match(
        id=data["id"],
        matchroom_id=data["matchroom_id"],
        player_ids=list(data.get("player_ids", [])),
        frames={frame_id: deserialize_frame(frame_data) for frame_id, frame_data in data.get("frames", {}).items()},
        match_importance=data.get("match_importance", "Practice Match"),
        frames_to_win=data.get("frames_to_win", 0),
        status=MatchStatus(data.get("status", MatchStatus.PENDING.value)),
    )
    match.is_finished = data.get("is_finished", False)
    match.match_scores = dict(data.get("match_scores", match.match_scores))
    return match


def serialize_matchroom(matchroom: Matchroom) -> dict[str, Any]:
    return {
        "id": matchroom.id,
        "room_code": matchroom.room_code,
        "players": [serialize_player(player) for player in matchroom.players],
        "match": serialize_match(matchroom.match) if matchroom.match else None,
        "current_frame_id": matchroom.current_frame_id,
        "score_keeper": matchroom.score_keeper,
        "status": matchroom.status.value,
        "pending_next_frame_confirmations": sorted(matchroom.pending_next_frame_confirmations),
    }


def deserialize_matchroom(data: dict[str, Any]) -> Matchroom:
    return Matchroom(
        id=data["id"],
        room_code=data.get("room_code", ""),
        players=[deserialize_player(player_data) for player_data in data.get("players", [])],
        match=deserialize_match(data["match"]) if data.get("match") else None,
        current_frame_id=data.get("current_frame_id"),
        score_keeper=data.get("score_keeper", "opp"),
        status=MatchroomStatus(data.get("status", MatchroomStatus.PENDING.value)),
        pending_next_frame_confirmations=set(data.get("pending_next_frame_confirmations", [])),
    )
