from uuid import uuid4

from scoreboard.engine.factories import MatchFactory
from scoreboard.engine.factories.player_factory import PlayerFactory
from scoreboard.engine.models.matchroom import MatchroomModel


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
