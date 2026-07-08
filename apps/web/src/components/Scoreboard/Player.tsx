import { Avatar, Badge, BadgeAnchor, Card } from "@heroui/react";

import { Player as PlayerType } from "@/types";

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

function nameToColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]!;
}

export default function Player({
  player,
  direction = "ltr",
  isFrameWinner = false,
}: {
  player: PlayerType;
  direction?: "ltr" | "rtl";
  isFrameWinner?: boolean;
}) {
  const getInitials = (displayName: string): string => {
    const parts = displayName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "CU";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  };

  const avatarColor = nameToColor(player.name);
  const avatarColor2 = nameToColor(player.name + player.name.length);

  const reverseDirection = direction === "rtl";

  return (
    <Card
      variant="transparent"
      className="w-full items-stretch rounded-full p-0"
    >
      <Card.Content
        className={`flex w-auto items-center gap-2 ${
          reverseDirection ? "flex-row-reverse" : "flex-row"
        }`}
      >
        <BadgeAnchor>
          <Avatar
            size="lg"
            className={isFrameWinner ? "winner-avatar-glow" : ""}
          >
            <Avatar.Image />
            <Avatar.Fallback
              className="font-sans font-medium text-lg transition-colors duration-500"
              style={{
                background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor2})`,
                color: "#fff",
              }}
            >
              {getInitials(player.name)}
            </Avatar.Fallback>
          </Avatar>
          <Badge
            placement={reverseDirection ? "bottom-left" : "bottom-right"}
            color={player.match_score > 0 ? "success" : "warning"}
            className="border-0"
          >
            <span className="font-mono text-lg font-bold">
              {player.match_score}
            </span>
          </Badge>
        </BadgeAnchor>

        <div className="flex w-full min-w-0 flex-col items-stretch gap-1">
          <h2
            className={`font-mono font-normal tracking-wider uppercase ${
              reverseDirection ? "text-right" : "text-left"
            }`}
          >
            {player.name}
          </h2>
        </div>
      </Card.Content>
    </Card>
  );
}
