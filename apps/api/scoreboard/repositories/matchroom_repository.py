from scoreboard.domain.models.matchroom import Matchroom


class MatchroomRepository:
    def __init__(self):
        self._matchrooms: dict[str, Matchroom] = {}

    def get(self, matchroom_id: str) -> Matchroom | None:
        return self._matchrooms.get(matchroom_id)

    def save(self, matchroom: Matchroom) -> None:
        self._matchrooms[matchroom.id] = matchroom

    def delete(self, matchroom_id: str) -> None:
        if matchroom_id in self._matchrooms:
            del self._matchrooms[matchroom_id]


matchroom_repository = MatchroomRepository()
