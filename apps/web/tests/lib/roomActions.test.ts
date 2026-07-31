import { describe, expect, it } from "vitest";

import {
  createConcedeAction,
  createDeclareFreeBallAction,
  createLogBreakAction,
  createNextFrameAction,
  createPassShotAction,
  createResolveBreakCompositionAction,
  createShotAction,
  createUndoAction,
} from "@/lib/roomActions";

describe("room action creators", () => {
  it("creates shot actions with potted balls and foul points", () => {
    expect(createShotAction(["red", "black"], 7)).toEqual({
      action: "shot",
      data: {
        potted_balls: ["red", "black"],
        foul: 7,
      },
    });
  });

  it("creates summary break actions with points and foul points", () => {
    expect(createLogBreakAction(35, 4)).toEqual({
      action: "log_break",
      data: {
        points: 35,
        foul: 4,
      },
    });
  });

  it("creates summary break composition resolve actions", () => {
    expect(
      createResolveBreakCompositionAction("history-1", "suggestion_2"),
    ).toEqual({
      action: "resolve_break_composition",
      data: {
        entry_id: "history-1",
        suggestion_id: "suggestion_2",
      },
    });
  });

  it("creates non-shot action payloads", () => {
    expect(createPassShotAction()).toEqual({ action: "pass_shot", data: {} });
    expect(createDeclareFreeBallAction("blue")).toEqual({
      action: "declare_free_ball",
      data: { nominated_colour: "blue" },
    });
    expect(createUndoAction()).toEqual({ action: "undo", data: {} });
    expect(createConcedeAction()).toEqual({ action: "concede", data: {} });
    expect(createNextFrameAction()).toEqual({
      action: "next_frame",
      data: {},
    });
  });
});
