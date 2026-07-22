import { Button } from "@heroui/react";

type FinishedFramePanelProps = {
  winnerKey: string | null;
  currentPlayerKey: string;
  hasConfirmedNextFrame: boolean;
  onNextFrame: () => void;
};

const FinishedFramePanel = ({
  winnerKey,
  currentPlayerKey,
  hasConfirmedNextFrame,
  onNextFrame,
}: FinishedFramePanelProps) => {
  const resultMessage =
    winnerKey === currentPlayerKey
      ? "Congratulations! You won the frame."
      : "You lost the frame.";

  return (
    <div className="flex w-full flex-col items-center justify-center gap-3 py-2">
      <p className="text-lg">{resultMessage}</p>
      {hasConfirmedNextFrame ? (
        <p className="font-mono text-sm tracking-wide uppercase text-muted">
          Waiting for your opponent
        </p>
      ) : (
        <Button variant="primary" onPress={onNextFrame}>
          Start Next Frame
        </Button>
      )}
    </div>
  );
};

export default FinishedFramePanel;
