from scoreboard.domain.models.match import Match
from scoreboard.factories.match_factory import MatchFactory
from scoreboard.repositories.match_repository import match_repository


class MatchService:
    def __init__(self):
        self.repository = match_repository
        self.factory = MatchFactory()

    def create_match(self, match_data: dict, player_ids: list[str]) -> Match:
        match = self.factory.create_match(match_data, player_ids)
        self.repository.save(match)
        return match

    def get_match_by_id(self, match_id: str) -> Match | None:
        return self.repository.get(match_id)
