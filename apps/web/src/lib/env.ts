const DEFAULT_LOCAL_API_PORT = "8004";

function getLocalApiPort(): string {
  const configuredPort = process.env.NEXT_PUBLIC_LOCAL_API_PORT?.trim();
  return configuredPort || DEFAULT_LOCAL_API_PORT;
}

export function isLocalHostname(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname.endsWith(".local") ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname)
  );
}

export function normalizeApiBase(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

export function getClientApiBase(): string | null {
  const configuredApiBase = process.env.NEXT_PUBLIC_API_BASE?.trim();
  if (configuredApiBase) {
    return normalizeApiBase(configuredApiBase);
  }

  if (typeof window !== "undefined") {
    if (isLocalHostname(window.location.hostname)) {
      return `${window.location.protocol}//${window.location.hostname}:${getLocalApiPort()}`;
    }

    return null;
  }

  return `http://127.0.0.1:${getLocalApiPort()}`;
}

export function getServerApiBase(params: {
  host: string | null;
  forwardedProto: string | null;
}): string | null {
  const configuredApiBase = process.env.NEXT_PUBLIC_API_BASE?.trim();
  if (configuredApiBase) {
    return normalizeApiBase(configuredApiBase);
  }

  const host = params.host;
  if (!host) {
    return null;
  }

  const hostname = host.split(":")[0];
  if (!isLocalHostname(hostname)) {
    return null;
  }

  const proto = params.forwardedProto || "http";
  return `${proto}://${hostname}:${getLocalApiPort()}`;
}

export function getLocalApiPortForDisplay(): string {
  return getLocalApiPort();
}