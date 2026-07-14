# Design

## Context

The current pipeline has these pieces:

- OCR result hydration creates `RecoveredDocumentStructure`.
- Review-preparation loading can render structure-aware stages.
- Deterministic draft issues are generated from recovered paragraphs.
- The workbench opens from `createReviewSession(...)`.
- Backend SSE can emit structure-aware stage events from a compact structure summary.

The missing boundary is a single preparation result that says: "this recovered structure has been accepted as the input for review, these stage events were produced, these summaries are safe to display, and this package can be restored later."

## Proposed Contract

Add a `ReviewPreparationPackage` domain shape:

- `packageId`: stable package identifier for the current task/preparation run.
- `source`: `backend-sse | local-fallback`.
- `status`: `ready | fallback | failed`.
- `createdAt` and optional `completedAt`.
- `structureSummary`: section count, paragraph count, current section, current paragraph metadata, and source format.
- `stageEvents`: normalized review-preparation events compatible with the existing loading UI.
- `issueSummaries`: display-safe candidate issue summaries derived from structure-aware stages or deterministic draft rules.
- `providerSummary`: safe readiness snapshot for LLM/OCR/MinIO when available.
- `message`: optional non-secret diagnostic text.

The package should be stored on the task aggregate and surfaced by the review session snapshot.

## Backend Boundary

Extend the existing review-agent backend boundary rather than adding a separate orchestration service in this slice.

Recommended implementation path:

1. Keep `GET /api/review-agent/stream` backward compatible.
2. Add package metadata to the final `review.complete` event when structure context is present.
3. Optionally add a small `POST /api/review-agent/prepare` endpoint if the implementation needs a non-SSE package request.

The backend must not receive secrets from the frontend and must only return safe provider summaries.

## Frontend Flow

When OCR hydration produces recovered structure:

1. Build a compact structure summary from the task aggregate.
2. Subscribe to backend review-agent SSE.
3. Accumulate stage events.
4. On completion, normalize the final event into a `ReviewPreparationPackage`.
5. Persist the package on the selected task.
6. Unlock the workbench using the existing session boundary.

If SSE fails or has no structure context, the app creates a local fallback package from existing `buildReviewPreparationStages(...)` output.

## Task Grouping

Task Group A: Contract and package model

- Add domain types.
- Add package normalization helpers.
- Extend OpenSpec specs.

Task Group B: Backend package emission

- Enrich final SSE completion payload with package metadata.
- Keep legacy stream consumers working.
- Run `node --check` for touched `.mjs` files.

Task Group C: Frontend persistence and fallback

- Persist package on review tasks.
- Map package stage events into loading snapshots.
- Reuse local fallback when backend stream is unavailable.

Task Group D: Verification and archive

- Run `npm run typecheck`.
- Run targeted `node --check`.
- Archive the OpenSpec change after implementation.

## Risks

- Duplicating deterministic issue generation between frontend and backend would create drift. This slice should package summaries and stage context, not reimplement the full issue rule engine on the backend.
- Sending full OCR text through query strings would be unsafe and brittle. Structure summary should remain compact for SSE query parameters.
- A package should be replaceable by future backend persistence, so avoid UI-only fields.
