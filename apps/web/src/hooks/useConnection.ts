"use client";

import { useState } from "react";

import { MatchroomConnection } from "@/types";
import { getAppDictionary } from "@/i18n";
import { getClientApiBase } from "@/lib/env";

const ROOM_SESSION_KEY_STORAGE_KEY = "scoreboard.room_session_key";

function persistSession(connection: MatchroomConnection): void {
  if (typeof window === "undefined") {
    return;
  }

  const byRoomRaw = sessionStorage.getItem(ROOM_SESSION_KEY_STORAGE_KEY);
  let byRoom: Record<string, string> = {};

  if (byRoomRaw) {
    try {
      byRoom = JSON.parse(byRoomRaw) as Record<string, string>;
    } catch {
      sessionStorage.removeItem(ROOM_SESSION_KEY_STORAGE_KEY);
    }
  }

  byRoom[connection.matchroomId] = connection.playerKey;
  sessionStorage.setItem(ROOM_SESSION_KEY_STORAGE_KEY, JSON.stringify(byRoom));
  window.dispatchEvent(
    new CustomEvent("scoreboard:room-session-updated", {
      detail: {
        matchroomId: connection.matchroomId,
        playerKey: connection.playerKey,
      },
    }),
  );
}

type ConnectParams = {
  displayName: string;
  matchroomId?: string;
  scoreKeeper?: "self" | "opp" | "ref" | "any";
};

export function useConnection() {
  const copy = getAppDictionary("en").errors;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = async ({
    displayName,
    matchroomId,
    scoreKeeper,
  }: ConnectParams) => {
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      throw new Error(copy.enterName);
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const apiBase = getClientApiBase();
      if (!apiBase) {
        throw new Error(copy.backendUrlNotConfigured);
      }

      const response = await fetch(`${apiBase}/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          display_name: trimmedName,
          matchroom_id: matchroomId?.trim() || undefined,
          score_keeper: scoreKeeper,
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
      ) {
        throw new Error(
          "detail" in payload && payload.detail
            ? payload.detail
            : copy.connectionFailed,
        );
      }

      const connection: MatchroomConnection = {
        matchroomId: String(payload.matchroom_id),
        displayName: String(payload.display_name),
        playerKey: String(payload.player_key),
        identityType:
          String(payload.identity_type) === "verified"
            ? "verified"
            : "anonymous",
      };

      persistSession(connection);
      return connection;
    } catch (connectError) {
      const message =
        connectError instanceof Error
          ? connectError.message
          : copy.connectionFailed;
      setError(message);
      throw new Error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    connect,
    isSubmitting,
    error,
    setError,
  };
}
