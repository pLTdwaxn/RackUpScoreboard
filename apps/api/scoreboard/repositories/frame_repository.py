from scoreboard.domain.models.frame import Frame


class FrameRepository:
    def __init__(self):
        self._frames: dict[str, Frame] = {}

    def get(self, frame_id: str) -> Frame | None:
        return self._frames.get(frame_id)

    def save(self, frame: Frame) -> None:
        self._frames[frame.id] = frame

    def delete(self, frame_id: str) -> None:
        if frame_id in self._frames:
            del self._frames[frame_id]


frame_repository = FrameRepository()
