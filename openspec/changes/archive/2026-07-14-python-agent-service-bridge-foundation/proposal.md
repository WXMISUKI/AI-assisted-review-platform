# Python agent service bridge foundation

## Why

The platform now has backend-owned review task snapshots, replayable generation run records, and a local worker queue boundary. That gives the Node BFF a durable task/run/event surface, but the actual review-generation execution still lives inside the Node process.

The next maturity step is not to replace the BFF with Python. It is to introduce a small backend-facing bridge that lets the worker call a future Python agent service through a stable, safe contract while preserving the current Node fallback path.

This bridge prepares the platform for mature review workflows:

- OCR structure can become bounded review context for agent execution.
- Python workers can later own document parsing, layout recovery, RAG, review reasoning, and report generation.
- The frontend can keep consuming the same run status, replayed events, and SSE loading contract.
- Provider failures can degrade safely instead of breaking review task recovery.

## What Changes

- Add a backend-facing agent service adapter contract for review generation execution.
- Define safe health/readiness diagnostics for a future Python agent service.
- Define the request and response schema used when the Node worker delegates generation to the agent service.
- Allow the local worker execution path to prefer the configured agent service when ready and fall back to the current Node in-process generation path when unavailable.
- Persist only safe agent-source summaries, diagnostics, stage events, and completion metadata in run records/events.
- Surface agent service readiness through the existing backend connectivity surface without exposing private URLs, prompts, raw OCR text, provider traces, or secrets.

## Non-goals

- No full Python microservice implementation in this change.
- No LangGraph/Celery/Temporal/RAG production workflow implementation.
- No production queue replacement.
- No authentication, tenancy, or service-to-service authorization model yet.
- No change to the frontend review workbench, reviewer decision workflow, or report export workflow.
- No unbounded OCR text transfer across the bridge.

## Impact

- `server/reviewWorkerLoop.mjs`
- `server/reviewGenerationRunBridge.mjs`
- new backend agent service adapter module under `server/`
- `server/config.mjs`
- `server/index.mjs`
- `src/domain/backendConnectivity.ts`
- `src/appShellPages.tsx`
- `docs/architecture-evolution-decisions.md`
- `openspec/specs/review-agent-orchestration/spec.md`
- `openspec/specs/llm-agent-adapter/spec.md`
- `openspec/specs/backend-connectivity/spec.md`
- `openspec/specs/local-development-runtime/spec.md`
- `openspec/specs/review-streaming-api/spec.md`
