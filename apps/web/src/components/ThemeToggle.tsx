"use client";

import { useSyncExternalStore } from "react";

import { useTheme } from "next-themes";

import { Switch } from "@heroui/react";
import { IconMoon, IconSun } from "@tabler/icons-react";
import { useAppDictionary } from "@/i18n/client";

export default function ThemeToggle() {
  const copy = useAppDictionary().theme;
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const isDarkTheme = mounted ? resolvedTheme === "dark" : false;

  return (
    <Switch
      aria-label={isDarkTheme ? copy.switchToLight : copy.switchToDark}
      isSelected={isDarkTheme}
      onChange={(isSelected) => setTheme(isSelected ? "dark" : "light")}
      size="lg"
    >
      {({ isSelected }) => (
        <Switch.Content>
          <Switch.Control>
            <Switch.Thumb>
              <Switch.Icon>
                {isSelected ? (
                  <IconMoon stroke={2} size={12} />
                ) : (
                  <IconSun stroke={2} size={12} />
                )}
              </Switch.Icon>
            </Switch.Thumb>
          </Switch.Control>
          <span className="text-sm">
            {isSelected ? copy.dark : copy.light}
          </span>
        </Switch.Content>
      )}
    </Switch>
  );
}
