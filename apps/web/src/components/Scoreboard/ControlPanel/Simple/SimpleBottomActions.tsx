import { Button, ButtonGroup } from "@heroui/react";
import {
  IconAdjustmentsAlt,
  IconArrowsRightLeft,
  IconBan,
  IconChartCircles,
  IconFlagFilled,
  IconPlayerSkipForward,
} from "@tabler/icons-react";

export type SimpleBottomActionsProps = {
  canKeepScore: boolean;
  canUseFoulOptions: boolean;
  onConcede: () => void;
  onEnterAdvancedMode: () => void;
  onDeclareFoul: () => void;
  onEndTurn: () => void;
  onPassShot?: () => void;
  onDeclareFreeBall?: () => void;
};

export default function SimpleBottomActions({
  canKeepScore,
  canUseFoulOptions,
  onConcede,
  onEnterAdvancedMode,
  onDeclareFoul,
  onEndTurn,
  onPassShot,
  onDeclareFreeBall,
}: SimpleBottomActionsProps) {
  return (
    <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-4">
      <div className="justify-self-start">
        <ButtonGroup size="sm">
          <Button isIconOnly variant="danger" size="sm" onPress={onConcede}>
            <IconFlagFilled stroke={2} />
          </Button>
        </ButtonGroup>
      </div>

      <div className="justify-self-center">
        <ButtonGroup variant="secondary" size="sm">
          <Button isIconOnly isDisabled={!canKeepScore} onPress={onEndTurn}>
            <IconArrowsRightLeft stroke={2} />
          </Button>
          <Button
            isIconOnly
            size="sm"
            isDisabled={!canUseFoulOptions}
            onPress={onPassShot}
          >
            <ButtonGroup.Separator />
            <IconPlayerSkipForward stroke={2} />
          </Button>
          <Button
            isIconOnly
            size="sm"
            isDisabled={!canUseFoulOptions}
            onPress={onDeclareFreeBall}
          >
            <ButtonGroup.Separator />
            <IconChartCircles stroke={2} />
          </Button>
          <Button
            isIconOnly
            variant="danger-soft"
            isDisabled={!canKeepScore}
            onPress={onDeclareFoul}
          >
            <ButtonGroup.Separator />
            <IconBan stroke={2} />
          </Button>
        </ButtonGroup>
      </div>

      <div className="justify-self-end">
        <ButtonGroup variant="secondary" size="sm">
          <Button
            isDisabled={!canKeepScore}
            variant="secondary"
            isIconOnly
            onPress={onEnterAdvancedMode}
            size="sm"
          >
            <IconAdjustmentsAlt stroke={2} />
          </Button>
        </ButtonGroup>
      </div>
    </div>
  );
}
