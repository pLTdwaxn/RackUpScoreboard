from scoreboard.domain.models.match import Match
from scoreboard.repositories.match_repository import MatchRepository


def test_match_repository_saves_gets_and_deletes_matches() -> None:
    repository = MatchRepository()
    match = Match(id="match-1", matchroom_id="room-1")

    assert repository.get(match.id) is None

    repository.save(match)
    assert repository.get(match.id) is match

    repository.delete(match.id)
    assert repository.get(match.id) is None


def test_match_repository_ignores_delete_for_missing_match() -> None:
    repository = MatchRepository()

    repository.delete("missing")

    assert repository.get("missing") is None
