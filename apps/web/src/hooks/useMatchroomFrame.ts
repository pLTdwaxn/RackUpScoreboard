import { useMemo } from "react";

import { useMatchroomGame } from "@/hooks/useSocket";
import { useMatchroomPlayers } from "@/hooks/useMatchroomPlayers";
import { DEFAULT_FRAME } from "@/lib/viewModel";

export function useMatchroomFrame() {
  const { gameState } = useMatchroomGame();
  const { currentPlayerKey, opponent } = useMatchroomPlayers();

  return useMemo(() => {
    const hasFrame = Boolean(gameState?.current_frame);
    const frame = gameState?.current_frame ?? DEFAULT_FRAME;
    const winningPlayerKey =
      frame.status === "finished" ? frame.winner_key : null;
    const isMyTurn = frame.current_turn === currentPlayerKey;
    const isOpponentTurn = Boolean(
      opponent && frame.current_turn === opponent.session_key,
    );
    const currentBreak = frame.current_break ?? 0;

    return {
      hasFrame,
      frame,
      winningPlayerKey,
      isMyTurn,
      isOpponentTurn,
      currentBreak,
      previouslyFouled: frame.previously_fouled ?? false,
      myCurrentBreak: isMyTurn ? currentBreak : 0,
      opponentCurrentBreak: isOpponentTurn ? currentBreak : 0,
      scoreKeeper: gameState?.score_keeper ?? "opp",
      nextFrameConfirmations: gameState?.next_frame_confirmations ?? [],
      myScore: frame.scores[currentPlayerKey] ?? 0,
      opponentScore: opponent ? (frame.scores[opponent.session_key] ?? 0) : 0,
    };
  }, [gameState, currentPlayerKey, opponent]);
}
