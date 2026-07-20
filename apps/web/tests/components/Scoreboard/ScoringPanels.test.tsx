import {
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import AdvancedScoringPanel from "@/components/Scoreboard/AdvancedScoringPanel";
import {
  AdvancedBallRail,
  AdvancedBottomActions,
} from "@/components/Scoreboard/AdvancedControl";
import SimpleScoringPanel from "@/components/Scoreboard/SimpleScoringPanel";
import {
  SimpleBallRail,
  SimpleBottomActions,
} from "@/components/Scoreboard/SimpleControl";
import { DEFAULT_TABLE } from "@/lib/viewModel";

const coloursOnTable = DEFAULT_TABLE.colours_on_table;

describe("Simple scoring controls", () => {
  afterEach(cleanup);

  it("sends legal ball taps from the simple rail", () => {
    const onBallTap = vi.fn();

    render(
      <SimpleBallRail
        redsRemaining={15}
        coloursOnTable={coloursOnTable}
        objectBall="red"
        freeBall={null}
        canKeepScore
        selectedBalls={[]}
        onBallTap={onBallTap}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "red" }));

    expect(onBallTap).toHaveBeenCalledWith("red");
  });

  it("disables simple actions when scorekeeping is unavailable", () => {
    render(
      <SimpleBottomActions
        canKeepScore={false}
        canUseFoulOptions={false}
        onConcede={vi.fn()}
        onEnterAdvancedMode={vi.fn()}
        onDeclareFoul={vi.fn()}
        onEndTurn={vi.fn()}
        onUndo={vi.fn()}
      />,
    );

    expect(screen.getAllByRole("button", { hidden: true })[1]).toBeDisabled();
  });

  it("renders scorekeeping and free-ball messages", () => {
    const { rerender } = render(
      <SimpleScoringPanel
        redsRemaining={15}
        coloursOnTable={coloursOnTable}
        objectBall="red"
        freeBall={null}
        scoreKeeper="any"
        canKeepScore
        canUseFoulOptions={false}
        freeBallMode={false}
        selectedBalls={[]}
        onBallTap={vi.fn()}
        onConcede={vi.fn()}
        onEnterAdvancedMode={vi.fn()}
        onDeclareFoul={vi.fn()}
        onEndTurn={vi.fn()}
        onUndo={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Scorekeeping is open to both players"),
    ).toBeInTheDocument();

    rerender(
      <SimpleScoringPanel
        redsRemaining={15}
        coloursOnTable={coloursOnTable}
        objectBall="red"
        freeBall={null}
        scoreKeeper="any"
        canKeepScore
        canUseFoulOptions={false}
        freeBallMode
        selectedBalls={[]}
        onBallTap={vi.fn()}
        onConcede={vi.fn()}
        onEnterAdvancedMode={vi.fn()}
        onDeclareFoul={vi.fn()}
        onEndTurn={vi.fn()}
        onUndo={vi.fn()}
      />,
    );

    expect(screen.getByText("Nominate the free ball")).toBeInTheDocument();
  });
});

describe("Advanced scoring controls", () => {
  afterEach(cleanup);

  it("sends ball taps and reset through the advanced rail", () => {
    vi.useFakeTimers();
    const onBallTap = vi.fn();
    const onRedLongPress = vi.fn();

    render(
      <AdvancedBallRail
        redsRemaining={15}
        coloursOnTable={coloursOnTable}
        objectBall="red"
        freeBall={null}
        canKeepScore
        redSelections={1}
        selectedBalls={["red"]}
        foulMode={false}
        onBallTap={onBallTap}
        onRedLongPress={onRedLongPress}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "black" }));
    expect(onBallTap).toHaveBeenCalledWith("black");

    fireEvent.pointerDown(screen.getByRole("button", { name: "red" }));
    vi.advanceTimersByTime(450);
    expect(onRedLongPress).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it("toggles foul mode and submits selected balls", () => {
    const onChangeFoulMode = vi.fn();
    const onSubmit = vi.fn();

    render(
      <AdvancedBottomActions
        canKeepScore
        foulMode={false}
        comboIsFoul={false}
        hasSelectedBalls
        onExitAdvancedMode={vi.fn()}
        onChangeFoulMode={onChangeFoulMode}
        onSubmit={onSubmit}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Foul Declaring Off" }));
    fireEvent.click(screen.getAllByRole("button")[1]);

    expect(onChangeFoulMode).toHaveBeenCalledWith(true);
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it("renders summary and status chip", () => {
    render(
      <AdvancedScoringPanel
        summary="Pot 1 red"
        statusChip={{ label: "LEGAL", color: "success" }}
        redsRemaining={15}
        coloursOnTable={coloursOnTable}
        objectBall="red"
        freeBall={null}
        canKeepScore
        redSelections={1}
        foulMode={false}
        selectedBalls={["red"]}
        comboIsFoul={false}
        hasSelectedBalls
        onBallTap={vi.fn()}
        onResetRedSelections={vi.fn()}
        onExitAdvancedMode={vi.fn()}
        onChangeFoulMode={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByText("Pot 1 red")).toBeInTheDocument();
    expect(screen.getByText("LEGAL")).toBeInTheDocument();
  });
});
