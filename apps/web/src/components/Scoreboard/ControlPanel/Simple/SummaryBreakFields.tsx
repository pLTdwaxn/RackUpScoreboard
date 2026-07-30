import { Button, Label, NumberField } from "@heroui/react";
import { IconCheck, IconMinus, IconPlus } from "@tabler/icons-react";
import { useState } from "react";

type SummaryBreakFieldsProps = {
  canKeepScore: boolean;
};

export default function SummaryBreakFields({
  canKeepScore,
}: SummaryBreakFieldsProps) {
  const [score, setScore] = useState(0);
  const [foul, setFoul] = useState(0);

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
        <Label>Score</Label>
        <NumberField.Group>
          <NumberField.DecrementButton
            aria-label="Decrease score"
            className="px-2"
          >
            <IconMinus size={16} stroke={2} />
          </NumberField.DecrementButton>
          <NumberField.Input aria-label="Score" inputMode="numeric" />
          <NumberField.IncrementButton
            aria-label="Increase score"
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
        onChange={setFoul}
        isDisabled={!canKeepScore}
        variant="secondary"
        className="space-y-1 text-left"
      >
        <Label>Foul</Label>
        <NumberField.Group>
          <NumberField.DecrementButton
            aria-label="Decrease foul"
            className="px-2"
          >
            <IconMinus size={16} stroke={2} />
          </NumberField.DecrementButton>
          <NumberField.Input aria-label="Foul" inputMode="numeric" />
          <NumberField.IncrementButton
            aria-label="Increase foul"
            className="px-2"
          >
            <IconPlus size={16} stroke={2} />
          </NumberField.IncrementButton>
        </NumberField.Group>
      </NumberField>

      <Button
        aria-label="Submit logged break"
        isIconOnly
        isDisabled
        size="sm"
        type="button"
        variant="primary"
      >
        <IconCheck stroke={2} />
      </Button>
    </div>
  );
}
