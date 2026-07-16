"use client";

import { useMatchroomFrame } from "@/hooks/useMatchroomFrame";

import FrameScoreboard from "./FrameScoreboard";
import FrameStats from "./FrameStats";
import OverviewWrapper from "./OverviewWrapper";

export { default as FrameScoreboard } from "./FrameScoreboard";
export { default as FrameStats } from "./FrameStats";
export { default as OverviewWrapper } from "./OverviewWrapper";

export default function FrameOverview() {
  const {
    hasFrame,
    frame,
    myScore,
    opponentScore,
    myCurrentBreak,
    opponentCurrentBreak,
    isMyTurn,
    isOpponentTurn,
  } = useMatchroomFrame();

  if (!hasFrame) {
    return null;
  }

  return (
    <OverviewWrapper>
      <FrameStats frame={frame} />
      <div className="flex flex-row items-center justify-between gap-2">
        <FrameScoreboard
          currentTurn={isOpponentTurn}
          playerScore={opponentScore}
          playerCurrentBreak={opponentCurrentBreak}
        />
        <FrameScoreboard
          currentTurn={isMyTurn}
          playerScore={myScore}
          playerCurrentBreak={myCurrentBreak}
        />
      </div>
    </OverviewWrapper>
  );
}
