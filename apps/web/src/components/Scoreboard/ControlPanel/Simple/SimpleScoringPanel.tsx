import type { Frame, GameStateMessage, Player } from "@/types";

import ControlPanelLayout from "../ControlPanelLayout";
import SimpleBallRail from "./SimpleBallRail";
import SimpleBottomActions from "./SimpleBottomActions";
import { BallName } from "@/domain/balls";
import { PlayerNameText } from "@/components/Scoreboard/shared/PlayerName";
import type { PlayerTheme } from "@/components/Scoreboard/shared/playerIdentity";

type SimpleScoringPanelProps = {
  redsRemaining: number;
  coloursOnTable: Frame["colours_on_table"];
  objectBall: string;
  freeBall: Frame["free_ball"];
  scoreKeeper: GameStateMessage["score_keeper"];
  scorekeepingTarget?: ScorekeepingTarget;
  canKeepScore: boolean;
  canUseFoulOptions: boolean;
  freeBallMode: boolean;
  selectedBalls: BallName[];
  onBallTap: (ball: BallName) => void;
  onConcede: () => void;
  onEnterAdvancedMode: () => void;
  onDeclareFoul: () => void;
  onEndTurn: () => void;
  onPassShot?: () => void;
  onDeclareFreeBall?: () => void;
};

type ScorekeepingTarget = {
  player: Player;
  theme: PlayerTheme;
};

type ScorekeepingMessageProps = {
  freeBallMode: boolean;
  scoreKeeper: GameStateMessage["score_keeper"];
  target?: ScorekeepingTarget;
};

export default function SimpleScoringPanel({
  redsRemaining,
  coloursOnTable,
  objectBall,
  freeBall,
  scoreKeeper,
  scorekeepingTarget,
  canKeepScore,
  canUseFoulOptions,
  freeBallMode,
  selectedBalls,
  onBallTap,
  onConcede,
  onEnterAdvancedMode,
  onDeclareFoul,
  onEndTurn,
  onPassShot,
  onDeclareFreeBall,
}: SimpleScoringPanelProps) {
  return (
    <ControlPanelLayout
      messageRow={
        <div className="flex items-center justify-center gap-2 text-sm leading-5 text-muted">
          <ScorekeepingMessage
            freeBallMode={freeBallMode}
            scoreKeeper={scoreKeeper}
            target={scorekeepingTarget}
          />
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
          onPassShot={onPassShot}
          onDeclareFreeBall={onDeclareFreeBall}
        />
      }
    />
  );
}

function ScorekeepingMessage({
  freeBallMode,
  scoreKeeper,
  target,
}: ScorekeepingMessageProps) {
  if (freeBallMode) {
    return <span className="text-center">Nominate the free ball</span>;
  }

  if ((scoreKeeper === "self" || scoreKeeper === "opp") && target) {
    return (
      <span className="text-center">
        Scorekeeping for{" "}
        <PlayerNameText name={target.player.name} theme={target.theme} />
      </span>
    );
  }

  if (scoreKeeper === "self") {
    return <span className="text-center">Scorekeeping for your turn</span>;
  }

  if (scoreKeeper === "any") {
    return (
      <span className="text-center">
        Scorekeeping is open to both players
      </span>
    );
  }

  if (scoreKeeper === "ref") {
    return <span className="text-center">Scorekeeping by referee</span>;
  }

  return <span className="text-center">Scorekeeping for your opponent</span>;
}
