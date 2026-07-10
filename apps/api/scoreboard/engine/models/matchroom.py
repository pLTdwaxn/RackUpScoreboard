from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum

from scoreboard.engine.models.match import MatchModel
from scoreboard.engine.models.match_state_projector import MatchStateProjector
from scoreboard.engine.models.player import PlayerModel

VALID_SCORE_KEEPERS = {"self", "opp", "ref", "any"}


class MatchroomStatus(str, Enum):
    PENDING = "pending"
    ACTIVE = "active"
    CLOSED = "closed"


@dataclass
class MatchroomModel:
    id: str
    room_code: str
    players: list[PlayerModel]
    match: MatchModel | None = None
    current_frame_id: str | None = None
    score_keeper: str = "opp"
    status: MatchroomStatus = MatchroomStatus.PENDING
    pending_next_frame_confirmations: set[str] = field(default_factory=set)

    def __init__(
        self,
        id: str,
        room_code: str = "",
        players: list[PlayerModel] = [],
        match: MatchModel | None = None,
        current_frame_id: str | None = None,
        score_keeper: str = "opp",
        status: MatchroomStatus = MatchroomStatus.PENDING,
        pending_next_frame_confirmations: set[str] | None = None,
    ) -> None:
        self.id = id
        self.room_code = room_code
        self.players = players or []
        self.match = match
        self.current_frame_id = current_frame_id
        self.score_keeper = score_keeper if score_keeper in VALID_SCORE_KEEPERS else "opp"
        self.status = status
        self.pending_next_frame_confirmations = pending_next_frame_confirmations or set()
        self._state_projector = MatchStateProjector()

    def add_player(self, player: PlayerModel) -> None:
        if len(self.players) < 2:
            self.players.append(player)

    def payload(self) -> dict:
        return {
            "id": self.id,
            "room_code": self.room_code,
            "club_id": None,  # Placeholder for future implementation
            "table_id": None,  # Placeholder for future implementation
            "status": self.status.value,
            "score_keeper": self.score_keeper,
        }

    def state_payload(self) -> dict:
        payload = self._state_projector.state_payload(self)
        return payload
