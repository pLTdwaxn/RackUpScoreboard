from __future__ import annotations

from typing import TYPE_CHECKING, Dict

if TYPE_CHECKING:
    from scoreboard.domain.models.matchroom import MatchroomModel

from scoreboard.factories import MatchroomFactory, PlayerFactory


class MatchroomManager:
    def __init__(self):
        self.active_matchrooms: Dict[str, MatchroomModel] = {}

    def get_or_create_matchroom(
        self,
        matchroom_data: dict,
        player_data: dict,
        match_data: dict,
    ) -> MatchroomModel:
        existing = self.get_matchroom(matchroom_data["id"])
        if existing is None:
            new_matchroom = MatchroomFactory.create_matchroom(matchroom_data, match_data, player_data)
            self.register_matchroom(new_matchroom)
            return new_matchroom

        if existing.players[0].session_key != player_data["session_key"] and len(existing.players) == 1:
            new_player = PlayerFactory.create_player(player_data)
            existing.add_player(new_player)
        return existing

    def get_matchroom(self, matchroom_id: str) -> MatchroomModel | None:
        return self.active_matchrooms.get(matchroom_id)

    def register_matchroom(self, matchroom: MatchroomModel) -> None:
        self.active_matchrooms[matchroom.id] = matchroom

    def close_matchroom(self, matchroom_id: str) -> None:
        if matchroom_id in self.active_matchrooms:
            del self.active_matchrooms[matchroom_id]


matchroom_manager = MatchroomManager()
