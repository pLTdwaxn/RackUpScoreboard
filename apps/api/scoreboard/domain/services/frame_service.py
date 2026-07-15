from scoreboard.domain.models.frame import Frame
from scoreboard.factories.frame_factory import FrameFactory
from scoreboard.repositories.frame_repository import FrameRepository


class FrameService:
    def __init__(self, repository: FrameRepository, factory: FrameFactory):
        self.repository = repository
        self.factory = factory

    def create_frame(self, frame_data: dict, match_id: str, player_ids: list[str]) -> Frame:
        frame = self.factory.create_frame(frame_data, match_id, player_ids)
        self.repository.save(frame)
        return frame

    def get_frame_by_id(self, frame_id: str) -> Frame | None:
        return self.repository.get(frame_id)
