from scoreboard.domain.models.frame import Frame
from scoreboard.repositories.frame_repository import FrameRepository


def test_frame_repository_saves_gets_and_deletes_frames() -> None:
    repository = FrameRepository()
    frame = Frame(id="frame-1", match_id="match-1", scores={})

    assert repository.get(frame.id) is None

    repository.save(frame)
    assert repository.get(frame.id) is frame

    repository.delete(frame.id)
    assert repository.get(frame.id) is None


def test_frame_repository_ignores_delete_for_missing_frame() -> None:
    repository = FrameRepository()

    repository.delete("missing")

    assert repository.get("missing") is None
