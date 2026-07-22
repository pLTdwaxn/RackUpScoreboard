import { Chip } from "@heroui/react";

import { Frame } from "@/types";

import ControlPanelLayout from "../ControlPanelLayout";
import AdvancedBallRail from "./AdvancedBallRail";
import AdvancedBottomActions from "./AdvancedBottomActions";
import { BallName } from "@/lib/controlPanelShared";

type AdvancedScoringPanelProps = {
  summary: string;
  statusChip: { label: string; color: "danger" | "success" } | null;
  redsRemaining: number;
  coloursOnTable: Frame["colours_on_table"];
  objectBall: string;
  freeBall: Frame["free_ball"];
  canKeepScore: boolean;
  redSelections: number;
  foulMode: boolean;
  selectedBalls: BallName[];
  isRedFoulWithoutPot: boolean;
  comboIsFoul: boolean;
  hasSelectedBalls: boolean;
  onBallTap: (ball: BallName) => void;
  onResetRedSelections: () => void;
  onExitAdvancedMode: () => void;
  onChangeFoulMode: (isFoulMode: boolean) => void;
  onSubmit: () => void;
};

export default function AdvancedScoringPanel({
  summary,
  statusChip,
  redsRemaining,
  coloursOnTable,
  objectBall,
  freeBall,
  canKeepScore,
  redSelections,
  foulMode,
  selectedBalls,
  isRedFoulWithoutPot,
  comboIsFoul,
  hasSelectedBalls,
  onBallTap,
  onResetRedSelections,
  onExitAdvancedMode,
  onChangeFoulMode,
  onSubmit,
}: AdvancedScoringPanelProps) {
  return (
    <ControlPanelLayout
      messageRow={
        <div className="flex items-center justify-center gap-2 text-sm leading-5 text-muted">
          <span className="text-center">{summary}</span>
          {statusChip ? (
            <Chip
              variant="soft"
              color={statusChip.color}
              size="sm"
              className="m-0 min-w-14 justify-center"
            >
              {statusChip.label}
            </Chip>
          ) : null}
        </div>
      }
      ballRow={
        <AdvancedBallRail
          redsRemaining={redsRemaining}
          coloursOnTable={coloursOnTable}
          objectBall={objectBall}
          freeBall={freeBall}
          canKeepScore={canKeepScore}
          redSelections={redSelections}
          selectedBalls={selectedBalls}
          isRedFoulWithoutPot={isRedFoulWithoutPot}
          foulMode={foulMode}
          comboIsFoul={comboIsFoul}
          onBallTap={onBallTap}
          onRedLongPress={onResetRedSelections}
        />
      }
      actionsRow={
        <AdvancedBottomActions
          canKeepScore={canKeepScore}
          foulMode={foulMode}
          comboIsFoul={comboIsFoul}
          hasSelectedBalls={hasSelectedBalls}
          onExitAdvancedMode={onExitAdvancedMode}
          onChangeFoulMode={onChangeFoulMode}
          onSubmit={onSubmit}
        />
      }
    />
  );
}
