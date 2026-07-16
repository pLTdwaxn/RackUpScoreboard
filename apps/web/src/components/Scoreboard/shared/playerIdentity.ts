import { Player } from "@/types";

const AVATAR_COLORS = [
  "#e57373",
  "#f06292",
  "#ba68c8",
  "#9575cd",
  "#7986cb",
  "#64b5f6",
  "#4dd0e1",
  "#4db6ac",
  "#81c784",
  "#aed581",
  "#ffd54f",
  "#ffb74d",
  "#ff8a65",
  "#a1887f",
  "#90a4ae",
];

export function getAvatarColors(name: string): {
  avatarColor: string;
  avatarColor2: string;
} {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const avatarColor = AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
  const avatarColor2 =
    AVATAR_COLORS[Math.abs(hash + name.length) % AVATAR_COLORS.length]!;

  return { avatarColor, avatarColor2 };
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
