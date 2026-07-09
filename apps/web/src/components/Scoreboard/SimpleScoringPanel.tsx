import { TableState } from "@/types";

import SimpleControl, {
  SimpleBallRail,
  SimpleBottomActions,
} from "./SimpleControl";
import { BallName } from "./controlPanelShared";

type SimpleScoringPanelProps = {
  redsRemaining: number;
  coloursOnTable: TableState["colours_on_table"];
  objectBall: string;
  canKeepScore: boolean;
  selectedBalls: BallName[];
  onBallTap: (ball: BallName) => void;
  onConcede: () => void;
  onEnterAdvancedMode: () => void;
  onDeclareFoul: () => void;
  onEndTurn: () => void;
  onUndo: () => void;
};

export default function SimpleScoringPanel({
  redsRemaining,
  coloursOnTable,
  objectBall,
  canKeepScore,
  selectedBalls,
  onBallTap,
  onConcede,
  onEnterAdvancedMode,
  onDeclareFoul,
  onEndTurn,
  onUndo,
}: SimpleScoringPanelProps) {
  return (
    <SimpleControl
      messageRow={
        <div className="flex items-center justify-center gap-2 text-sm leading-5 text-muted">
          <span className="text-center">Scorekeeping for your opponent</span>
        </div>
      }
      ballRow={
        <SimpleBallRail
          redsRemaining={redsRemaining}
          coloursOnTable={coloursOnTable}
          objectBall={objectBall}
          canKeepScore={canKeepScore}
          selectedBalls={selectedBalls}
          onBallTap={onBallTap}
        />
      }
      actionsRow={
        <SimpleBottomActions
          canKeepScore={canKeepScore}
          onConcede={onConcede}
          onEnterAdvancedMode={onEnterAdvancedMode}
          onDeclareFoul={onDeclareFoul}
          onEndTurn={onEndTurn}
          onUndo={onUndo}
        />
      }
    />
  );
}
