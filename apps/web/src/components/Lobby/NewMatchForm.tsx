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

type ScoreKeeperMode = "opp" | "self" | "any";

const NewMatchForm = () => {
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
        <Label>Name</Label>
        <Input
          placeholder="Enter your name"
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
        <Label>Win Condition</Label>
        <Radio value="best-of-frames">
          <Radio.Content>
            <Radio.Control>
              <Radio.Indicator />
            </Radio.Control>
            Best of Frames
          </Radio.Content>
        </Radio>
        <Radio value="open-ended">
          <Radio.Content>
            <Radio.Control>
              <Radio.Indicator />
            </Radio.Control>
            Open Ended
          </Radio.Content>
        </Radio>
      </RadioGroup>
      <RadioGroup
        value={scoreKeeper}
        onChange={(value) => setScoreKeeper(value as ScoreKeeperMode)}
        variant="secondary"
      >
        <Label>Scorekeeping By</Label>
        <Radio value="opp">
          <Radio.Content>
            <Radio.Control>
              <Radio.Indicator />
            </Radio.Control>
            Opponent
          </Radio.Content>
          <Description>
            The player not at the table is scorekeeping.
          </Description>
        </Radio>
        <Radio value="self">
          <Radio.Content>
            <Radio.Control>
              <Radio.Indicator />
            </Radio.Control>
            Self
          </Radio.Content>
          <Description>The player at the table is scorekeeping.</Description>
        </Radio>
        <Radio value="referee" isDisabled>
          <Radio.Content>
            <Radio.Control>
              <Radio.Indicator />
            </Radio.Control>
            Referee (TBA)
          </Radio.Content>
          <Description>A referee is scorekeeping for both players.</Description>
        </Radio>
        <Radio value="any">
          <Radio.Content>
            <Radio.Control>
              <Radio.Indicator />
            </Radio.Control>
            Free for All
          </Radio.Content>
          <Description>Any player can scorekeep.</Description>
        </Radio>
      </RadioGroup>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button className="rounded-2xl" type="submit" isDisabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create"}
      </Button>
    </Form>
  );
};

export default NewMatchForm;
