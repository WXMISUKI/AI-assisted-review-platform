## 1. Spec and Contract

- [x] 1.1 Update `review-session-state` and `streaming-review-workbench` specs to describe a normalized, recoverable pipeline snapshot.
- [x] 1.2 Clarify legacy compatibility for stored tasks that only have stream fields.

## 2. Implementation

- [x] 2.1 Add a shared pipeline snapshot helper in `src/domain/reviewPipelineSnapshot.ts`.
- [x] 2.2 Persist and backfill the snapshot in `src/domain/reviewSessionService.ts` and `src/domain/reviewTaskRepository.ts`.
- [x] 2.3 Read the snapshot in loading and orchestration entry points, including `src/App.tsx`.

## 3. Verification

- [x] 3.1 Run `npm run typecheck`.
- [x] 3.2 Verify the loading path still falls back when SSE is missing.
- [x] 3.3 Archive the completed OpenSpec change.
