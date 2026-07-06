import { Button, ButtonGroup, Surface } from "@heroui/react";

import { GameStateMessage, TableState } from "@/types";

import { BallButtons } from ".";

type ControlsProps = {
  table: TableState;
  scoreKeeper: GameStateMessage["score_keeper"];
  currentPlayerKey: string;
  sendPot: (color: string) => void;
  sendFoul: () => void;
  sendEndTurn: () => void;
  sendUndo: () => void;
};

export default function Controls({
  table,
  scoreKeeper,
  currentPlayerKey,
  sendPot,
  sendFoul,
  sendEndTurn,
  sendUndo,
}: ControlsProps) {
  const redsRemaining = table.reds_remaining;
  const coloursOnTable = table.colours_on_table;
  const objectBall = table.object_ball;
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

  const scoreKeepingNote = (() => {
    switch (scoreKeeper) {
      case "self":
        return "Scorekeeping for yourself";
      case "opp":
        return "Scorekeeping for your opponent";
      case "ref":
        return "Scorekeeping as a referee";
      case "any":
        return "Scorekeeping for any player";
      default:
        return "";
    }
  })();

  return (
    <Surface
      variant="default"
      className="mt-auto w-full shrink-0 items-center space-y-4 rounded-4xl p-2 text-center"
    >
      <p className="text-muted m-1">{scoreKeepingNote}</p>
      <BallButtons
        redsRemaining={redsRemaining}
        coloursOnTable={coloursOnTable}
        objectBall={objectBall}
        canKeepScore={canKeepScore}
        sendPot={sendPot}
      />
      <ButtonGroup variant="secondary" size="sm" className="mb-0">
        <Button isDisabled={!canKeepScore} onPress={sendEndTurn}>
          End Break
        </Button>
        <Button variant="danger" isDisabled={!canKeepScore} onPress={sendFoul}>
          <ButtonGroup.Separator />
          Foul
        </Button>
      </ButtonGroup>

      <ButtonGroup variant="secondary" size="sm" className="mb-0">
        <Button variant="ghost" size="sm" onPress={sendUndo}>
          Undo
        </Button>
        <Button variant="ghost" size="sm" onPress={sendUndo}>
          Concede
        </Button>
      </ButtonGroup>
    </Surface>
  );
}
