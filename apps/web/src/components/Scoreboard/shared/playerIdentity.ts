import { Player } from "@/types";

export type PlayerTheme = "red" | "blue" | "neutral";
export type PlayerAvatarTheme = PlayerTheme;

export function getPlayerAvatarTheme(
  playerKey: string | undefined,
  players: Player[] = [],
): PlayerTheme {
  const playerIndex = players.findIndex(
    (player) => player.session_key === playerKey,
  );

  if (playerIndex === 0) return "red";
  if (playerIndex === 1) return "blue";
  return "neutral";
}

export function getPlayerThemeClassName(theme: PlayerTheme): string {
  return `player-theme-${theme}`;
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
