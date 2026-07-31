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

export function createLogBreakAction(points: number, foul = 0): RoomClientAction {
  return {
    action: "log_break",
    data: {
      points,
      foul,
    },
  };
}

export function createResolveBreakCompositionAction(
  entryId: string,
  suggestionId: string,
): RoomClientAction {
  return {
    action: "resolve_break_composition",
    data: {
      entry_id: entryId,
      suggestion_id: suggestionId,
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
