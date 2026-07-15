from scoreboard.domain.models.matchroom import Matchroom
from scoreboard.domain.models.player import Player
from scoreboard.factories.matchroom_factory import MatchroomFactory
from scoreboard.factories.player_factory import PlayerFactory
from scoreboard.repositories.matchroom_repository import (
    MatchroomRepository,
    matchroom_repository,
)


class MatchroomService:
    def __init__(
        self,
        repository: MatchroomRepository | None = None,
        matchroom_factory: MatchroomFactory | None = None,
        player_factory: PlayerFactory | None = None,
    ):
        self.repository = repository or matchroom_repository
        self.matchroom_factory = matchroom_factory or MatchroomFactory()
        self.player_factory = player_factory or PlayerFactory()

    def create_matchroom(self, matchroom_data: dict, player_data: dict, match_data: dict) -> Matchroom:
        matchroom = self.matchroom_factory.create_matchroom(matchroom_data, match_data, player_data)
        self.repository.save(matchroom)
        return matchroom

    def connect_player_to_matchroom(
        self,
        matchroom_data: dict,
        player_data: dict,
        match_data: dict,
    ) -> Matchroom:
        existing = self.get_matchroom_by_id(matchroom_data["id"])
        if existing is None:
            return self.create_matchroom(matchroom_data, player_data, match_data)

        if existing.players[0].session_key != player_data["session_key"] and len(existing.players) == 1:
            new_player = self.player_factory.create_player(player_data)
            existing.add_player(new_player)
            self.repository.save(existing)

        return existing

    def get_matchroom_by_id(self, matchroom_id: str) -> Matchroom | None:
        """Return the matchroom associated with the given matchroom ID."""
        return self.repository.get(matchroom_id)

    def close_matchroom(self, matchroom_id: str) -> None:
        self.repository.delete(matchroom_id)

    def get_opponent(self, matchroom: Matchroom, player_key: str) -> Player | None:
        """Return the opponent Player record for the given player key."""
        if len(matchroom.players) != 2:
            return None

        for player in matchroom.players:
            if player.session_key != player_key:
                return player

        return None


matchroom_service = MatchroomService()
