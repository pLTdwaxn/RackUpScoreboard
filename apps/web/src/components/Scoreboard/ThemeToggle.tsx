"use client";

import { useTheme } from "next-themes";

import { Button } from "@heroui/react";
import { IconMoon, IconSun } from "@tabler/icons-react";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  if (resolvedTheme === undefined) {
    return null;
  }

  return resolvedTheme === "dark" ? (
    <Button
      isIconOnly
      variant="ghost"
      size="sm"
      onClick={() => setTheme("light")}
    >
      <IconSun stroke={2} />
    </Button>
  ) : (
    <Button
      isIconOnly
      variant="ghost"
      size="sm"
      onClick={() => setTheme("dark")}
    >
      <IconMoon stroke={2} />
    </Button>
  );
}
