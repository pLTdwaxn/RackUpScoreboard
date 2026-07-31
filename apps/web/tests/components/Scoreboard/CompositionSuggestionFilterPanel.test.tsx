import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import CompositionSuggestionFilterPanel from "@/components/Scoreboard/ControlPanel/CompositionSuggestionFilterPanel";

const suggestions = [
  {
    id: "suggestion_1",
    label: "5 reds, 1 yellow, 4 blacks",
    balls: [
      "red",
      "black",
      "red",
      "black",
      "red",
      "black",
      "red",
      "black",
      "red",
      "yellow",
    ],
  },
];

describe("CompositionSuggestionFilterPanel", () => {
  afterEach(cleanup);

  it("describes the unfiltered state", () => {
    render(
      <CompositionSuggestionFilterPanel
        counts={{}}
        suggestions={suggestions}
        onBallTap={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(
      screen.getByText("Tap balls to narrow the break composition"),
    ).toBeInTheDocument();
  });

  it("renders a control-panel-sized filter rail and exposes cancel", () => {
    const onBallTap = vi.fn();
    const onCancel = vi.fn();

    render(
      <CompositionSuggestionFilterPanel
        counts={{ red: 1, black: 1 }}
        suggestions={suggestions}
        onBallTap={onBallTap}
        onCancel={onCancel}
      />,
    );

    expect(
      screen.getByText("Showing breaks with at least 1 red and 1 black"),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "black suggestion filter 1" }));
    fireEvent.click(
      screen.getByRole("button", { name: "Cancel composition resolution" }),
    );

    expect(screen.getByRole("button", { name: "red suggestion filter 1" })).toBeInTheDocument();
    expect(onBallTap).toHaveBeenCalledWith("black");
    expect(onCancel).toHaveBeenCalled();
  });
});
