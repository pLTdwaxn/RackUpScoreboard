import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import FinishedFramePanel from "@/components/Scoreboard/ControlPanel/FinishedFramePanel";

describe("FinishedFramePanel", () => {
  it("shows a win message and starts the next frame", () => {
    const onNextFrame = vi.fn();

    render(
      <FinishedFramePanel
        winnerKey="p1"
        currentPlayerKey="p1"
        hasConfirmedNextFrame={false}
        onNextFrame={onNextFrame}
      />,
    );

    expect(
      screen.getByText("Congratulations! You won the frame."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Start Next Frame" }));
    expect(onNextFrame).toHaveBeenCalledOnce();
  });

  it("shows waiting state after confirming next frame", () => {
    render(
      <FinishedFramePanel
        winnerKey="p2"
        currentPlayerKey="p1"
        hasConfirmedNextFrame
        onNextFrame={vi.fn()}
      />,
    );

    expect(screen.getByText("You lost the frame.")).toBeInTheDocument();
    expect(screen.getByText("Waiting for your opponent")).toBeInTheDocument();
  });
});
