# Backend review generation run bridge

## Why

The review workflow now has safe frontend session state for generation runs, retry, degraded recovery, preparation packages, draft issue provenance, and a compact activity trail. The remaining gap is that the actual generation orchestration is still split across the frontend:

- the loading page subscribes to the review-agent SSE preparation stream
- the frontend persists the preparation package
- the frontend then separately calls draft issue generation
- the frontend decides how to mark the run ready or degraded

This works for the MVP, but it keeps the page component responsible for a backend workflow boundary that should eventually be owned by a backend worker or agent service. The next slice should introduce a small backend run bridge that lets the frontend create a generation run, subscribe to a run-specific stream, and receive a safe completion payload containing both the preparation package and draft issue generation result.

## What Changes

- Add a backend review-generation run creation endpoint that accepts safe task metadata, recovered structure summary, paragraph excerpts, and review mode.
- Add a run-specific SSE endpoint that emits ordered generation events for connection, preparation stages, draft issue generation, completion, degraded completion, and failure.
- Let the backend run stream call the existing draft issue adapter after preparation completes, so the frontend can consume one orchestration contract instead of stitching two backend calls.
- Keep the existing `/api/review-agent/stream` and `/api/review-agent/draft-issues` endpoints backward compatible.
- Update frontend backend connectivity types and review-loading orchestration to prefer the run bridge when available and keep the current local fallback path when unavailable.
- Store only safe run metadata and bounded paragraph excerpts in the temporary backend run registry.

## Non-goals

- No persistent database-backed task table.
- No Redis/Celery/BullMQ worker yet.
- No authentication or tenant authorization changes.
- No PDF coordinate rendering changes.
- No full audit-log service.
- No prompt or raw provider trace persistence.

## Impact

- `server/index.mjs`
- `server/reviewAgentStream.mjs`
- new backend run bridge module under `server/`
- `src/domain/backendConnectivity.ts`
- `src/App.tsx`
- `src/domain/reviewSessionService.ts` only if existing service helpers need a narrow adapter
- `openspec/specs/review-streaming-api/spec.md`
- `openspec/specs/llm-agent-adapter/spec.md`
- `openspec/specs/review-session-state/spec.md`
- `openspec/specs/review-workbench/spec.md`
