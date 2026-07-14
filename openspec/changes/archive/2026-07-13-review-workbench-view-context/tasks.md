## 1. Spec and Contract

- [x] 1.1 Update `review-session-state` to describe persisted workbench view context.
- [x] 1.2 Update `review-workbench` to describe session-backed active issue focus.

## 2. Implementation

- [x] 2.1 Add a persisted workbench view context to the review session boundary.
- [x] 2.2 Restore the active issue focus from the session snapshot when reopening the workbench.
- [x] 2.3 Persist user-driven issue focus changes back into the task aggregate.

## 3. Verification

- [x] 3.1 Run `npm run typecheck`.
- [x] 3.2 Reopen a task after focusing an issue and confirm the same issue stays active.
- [x] 3.3 Archive the completed OpenSpec change.
