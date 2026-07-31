import type { Frame, GameStateMessage, Player } from "@/types";

import ControlPanelLayout from "../ControlPanelLayout";
import SimpleBallRail from "./SimpleBallRail";
import SimpleBottomActions from "./SimpleBottomActions";
import SummaryBreakFields from "./SummaryBreakFields";
import { BallName } from "@/domain/balls";
import { PlayerNameText } from "@/components/Scoreboard/shared/PlayerName";
import type { PlayerTheme } from "@/components/Scoreboard/shared/playerIdentity";

type SimpleScoringPanelProps = {
  redsRemaining: Frame["reds_remaining"];
  coloursOnTable: Frame["colours_on_table"];
  objectBall: string;
  freeBall: Frame["free_ball"];
  scoreKeeper: GameStateMessage["score_keeper"];
  scorekeepingTarget?: ScorekeepingTarget;
  canKeepScore: boolean;
  canUseFoulOptions: boolean;
  freeBallMode: boolean;
  isSummaryBreakMode: boolean;
  selectedBalls: BallName[];
  onBallTap: (ball: BallName) => void;
  onLogBreak: (score: number, foul: number) => void;
  onConcede: () => void;
  onEnterAdvancedMode: () => void;
  onToggleSummaryBreakMode: () => void;
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
  isSummaryBreakMode: boolean;
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
  isSummaryBreakMode,
  selectedBalls,
  onBallTap,
  onLogBreak,
  onConcede,
  onEnterAdvancedMode,
  onToggleSummaryBreakMode,
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
            isSummaryBreakMode={isSummaryBreakMode}
            scoreKeeper={scoreKeeper}
            target={scorekeepingTarget}
          />
        </div>
      }
      ballRow={
        isSummaryBreakMode ? (
          <SummaryBreakFields
            canKeepScore={canKeepScore}
            onSubmit={onLogBreak}
          />
        ) : (
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
        )
      }
      actionsRow={
        <SimpleBottomActions
          canKeepScore={canKeepScore}
          canUseFoulOptions={canUseFoulOptions}
          isSummaryBreakMode={isSummaryBreakMode}
          onConcede={onConcede}
          onEnterAdvancedMode={onEnterAdvancedMode}
          onToggleSummaryBreakMode={onToggleSummaryBreakMode}
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
  isSummaryBreakMode,
  scoreKeeper,
  target,
}: ScorekeepingMessageProps) {
  if (freeBallMode) {
    return <span className="text-center">Nominate the free ball</span>;
  }

  if (isSummaryBreakMode && target) {
    return (
      <span className="text-center">
        Manually logging the break for{" "}
        <PlayerNameText name={target.player.name} theme={target.theme} />
      </span>
    );
  }

  if (isSummaryBreakMode) {
    return (
      <span className="text-center">
        Manually logging the break for this player
      </span>
    );
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
