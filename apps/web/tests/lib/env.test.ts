import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getClientApiBase,
  getServerApiBase,
  isLocalHostname,
  normalizeApiBase,
} from "@/lib/env";

describe("env helpers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    window.history.pushState({}, "", "http://localhost:3000/");
  });

  it("normalizes configured API base URLs", () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE", " https://api.example.com/// ");

    expect(getClientApiBase()).toBe("https://api.example.com");
    expect(
      getServerApiBase({ host: "rackup.example", forwardedProto: "https" }),
    ).toBe("https://api.example.com");
    expect(normalizeApiBase(" http://localhost:8004/api// ")).toBe(
      "http://localhost:8004/api",
    );
  });

  it("uses local browser host fallback for development hosts", () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE", "");
    vi.stubEnv("NEXT_PUBLIC_LOCAL_API_PORT", "9000");

    expect(getClientApiBase()).toBe("http://localhost:9000");
  });

  it("detects local hostnames for client and server fallback", () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE", "");

    expect(isLocalHostname("localhost")).toBe(true);
    expect(isLocalHostname("10.1.2.3")).toBe(true);
    expect(isLocalHostname("172.20.1.2")).toBe(true);
    expect(isLocalHostname("rackup.example")).toBe(false);
    expect(
      getServerApiBase({
        host: "localhost:3000",
        forwardedProto: "https",
      }),
    ).toBe("https://localhost:8004");
    expect(
      getServerApiBase({
        host: "rackup.example",
        forwardedProto: "https",
      }),
    ).toBeNull();
  });
});
