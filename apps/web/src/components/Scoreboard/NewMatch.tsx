"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";

import { Button, Card, Form, Input, Label, TextField } from "@heroui/react";

import { MatchroomConnection } from "@/types";

type NewMatchProps = {
  onConnected: (connection: MatchroomConnection) => void;
};

export default function NewMatch({ onConnected }: NewMatchProps) {
  const searchParams = useSearchParams();
  const [displayName, setDisplayName] = useState("");
  const [matchroomId, setMatchroomId] = useState(
    searchParams.get("matchroom") ?? "".trim(),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // const matchroomFromUrl = (searchParams.get("matchroom") ?? "").trim();

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
          matchroom_id: matchroomId.trim() || undefined,
        }),
      });

      const payload = (await response.json()) as
        | MatchroomConnection
        | { detail?: string };

      if (
        !response.ok ||
        !("matchroom_id" in payload) ||
        !("display_name" in payload) ||
        !("player_key" in payload) ||
        !("identity_type" in payload)
        // !("instance_id" in payload) ||
      ) {
        throw new Error(
          "detail" in payload && payload.detail
            ? payload.detail
            : "Could not connect to the scoreboard service.",
        );
      }

      onConnected({
        matchroomId: String(payload.matchroom_id),
        displayName: String(payload.display_name),
        playerKey: String(payload.player_key),
        identityType:
          String(payload.identity_type) === "verified"
            ? "verified"
            : "anonymous",
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
          <TextField
            className="space-y-2"
            value={matchroomId}
            onChange={setMatchroomId}
          >
            <Label>Matchroom ID</Label>
            <Input placeholder={"Leave empty to create room"} />
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
