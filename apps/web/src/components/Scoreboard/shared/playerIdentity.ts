import { Player } from "@/types";
import type { CSSProperties } from "react";

export type PlayerAvatarTheme = "red" | "blue" | "neutral";
type CurrentBreakGlowStyle = CSSProperties & {
  "--current-break-bg": string;
  "--current-break-glow-soft": string;
  "--current-break-glow-strong": string;
};
type PlayerNameThemeStyle = CSSProperties & {
  "--player-name-color": string;
};

const PLAYER_AVATAR_COLORS: Record<
  PlayerAvatarTheme,
  {
    avatarColor: string;
    avatarColor2: string;
    avatarBackground: string;
  }
> = {
  red: {
    avatarColor: "#f43f5e",
    avatarColor2: "#facc15",
    avatarBackground:
      "conic-gradient(from 225deg at 50% 50%, #f43f5e 0deg, #fb7185 58deg, #fbbf24 132deg, #facc15 218deg, #38bdf8 296deg, #f43f5e 360deg)",
  },
  blue: {
    avatarColor: "#3b82f6",
    avatarColor2: "#22c55e",
    avatarBackground:
      "conic-gradient(from 225deg at 50% 50%, #3b82f6 0deg, #38bdf8 58deg, #fbbf24 132deg, #22c55e 218deg, #f472b6 296deg, #3b82f6 360deg)",
  },
  neutral: {
    avatarColor: "#64748b",
    avatarColor2: "#94a3b8",
    avatarBackground:
      "radial-gradient(circle at 35% 32%, #64748b 0%, #64748b 42%, transparent 70%), radial-gradient(circle at 70% 70%, #cbd5e1 0%, #94a3b8 46%, #475569 100%)",
  },
};

const PLAYER_CURRENT_BREAK_GLOW: Record<PlayerAvatarTheme, CurrentBreakGlowStyle> = {
  red: {
    "--current-break-bg": "rgba(244, 63, 94, 0.12)",
    "--current-break-glow-soft": "rgba(244, 63, 94, 0.32)",
    "--current-break-glow-strong": "rgba(244, 63, 94, 0.64)",
  },
  blue: {
    "--current-break-bg": "rgba(59, 130, 246, 0.12)",
    "--current-break-glow-soft": "rgba(59, 130, 246, 0.32)",
    "--current-break-glow-strong": "rgba(59, 130, 246, 0.64)",
  },
  neutral: {
    "--current-break-bg": "rgba(100, 116, 139, 0.12)",
    "--current-break-glow-soft": "rgba(100, 116, 139, 0.3)",
    "--current-break-glow-strong": "rgba(100, 116, 139, 0.58)",
  },
};

const PLAYER_NAME_THEME: Record<PlayerAvatarTheme, PlayerNameThemeStyle> = {
  red: {
    "--player-name-color": "#e11d48",
  },
  blue: {
    "--player-name-color": "#2563eb",
  },
  neutral: {
    "--player-name-color": "#64748b",
  },
};

export function getPlayerAvatarTheme(
  playerKey: string | undefined,
  players: Player[] = [],
): PlayerAvatarTheme {
  const playerIndex = players.findIndex(
    (player) => player.session_key === playerKey,
  );

  if (playerIndex === 0) return "red";
  if (playerIndex === 1) return "blue";
  return "neutral";
}

export function getAvatarColors(theme: PlayerAvatarTheme): {
  avatarColor: string;
  avatarColor2: string;
  avatarBackground: string;
} {
  return PLAYER_AVATAR_COLORS[theme];
}

export function getCurrentBreakGlowStyle(
  theme: PlayerAvatarTheme,
): CurrentBreakGlowStyle {
  return PLAYER_CURRENT_BREAK_GLOW[theme];
}

export function getPlayerNameThemeStyle(
  theme: PlayerAvatarTheme,
): PlayerNameThemeStyle {
  return PLAYER_NAME_THEME[theme];
}

export function getPlayerInitials(playerName: string): string {
  const parts = playerName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "CU";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function getReverseDirection(direction: "ltr" | "rtl" = "ltr"): boolean {
  return direction === "rtl";
}

export function getPlayerCardKey(player: Player): string {
  return player.session_key;
}
