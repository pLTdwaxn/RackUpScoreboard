import { Avatar, Badge, BadgeAnchor, Card } from "@heroui/react";

import { Player as PlayerType } from "@/types";

export default function Player({
  player,
  direction = "ltr",
}: {
  player: PlayerType;
  direction?: "ltr" | "rtl";
}) {
  const getInitials = (displayName: string): string => {
    const parts = displayName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "CU";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  };

  const reverseDirection = direction === "rtl";

  return (
    <Card
      variant="default"
      className="w-full items-stretch rounded-full border border-lime-300/25 bg-[#0a1a10] p-0 shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
    >
      <Card.Content
        className={`flex w-auto items-center gap-2 ${
          reverseDirection ? "flex-row-reverse" : "flex-row"
        }`}
      >
        <BadgeAnchor>
          <Avatar size="lg" className="border border-lime-200/20">
            <Avatar.Image />
            <Avatar.Fallback className="bg-lime-100 text-xl font-bold text-[#10220f]">
              {getInitials(player.name)}
            </Avatar.Fallback>
          </Avatar>
          <Badge
            placement={reverseDirection ? "bottom-left" : "bottom-right"}
            color={player.match_score > 0 ? "success" : "warning"}
            className="border-0 shadow"
          >
            <span className="font-mono text-lg font-bold text-black">
              {player.match_score}
            </span>
          </Badge>
        </BadgeAnchor>

        <div className="flex w-full min-w-0 flex-col items-stretch gap-1">
          <h2
            className={`min-w-0 truncate text-base font-semibold text-lime-50 ${
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
