"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button, Form, Input, Label, TextField } from "@heroui/react";

import { useConnection } from "@/hooks/useConnection";

type JoinMatchFormProps = {
  initialMatchroomId?: string;
};

const JoinMatchForm = ({ initialMatchroomId = "" }: JoinMatchFormProps) => {
  const router = useRouter();
  const { connect, isSubmitting, error, setError } = useConnection();
  const [displayName, setDisplayName] = useState("");
  const [matchroomId, setMatchroomId] = useState(initialMatchroomId);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!matchroomId.trim()) {
      setError("Enter a matchroom ID to join.");
      return;
    }

    try {
      const connection = await connect({
        displayName,
        matchroomId,
      });

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
      <TextField className="space-y-2" isRequired>
        <Label>Matchroom ID</Label>
        <Input
          placeholder="Enter matchroom ID"
          value={matchroomId}
          onChange={(event) => {
            setMatchroomId(event.target.value);
            if (error) {
              setError(null);
            }
          }}
        />
      </TextField>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button className="rounded-2xl" type="submit" isDisabled={isSubmitting}>
        {isSubmitting ? "Joining..." : "Join"}
      </Button>
    </Form>
  );
};

export default JoinMatchForm;
