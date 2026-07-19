"use client";

import { Button, Surface } from "@heroui/react";

export default function Home() {
  return (
    <Surface
      variant="tertiary"
      className="flex h-full w-full flex-col items-center justify-center overflow-hidden p-0"
    >
      <Button onClick={() => (window.location.href = "/matchroom")}>
        Snooker Scoreboard
      </Button>
    </Surface>
  );
}
