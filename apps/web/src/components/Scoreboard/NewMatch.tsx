"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Button, Card, Form, Input, Label, TextField } from "@heroui/react";

import { ConnectedInstance } from "@/types";

type ConnectResponse = {
  instance_id: string;
  display_name: string;
  matchroom_id: string;
  identity_type?: string;
};

type NewMatchProps = {
  onConnected: (payload: {
    instance: ConnectedInstance;
    matchroomId: string;
  }) => void;
};

export default function NewMatch({ onConnected }: NewMatchProps) {
  const searchParams = useSearchParams();
  const [displayName, setDisplayName] = useState("");
  const [matchroomId, setMatchroomId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matchroomFromUrl = (searchParams.get("matchroom") ?? "").trim();
  const isMatchroomLocked = matchroomFromUrl.length > 0;
  const effectiveMatchroomId = isMatchroomLocked
    ? matchroomFromUrl
    : matchroomId;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setError("Enter your name to continue.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const apiBase =
        process.env.NEXT_PUBLIC_API_BASE ?? "http://127.0.0.1:8004";
      const response = await fetch(`${apiBase}/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          display_name: trimmedName,
          matchroom_id: effectiveMatchroomId.trim() || undefined,
        }),
      });

      const payload = (await response.json()) as
        | ConnectResponse
        | { detail?: string };

      if (
        !response.ok ||
        !("instance_id" in payload) ||
        !("display_name" in payload) ||
        !("matchroom_id" in payload)
      ) {
        throw new Error(
          "detail" in payload && payload.detail
            ? payload.detail
            : "Could not connect to the scoreboard service.",
        );
      }

      onConnected({
        instance: {
          instanceId: payload.instance_id,
          displayName: payload.display_name,
          playerKey:
            payload.identity_type === "verified"
              ? `user_${payload.instance_id}`
              : `anon_${payload.instance_id}`,
        },
        matchroomId: payload.matchroom_id,
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Could not connect to the scoreboard service.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <Card.Header className="flex-col items-start gap-1">
        <h1>New Match</h1>
      </Card.Header>
      <Card.Content>
        <Form className="w-full space-y-4" onSubmit={handleSubmit}>
          <TextField className="space-y-2" isRequired>
            <Label>Name</Label>
            <Input
              placeholder="Enter your name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
          </TextField>
          <TextField className="space-y-2">
            <Label>
              {isMatchroomLocked
                ? "Matchroom ID (from invite link)"
                : "Matchroom ID (optional)"}
            </Label>
            <Input
              placeholder={
                isMatchroomLocked
                  ? "Matchroom from invite"
                  : "Leave empty to create room"
              }
              value={effectiveMatchroomId}
              disabled={isMatchroomLocked}
              onChange={(event) => {
                if (!isMatchroomLocked) {
                  setMatchroomId(event.target.value);
                }
              }}
            />
          </TextField>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <Button
            className="rounded-2xl"
            isDisabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Connecting..." : "Connect"}
          </Button>
        </Form>
      </Card.Content>
    </Card>
  );
}
