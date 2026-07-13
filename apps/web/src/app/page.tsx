"use client";

import { Button, Surface } from "@heroui/react";

export default function Home() {
  return (
    <Surface
      variant="tertiary"
      className="flex mx-auto h-dvh w-full max-w-md flex-col overflow-hidden p-0 items-center justify-center"
    >
      <Button onClick={() => (window.location.href = "/matchroom")}>
        Snooker Scoreboard
      </Button>
    </Surface>
  );
}
