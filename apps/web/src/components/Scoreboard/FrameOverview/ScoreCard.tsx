import { Card } from "@heroui/react";

import type { Frame, Player } from "@/types";

import PlayerCard from "../shared/PlayerCard";
import {
  getPlayerThemeClassName,
  PlayerTheme,
} from "../shared/playerIdentity";

type ScoreCardProps = {
  player: Player | undefined;
  frame: Frame;
  currentTurn: boolean;
  direction?: "ltr" | "rtl";
  isFrameWinner?: boolean;
  playerTheme?: PlayerTheme;
};

export default function ScoreCard({
  player,
  frame,
  currentTurn,
  direction = "ltr",
  isFrameWinner = false,
  playerTheme = "neutral",
}: ScoreCardProps) {
  const frameScore = player ? (frame.scores[player.session_key] ?? 0) : 0;
  const matchScore = player?.match_score ?? 0;

  return (
    <Card
      variant="default"
      className={`${getPlayerThemeClassName(playerTheme)} w-full min-w-0 p-2 ${
        currentTurn ? "current-break-glow" : ""
      }`}
    >
      <Card.Content className="flex min-w-0 flex-col items-stretch gap-1 p-1">
        {player ? (
          <PlayerCard
            player={player}
            direction={direction}
            isFrameWinner={isFrameWinner}
            theme={playerTheme}
          />
        ) : null}
        <div className="score-primary">{frameScore}</div>
        <div className="score-secondary">{matchScore}</div>
      </Card.Content>
    </Card>
  );
}
