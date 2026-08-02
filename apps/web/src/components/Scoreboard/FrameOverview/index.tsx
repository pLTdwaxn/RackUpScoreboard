"use client";

import { useMatchroomFrame } from "@/hooks/useMatchroomFrame";
import { useAppDictionary } from "@/i18n/client";
import type { Player } from "@/types";

import FrameStats from "./FrameStats";
import OverviewWrapper from "./OverviewWrapper";
import ScoreCard from "./ScoreCard";
import { useMatchroomPlayers } from "@/hooks/useMatchroomPlayers";
import { getPlayerAvatarTheme } from "../shared/playerIdentity";

export { default as FrameStats } from "./FrameStats";
export { default as OverviewWrapper } from "./OverviewWrapper";
export { default as ScoreCard } from "./ScoreCard";

export default function FrameOverview() {
  const copy = useAppDictionary().frameOverview;
  const { me, opponent, players = [] } = useMatchroomPlayers();
  const { hasFrame, frame, isMyTurn, isOpponentTurn, winningPlayerKey } =
    useMatchroomFrame();
  const waitingOpponent: Player = {
    session_key: "__waiting_opponent__",
    name: copy.waitingPlayer,
    type: "placeholder",
    match_score: 0,
    current_frame_score: 0,
    highest_break: null,
  };
  const opponentCardPlayer = opponent ?? waitingOpponent;
  const opponentTheme = opponent
    ? getPlayerAvatarTheme(opponent.session_key, players)
    : "blue";

  if (!hasFrame) {
    return null;
  }

  return (
    <OverviewWrapper>
      <FrameStats frame={frame} />
      <div className="grid w-full grid-cols-2 gap-2 overflow-visible p-1">
        <ScoreCard
          player={opponentCardPlayer}
          frame={frame}
          currentTurn={isOpponentTurn}
          isFrameWinner={opponent?.session_key === winningPlayerKey}
          playerTheme={opponentTheme}
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
