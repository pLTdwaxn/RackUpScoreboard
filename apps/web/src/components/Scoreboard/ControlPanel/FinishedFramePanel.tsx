import { Button } from "@heroui/react";
import { useAppDictionary } from "@/i18n/client";
import type { FrameSummary, Player } from "@/types";

type FinishedFramePanelProps = {
  winnerKey: string | null;
  currentPlayerKey: string;
  players?: Player[];
  summary?: FrameSummary[];
  hasConfirmedNextFrame: boolean;
  onNextFrame: () => void;
};

const FinishedFramePanel = ({
  winnerKey,
  currentPlayerKey,
  players = [],
  summary = [],
  hasConfirmedNextFrame,
  onNextFrame,
}: FinishedFramePanelProps) => {
  const copy = useAppDictionary().controlPanel.finishedFrame;
  const resultMessage =
    winnerKey === null
      ? copy.drawn
      : winnerKey === currentPlayerKey
        ? copy.won
        : copy.lost;
  const playersByKey = new Map(players.map((player) => [player.session_key, player]));

  return (
    <div className="flex w-full flex-col items-center justify-center gap-3 py-2">
      <p className="text-lg">{resultMessage}</p>
      {summary.length ? (
        <div className="grid w-full grid-cols-2 gap-2 text-left">
          {summary.map((playerSummary) => {
            const player = playersByKey.get(playerSummary.player_key);
            const playerName = player?.name ?? copy.playerFallback;
            return (
              <div
                key={playerSummary.player_key}
                className="rounded-lg border border-divider px-3 py-2"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-semibold">{playerName}</p>
                  <p className="font-mono text-lg font-semibold">
                    {playerSummary.score}
                  </p>
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
                  <dt className="text-muted">{copy.highestBreak}</dt>
                  <dd className="text-right font-mono">{playerSummary.highest_break}</dd>
                  <dt className="text-muted">{copy.visits}</dt>
                  <dd className="text-right font-mono">{playerSummary.visits}</dd>
                  <dt className="text-muted">{copy.foulPointsAway}</dt>
                  <dd className="text-right font-mono">
                    {playerSummary.foul_points_conceded}
                  </dd>
                </dl>
              </div>
            );
          })}
        </div>
      ) : null}
      {hasConfirmedNextFrame ? (
        <p className="font-mono text-sm tracking-wide uppercase text-muted">
          {copy.waitingForOpponent}
        </p>
      ) : (
        <Button variant="primary" onPress={onNextFrame}>
          {copy.startNextFrame}
        </Button>
      )}
    </div>
  );
};

export default FinishedFramePanel;
