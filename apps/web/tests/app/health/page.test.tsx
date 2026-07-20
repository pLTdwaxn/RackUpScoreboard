import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import HealthPage from "@/app/health/page";

const headersMock = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({
  headers: headersMock,
}));

function mockHeaders(values: Record<string, string | null>) {
  headersMock.mockResolvedValue({
    get: (name: string) => values[name] ?? null,
  });
}

describe("Health page", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    headersMock.mockReset();
  });

  it("renders backend health as online", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE", "http://api.test");
    mockHeaders({});
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        service: "rackup-api",
        status: "ok",
      }),
    })) as unknown as typeof fetch;
    vi.stubGlobal("fetch", fetchMock);

    render(await HealthPage());

    expect(fetchMock).toHaveBeenCalledWith("http://api.test/health", {
      cache: "no-store",
    });
    expect(screen.getByText("Online")).toBeInTheDocument();
    expect(screen.getByText(/rackup-api/)).toBeInTheDocument();
    expect(screen.getByText(/ok/)).toBeInTheDocument();
  });

  it("renders configuration errors as offline", async () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE", "");
    mockHeaders({
      host: "rackup.example",
      "x-forwarded-proto": "https",
    });

    render(await HealthPage());

    expect(screen.getByText("Offline")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Backend URL is not configured for this environment. Set NEXT_PUBLIC_API_BASE in deployment settings.",
      ),
    ).toBeInTheDocument();
  });
});
