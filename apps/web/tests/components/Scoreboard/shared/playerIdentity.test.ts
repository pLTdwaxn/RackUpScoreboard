import { describe, expect, it } from "vitest";

import {
  getPlayerAvatarTheme,
  getPlayerCardKey,
  getPlayerInitials,
  getPlayerThemeClassName,
  getReverseDirection,
} from "@/components/Scoreboard/shared/playerIdentity";

describe("player identity helpers", () => {
  it("builds player initials from display names", () => {
    expect(getPlayerInitials("Ada Lovelace")).toBe("AL");
    expect(getPlayerInitials("Grace")).toBe("GR");
    expect(getPlayerInitials("   ")).toBe("CU");
  });

  it("returns layout direction", () => {
    expect(getReverseDirection("ltr")).toBe(false);
    expect(getReverseDirection("rtl")).toBe(true);
  });

  it("uses matchroom player order for avatar themes", () => {
    const players = [
      {
        session_key: "p1",
        name: "Ada",
        type: "anonymous",
        match_score: 0,
        current_frame_score: 0,
        highest_break: null,
      },
      {
        session_key: "p2",
        name: "Grace",
        type: "anonymous",
        match_score: 0,
        current_frame_score: 0,
        highest_break: null,
      },
    ];

    expect(getPlayerAvatarTheme("p1", players)).toBe("red");
    expect(getPlayerAvatarTheme("p2", players)).toBe("blue");
    expect(getPlayerAvatarTheme("missing", players)).toBe("neutral");
  });

  it("returns player theme class names", () => {
    expect(getPlayerThemeClassName("red")).toBe("player-theme-red");
    expect(getPlayerThemeClassName("blue")).toBe("player-theme-blue");
    expect(getPlayerThemeClassName("neutral")).toBe("player-theme-neutral");
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
