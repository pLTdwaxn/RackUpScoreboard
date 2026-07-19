# RackUp Frontend

This app is a Next.js frontend for the RackUp scoreboard API.

## Environment Profiles

Use separate environment values for local development and cloud deployments.

1. Local development profile:
Set NEXT_PUBLIC_API_BASE in a local shell or in a local .env.local file.

2. Vercel Preview profile:
Set NEXT_PUBLIC_API_BASE in Vercel for the Preview environment.

3. Vercel Production profile:
Set NEXT_PUBLIC_API_BASE in Vercel for the Production environment.

Important:
NEXT_PUBLIC_* variables are embedded at build time. After changing them in Vercel, redeploy so the client bundle picks up the new value.

Required runtime variables:

- NEXT_PUBLIC_API_BASE: Public backend base URL used by browser requests and websocket connections.

Optional runtime variables:

- NEXT_PUBLIC_LOCAL_API_PORT: Local fallback backend port for localhost/private-network development. Defaults to 8004.
- NEXT_PUBLIC_APP_ENV: Build environment embedded into the frontend bundle. Supported values are `dev`, `preview`, and `production`.
- NEXT_PUBLIC_APP_VERSION: Version label embedded into the frontend bundle. For production, use the release tag.
- NEXT_PUBLIC_GIT_SHA: Git commit SHA embedded into the frontend bundle. Short or full SHA is fine.
- ALLOWED_DEV_ORIGINS: Comma-separated dev origins for Next.js allowedDevOrigins.

## Local Setup

```bash
export NEXT_PUBLIC_API_BASE=http://127.0.0.1:8004
npm ci
npm run dev
```

Open <http://localhost:3000>.

## Docker Build Args

The Dockerfile accepts NEXT_PUBLIC_API_BASE, NEXT_PUBLIC_LOCAL_API_PORT, NEXT_PUBLIC_APP_ENV, NEXT_PUBLIC_APP_VERSION, and NEXT_PUBLIC_GIT_SHA as build args because the client needs them at build time.

Example:

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_BASE=https://api.example.com \
  --build-arg NEXT_PUBLIC_LOCAL_API_PORT=8004 \
  --build-arg NEXT_PUBLIC_APP_ENV=preview \
  --build-arg NEXT_PUBLIC_APP_VERSION="$(git describe --tags --always)" \
  --build-arg NEXT_PUBLIC_GIT_SHA="$(git rev-parse --short HEAD)" \
  -t rackup-web .
```

Displayed version labels:

- Dev: `dev-<git-sha>` or `dev-local`.
- Preview: `preview-<git-sha>`.
- Production: `<git-tag>`.

## Notes

- The app intentionally fails fast on non-local hosts if NEXT_PUBLIC_API_BASE is missing.
- Local fallback to host:NEXT_PUBLIC_LOCAL_API_PORT is only used for local/private development hosts.
