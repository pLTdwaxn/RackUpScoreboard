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
- ALLOWED_DEV_ORIGINS: Comma-separated dev origins for Next.js allowedDevOrigins.

## Local Setup

```bash
export NEXT_PUBLIC_API_BASE=http://127.0.0.1:8004
npm ci
npm run dev
```

Open <http://localhost:3000>.

## Docker Build Args

The Dockerfile accepts NEXT_PUBLIC_API_BASE and NEXT_PUBLIC_LOCAL_API_PORT as build args because the client needs them at build time.

Example:

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_BASE=https://api.example.com \
  --build-arg NEXT_PUBLIC_LOCAL_API_PORT=8004 \
  -t rackup-web .
```

## Notes

- The app intentionally fails fast on non-local hosts if NEXT_PUBLIC_API_BASE is missing.
- Local fallback to host:NEXT_PUBLIC_LOCAL_API_PORT is only used for local/private development hosts.
