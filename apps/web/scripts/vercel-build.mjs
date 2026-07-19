import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = dirname(fileURLToPath(new URL("../package.json", import.meta.url)));
const packageJson = JSON.parse(
  readFileSync(join(rootDir, "package.json"), "utf8"),
);

function gitTagForCurrentCommit() {
  try {
    return execFileSync("git", ["describe", "--tags", "--exact-match"], {
      cwd: rootDir,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

const appEnv = process.env.VERCEL_ENV === "production" ? "production" : "preview";
const gitSha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_GIT_SHA || "";
const productionVersion = gitTagForCurrentCommit() || packageJson.version;

process.env.NEXT_PUBLIC_APP_ENV ||= appEnv;
process.env.NEXT_PUBLIC_GIT_SHA ||= gitSha;
process.env.NEXT_PUBLIC_APP_VERSION ||= productionVersion;

execFileSync(
  process.execPath,
  [join(rootDir, "node_modules/next/dist/bin/next"), "build"],
  {
    cwd: rootDir,
    env: process.env,
    stdio: "inherit",
  },
);
