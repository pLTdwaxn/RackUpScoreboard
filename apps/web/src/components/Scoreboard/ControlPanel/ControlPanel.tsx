"use client";

import { useState } from "react";

import { Surface } from "@heroui/react";

import { AdvancedScoringPanel } from "./Advanced";
import ConcedeFrameDialog from "./ConcedeFrameDialog";
import FinishedFramePanel from "./FinishedFramePanel";
import { SimpleScoringPanel } from "./Simple";
import { useControlPanelState } from "./useControlPanelState";
import { useShotComposer } from "./useShotComposer";

export default function ControlPanel() {
  const {
    canKeepScore,
    canLogSummaryBreak,
    canUseFoulOptions,
    coloursOnTable,
    currentPlayerKey,
    frame,
    frameSummary,
    freeBall,
    hasConfirmedNextFrame,
    hasFrame,
    isFrameFinished,
    objectBall,
    players,
    redsRemaining,
    scoreKeeper,
    scorekeepingTarget,
    sendConcede,
    sendDeclareFreeBall,
    sendEndTurn,
    sendLogBreak,
    sendNextFrame,
    sendPassShot,
    sendShot,
  } = useControlPanelState();

  const [isConcedeDialogOpen, setIsConcedeDialogOpen] = useState(false);
  const [isSummaryBreakMode, setIsSummaryBreakMode] = useState(false);
  const shotComposer = useShotComposer({
    canKeepScore,
    canUseFoulOptions,
    redsRemaining,
    coloursOnTable,
    objectBall,
    freeBall,
    sendShot,
    sendDeclareFreeBall,
  });

  const showSummaryBreakMode = isSummaryBreakMode && canLogSummaryBreak;

  if (!hasFrame) {
    return null;
  }

  return (
    <Surface
      variant="default"
      className="mt-auto w-full items-center rounded-3xl p-3 text-center"
    >
      {isFrameFinished ? (
        <FinishedFramePanel
          winnerKey={frame.winner_key}
          currentPlayerKey={currentPlayerKey}
          players={players}
          summary={frameSummary}
          hasConfirmedNextFrame={hasConfirmedNextFrame}
          onNextFrame={sendNextFrame}
        />
      ) : (
        <>
          {shotComposer.isAdvancedMode ? (
            <AdvancedScoringPanel
              summary={shotComposer.advancedSummary}
              statusChip={shotComposer.comboStatusChip}
              redsRemaining={redsRemaining}
              coloursOnTable={coloursOnTable}
              objectBall={objectBall}
              freeBall={freeBall}
              canKeepScore={canKeepScore}
              redSelections={shotComposer.redSelections}
              foulMode={shotComposer.foulMode}
              selectedBalls={shotComposer.selectedBalls}
              isRedFoulWithoutPot={shotComposer.isRedFoulWithoutPot}
              comboIsFoul={shotComposer.comboIsFoul}
              hasSelectedBalls={shotComposer.hasSelectedBalls}
              onBallTap={shotComposer.handleBallTap}
              onResetRedSelections={shotComposer.resetRedSelections}
              onExitAdvancedMode={shotComposer.cancelAdvancedMode}
              onChangeFoulMode={shotComposer.toggleFoulMode}
              onSubmit={shotComposer.submitComposer}
            />
          ) : (
            <SimpleScoringPanel
              redsRemaining={redsRemaining}
              coloursOnTable={coloursOnTable}
              objectBall={objectBall}
              freeBall={freeBall}
              scoreKeeper={scoreKeeper}
              scorekeepingTarget={scorekeepingTarget}
              canKeepScore={canKeepScore}
              canLogSummaryBreak={canLogSummaryBreak}
              canUseFoulOptions={canUseFoulOptions}
              freeBallMode={shotComposer.freeBallMode}
              selectedBalls={shotComposer.multiPotBalls}
              onBallTap={shotComposer.handleBallTap}
              onLogBreak={(score, foul) => {
                sendLogBreak(score, foul);
                setIsSummaryBreakMode(false);
              }}
              onConcede={() => setIsConcedeDialogOpen(true)}
              onEnterAdvancedMode={() => {
                setIsSummaryBreakMode(false);
                shotComposer.startAdvancedMode();
              }}
              isSummaryBreakMode={showSummaryBreakMode}
              onToggleSummaryBreakMode={() => {
                if (canLogSummaryBreak) {
                  setIsSummaryBreakMode((isActive) => !isActive);
                }
              }}
              onDeclareFoul={shotComposer.toggleFoulMode}
              onEndTurn={sendEndTurn}
              onPassShot={sendPassShot}
              onDeclareFreeBall={shotComposer.startFreeBallMode}
            />
          )}

          <ConcedeFrameDialog
            open={isConcedeDialogOpen}
            onOpenChange={setIsConcedeDialogOpen}
            onConfirm={sendConcede}
          />
        </>
      )}
    </Surface>
  );
}
