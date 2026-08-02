import { headers } from "next/headers";

import { Card, CardContent, CardHeader, Chip, Code } from "@heroui/react";
import { getAppDictionary } from "@/i18n";
import { getLocalApiPortForDisplay, getServerApiBase } from "@/lib/env";

type HealthResponse = {
  status?: string;
  service?: string;
};

async function getHealth() {
  const copy = getAppDictionary().health;
  const headerStore = await headers();
  const host = headerStore.get("host");
  const forwardedProto = headerStore.get("x-forwarded-proto");
  const apiBase = getServerApiBase({ host, forwardedProto });

  if (!apiBase) {
    return {
      ok: false,
      apiBase: copy.missingApiBase,
      message: copy.backendUrlNotConfigured,
    };
  }

  const url = `${apiBase}/health`;

  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      return {
        ok: false,
        apiBase,
        message: copy.requestFailed(response.status),
      };
    }

    const data = (await response.json()) as HealthResponse;
    return {
      ok: true,
      apiBase,
      status: data.status ?? getAppDictionary().common.unknown,
      service: data.service ?? getAppDictionary().common.unknown,
    };
  } catch {
    return {
      ok: false,
      apiBase,
      message: copy.backendUnreachable(getLocalApiPortForDisplay()),
    };
  }
}

export default async function HealthPage() {
  const copy = getAppDictionary().health;
  const health = await getHealth();

  return (
    <main className="flex h-full w-full items-center px-4 py-8">
      <Card className="w-full">
        <CardHeader className="flex-col items-start gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            {copy.title}
          </h1>
          <Code>{health.apiBase}/health</Code>
        </CardHeader>
        <CardContent className="gap-4">
          <div className="flex items-center gap-3">
            <span className="text-sm">{copy.connection}</span>
            <Chip color={health.ok ? "success" : "danger"} variant="primary">
              {health.ok ? copy.online : copy.offline}
            </Chip>
          </div>

          {health.ok ? (
            <div className="space-y-1 text-sm">
              <p>
                <span className="">{copy.service}</span> {health.service}
              </p>
              <p>
                <span className="">{copy.status}</span> {health.status}
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
