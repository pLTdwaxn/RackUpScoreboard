import { Card } from "@heroui/react";

import { Frame, Player } from "@/types";
import { resolvePlayerPair } from "./playerIdentity";

export default function FrameOverview({
  players,
  currentPlayerKey,
  frame,
}: {
  players: Player[];
  currentPlayerKey: string;
  frame: Frame;
}) {
  const { me, opponent } = resolvePlayerPair(players, currentPlayerKey);
  const isMyTurn = frame.current_turn === currentPlayerKey;
  const isOpponentTurn = Boolean(
    opponent && frame.current_turn === opponent.session_key,
  );
  const myFrameScore = frame.scores[currentPlayerKey] ?? 0;
  const opponentFrameScore = opponent
    ? (frame.scores[opponent.session_key] ?? 0)
    : 0;
  const currentBreak = frame.current_break ?? 0;
  const myCurrentBreak = isMyTurn ? currentBreak : 0;
  const opponentCurrentBreak = isOpponentTurn ? currentBreak : 0;

  const OpponentFrameScoreBoard = (
    <Card variant="default" className="w-full p-2">
      <Card.Content className="flex flex-col items-center">
        <span className="score-primary">{opponentFrameScore}</span>
        <h3 className="score-label">Current Break</h3>
        <span className="score-secondary">{opponentCurrentBreak}</span>
      </Card.Content>
    </Card>
  );

  const MyFrameScoreBoard = (
    <Card variant="default" className="w-full p-2">
      <Card.Content className="flex flex-col items-center">
        <span className="score-primary"> {myFrameScore}</span>
        <h3 className="score-label">Current Break</h3>
        <span className="score-secondary">{myCurrentBreak}</span>
      </Card.Content>
    </Card>
  );

  const FrameStats = (
    <Card variant="default" className="w-full p-2">
      <Card.Content className="flex flex-row justify-between">
        <div className="flex flex-1 flex-col items-center gap-1">
          <h3 className="score-label">Remaining</h3>
          <p className="score-secondary">{frame.points_remaining}</p>
        </div>
        <div className="flex flex-1 flex-col items-center gap-1">
          <h3 className="score-label">Gap</h3>
          <p className="score-secondary">{frame.points_gap}</p>
        </div>
        <div className="flex flex-1 flex-col items-center gap-1">
          <h3 className="score-label">Snks Needed</h3>
          <p className="score-secondary">{frame.snookers_required}</p>
        </div>
      </Card.Content>
    </Card>
  );

  const Scoreboard = (
    <div className="flex flex-row items-center justify-between gap-2">
      {OpponentFrameScoreBoard}
      {MyFrameScoreBoard}
    </div>
  );

  return (
    <div className="flex flex-col items-stretch gap-2">
      {Scoreboard}
      {FrameStats}
    </div>
  );
}
