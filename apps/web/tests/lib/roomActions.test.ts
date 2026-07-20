import { describe, expect, it } from "vitest";

import {
  createConcedeAction,
  createDeclareFreeBallAction,
  createNextFrameAction,
  createPassShotAction,
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
