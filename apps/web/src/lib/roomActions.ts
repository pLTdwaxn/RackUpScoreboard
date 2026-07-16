import { RoomClientAction } from "@/types";

export function createShotAction(
  pottedBalls: string[],
  foul = 0,
): RoomClientAction {
  return {
    action: "shot",
    data: {
      potted_balls: pottedBalls,
      foul,
    },
  };
}

export function createPassShotAction(): RoomClientAction {
  return {
    action: "pass_shot",
    data: {},
  };
}

export function createDeclareFreeBallAction(
  nominatedColour: string,
): RoomClientAction {
  return {
    action: "declare_free_ball",
    data: {
      nominated_colour: nominatedColour,
    },
  };
}

export function createUndoAction(): RoomClientAction {
  return {
    action: "undo",
    data: {},
  };
}

export function createConcedeAction(): RoomClientAction {
  return {
    action: "concede",
    data: {},
  };
}

export function createNextFrameAction(): RoomClientAction {
  return {
    action: "next_frame",
    data: {},
  };
}
