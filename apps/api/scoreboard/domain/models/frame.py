from __future__ import annotations

from collections import UserDict
from dataclasses import dataclass, field
from enum import Enum
from typing import TYPE_CHECKING, Callable, MutableMapping

if TYPE_CHECKING:
    from scoreboard.domain.orchestrators.effects.contracts import FrameEffect

# Don't call the SnookerCalculator directly from the Frame model!
# Currently porting to the FrameOrchestrator.
from scoreboard.domain.rules.snooker_calculator import SnookerCalculator

# from scoreboard.engine.models.states import FrameStatus
from ..rules import (
    BALL_POINTS,
    COLOUR_BALLS,
    RED_BALL,
)


class FrameStatus(str, Enum):
    READY = "ready"
    ACTIVE = "active"
    FINISHED = "finished"


class FramePhase(str, Enum):
    REDS = "reds"
    COLOURS = "colours"
    RESPOTTED_BLACK = "respotted_black"


@dataclass(init=False)
class Frame:
    id: str
    match_id: str
    scores: MutableMapping[str, int]
    _current_turn: str = ""
    _opening_turn: str = ""
    winner_key: str | None = None

    def __init__(
        self,
        id: str,
        match_id: str,
        scores: MutableMapping[str, int],
        current_turn: str = "",
        opening_turn: str = "",
    ) -> None:
        self.id = id
        self.match_id = match_id
        self._snooker_calculator = SnookerCalculator()
        self._current_turn = ""
        self._opening_turn = opening_turn or current_turn

        self.current_break = 0
        self.highest_break = 0
        self.status = FrameStatus.READY
        self.winner_key = None

        self.phase = FramePhase.REDS
        self.points_remaining = 147
        self.snookers_required = 0

        self.reds_remaining = 15
        self.colours_on_table = {ball: True for ball in COLOUR_BALLS}
        self.object_ball = RED_BALL
        self.free_ball_nominated_colour = None
        self.free_ball_object_ball = None

        self.history = []

        self.previously_fouled = False

        # Reactive scores mapping; any score mutation recalculates context.
        self.scores = ObservableScores(dict(scores), self.recalculate_score_context)

        # Use the public setter so current-turn changes are also reactive.
        self.current_turn = current_turn or self._opening_turn

    @property
    def current_turn(self) -> str:
        return self._current_turn

    @current_turn.setter
    def current_turn(self, value: str) -> None:
        self._current_turn = value
        self.recalculate_score_context()

    @property
    def opening_turn(self) -> str:
        return self._opening_turn

    current_break: int = 0
    highest_break: int = 0

    status: FrameStatus = FrameStatus.READY

    phase: FramePhase = FramePhase.REDS
    points_remaining: int = 147
    snookers_required: int = 0

    reds_remaining: int = 15
    colours_on_table: dict[str, bool] = field(default_factory=lambda: {ball: True for ball in COLOUR_BALLS})
    object_ball: str = RED_BALL
    free_ball_nominated_colour: str | None = None
    free_ball_object_ball: str | None = None

    history: list[dict] = field(default_factory=list)
    _snooker_calculator: SnookerCalculator = field(
        default_factory=SnookerCalculator,
        init=False,
        repr=False,
    )

    def recalculate_score_context(self) -> None:
        self.points_remaining = self._snooker_calculator.points_remaining(self)
        self.snookers_required = self._snooker_calculator.snookers_required(self)

    def replace_scores(self, scores: MutableMapping[str, int]) -> None:
        self.scores = ObservableScores(dict(scores), self.recalculate_score_context)
        self.recalculate_score_context()

    def points_gap(self) -> int:
        scores = list(self.scores.values())
        return max(scores, default=0) - min(scores, default=0)

    def award_penalty(self, penalty_points: int) -> None:
        # Not the current player, but the opponent gets the penalty points.
        opponent_key = self.scores.keys() - {self.current_turn}
        if opponent_key:
            opponent_key = next(iter(opponent_key))
            self.scores[opponent_key] += penalty_points
            self.recalculate_score_context()

    def enter_colours_phase(self) -> None:
        self.phase = FramePhase.COLOURS
        self.recalculate_score_context()

    def finish(self) -> None:
        self.status = FrameStatus.FINISHED

    def determine_winner_key(self) -> str | None:
        if not self.scores:
            return None

        highest_score = max(self.scores.values())
        leaders = [player_key for player_key, score in self.scores.items() if score == highest_score]
        if len(leaders) != 1:
            return None
        return leaders[0]

    def set_previously_fouled(self, fouled: bool) -> None:
        self.previously_fouled = fouled

    def finish_with_resolved_winner(self) -> None:
        self.status = FrameStatus.FINISHED
        self.winner_key = self.determine_winner_key()

    def respot_black(self) -> None:
        self.phase = FramePhase.RESPOTTED_BLACK
        self.object_ball = "black"
        self.colours_on_table["black"] = True
        self.recalculate_score_context()

    def update_highest_break(self, new_highest: int) -> None:
        self.highest_break = new_highest

    def bump_current_break(self, increment: int) -> None:
        self.current_break += increment

    def set_object_ball(self, ball: str) -> None:
        self.object_ball = ball
        self.recalculate_score_context()

    def declare_free_ball(self, nominated_colour: str) -> None:
        self.free_ball_nominated_colour = nominated_colour
        self.free_ball_object_ball = nominated_colour if self.object_ball == "colour" else self.object_ball
        self.previously_fouled = False
        self.recalculate_score_context()

    def clear_free_ball(self) -> None:
        self.free_ball_nominated_colour = None
        self.free_ball_object_ball = None
        self.recalculate_score_context()

    def remove_reds(self, reds: int) -> None:
        self.reds_remaining = max(0, self.reds_remaining - reds)
        # TODO: Flag the frame history for diagnostic purposes if self.reds_remaining < 0.
        self.recalculate_score_context()

    def score_reds(self, reds: int) -> None:
        # Current player scores 1 point for each red potted.
        self.scores[self.current_turn] += reds * BALL_POINTS[RED_BALL]
        self.recalculate_score_context()

    def remove_colours(self, colours: tuple[str, ...]) -> None:
        for colour in colours:
            if colour in self.colours_on_table:
                self.colours_on_table[colour] = False
        self.recalculate_score_context()

    def score_colour(self, color: str) -> None:
        if color in BALL_POINTS:
            self.scores[self.current_turn] += BALL_POINTS[color]
            self.recalculate_score_context()

    def respot_colours(self, colours: tuple[str, ...]) -> None:
        for colour in colours:
            if colour in self.colours_on_table:
                self.colours_on_table[colour] = True
        self.recalculate_score_context()

    def switch_turn(self) -> None:
        player_keys = list(self.scores.keys())
        if len(player_keys) < 2:
            return
        self.current_turn = player_keys[1] if self.current_turn == player_keys[0] else player_keys[0]

    def reset_current_break(self) -> None:
        self.current_break = 0

    def first_remaining_colour(self) -> str:
        for colour in COLOUR_BALLS:
            if self.colours_on_table.get(colour, False):
                return colour
        # No colours remaining, return black and decide if respotting is needed
        return "black"

    def apply(self, effects: list[FrameEffect]) -> None:
        for effect in effects:
            effect.apply(self)

    def history_depth(self) -> int:
        return len(self.history)


class ObservableScores(UserDict):
    def __init__(self, initial: dict[str, int], on_change: Callable[[], None]) -> None:
        # UserDict.__init__ calls update(), which routes through __setitem__.
        # Defer the real callback until bootstrap assignment is complete.
        self._on_change = lambda: None
        super().__init__(initial)
        self._on_change = on_change

    def __setitem__(self, key: str, value: int) -> None:
        super().__setitem__(key, value)
        self._on_change()

    def update(self, *args, **kwargs) -> None:
        super().update(*args, **kwargs)
        self._on_change()

    def pop(self, key, default=None):
        value = super().pop(key, default)
        self._on_change()
        return value
