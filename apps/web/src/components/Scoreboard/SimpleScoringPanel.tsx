import { TableState } from "@/types";

import SimpleControl, {
  SimpleBallRail,
  SimpleBottomActions,
} from "./SimpleControl";
import { BallName } from "@/lib/controlPanelShared";

type SimpleScoringPanelProps = {
  redsRemaining: number;
  coloursOnTable: TableState["colours_on_table"];
  objectBall: string;
  freeBall: TableState["free_ball"];
  canKeepScore: boolean;
  canUseFoulOptions: boolean;
  freeBallMode: boolean;
  selectedBalls: BallName[];
  onBallTap: (ball: BallName) => void;
  onConcede: () => void;
  onEnterAdvancedMode: () => void;
  onDeclareFoul: () => void;
  onEndTurn: () => void;
  onUndo: () => void;
  onPassShot?: () => void;
  onDeclareFreeBall?: () => void;
};

export default function SimpleScoringPanel({
  redsRemaining,
  coloursOnTable,
  objectBall,
  freeBall,
  canKeepScore,
  canUseFoulOptions,
  freeBallMode,
  selectedBalls,
  onBallTap,
  onConcede,
  onEnterAdvancedMode,
  onDeclareFoul,
  onEndTurn,
  onUndo,
  onPassShot,
  onDeclareFreeBall,
}: SimpleScoringPanelProps) {
  return (
    <SimpleControl
      messageRow={
        <div className="flex items-center justify-center gap-2 text-sm leading-5 text-muted">
          <span className="text-center">
            {freeBallMode
              ? "Nominate the free ball"
              : "Scorekeeping for your opponent"}
          </span>
        </div>
      }
      ballRow={
        <SimpleBallRail
          redsRemaining={redsRemaining}
          coloursOnTable={coloursOnTable}
          objectBall={objectBall}
          freeBall={freeBall}
          canKeepScore={canKeepScore}
          freeBallMode={freeBallMode}
          selectedBalls={selectedBalls}
          onBallTap={onBallTap}
        />
      }
      actionsRow={
        <SimpleBottomActions
          canKeepScore={canKeepScore}
          canUseFoulOptions={canUseFoulOptions}
          onConcede={onConcede}
          onEnterAdvancedMode={onEnterAdvancedMode}
          onDeclareFoul={onDeclareFoul}
          onEndTurn={onEndTurn}
          onUndo={onUndo}
          onPassShot={onPassShot}
          onDeclareFreeBall={onDeclareFreeBall}
        />
      }
    />
  );
}
