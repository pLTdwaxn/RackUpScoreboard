import { toast } from "@heroui/react";

export function useGameActions(
  sendEvent: (payload: Record<string, unknown>) => void,
  turnPlayerName: string,
) {
  const sendShot = (pottedBalls: string[], foul = 0) => {
    sendEvent({
      action: "shot",
      data: {
        potted_balls: pottedBalls,
        foul,
      },
    });
    toast.success(`${turnPlayerName} potted ${pottedBalls.join(", ")}`, {
      timeout: 2000,
    });
  };

  const sendEndTurn = () => {
    sendEvent({
      action: "shot",
      data: {
        potted_balls: [],
        foul: 0,
      },
    });
    toast.info(`${turnPlayerName} ended their turn`, {
      timeout: 2000,
    });
  };

  const sendUndo = () => {
    sendEvent({ action: "undo", data: {} });
    toast.warning(`You reverted the last action`, {
      timeout: 2000,
    });
  };

  return { sendShot, sendEndTurn, sendUndo };
}
