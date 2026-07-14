# Review preparation package

## Why

OCR hydration, structure-aware loading, deterministic draft issues, and workbench session handoff are now connected, but the review-preparation output is still spread across page-local stream state and task fields. The next backend integration step needs a stable package contract that can carry the recovered OCR structure into the review stage without immediately requiring a full LLM review engine.

Without this package boundary, the platform risks keeping OCR structure, SSE progress, draft issue summaries, and future LLM output as parallel flows. That would make refresh recovery, provider fallback, and later backend replacement harder than necessary.

## What Changes

- Introduce a review-preparation package contract for the output between OCR structure hydration and workbench unlock.
- Allow the backend review-agent boundary to produce a package-shaped completion payload from recovered structure context.
- Persist the package on the review task aggregate so reopen flows can restore the same preparation result instead of recomputing it.
- Keep deterministic draft issue generation and existing workbench interactions intact.

## Non-goals

- No full semantic LLM review generation in this slice.
- No database, queue, worker, or authentication redesign.
- No change to review decision rules or report generation.
- No broad UI redesign of the review workbench.

## Impact

- `server/reviewAgentStream.mjs`
- `server/index.mjs`
- `src/domain/backendConnectivity.ts`
- `src/domain/reviewTypes.ts`
- `src/domain/reviewSessionService.ts`
- `src/App.tsx`
- `src/appShellPages.tsx`
- `openspec/specs/review-streaming-api/spec.md`
- `openspec/specs/review-session-state/spec.md`
- `openspec/specs/document-review-task/spec.md`
