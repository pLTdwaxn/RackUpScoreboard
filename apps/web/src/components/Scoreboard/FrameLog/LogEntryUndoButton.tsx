import { Button } from "@heroui/react";
import { IconArrowBackUp } from "@tabler/icons-react";
import { useAppDictionary } from "@/i18n/client";

type LogEntryUndoButtonProps = {
  canUndo: boolean;
  onUndo: () => void;
};

export default function LogEntryUndoButton({
  canUndo,
  onUndo,
}: LogEntryUndoButtonProps) {
  const copy = useAppDictionary().frameLog;

  return (
    <Button
      size="sm"
      aria-label={copy.undoLatestAction}
      isIconOnly
      isDisabled={!canUndo}
      variant={canUndo ? "primary" : "ghost"}
      onPress={onUndo}
      className={`absolute right-2 top-1/2 -translate-y-1/2 ${
        canUndo
          ? "bg-warning/80 hover:bg-warning/70 focus:bg-warning/70 active:bg-warning/60"
          : ""
      }`}
    >
      <IconArrowBackUp stroke={2} />
    </Button>
  );
}
