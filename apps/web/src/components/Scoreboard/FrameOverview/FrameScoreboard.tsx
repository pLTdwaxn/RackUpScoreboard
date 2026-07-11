import { Card } from "@heroui/react";

type FrameScoreboardProps = {
  playerScore: number;
  playerCurrentBreak: number;
};

const FrameScoreboard = ({
  playerScore,
  playerCurrentBreak,
}: FrameScoreboardProps) => {
  return (
    <Card variant="default" className="w-full p-2">
      <Card.Content className="flex flex-col items-center">
        <span className="score-primary"> {playerScore}</span>
        <h3 className="score-label">Current Break</h3>
        <span className="score-secondary">{playerCurrentBreak}</span>
      </Card.Content>
    </Card>
  );
};

export default FrameScoreboard;
