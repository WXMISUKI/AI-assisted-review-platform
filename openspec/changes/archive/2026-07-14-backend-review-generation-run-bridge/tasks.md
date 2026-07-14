## 1. Spec and Contract

- [x] 1.1 Extend `review-streaming-api` with backend review-generation run creation and run-specific SSE requirements.
- [x] 1.2 Extend `llm-agent-adapter` with stream-owned draft issue generation result semantics.
- [x] 1.3 Extend `review-session-state` with frontend mapping requirements for backend run completion payloads.
- [x] 1.4 Extend `review-workbench` with fallback and no-double-generation behavior for loading flow.

## 2. Backend Run Bridge

- [x] 2.1 Add a bounded in-memory review-generation run registry with TTL cleanup.
- [x] 2.2 Add `POST /api/review-agent/generation-runs` to validate and store safe run input.
- [x] 2.3 Add `GET /api/review-agent/generation-runs/:runId/stream` with SSE headers and safe not-found/expired handling.
- [x] 2.4 Reuse existing structure-aware preparation stage builders for run-specific stream events.
- [x] 2.5 Invoke the existing draft issue adapter after preparation package creation and emit a single completion payload.
- [x] 2.6 Preserve existing `/api/review-agent/stream` and `/api/review-agent/draft-issues` behavior.

## 3. Frontend Consumption

- [x] 3.1 Add backend connectivity types and helpers for creating generation runs and subscribing to run streams.
- [x] 3.2 Update review-loading orchestration to prefer the backend run bridge when recovered paragraphs are available.
- [x] 3.3 Map run completion payloads into existing session service helpers for package persistence, issue merge, degraded completion, and activity trail.
- [x] 3.4 Keep the current SSE/local fallback path for bridge creation, stream, timeout, and completion payload failures.
- [x] 3.5 Ensure the frontend does not call the draft issue endpoint again when the run stream already provides draft issue output.

## 4. Safety and Compatibility

- [x] 4.1 Bound stored paragraph count and text length in the backend run registry.
- [x] 4.2 Return only safe status, diagnostics, counts, ids, and bounded generation outputs.
- [x] 4.3 Keep older locally persisted tasks and existing connectivity panel flows backward compatible.
- [x] 4.4 Avoid persisting prompts, provider traces, API keys, private URLs, or unbounded OCR text.

## 5. Verification and Archive

- [x] 5.1 Run `npm run typecheck`.
- [x] 5.2 Run `node --check` on changed backend `.mjs` files.
- [x] 5.3 Smoke check run creation and run-specific SSE completion with a minimal paragraph payload.
- [x] 5.4 Archive the completed OpenSpec change after implementation and spec sync.
