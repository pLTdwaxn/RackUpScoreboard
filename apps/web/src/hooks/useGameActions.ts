import { RoomClientAction } from "@/types";
import {
  createConcedeAction,
  createDeclareFreeBallAction,
  createNextFrameAction,
  createPassShotAction,
  createShotAction,
  createUndoAction,
} from "@/lib/roomActions";

export function useGameActions(
  sendAction: (action: RoomClientAction) => void,
) {
  const sendShot = (pottedBalls: string[], foul = 0) => {
    sendAction(createShotAction(pottedBalls, foul));
  };

  const sendEndTurn = () => {
    sendAction(createShotAction([], 0));
  };

  const sendUndo = () => {
    sendAction(createUndoAction());
  };

  const sendConcede = () => {
    sendAction(createConcedeAction());
  };

  const sendPassShot = () => {
    sendAction(createPassShotAction());
    toast.info(`${turnPlayerName} passed their shot`, {
      timeout: 2000,
    });
  };

  const sendDeclareFreeBall = () => {
    sendAction(createDeclareFreeBallAction());
    toast.info(`${turnPlayerName} declared a free ball`, {
      timeout: 2000,
    });
  };

  const sendNextFrame = () => {
    sendAction(createNextFrameAction());
  };

  return {
    sendShot,
    sendEndTurn,
    sendUndo,
    sendConcede,
    sendPassShot,
    sendDeclareFreeBall,
    sendNextFrame,
  };
}
