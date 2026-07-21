"use client";

import { Surface } from "@heroui/react";
import { usePathname, useRouter } from "next/navigation";

import MatchroomOverview from "@/components/Scoreboard/MatchroomOverview";
import Menu from "@/components/SideDrawer/Menu";
import ThemeToggle from "@/components/ThemeToggle";
import TopRow from "@/components/TopBar/TopBar";
import {
  MatchroomProvider,
  useMatchroomGame,
  useMatchroomSession,
} from "@/hooks/useSocket";
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
  const router = useRouter();
  const { matchroomId } = useMatchroomSession();
  const { gameState } = useMatchroomGame();
  const viewModel = buildScoreboardViewModel({ gameState });

  if (!matchroomId) {
    return <span className="text-sm font-medium">Lobby</span>;
  }

  return (
    <MatchroomOverview
      roomReady={viewModel.roomReady}
      matchroomId={matchroomId}
      match={viewModel.match}
      resetRoom={() => {
        router.push("/");
      }}
    />
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const matchroomId = useMatchroomIdFromPathname();

  return (
    <MatchroomProvider matchroomId={matchroomId}>
      <Surface
        variant="tertiary"
        className="flex h-full w-full flex-col overflow-hidden p-0"
      >
        <TopRow>
          <Menu />
          <MatchroomTopRowContent />
          <ThemeToggle />
        </TopRow>
        <div className="flex flex-1 min-h-0 w-full items-stretch justify-center overflow-hidden p-2">
          {children}
        </div>
      </Surface>
    </MatchroomProvider>
  );
}
