from uuid import uuid4

from scoreboard.domain.models.matchroom import MatchroomModel
from scoreboard.factories import MatchFactory
from scoreboard.factories.player_factory import PlayerFactory


class MatchroomFactory:
    @staticmethod
    def create_matchroom(matchroom_data, match_data, player_data):
        matchroom = MatchroomModel(
            id=uuid4().hex[:8],
            room_code=matchroom_data.get("room_code", ""),
            score_keeper=matchroom_data.get("score_keeper", "opp"),
        )

        player = PlayerFactory.create_player(player_data)
        matchroom.players.append(player)

        match = MatchFactory.create_match(match_data, matchroom.players)
        matchroom.match = match
        matchroom.current_frame_id = next(reversed(match.frames)) if match.frames else None

        return matchroom
