import { GameStateMessage, Frame } from "@/types";

export function useControlPanel(
  frame: Frame,
  scoreKeeper: GameStateMessage["score_keeper"],
  currentPlayerKey: string,
  nextFrameConfirmations: string[],
) {
  const isFrameFinished = frame.status === "finished";
  const hasConfirmedNextFrame =
    nextFrameConfirmations.includes(currentPlayerKey);

  const isAtTable = frame.current_turn === currentPlayerKey;

  const canKeepScore = (() => {
    switch (scoreKeeper) {
      case "self":
        return isAtTable;
      case "opp":
        return Boolean(frame.current_turn) && !isAtTable;
      case "ref":
        return false;
      case "any":
        return true;
      default:
        return false;
    }
  })();

  const redsRemaining = frame.reds_remaining;
  const coloursOnTable = frame.colours_on_table;
  const objectBall = frame.object_ball;

  return {
    isFrameFinished,
    hasConfirmedNextFrame,
    canKeepScore,
    redsRemaining,
    coloursOnTable,
    objectBall,
  };
}
