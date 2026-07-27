import { describe, expect, it } from "vitest";

import {
  getAvatarColors,
  getCurrentBreakGlowStyle,
  getPlayerNameThemeStyle,
  getPlayerAvatarTheme,
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

  it("returns themed avatar colors and layout direction", () => {
    expect(getAvatarColors("red")).toEqual({
      avatarColor: "#f43f5e",
      avatarColor2: "#facc15",
      avatarBackground:
        "conic-gradient(from 225deg at 50% 50%, #f43f5e 0deg, #fb7185 58deg, #fbbf24 132deg, #facc15 218deg, #38bdf8 296deg, #f43f5e 360deg)",
    });
    expect(getAvatarColors("blue")).toEqual({
      avatarColor: "#3b82f6",
      avatarColor2: "#22c55e",
      avatarBackground:
        "conic-gradient(from 225deg at 50% 50%, #3b82f6 0deg, #38bdf8 58deg, #fbbf24 132deg, #22c55e 218deg, #f472b6 296deg, #3b82f6 360deg)",
    });
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

  it("returns player-themed current break glow styles", () => {
    expect(getCurrentBreakGlowStyle("red")).toMatchObject({
      "--current-break-bg": "rgba(244, 63, 94, 0.12)",
      "--current-break-glow-soft": "rgba(244, 63, 94, 0.32)",
      "--current-break-glow-strong": "rgba(244, 63, 94, 0.64)",
    });
    expect(getCurrentBreakGlowStyle("blue")).toMatchObject({
      "--current-break-bg": "rgba(59, 130, 246, 0.12)",
      "--current-break-glow-soft": "rgba(59, 130, 246, 0.32)",
      "--current-break-glow-strong": "rgba(59, 130, 246, 0.64)",
    });
  });

  it("returns player-themed name styles", () => {
    expect(getPlayerNameThemeStyle("red")).toMatchObject({
      "--player-name-color": "#e11d48",
    });
    expect(getPlayerNameThemeStyle("blue")).toMatchObject({
      "--player-name-color": "#2563eb",
    });
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
