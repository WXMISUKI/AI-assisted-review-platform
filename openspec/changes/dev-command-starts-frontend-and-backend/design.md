## Context

Vite proxies `/api` to `http://127.0.0.1:8787`. That proxy is correct for the current local backend, but it assumes `server/index.mjs` is already running. Users naturally run `pnpm dev` and expect the full platform to work, including upload and OCR routes.

## Goals / Non-Goals

**Goals:**
- `pnpm dev` starts both backend and frontend for normal platform development.
- A separate `dev:frontend` command remains available.
- Existing `server:dev` command remains available for backend-only debugging.

**Non-Goals:**
- Change Vite proxy target.
- Add a production process manager.
- Add Docker Compose orchestration.

## Decisions

1. **Use `concurrently` for local multi-process dev.**  
   It is a small, common dev dependency that works across Windows and Unix shells. It also keeps logs readable with process names.

2. **Make `dev` the full-stack default.**  
   This matches user expectation: the platform UI depends on BFF routes for upload and OCR.

3. **Preserve split commands.**  
   `dev:frontend` and `server:dev` let developers isolate either side during debugging.

## Risks / Trade-offs

- **Backend port already in use** -> Backend process will print an address-in-use error; frontend-only debugging can use `pnpm dev:frontend`.
- **More terminal output** -> Named concurrently processes keep logs distinguishable.
