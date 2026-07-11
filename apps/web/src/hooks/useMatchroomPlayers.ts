import { useMemo } from "react";

import { useMatchroomGame, useMatchroomSession } from "@/hooks/useSocket";
import { resolvePlayerPair } from "@/types/playerIdentity";

export function useMatchroomPlayers() {
  const { players } = useMatchroomGame();
  const { sessionKey } = useMatchroomSession();

  return useMemo(() => {
    const currentPlayerKey = sessionKey;
    const { me, opponent } = resolvePlayerPair(players, currentPlayerKey);

    return {
      players,
      currentPlayerKey,
      me,
      opponent,
    };
  }, [players, sessionKey]);
}
