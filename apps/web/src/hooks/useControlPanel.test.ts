import { describe, expect, it } from "vitest";

import { DEFAULT_FRAME } from "@/lib/viewModel";

import { useControlPanel } from "./useControlPanel";

describe("useControlPanel scorekeeping modes", () => {
  it("allows only the player at the table in self scorekeeping mode", () => {
    const frame = { ...DEFAULT_FRAME, current_turn: "p1" };

    expect(useControlPanel(frame, "self", "p1", []).canKeepScore).toBe(true);
    expect(useControlPanel(frame, "self", "p2", []).canKeepScore).toBe(false);
  });

  it("allows either player in free-for-all scorekeeping mode", () => {
    const frame = { ...DEFAULT_FRAME, current_turn: "p1" };

    expect(useControlPanel(frame, "any", "p1", []).canKeepScore).toBe(true);
    expect(useControlPanel(frame, "any", "p2", []).canKeepScore).toBe(true);
  });
});
