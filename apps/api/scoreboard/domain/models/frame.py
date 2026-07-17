from __future__ import annotations

from typing import Mapping

from scoreboard.domain.models.frame_state import (
    FrameLifecycleState,
    FrameRuleState,
    FrameScoringState,
    FrameTableState,
    FrameTurnState,
)


class Frame:
    id: str
    match_id: str
    scoring_state: FrameScoringState
    turn_state: FrameTurnState
    lifecycle_state: FrameLifecycleState
    table_state: FrameTableState
    rule_state: FrameRuleState
    history: list[dict]

    def __init__(
        self,
        id: str,
        match_id: str,
        scores: Mapping[str, int],
        current_turn: str = "",
        opening_turn: str = "",
    ) -> None:
        self.id = id
        self.match_id = match_id

        self.scoring_state = FrameScoringState(scores=dict(scores))
        self.turn_state = FrameTurnState(opening_turn=opening_turn or current_turn)
        self.lifecycle_state = FrameLifecycleState()

        self.table_state = FrameTableState()
        self.rule_state = FrameRuleState()

        self.history = []

        self.turn_state.current_turn = current_turn or self.turn_state.opening_turn

    def history_depth(self) -> int:
        return len(self.history)
