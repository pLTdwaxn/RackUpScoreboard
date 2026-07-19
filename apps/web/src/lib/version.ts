import packageJson from "../../package.json";

type AppEnvironment = "dev" | "preview" | "production";

const configuredEnvironment = process.env.NEXT_PUBLIC_APP_ENV;

export const appVersion =
  process.env.NEXT_PUBLIC_APP_VERSION || packageJson.version;

export const gitSha = process.env.NEXT_PUBLIC_GIT_SHA || "";

export const appEnvironment: AppEnvironment =
  configuredEnvironment === "preview" || configuredEnvironment === "production"
    ? configuredEnvironment
    : "dev";

const shortGitSha = gitSha ? gitSha.slice(0, 7) : "local";

export const appVersionLabel =
  appEnvironment === "production"
    ? appVersion
    : `${appEnvironment}-${shortGitSha}`;
