import { Badge, Card } from "@heroui/react";

import { Player as PlayerType } from "@/types";

import PlayerAvatar from "./PlayerAvatar";
import PlayerName from "./PlayerName";
import {
  getPlayerInitials,
  getPlayerThemeClassName,
  getReverseDirection,
  PlayerTheme,
} from "./playerIdentity";

type PlayerCardProps = {
  player: PlayerType;
  direction?: "ltr" | "rtl";
  isFrameWinner?: boolean;
  theme?: PlayerTheme;
};

export default function PlayerCard({
  player,
  direction = "ltr",
  isFrameWinner = false,
  theme = "neutral",
}: PlayerCardProps) {
  const initials = getPlayerInitials(player.name);
  const reverseDirection = getReverseDirection(direction);

  return (
    <Card
      variant="transparent"
      className={`${getPlayerThemeClassName(theme)} w-full min-w-0 p-0 `}
    >
      <Card.Content className={"flex w-full min-w-0 items-center p-0"}>
        <Badge.Anchor className="shrink-0">
          <PlayerAvatar
            isFrameWinner={isFrameWinner}
            className={getPlayerThemeClassName(theme)}
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
