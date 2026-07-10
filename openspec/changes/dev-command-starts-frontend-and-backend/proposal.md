## Why

The document upload UI calls `/api/minio/upload` through the Vite proxy, but `pnpm dev` currently starts only the Vite frontend. When the local backend is not running on `127.0.0.1:8787`, uploads fail with a proxy `ECONNREFUSED` 500 error.

## What Changes

- Make the default local development command start both the backend BFF and the Vite frontend.
- Keep a frontend-only command for cases where developers intentionally run the backend separately.
- Document the expected local development commands.

## Capabilities

### New Capabilities
- `local-development-runtime`: Local development commands provide the frontend and backend processes required by proxied API workflows.

### Modified Capabilities

## Impact

- `package.json` scripts and lockfile dependencies.
- README local development instructions.
- No runtime application behavior changes in production.
