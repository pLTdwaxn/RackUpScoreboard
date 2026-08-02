"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Button,
  Description,
  Form,
  Input,
  Label,
  Radio,
  RadioGroup,
  TextField,
} from "@heroui/react";

import { useConnection } from "@/hooks/useConnection";
import { useAppDictionary } from "@/i18n/client";

type ScoreKeeperMode = "opp" | "self" | "any";

const NewMatchForm = () => {
  const copy = useAppDictionary().lobby;
  const router = useRouter();
  const { connect, isSubmitting, error, setError } = useConnection();
  const [displayName, setDisplayName] = useState("");
  const [scoreKeeper, setScoreKeeper] = useState<ScoreKeeperMode>("opp");

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
      <RadioGroup defaultValue="best-of-frames" variant="secondary">
        <Label>{copy.winCondition}</Label>
        <Radio value="best-of-frames">
          <Radio.Content>
            <Radio.Control>
              <Radio.Indicator />
            </Radio.Control>
            {copy.bestOfFrames}
          </Radio.Content>
        </Radio>
        <Radio value="open-ended">
          <Radio.Content>
            <Radio.Control>
              <Radio.Indicator />
            </Radio.Control>
            {copy.openEnded}
          </Radio.Content>
        </Radio>
      </RadioGroup>
      <RadioGroup
        value={scoreKeeper}
        onChange={(value) => setScoreKeeper(value as ScoreKeeperMode)}
        variant="secondary"
      >
        <Label>{copy.scorekeepingBy}</Label>
        <Radio value="opp">
          <Radio.Content>
            <Radio.Control>
              <Radio.Indicator />
            </Radio.Control>
            {copy.scorekeepingOpponent}
          </Radio.Content>
          <Description>
            {copy.scorekeepingOpponentDescription}
          </Description>
        </Radio>
        <Radio value="self">
          <Radio.Content>
            <Radio.Control>
              <Radio.Indicator />
            </Radio.Control>
            {copy.scorekeepingSelf}
          </Radio.Content>
          <Description>{copy.scorekeepingSelfDescription}</Description>
        </Radio>
        <Radio value="referee" isDisabled>
          <Radio.Content>
            <Radio.Control>
              <Radio.Indicator />
            </Radio.Control>
            {copy.scorekeepingReferee}
          </Radio.Content>
          <Description>{copy.scorekeepingRefereeDescription}</Description>
        </Radio>
        <Radio value="any">
          <Radio.Content>
            <Radio.Control>
              <Radio.Indicator />
            </Radio.Control>
            {copy.scorekeepingAny}
          </Radio.Content>
          <Description>{copy.scorekeepingAnyDescription}</Description>
        </Radio>
      </RadioGroup>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button className="rounded-2xl" type="submit" isDisabled={isSubmitting}>
        {isSubmitting ? copy.creating : copy.create}
      </Button>
    </Form>
  );
};

export default NewMatchForm;
