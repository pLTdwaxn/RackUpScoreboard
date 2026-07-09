import { GameStateMessage, TableState } from "@/types";

export function useControlPanel(
  frameStatus: GameStateMessage["frame"]["status"],
  table: TableState,
  scoreKeeper: GameStateMessage["score_keeper"],
  currentPlayerKey: string,
  nextFrameConfirmations: string[],
) {
  const isFrameFinished = frameStatus === "finished";
  const hasConfirmedNextFrame =
    nextFrameConfirmations.includes(currentPlayerKey);

  const isAtTable = table.current_turn === currentPlayerKey;

  const canKeepScore = (() => {
    switch (scoreKeeper) {
      case "self":
        return isAtTable;
      case "opp":
        return Boolean(table.current_turn) && !isAtTable;
      case "ref":
        return false;
      case "any":
        return true;
      default:
        return false;
    }
  })();

  const redsRemaining = table.reds_remaining;
  const coloursOnTable = table.colours_on_table;
  const objectBall = table.object_ball;

  return {
    isFrameFinished,
    hasConfirmedNextFrame,
    canKeepScore,
    redsRemaining,
    coloursOnTable,
    objectBall,
  };
}
