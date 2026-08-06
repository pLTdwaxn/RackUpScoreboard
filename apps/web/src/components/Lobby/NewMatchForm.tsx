"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Button,
  Description,
  Form,
  Input,
  Label,
  ListBox,
  TextField,
} from "@heroui/react";
import { IconCheck } from "@tabler/icons-react";

import { useConnection } from "@/hooks/useConnection";
import { useAppDictionary } from "@/i18n/client";

type WinConditionMode = "best-of-frames" | "open-ended";
type ScoreKeeperMode = "opp" | "self" | "any";
type ChoiceOption<T extends string> = {
  id: T;
  label: string;
  description: string;
};

type ChoiceListProps<T extends string> = {
  label: string;
  options: ChoiceOption<T>[];
  selected: T;
  onChange: (value: T) => void;
};

function ChoiceList<T extends string>({
  label,
  options,
  selected,
  onChange,
}: ChoiceListProps<T>) {
  const selectedOption =
    options.find((option) => option.id === selected) ?? options[0];

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <ListBox
        aria-label={label}
        selectedKeys={new Set([selected])}
        onSelectionChange={(keys) => {
          if (keys === "all") {
            return;
          }

          const [value] = Array.from(keys);
          const option = options.find((item) => item.id === value);
          if (option) {
            onChange(option.id);
          }
        }}
        selectionMode="single"
      >
        {options.map((option) => (
          <ListBox.Item
            key={option.id}
            id={option.id}
            textValue={option.label}
            className="data-[selected=true]:border-success/40 data-[selected=true]:bg-success/15"
          >
            <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
              <span className="min-w-0 truncate">{option.label}</span>
              <ListBox.ItemIndicator>
                {({ isSelected }) =>
                  isSelected ? (
                    <IconCheck className="text-success" stroke={2} />
                  ) : null
                }
              </ListBox.ItemIndicator>
            </div>
          </ListBox.Item>
        ))}
      </ListBox>
      <Description>{selectedOption.description}</Description>
    </div>
  );
}

const NewMatchForm = () => {
  const copy = useAppDictionary().lobby;
  const router = useRouter();
  const { connect, isSubmitting, error, setError } = useConnection();
  const [displayName, setDisplayName] = useState("");
  const [winCondition, setWinCondition] =
    useState<WinConditionMode>("best-of-frames");
  const [scoreKeeper, setScoreKeeper] = useState<ScoreKeeperMode>("any");
  const winConditionOptions: ChoiceOption<WinConditionMode>[] = [
    {
      id: "best-of-frames",
      label: copy.bestOfFrames,
      description: copy.bestOfFramesDescription,
    },
    {
      id: "open-ended",
      label: copy.openEnded,
      description: copy.openEndedDescription,
    },
  ];
  const scoreKeeperOptions: ChoiceOption<ScoreKeeperMode>[] = [
    {
      id: "any",
      label: copy.scorekeepingAny,
      description: copy.scorekeepingAnyDescription,
    },
    {
      id: "self",
      label: copy.scorekeepingSelf,
      description: copy.scorekeepingSelfDescription,
    },
    {
      id: "opp",
      label: copy.scorekeepingOpponent,
      description: copy.scorekeepingOpponentDescription,
    },
  ];

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const connection = await connect({ displayName, scoreKeeper });
      router.push(`/matchroom/${encodeURIComponent(connection.matchroomId)}`);
    } catch {
      // Error state is already handled in the connection hook.
    }
  };

  return (
    <Form className="w-full space-y-4" onSubmit={handleSubmit}>
      <TextField className="space-y-2" isRequired>
        <Label>{copy.name}</Label>
        <Input
          placeholder={copy.namePlaceholder}
          value={displayName}
          onChange={(event) => {
            setDisplayName(event.target.value);
            if (error) {
              setError(null);
            }
          }}
        />
      </TextField>
      <ChoiceList
        label={copy.winCondition}
        options={winConditionOptions}
        selected={winCondition}
        onChange={setWinCondition}
      />
      <ChoiceList
        label={copy.scorekeepingBy}
        options={scoreKeeperOptions}
        selected={scoreKeeper}
        onChange={setScoreKeeper}
      />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button type="submit" isDisabled={isSubmitting}>
        {isSubmitting ? copy.creating : copy.create}
      </Button>
    </Form>
  );
};

export default NewMatchForm;
