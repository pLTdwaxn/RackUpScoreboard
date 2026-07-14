from scoreboard.domain.models.player import Player


class PlayerFactory:
    @staticmethod
    def create_player(player_data):

        player = Player(
            session_key=player_data.get("session_key", ""),
            id=player_data.get("id", ""),
            name=player_data.get("display_name", ""),
        )

        return player
