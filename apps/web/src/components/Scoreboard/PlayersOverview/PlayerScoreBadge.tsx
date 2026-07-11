import { Badge } from "@heroui/react";

import { Player as PlayerType } from "@/types";

type PlayerScoreBadgeProps = {
  player: PlayerType;
  reverseDirection: boolean;
};

export default function PlayerScoreBadge({
  player,
  reverseDirection,
}: PlayerScoreBadgeProps) {
  return (
    <Badge
      placement={reverseDirection ? "bottom-left" : "bottom-right"}
      color={player.match_score > 0 ? "success" : "warning"}
      className="border-0"
    >
      <span className="font-mono text-lg font-bold">{player.match_score}</span>
    </Badge>
  );
}
