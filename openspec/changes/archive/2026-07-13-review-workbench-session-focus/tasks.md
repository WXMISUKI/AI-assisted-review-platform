## 1. Spec and Contract

- [x] 1.1 Update `review-workbench` to describe session-backed active issue focus.

## 2. Implementation

- [x] 2.1 Restore the active issue from the session snapshot when a matching paragraph is available.
- [x] 2.2 Fall back to the session section or first issue when no matching paragraph issue exists.

## 3. Verification

- [x] 3.1 Run `npm run typecheck`.
- [x] 3.2 Reopen a task with session snapshot, section focus, and empty-match fallback states.
- [x] 3.3 Archive the completed OpenSpec change.
