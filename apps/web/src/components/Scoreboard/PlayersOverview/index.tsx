"use client";

import { useMatchroomFrame } from "@/hooks/useMatchroomFrame";
import { useMatchroomPlayers } from "@/hooks/useMatchroomPlayers";

import OverviewWrapper from "./OverviewWrapper";
import PlayerPairDisplay from "./PlayerPairDisplay";

export { default as OverviewWrapper } from "./OverviewWrapper";
export { default as PlayerPairDisplay } from "./PlayerPairDisplay";
export { default as PlayerCard } from "./PlayerCard";

export default function PlayersOverview() {
  const { hasFrame, winningPlayerKey } = useMatchroomFrame();
  const { me, opponent } = useMatchroomPlayers();

  if (!hasFrame) {
    return null;
  }

  return (
    <OverviewWrapper>
      <PlayerPairDisplay
        me={me}
        opponent={opponent}
        winningPlayerKey={winningPlayerKey}
      />
    </OverviewWrapper>
  );
}
