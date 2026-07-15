from scoreboard.domain.models.match import Match


class MatchRepository:
    def __init__(self):
        self._matches: dict[str, Match] = {}

    def get(self, match_id: str) -> Match | None:
        return self._matches.get(match_id)

    def save(self, match: Match) -> None:
        self._matches[match.id] = match

    def delete(self, match_id: str) -> None:
        if match_id in self._matches:
            del self._matches[match_id]


match_repository = MatchRepository()
