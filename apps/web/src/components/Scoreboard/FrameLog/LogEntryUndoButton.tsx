import { Button } from "@heroui/react";
import { IconArrowBackUp } from "@tabler/icons-react";

type LogEntryUndoButtonProps = {
  canUndo: boolean;
  onUndo: () => void;
};

export default function LogEntryUndoButton({
  canUndo,
  onUndo,
}: LogEntryUndoButtonProps) {
  return (
    <Button
      size="sm"
      aria-label="Undo latest frame log action"
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
