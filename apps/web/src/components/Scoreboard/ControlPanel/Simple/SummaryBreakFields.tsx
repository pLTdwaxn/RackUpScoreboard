import { Button, Label, NumberField } from "@heroui/react";
import { IconCheck, IconMinus, IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { useAppDictionary } from "@/i18n/client";

type SummaryBreakFieldsProps = {
  canKeepScore: boolean;
  onSubmit: (score: number, foul: number) => void;
};

function nextValidFoulPoints(nextFoul: number, currentFoul: number): number {
  if (nextFoul <= 0) {
    return 0;
  }

  if (currentFoul === 4 && nextFoul < 4) {
    return 0;
  }

  if (nextFoul < 4) {
    return 4;
  }

  return Math.min(nextFoul, 7);
}

export default function SummaryBreakFields({
  canKeepScore,
  onSubmit,
}: SummaryBreakFieldsProps) {
  const copy = useAppDictionary().controlPanel.summaryBreak;
  const [score, setScore] = useState(0);
  const [foul, setFoul] = useState(0);
  const canSubmit = canKeepScore && (score > 0 || foul > 0);

  return (
    <div className="grid w-full grid-cols-[1fr_1fr_auto] items-end gap-2">
      <NumberField
        minValue={0}
        maxValue={155}
        value={score}
        onChange={setScore}
        isDisabled={!canKeepScore}
        variant="secondary"
        className="space-y-1 text-left"
      >
        <Label>{copy.score}</Label>
        <NumberField.Group>
          <NumberField.DecrementButton
            aria-label={copy.decreaseScore}
            className="px-2"
          >
            <IconMinus size={16} stroke={2} />
          </NumberField.DecrementButton>
          <NumberField.Input aria-label={copy.score} inputMode="numeric" />
          <NumberField.IncrementButton
            aria-label={copy.increaseScore}
            className="px-2"
          >
            <IconPlus size={16} stroke={2} />
          </NumberField.IncrementButton>
        </NumberField.Group>
      </NumberField>

      <NumberField
        minValue={0}
        maxValue={7}
        value={foul}
        onChange={(nextFoul) =>
          setFoul((currentFoul) =>
            nextValidFoulPoints(nextFoul, currentFoul),
          )
        }
        isDisabled={!canKeepScore}
        variant="secondary"
        className="space-y-1 text-left"
      >
        <Label>{copy.foul}</Label>
        <NumberField.Group>
          <NumberField.DecrementButton
            aria-label={copy.decreaseFoul}
            className="px-2"
          >
            <IconMinus size={16} stroke={2} />
          </NumberField.DecrementButton>
          <NumberField.Input aria-label={copy.foul} inputMode="numeric" />
          <NumberField.IncrementButton
            aria-label={copy.increaseFoul}
            className="px-2"
          >
            <IconPlus size={16} stroke={2} />
          </NumberField.IncrementButton>
        </NumberField.Group>
      </NumberField>

      <Button
        aria-label={copy.submit}
        isIconOnly
        isDisabled={!canSubmit}
        onPress={() => onSubmit(score, foul)}
        size="sm"
        type="button"
        variant="primary"
      >
        <IconCheck stroke={2} />
      </Button>
    </div>
  );
}
