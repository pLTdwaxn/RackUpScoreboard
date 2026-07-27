import {
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import AdvancedScoringPanel from "@/components/Scoreboard/ControlPanel/Advanced/AdvancedScoringPanel";
import AdvancedBallRail from "@/components/Scoreboard/ControlPanel/Advanced/AdvancedBallRail";
import AdvancedBottomActions from "@/components/Scoreboard/ControlPanel/Advanced/AdvancedBottomActions";
import SimpleScoringPanel from "@/components/Scoreboard/ControlPanel/Simple/SimpleScoringPanel";
import SimpleBallRail from "@/components/Scoreboard/ControlPanel/Simple/SimpleBallRail";
import SimpleBottomActions from "@/components/Scoreboard/ControlPanel/Simple/SimpleBottomActions";
import { DEFAULT_FRAME } from "@/lib/viewModel";

const coloursOnTable = DEFAULT_FRAME.colours_on_table;

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
      />,
    );

    expect(screen.getByText("Nominate the free ball")).toBeInTheDocument();
  });

  it("themes a concrete scorekeeping target player", () => {
    render(
      <SimpleScoringPanel
        redsRemaining={15}
        coloursOnTable={coloursOnTable}
        objectBall="red"
        freeBall={null}
        scoreKeeper="opp"
        scorekeepingTarget={{
          player: {
            session_key: "p2",
            name: "Grace Hopper",
            type: "anonymous",
            match_score: 0,
            current_frame_score: 0,
            highest_break: null,
          },
          theme: "blue",
        }}
        canKeepScore
        canUseFoulOptions={false}
        freeBallMode={false}
        selectedBalls={[]}
        onBallTap={vi.fn()}
        onConcede={vi.fn()}
        onEnterAdvancedMode={vi.fn()}
        onDeclareFoul={vi.fn()}
        onEndTurn={vi.fn()}
      />,
    );

    expect(screen.getByText("Scorekeeping for")).toBeInTheDocument();
    expect(screen.getByText("Grace Hopper")).toHaveStyle({
      "--player-name-color": "#2563eb",
    });
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
        redSelections={15}
        selectedBalls={["red"]}
        isRedFoulWithoutPot={false}
        foulMode={false}
        onBallTap={onBallTap}
        onRedLongPress={onRedLongPress}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "black" }));
    expect(onBallTap).toHaveBeenCalledWith("black");

    const redButton = screen.getByRole("button", { name: "red" });
    expect(redButton).not.toBeDisabled();

    fireEvent.pointerDown(redButton);
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
        isRedFoulWithoutPot={false}
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
