"use client";

import { useMatchroomDerivedState } from "@/hooks/useSocket";

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
  } = useMatchroomDerivedState();

  if (!hasFrame) {
    return null;
  }

  return (
    <OverviewWrapper>
      <div className="flex flex-row items-center justify-between gap-2">
        <FrameScoreboard
          playerScore={opponentScore}
          playerCurrentBreak={opponentCurrentBreak}
        />
        <FrameScoreboard
          playerScore={myScore}
          playerCurrentBreak={myCurrentBreak}
        />
      </div>
      <FrameStats frame={frame} />
    </OverviewWrapper>
  );
}
