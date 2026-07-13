## 1. Spec and Contract

- [x] 1.1 Update `review-streaming-api` and `streaming-review-workbench` specs to define backend-SSE-driven review loading.
- [x] 1.2 Clarify fallback behavior when SSE is unavailable or a task has no recovered structure.

## 2. Implementation

- [x] 2.1 Add a reusable SSE subscription helper in `src/domain/backendConnectivity.ts`.
- [x] 2.2 Update `src/App.tsx` to drive review-loading progression from backend SSE first, with mock fallback.
- [x] 2.3 Keep the loading page and review workbench contracts unchanged apart from the richer stream source.

## 3. Verification

- [x] 3.1 Run `npm run typecheck`.
- [x] 3.2 Manually inspect the loading flow code path for SSE fallback symmetry.
- [x] 3.3 Archive the completed OpenSpec change.
