import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useGameActions } from "@/hooks/useGameActions";

describe("useGameActions", () => {
  it("wraps sender with scoreboard action helpers", () => {
    const sendAction = vi.fn();
    const { result } = renderHook(() => useGameActions(sendAction));

    result.current.sendShot(["red"], 4);
    result.current.sendEndTurn();
    result.current.sendLogBreak(35, 4);
    result.current.sendResolveBreakComposition("history-1", "suggestion_2");
    result.current.sendUndo();
    result.current.sendConcede();
    result.current.sendPassShot();
    result.current.sendDeclareFreeBall("blue");
    result.current.sendNextFrame();

    expect(sendAction).toHaveBeenNthCalledWith(1, {
      action: "shot",
      data: { potted_balls: ["red"], foul: 4 },
    });
    expect(sendAction).toHaveBeenNthCalledWith(2, {
      action: "shot",
      data: { potted_balls: [], foul: 0 },
    });
    expect(sendAction).toHaveBeenNthCalledWith(3, {
      action: "log_break",
      data: { points: 35, foul: 4 },
    });
    expect(sendAction).toHaveBeenNthCalledWith(4, {
      action: "resolve_break_composition",
      data: { entry_id: "history-1", suggestion_id: "suggestion_2" },
    });
    expect(sendAction).toHaveBeenNthCalledWith(5, {
      action: "undo",
      data: {},
    });
    expect(sendAction).toHaveBeenNthCalledWith(6, {
      action: "concede",
      data: {},
    });
    expect(sendAction).toHaveBeenNthCalledWith(7, {
      action: "pass_shot",
      data: {},
    });
    expect(sendAction).toHaveBeenNthCalledWith(8, {
      action: "declare_free_ball",
      data: { nominated_colour: "blue" },
    });
    expect(sendAction).toHaveBeenNthCalledWith(9, {
      action: "next_frame",
      data: {},
    });
  });
});
