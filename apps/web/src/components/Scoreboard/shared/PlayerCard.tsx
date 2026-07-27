import { Badge, Card } from "@heroui/react";

import { Player as PlayerType } from "@/types";

import PlayerAvatar from "./PlayerAvatar";
import PlayerName from "./PlayerName";
import {
  getAvatarColors,
  getPlayerInitials,
  getReverseDirection,
  PlayerAvatarTheme,
} from "./playerIdentity";

type PlayerCardProps = {
  player: PlayerType;
  direction?: "ltr" | "rtl";
  isFrameWinner?: boolean;
  theme?: PlayerAvatarTheme;
};

export default function PlayerCard({
  player,
  direction = "ltr",
  isFrameWinner = false,
  theme = "neutral",
}: PlayerCardProps) {
  const { avatarColor, avatarColor2, avatarBackground } =
    getAvatarColors(theme);
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
            avatarBackground={avatarBackground}
            initials={initials}
          />
        </Badge.Anchor>
        <PlayerName
          player={player}
          reverseDirection={reverseDirection}
          theme={theme}
        />
      </Card.Content>
    </Card>
  );
}
