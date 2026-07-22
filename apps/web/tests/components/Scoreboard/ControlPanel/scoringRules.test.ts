import { describe, expect, it } from "vitest";

import {
  inferFoulPoints,
  isLegalShot,
  summarizeBalls,
} from "@/components/Scoreboard/ControlPanel/scoringRules";

describe("scoringRules", () => {
  it("allows legal red pots up to the remaining red count", () => {
    expect(isLegalShot(["red", "red"], "red", 2, null)).toBe(true);
    expect(isLegalShot(["red", "red"], "red", 1, null)).toBe(false);
  });

  it("requires the nominated colour when a free ball is active", () => {
    expect(
      isLegalShot(["blue"], "red", 1, {
        nominated_colour: "blue",
        object_ball: "red",
      }),
    ).toBe(true);
    expect(
      isLegalShot(["pink"], "red", 1, {
        nominated_colour: "blue",
        object_ball: "red",
      }),
    ).toBe(false);
  });

  it("infers foul points from the highest selected penalty value", () => {
    expect(inferFoulPoints(["red", "black"])).toBe(7);
    expect(inferFoulPoints(["red", "yellow"])).toBe(4);
  });

  it("summarizes selected balls by count", () => {
    expect(summarizeBalls(["red", "red", "blue"])).toBe("2 red, 1 blue");
  });
});
