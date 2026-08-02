import { Button } from "@heroui/react";
import { useAppDictionary } from "@/i18n/client";

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
  const copy = useAppDictionary().controlPanel.finishedFrame;
  const resultMessage =
    winnerKey === currentPlayerKey
      ? copy.won
      : copy.lost;

  return (
    <div className="flex w-full flex-col items-center justify-center gap-3 py-2">
      <p className="text-lg">{resultMessage}</p>
      {hasConfirmedNextFrame ? (
        <p className="font-mono text-sm tracking-wide uppercase text-muted">
          {copy.waitingForOpponent}
        </p>
      ) : (
        <Button variant="primary" onPress={onNextFrame}>
          {copy.startNextFrame}
        </Button>
      )}
    </div>
  );
};

export default FinishedFramePanel;
