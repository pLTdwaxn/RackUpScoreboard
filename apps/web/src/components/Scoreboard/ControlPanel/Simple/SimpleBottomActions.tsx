import { Button, ButtonGroup } from "@heroui/react";
import {
  IconAdjustmentsAlt,
  IconArrowsRightLeft,
  IconBan,
  IconChartCircles,
  IconFlagFilled,
  IconNumber123,
  IconPlayerSkipForward,
} from "@tabler/icons-react";
import { useAppDictionary } from "@/i18n/client";

export type SimpleBottomActionsProps = {
  canKeepScore: boolean;
  canLogSummaryBreak: boolean;
  canUseFoulOptions: boolean;
  isSummaryBreakMode: boolean;
  onConcede: () => void;
  onEnterAdvancedMode: () => void;
  onToggleSummaryBreakMode: () => void;
  onDeclareFoul: () => void;
  onEndTurn: () => void;
  onPassShot?: () => void;
  onDeclareFreeBall?: () => void;
};

export default function SimpleBottomActions({
  canKeepScore,
  canLogSummaryBreak,
  canUseFoulOptions,
  isSummaryBreakMode,
  onConcede,
  onEnterAdvancedMode,
  onToggleSummaryBreakMode,
  onDeclareFoul,
  onEndTurn,
  onPassShot,
  onDeclareFreeBall,
}: SimpleBottomActionsProps) {
  const copy = useAppDictionary().controlPanel.simpleActions;

  return (
    <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-4">
      <div className="justify-self-start">
        <ButtonGroup size="sm">
          <Button
            aria-label={copy.concedeFrame}
            isIconOnly
            variant="danger"
            size="sm"
            onPress={onConcede}
          >
            <IconFlagFilled stroke={2} />
          </Button>
        </ButtonGroup>
      </div>

      <div className="justify-self-center">
        <ButtonGroup variant="secondary" size="sm">
          <Button
            aria-label={copy.switchTurn}
            isIconOnly
            isDisabled={!canKeepScore}
            onPress={onEndTurn}
          >
            <IconArrowsRightLeft stroke={2} />
          </Button>
          <Button
            aria-label={copy.passShot}
            isIconOnly
            size="sm"
            isDisabled={!canUseFoulOptions}
            onPress={onPassShot}
          >
            <ButtonGroup.Separator />
            <IconPlayerSkipForward stroke={2} />
          </Button>
          <Button
            aria-label={copy.declareFreeBall}
            isIconOnly
            size="sm"
            isDisabled={!canUseFoulOptions}
            onPress={onDeclareFreeBall}
          >
            <ButtonGroup.Separator />
            <IconChartCircles stroke={2} />
          </Button>
          <Button
            aria-label={copy.declareFoul}
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
            aria-label={copy.logBreakByNumber}
            isDisabled={!canLogSummaryBreak}
            variant={isSummaryBreakMode ? "primary" : "secondary"}
            isIconOnly
            onPress={onToggleSummaryBreakMode}
            size="sm"
          >
            <IconNumber123 stroke={2} />
          </Button>
          <Button
            aria-label={copy.advancedShotComposer}
            isDisabled={!canKeepScore}
            variant="secondary"
            isIconOnly
            onPress={onEnterAdvancedMode}
            size="sm"
          >
            <ButtonGroup.Separator />
            <IconAdjustmentsAlt stroke={2} />
          </Button>
        </ButtonGroup>
      </div>
    </div>
  );
}
