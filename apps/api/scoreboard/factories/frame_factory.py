from uuid import uuid4

from scoreboard.domain.models.frame import Frame


class FrameFactory:
    @staticmethod
    def create_frame(frame_data, match_id, player_session_keys):
        frame = Frame(
            id=uuid4().hex[:8],
            match_id=match_id,
            scores={player_key: 0 for player_key in player_session_keys},
            opening_turn=frame_data.get("opening_turn", player_session_keys[0]),
            current_turn=frame_data.get("current_turn", player_session_keys[0]),
        )
        return frame
