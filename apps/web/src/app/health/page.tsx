import { headers } from "next/headers";

import { Card, CardContent, CardHeader, Chip, Code } from "@heroui/react";
import { getLocalApiPortForDisplay, getServerApiBase } from "@/lib/env";

type HealthResponse = {
  status?: string;
  service?: string;
};

async function getHealth() {
  const headerStore = await headers();
  const host = headerStore.get("host");
  const forwardedProto = headerStore.get("x-forwarded-proto");
  const apiBase = getServerApiBase({ host, forwardedProto });

  if (!apiBase) {
    return {
      ok: false,
      apiBase: "(missing NEXT_PUBLIC_API_BASE)",
      message:
        "Backend URL is not configured for this environment. Set NEXT_PUBLIC_API_BASE in deployment settings.",
    };
  }

  const url = `${apiBase}/health`;

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      return {
        ok: false,
        apiBase,
        message: `Request failed with status ${response.status}`,
      };
    }

    const data = (await response.json()) as HealthResponse;
    return {
      ok: true,
      apiBase,
      status: data.status ?? "unknown",
      service: data.service ?? "unknown",
    };
  } catch {
    return {
      ok: false,
      apiBase,
      message: `Could not reach backend. Is FastAPI running on port ${getLocalApiPortForDisplay()}?`,
    };
  }
}

export default async function HealthPage() {
  const health = await getHealth();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-16">
      <Card className="w-full">
        <CardHeader className="flex-col items-start gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            Backend Health
          </h1>
          <Code>{health.apiBase}/health</Code>
        </CardHeader>
        <CardContent className="gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm">Connection</span>
            <Chip color={health.ok ? "success" : "danger"} variant="primary">
              {health.ok ? "Online" : "Offline"}
            </Chip>
          </div>

          {health.ok ? (
            <div className="space-y-1 text-sm">
              <p>
                <span className="">Service:</span> {health.service}
              </p>
              <p>
                <span className="">Status:</span> {health.status}
              </p>
            </div>
          ) : (
            <p className="text-sm text-danger">{health.message}</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
