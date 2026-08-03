import type { Frame, GameStateMessage, Player } from "@/types";

import ControlPanelLayout from "../ControlPanelLayout";
import SimpleBallRail from "./SimpleBallRail";
import SimpleBottomActions from "./SimpleBottomActions";
import SummaryBreakFields from "./SummaryBreakFields";
import { BallName } from "@/domain/balls";
import { PlayerNameText } from "@/components/Scoreboard/shared/PlayerName";
import type { PlayerTheme } from "@/components/Scoreboard/shared/playerIdentity";
import { useAppDictionary } from "@/i18n/client";

type SimpleScoringPanelProps = {
  redsRemaining: Frame["reds_remaining"];
  coloursOnTable: Frame["colours_on_table"];
  objectBall: string;
  freeBall: Frame["free_ball"];
  scoreKeeper: GameStateMessage["score_keeper"];
  scorekeepingTarget?: ScorekeepingTarget;
  canKeepScore: boolean;
  canLogSummaryBreak: boolean;
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
  canLogSummaryBreak,
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
          canLogSummaryBreak={canLogSummaryBreak}
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
  const copy = useAppDictionary().controlPanel.scorekeeping;

  if (freeBallMode) {
    return <span className="text-center">{copy.nominateFreeBall}</span>;
  }

  if (isSummaryBreakMode && target) {
    return (
      <span className="text-center">
        {copy.manuallyLoggingFor}{" "}
        <PlayerNameText name={target.player.name} theme={target.theme} />
      </span>
    );
  }

  if (isSummaryBreakMode) {
    return (
      <span className="text-center">
        {copy.manuallyLoggingForThisPlayer}
      </span>
    );
  }

  if ((scoreKeeper === "self" || scoreKeeper === "opp") && target) {
    return (
      <span className="text-center">
        {copy.scorekeepingFor}{" "}
        <PlayerNameText name={target.player.name} theme={target.theme} />
      </span>
    );
  }

  if (scoreKeeper === "self") {
    return <span className="text-center">{copy.scorekeepingForYourTurn}</span>;
  }

  if (scoreKeeper === "any") {
    return <span className="text-center">{copy.scorekeepingOpen}</span>;
  }

  if (scoreKeeper === "ref") {
    return <span className="text-center">{copy.scorekeepingByReferee}</span>;
  }

  return <span className="text-center">{copy.scorekeepingForOpponent}</span>;
}
