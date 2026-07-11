"use client";

import { Button, Surface } from "@heroui/react";

export default function Home() {
  return (
    <Surface
      variant="tertiary"
      className="mx-auto flex h-dvh w-full max-w-md flex-col overflow-hidden p-0"
    >
      <Button onClick={() => (window.location.href = "/matchroom")}>
        Snooker Scoreboard
      </Button>
    </Surface>
  );
}
