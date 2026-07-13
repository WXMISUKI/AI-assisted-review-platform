## 1. Spec and Contract

- [x] 1.1 Update `review-session-state` to describe session-backed result preview entry.
- [x] 1.2 Update `review-completion-results` to describe result asset continuity through the session boundary.

## 2. Implementation

- [x] 2.1 Extend `ReviewSession` and `createReviewSession(...)` so completed tasks carry `resultAsset`.
- [x] 2.2 Pass the session snapshot into the result preview entry and prefer it over page-local asset access.
- [x] 2.3 Keep the existing fallback behavior when the session snapshot is unavailable.

## 3. Verification

- [x] 3.1 Run `npm run typecheck`.
- [x] 3.2 Inspect the result-page entry path for completed and fallback tasks.
- [ ] 3.3 Archive the completed OpenSpec change.
