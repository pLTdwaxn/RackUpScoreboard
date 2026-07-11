import { Card } from "@heroui/react";

type FrameScoreboardProps = {
  playerScore: number;
  playerCurrentBreak: number;
  currentTurn: boolean;
};

const FrameScoreboard = ({
  playerScore,
  playerCurrentBreak,
  currentTurn,
}: FrameScoreboardProps) => {
  return (
    <Card
      variant="default"
      className={`w-full p-2 ${currentTurn ? "ring-2 ring-(--scoreboard-screen-label) animate-pulse" : ""}`}
    >
      <Card.Content className="flex flex-col items-center">
        <span className="score-primary"> {playerScore}</span>
        <h3 className="score-label">Current Break</h3>
        <span className="score-secondary">{playerCurrentBreak}</span>
      </Card.Content>
    </Card>
  );
};

export default FrameScoreboard;
