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
  };

  const sendDeclareFreeBall = (nominatedColour: string) => {
    sendAction(createDeclareFreeBallAction(nominatedColour));
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
