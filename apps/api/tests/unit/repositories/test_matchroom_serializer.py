from __future__ import annotations

from scoreboard.domain.models.frame import Frame
from scoreboard.domain.models.match import Match
from scoreboard.domain.models.matchroom import Matchroom
from scoreboard.domain.models.player import Player
from scoreboard.domain.projectors.match_state_projector import MatchStateProjector
from scoreboard.domain.services.matchroom_service import MatchroomService
from scoreboard.repositories.matchroom_repository import MatchroomRepository
from scoreboard.repositories.matchroom_serializer import (
    deserialize_matchroom,
    serialize_matchroom,
)
from scoreboard.services.matchroom_action_dispatcher import MatchroomActionDispatcher


def _service() -> MatchroomService:
    return MatchroomService(repository=MatchroomRepository())


def _create_room_with_two_players() -> Matchroom:
    service = _service()
    room = service.connect_player_to_matchroom(
        {"id": "", "score_keeper": "opp"},
        {"id": "", "session_key": "p1", "display_name": "Player 1"},
        {"id": "", "match_importance": "practice match", "frames_to_win": 3},
    )
    service.connect_player_to_matchroom(
        {"id": room.id, "score_keeper": "opp"},
        {"id": "", "session_key": "p2", "display_name": "Player 2"},
        {"id": "", "match_importance": "practice match", "frames_to_win": 3},
    )
    return room


def _round_trip(room: Matchroom) -> Matchroom:
    return deserialize_matchroom(serialize_matchroom(room))


def _state_payload(room: Matchroom) -> dict:
    return MatchStateProjector().state_payload(room)


def test_round_trip_fresh_matchroom_rehydrates_domain_objects() -> None:
    room = _create_room_with_two_players()

    restored = _round_trip(room)

    assert isinstance(restored, Matchroom)
    assert all(isinstance(player, Player) for player in restored.players)
    assert isinstance(restored.match, Match)
    assert restored.current_frame_id is not None
    assert isinstance(restored.match.frames[restored.current_frame_id], Frame)
    assert _state_payload(restored) == _state_payload(room)


def test_round_trip_preserves_scored_frame_history_and_reactive_scores() -> None:
    room = _create_room_with_two_players()
    dispatcher = MatchroomActionDispatcher()

    handled, error = dispatcher.dispatch(
        room,
        "p2",
        {"action": "shot", "data": {"potted_balls": ["red"], "foul": 0}},
    )
    assert handled is True
    assert error is None

    restored = _round_trip(room)
    assert restored.match is not None
    assert restored.current_frame_id is not None
    frame = restored.match.frames[restored.current_frame_id]

    assert frame.scores["p1"] == 1
    assert frame.current_break == 1
    assert frame.object_ball == "colour"
    assert frame.reds_remaining == 14
    assert frame.history == room.match.frames[room.current_frame_id].history
    assert _state_payload(restored) == _state_payload(room)

    frame.scores["p1"] += 6
    assert frame.points_gap() == 7


def test_round_trip_preserves_pending_next_frame_confirmations() -> None:
    room = _create_room_with_two_players()
    room.pending_next_frame_confirmations.update({"p2", "p1"})

    restored = _round_trip(room)

    assert restored.pending_next_frame_confirmations == {"p1", "p2"}
    assert serialize_matchroom(restored)["pending_next_frame_confirmations"] == ["p1", "p2"]
