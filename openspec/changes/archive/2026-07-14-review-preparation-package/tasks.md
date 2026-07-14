## 1. Spec and Contract

- [x] 1.1 Define the review-preparation package contract in `review-session-state`.
- [x] 1.2 Extend `review-streaming-api` so backend completion events can carry package metadata.
- [x] 1.3 Extend `document-review-task` so OCR-to-review handoff stores the package before workbench unlock.

## 2. Backend Package Emission

- [x] 2.1 Normalize structure-aware SSE stage events into a package-shaped completion payload.
- [x] 2.2 Include safe provider readiness and completion time in package metadata.
- [x] 2.3 Keep the legacy connectivity stream behavior unchanged when no structure context exists.

## 3. Frontend Session Integration

- [x] 3.1 Add `ReviewPreparationPackage` to the task/session domain types.
- [x] 3.2 Persist package results on the review task aggregate.
- [x] 3.3 Map backend package stage events into the existing loading snapshot.
- [x] 3.4 Create a local fallback package when backend SSE fails or times out.

## 4. Verification

- [x] 4.1 Run `npm run typecheck`.
- [x] 4.2 Run `node --check` for changed backend `.mjs` files.
- [x] 4.3 Manually verify that a structure-hydrated task can progress through review preparation and reopen with the package retained.
- [x] 4.4 Archive the completed OpenSpec change.
