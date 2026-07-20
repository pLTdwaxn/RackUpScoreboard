"use client";

import { Button, Surface } from "@heroui/react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <Surface
      variant="tertiary"
      className="flex h-full w-full flex-col items-center justify-center overflow-hidden p-0"
    >
      <Button onClick={() => router.push("/matchroom")}>
        Snooker Scoreboard
      </Button>
    </Surface>
  );
}
