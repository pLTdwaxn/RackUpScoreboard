import { describe, expect, it } from "vitest";

import { BALL_BY_NAME, BALL_NAMES, BALLS } from "@/lib/controlPanelShared";

describe("control panel ball metadata", () => {
  it("keeps balls ordered by snooker value", () => {
    expect(BALL_NAMES).toEqual([
      "red",
      "yellow",
      "green",
      "brown",
      "blue",
      "pink",
      "black",
    ]);
    expect(BALLS.map((ball) => ball.points)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("indexes balls by name with penalty points", () => {
    expect(BALL_BY_NAME.red).toEqual({
      name: "red",
      points: 1,
      penaltyPoints: 4,
    });
    expect(BALL_BY_NAME.black.penaltyPoints).toBe(7);
  });
});
