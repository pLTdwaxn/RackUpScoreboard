import { describe, expect, it } from "vitest";

import {
  getAvatarColors,
  getPlayerCardKey,
  getPlayerInitials,
  getReverseDirection,
} from "@/components/Scoreboard/shared/playerIdentity";

describe("player identity helpers", () => {
  it("builds player initials from display names", () => {
    expect(getPlayerInitials("Ada Lovelace")).toBe("AL");
    expect(getPlayerInitials("Grace")).toBe("GR");
    expect(getPlayerInitials("   ")).toBe("CU");
  });

  it("returns stable avatar colors and layout direction", () => {
    expect(getAvatarColors("Ada Lovelace")).toEqual(
      getAvatarColors("Ada Lovelace"),
    );
    expect(getReverseDirection("ltr")).toBe(false);
    expect(getReverseDirection("rtl")).toBe(true);
  });

  it("uses session key as the player card key", () => {
    expect(
      getPlayerCardKey({
        session_key: "p1",
        name: "Ada",
        type: "anonymous",
        match_score: 0,
        current_frame_score: 0,
        highest_break: null,
      }),
    ).toBe("p1");
  });
});
