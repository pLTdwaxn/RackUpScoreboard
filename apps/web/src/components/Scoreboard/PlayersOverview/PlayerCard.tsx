import { Badge, Card } from "@heroui/react";

import { Player as PlayerType } from "@/types";

import PlayerAvatar from "./PlayerAvatar";
import PlayerName from "./PlayerName";
import PlayerScoreBadge from "./PlayerScoreBadge";
import {
  getAvatarColors,
  getPlayerInitials,
  getReverseDirection,
} from "./utils";

type PlayerCardProps = {
  player: PlayerType;
  direction?: "ltr" | "rtl";
  isFrameWinner?: boolean;
};

export default function PlayerCard({
  player,
  direction = "ltr",
  isFrameWinner = false,
}: PlayerCardProps) {
  const { avatarColor, avatarColor2 } = getAvatarColors(player.name);
  const initials = getPlayerInitials(player.name);
  const reverseDirection = getReverseDirection(direction);

  return (
    <Card
      variant="transparent"
      className="w-full items-stretch rounded-full px-2py-2"
    >
      <Card.Content
        className={`flex w-auto items-center gap-2 ${
          reverseDirection ? "flex-row-reverse" : "flex-row"
        }`}
      >
        <Badge.Anchor>
          <PlayerAvatar
            isFrameWinner={isFrameWinner}
            avatarColor={avatarColor}
            avatarColor2={avatarColor2}
            initials={initials}
          />
          <PlayerScoreBadge
            player={player}
            reverseDirection={reverseDirection}
          />
        </Badge.Anchor>
        <PlayerName player={player} reverseDirection={reverseDirection} />
      </Card.Content>
    </Card>
  );
}
