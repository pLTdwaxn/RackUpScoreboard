"use client";

import { useMatchroomFrame } from "@/hooks/useMatchroomFrame";

import FrameStats from "./FrameStats";
import OverviewWrapper from "./OverviewWrapper";
import ScoreCard from "./ScoreCard";
import { useMatchroomPlayers } from "@/hooks/useMatchroomPlayers";
import { getPlayerAvatarTheme } from "../shared/playerIdentity";

export { default as FrameStats } from "./FrameStats";
export { default as OverviewWrapper } from "./OverviewWrapper";
export { default as ScoreCard } from "./ScoreCard";

export default function FrameOverview() {
  const { me, opponent, players = [] } = useMatchroomPlayers();
  const {
    hasFrame,
    frame,
    isMyTurn,
    isOpponentTurn,
    winningPlayerKey,
  } = useMatchroomFrame();

  if (!hasFrame) {
    return null;
  }

  return (
    <OverviewWrapper>
      <FrameStats frame={frame} />
      <div className="flex flex-row items-center justify-between gap-2">
        <ScoreCard
          player={opponent}
          frame={frame}
          currentTurn={isOpponentTurn}
          isFrameWinner={opponent?.session_key === winningPlayerKey}
          playerTheme={getPlayerAvatarTheme(opponent?.session_key, players)}
        />
        <ScoreCard
          player={me}
          frame={frame}
          currentTurn={isMyTurn}
          direction="rtl"
          isFrameWinner={me?.session_key === winningPlayerKey}
          playerTheme={getPlayerAvatarTheme(me?.session_key, players)}
        />
      </div>
    </OverviewWrapper>
  );
}
