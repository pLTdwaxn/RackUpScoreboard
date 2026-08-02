import { Button } from "@heroui/react";
import { IconArrowBackUp } from "@tabler/icons-react";
import { useAppDictionary } from "@/i18n/client";

type UndoSlotProps = {
  canUndo: boolean;
  onUndo: () => void;
};

export default function UndoSlot({ canUndo, onUndo }: UndoSlotProps) {
  const copy = useAppDictionary().frameLog;

  return (
    <div className="flex shrink-0 items-center justify-center">
      <Button
        aria-label={copy.undoLatestAction}
        isIconOnly
        isDisabled={!canUndo}
        size="sm"
        variant={canUndo ? "primary" : "ghost"}
        onPress={onUndo}
        className={
          canUndo
            ? "bg-warning/80 hover:bg-warning/70 focus:bg-warning/70 active:bg-warning/60"
            : "invisible"
        }
      >
        <IconArrowBackUp stroke={2} />
      </Button>
    </div>
  );
}
