import { Card } from "@heroui/react";

import { Frame, Player, TableState } from "@/types";
import { resolvePlayerPair } from "./playerIdentity";

export default function FrameOverview({
  players,
  currentPlayerKey,
  frame,
  table,
}: {
  players: Player[];
  currentPlayerKey: string;
  frame: Frame;
  table: TableState;
}) {
  const { me, opponent } = resolvePlayerPair(players, currentPlayerKey);
  const isMyTurn = table.current_turn === currentPlayerKey;
  const isOpponentTurn = Boolean(
    opponent && table.current_turn === opponent.key,
  );
  const myFrameScore = me?.current_frame_score ?? 0;
  const opponentFrameScore = opponent?.current_frame_score ?? 0;
  const currentBreak = table.current_break ?? 0;
  const myCurrentBreak = isMyTurn ? currentBreak : 0;
  const opponentCurrentBreak = isOpponentTurn ? currentBreak : 0;

  const opponentScoreboardClass = !isMyTurn
    ? "scoreboard-digital-screen scoreboard-digital-screen-active"
    : "scoreboard-digital-screen";
  const activeScoreboardClass = isMyTurn
    ? "scoreboard-digital-screen scoreboard-digital-screen-active"
    : "scoreboard-digital-screen";

  const OpponentFrameScoreBoard = (
    <Card variant="transparent" className={opponentScoreboardClass}>
      <Card.Content className="scoreboard-digital-number-wrap">
        <span className="scoreboard-digital-number">{opponentFrameScore}</span>
      </Card.Content>
      <Card.Footer className="scoreboard-digital-footer">
        <h3 className="scoreboard-digital-label">Current Break</h3>
        <p className="scoreboard-digital-break">{opponentCurrentBreak}</p>
      </Card.Footer>
    </Card>
  );

  const MyFrameScoreBoard = (
    <Card variant="transparent" className={activeScoreboardClass}>
      <Card.Content className="scoreboard-digital-number-wrap">
        <span className="scoreboard-digital-number">{myFrameScore}</span>
      </Card.Content>
      <Card.Footer className="scoreboard-digital-footer">
        <h3 className="scoreboard-digital-label">Current Break</h3>
        <p className="scoreboard-digital-break">{myCurrentBreak}</p>
      </Card.Footer>
    </Card>
  );

  const FrameStats = (
    <Card
      variant="transparent"
      className="scoreboard-frame-stats-card scoreboard-digital-screen"
    >
      <Card.Content className="scoreboard-frame-stats-grid">
        <div className="flex min-w-0 flex-col items-center justify-between gap-1">
          <h3 className="scoreboard-digital-label">Remaining</h3>
          <p className="scoreboard-frame-stat-value">
            {frame.points_remaining}
          </p>
        </div>
        <div className="flex min-w-0 flex-col items-center justify-between gap-1">
          <h3 className="scoreboard-digital-label">Gap</h3>
          <p className="scoreboard-frame-stat-value">{frame.points_gap}</p>
        </div>
        <div className="flex min-w-0 flex-col items-center justify-between gap-1">
          <h3 className="scoreboard-digital-label">Snookers Needed</h3>
          <p className="scoreboard-frame-stat-value">
            {frame.snookers_required}
          </p>
        </div>
      </Card.Content>
    </Card>
  );

  const Scoreboard = (
    <div className="scoreboard-frame-score-grid">
      {OpponentFrameScoreBoard}
      {MyFrameScoreBoard}
    </div>
  );

  return (
    <div className="scoreboard-frame-root">
      {FrameStats}
      {Scoreboard}
    </div>
  );
}
