import { Button } from "@heroui/react";
import { IconCheck, IconX } from "@tabler/icons-react";
import { useAppDictionary } from "@/i18n/client";

export type AdvancedBottomActionsProps = {
  canKeepScore: boolean;
  foulMode: boolean;
  comboIsFoul: boolean;
  hasSelectedBalls: boolean;
  onExitAdvancedMode: () => void;
  onChangeFoulMode: (isFoulMode: boolean) => void;
  onSubmit: () => void;
};

export default function AdvancedBottomActions({
  canKeepScore,
  foulMode,
  comboIsFoul,
  hasSelectedBalls,
  onExitAdvancedMode,
  onChangeFoulMode,
  onSubmit,
}: AdvancedBottomActionsProps) {
  const copy = useAppDictionary().controlPanel.advanced;

  return (
    <div className="flex w-full flex-row items-center justify-between gap-4">
      <div>
        <Button
          variant={foulMode ? "danger" : "outline"}
          onPress={() => {
            onChangeFoulMode(!foulMode);
          }}
          size="sm"
        >
          {foulMode ? copy.foulDeclaringOn : copy.foulDeclaringOff}
        </Button>
      </div>
      <div></div>
      <div className="flex flex-wrap gap-1">
        <Button
          isIconOnly
          variant={foulMode || comboIsFoul ? "danger" : "primary"}
          isDisabled={!canKeepScore || !hasSelectedBalls}
          onPress={onSubmit}
          size="sm"
        >
          <IconCheck stroke={2} />
        </Button>
        <Button
          isIconOnly
          variant="secondary"
          onPress={onExitAdvancedMode}
          size="sm"
        >
          <IconX stroke={2} />
        </Button>
      </div>
    </div>
  );
}
