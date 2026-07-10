from uuid import uuid4

from scoreboard.engine.factories.frame_factory import FrameFactory
from scoreboard.engine.models.match import MatchModel


class MatchFactory:
    @staticmethod
    def create_match(match_data: dict, player_records: list) -> MatchModel:

        match = MatchModel(
            id=uuid4().hex[:8],  # To be replaced with the external match ID from RackUp
            matchroom_id=match_data.get("matchroom_id", ""),
            player_ids=[player_record.session_key for player_record in player_records],
            match_importance=match_data.get("match_importance", "practice match"),
            frames_to_win=match_data.get("frames_to_win", 0),
        )

        frame = FrameFactory.create_frame(
            {},
            match.id,
            [player_record.session_key for player_record in player_records],
        )  # Create the first frame for the match

        match.frames.update({frame.id: frame})  # Add the frame to the match's frames dictionary

        return match
