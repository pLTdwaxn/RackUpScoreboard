from typing import TYPE_CHECKING, Protocol

if TYPE_CHECKING:
    from scoreboard.domain.models.frame import Frame


class FrameEffect(Protocol):
    def apply(self, frame: Frame): ...
