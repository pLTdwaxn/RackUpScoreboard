import { Card } from "@heroui/react";

import type { Frame, Player } from "@/types";

import PlayerCard from "../shared/PlayerCard";

type ScoreCardProps = {
  player: Player | undefined;
  frame: Frame;
  currentTurn: boolean;
  direction?: "ltr" | "rtl";
  isFrameWinner?: boolean;
};

export default function ScoreCard({
  player,
  frame,
  currentTurn,
  direction = "ltr",
  isFrameWinner = false,
}: ScoreCardProps) {
  const frameScore = player ? (frame.scores[player.session_key] ?? 0) : 0;
  const matchScore = player?.match_score ?? 0;

  return (
    <Card
      variant="default"
      className={`w-full min-w-0 p-2 ${
        currentTurn
          ? "ring-2 ring-(--scoreboard-screen-label) animate-pulse"
          : ""
      }`}
    >
      <Card.Content className="flex min-w-0 flex-col items-stretch gap-1 p-0">
        <div className="score-secondary">{matchScore}</div>
        <div className={"score-primary shrink-0 tabular-nums"}>
          {frameScore}
        </div>
        {player ? (
          <PlayerCard
            player={player}
            direction={direction}
            isFrameWinner={isFrameWinner}
          />
        ) : null}
      </Card.Content>
    </Card>
  );
}
