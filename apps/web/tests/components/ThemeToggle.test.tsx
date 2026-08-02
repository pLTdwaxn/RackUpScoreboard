import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ThemeToggle from "@/components/ThemeToggle";

const themeMock = vi.hoisted(() =>
  vi.fn(() => ({
    resolvedTheme: "light",
    setTheme: vi.fn(),
  })),
);

vi.mock("next-themes", () => ({
  useTheme: themeMock,
}));

describe("ThemeToggle", () => {
  afterEach(() => {
    cleanup();
    themeMock.mockReset();
  });

  it("switches from light mode to dark mode", () => {
    const setTheme = vi.fn();
    themeMock.mockReturnValue({
      resolvedTheme: "light",
      setTheme,
    });

    render(<ThemeToggle />);

    fireEvent.click(screen.getByRole("switch", { name: "Switch to dark mode" }));

    expect(setTheme).toHaveBeenCalledWith("dark");
  });

  it("switches from dark mode to light mode", () => {
    const setTheme = vi.fn();
    themeMock.mockReturnValue({
      resolvedTheme: "dark",
      setTheme,
    });

    render(<ThemeToggle />);

    fireEvent.click(
      screen.getByRole("switch", { name: "Switch to light mode" }),
    );

    expect(setTheme).toHaveBeenCalledWith("light");
  });
});
