import { toast } from "@heroui/react";
import { RoomClientAction } from "@/types";
import {
  createConcedeAction,
  createNextFrameAction,
  createShotAction,
  createUndoAction,
} from "@/lib/roomActions";

export function useGameActions(
  sendAction: (action: RoomClientAction) => void,
  turnPlayerName: string,
) {
  const sendShot = (pottedBalls: string[], foul = 0) => {
    sendAction(createShotAction(pottedBalls, foul));
    toast.success(`${turnPlayerName} potted ${pottedBalls.join(", ")}`, {
      timeout: 2000,
    });
  };

  const sendEndTurn = () => {
    sendAction(createShotAction([], 0));
    toast.info(`${turnPlayerName} ended their turn`, {
      timeout: 2000,
    });
  };

  const sendUndo = () => {
    sendAction(createUndoAction());
    toast.warning(`You reverted the last action`, {
      timeout: 2000,
    });
  };

  const sendConcede = () => {
    sendAction(createConcedeAction());
    toast.warning(`${turnPlayerName} conceded the frame`, {
      timeout: 2000,
    });
  };

  const sendNextFrame = () => {
    sendAction(createNextFrameAction());
    toast.info("Confirmed: ready for the next frame", {
      timeout: 2000,
    });
  };

  return { sendShot, sendEndTurn, sendUndo, sendConcede, sendNextFrame };
}
