import { Badge, Card } from "@heroui/react";

import { Player as PlayerType } from "@/types";

import PlayerAvatar from "./PlayerAvatar";
import PlayerName from "./PlayerName";
import {
  getAvatarColors,
  getPlayerInitials,
  getReverseDirection,
} from "./playerIdentity";

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
    <Card variant="transparent" className="w-full min-w-0 p-0 ">
      <Card.Content className={"flex w-full min-w-0 items-center p-0"}>
        <Badge.Anchor className="shrink-0">
          <PlayerAvatar
            isFrameWinner={isFrameWinner}
            avatarColor={avatarColor}
            avatarColor2={avatarColor2}
            initials={initials}
          />
        </Badge.Anchor>
        <PlayerName player={player} reverseDirection={reverseDirection} />
      </Card.Content>
    </Card>
  );
}
