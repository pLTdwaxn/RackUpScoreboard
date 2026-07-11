"use client";

import { useSyncExternalStore } from "react";

import { useTheme } from "next-themes";

import { Button } from "@heroui/react";
import { IconMoon, IconSun } from "@tabler/icons-react";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const isDarkTheme = mounted ? resolvedTheme === "dark" : false;

  return (
    <Button
      isIconOnly
      variant="ghost"
      size="sm"
      aria-label={isDarkTheme ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(isDarkTheme ? "light" : "dark")}
    >
      {isDarkTheme ? <IconSun stroke={2} /> : <IconMoon stroke={2} />}
    </Button>
  );
}
