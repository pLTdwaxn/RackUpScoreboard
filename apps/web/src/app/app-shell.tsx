"use client";

import { Surface } from "@heroui/react";
import { usePathname, useRouter } from "next/navigation";

import MatchroomInviteDrawer from "@/components/Scoreboard/MatchroomInviteDrawer";
import MatchroomOverview from "@/components/Scoreboard/MatchroomOverview";
import Menu from "@/components/SideDrawer/Menu";
import TopRow from "@/components/TopBar/TopBar";
import {
  MatchroomProvider,
  useMatchroomGame,
  useMatchroomSession,
} from "@/hooks/useSocket";
import { useAppDictionary } from "@/i18n/client";
import { buildScoreboardViewModel } from "@/lib/viewModel";

function useMatchroomIdFromPathname() {
  const pathname = usePathname();
  if (!pathname) {
    return "";
  }

  const [, route, id] = pathname.split("/");

  if (route !== "matchroom") {
    return "";
  }

  return id ? decodeURIComponent(id) : "";
}

function MatchroomTopRowContent() {
  const copy = useAppDictionary().appShell;
  const { matchroomId } = useMatchroomSession();
  const { gameState } = useMatchroomGame();
  const viewModel = buildScoreboardViewModel({ gameState });

  if (!matchroomId) {
    return <span className="text-sm font-medium">{copy.lobby}</span>;
  }

  return (
    <MatchroomOverview
      roomReady={viewModel.roomReady}
      playerCount={viewModel.players.length}
      matchroomId={matchroomId}
      clubId={viewModel.matchroom.clubId}
      match={viewModel.match}
    />
  );
}

function MatchroomInviteTopRowContent() {
  const { matchroomId } = useMatchroomSession();
  const { gameState } = useMatchroomGame();
  const viewModel = buildScoreboardViewModel({ gameState });

  return (
    <MatchroomInviteDrawer
      key={viewModel.players.length}
      defaultOpen={viewModel.players.length === 1}
      matchroomId={matchroomId}
    />
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const matchroomId = useMatchroomIdFromPathname();
  const router = useRouter();

  return (
    <MatchroomProvider matchroomId={matchroomId}>
      <Surface
        variant="tertiary"
        className="flex h-full w-full flex-col overflow-hidden p-0"
      >
        <TopRow>
          <Menu
            onLeaveRoom={
              matchroomId
                ? () => {
                    router.push("/");
                  }
                : undefined
            }
          />
          <MatchroomTopRowContent />
          <MatchroomInviteTopRowContent />
        </TopRow>
        <div className="flex flex-1 min-h-0 w-full items-stretch justify-center overflow-hidden p-2">
          {children}
        </div>
      </Surface>
    </MatchroomProvider>
  );
}
