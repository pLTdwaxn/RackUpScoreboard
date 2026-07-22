"use client";

import { useParams } from "next/navigation";

import { LobbyCard } from "@/components/Lobby";
import Scoreboard from "@/components/Scoreboard/Scoreboard";
import { useMatchroomSession } from "@/hooks/useSocket";

export default function MatchPage() {
  const params = useParams<{ id?: string }>();
  const { hydrated, hasRoomSession, readyToRenderRoom } = useMatchroomSession();
  const matchroomId = typeof params?.id === "string" ? params.id : "";

  if (!hydrated || !hasRoomSession) {
    return (
      <div className="flex h-full w-full items-center justify-center p-2">
        <LobbyCard initialMatchroomId={matchroomId} />
      </div>
    );
  }

  if (!readyToRenderRoom) {
    return (
      <div className="flex h-full w-full items-center justify-center p-4 text-sm text-muted">
        Connecting to matchroom...
      </div>
    );
  }

  return <Scoreboard />;
}
