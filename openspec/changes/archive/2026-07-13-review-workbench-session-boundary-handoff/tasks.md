## 1. Spec and Contract

- [x] 1.1 Update `review-session-state` and `review-workbench` specs to describe session-backed workbench entry.
- [x] 1.2 Clarify fallback behavior when the session snapshot is unavailable.

## 2. Implementation

- [x] 2.1 Build the active review session in `src/App.tsx` when the detail workbench opens.
- [x] 2.2 Pass the session snapshot into `src/ReviewWorkbenchPage.tsx` and use it to initialize paragraph / section focus.
- [x] 2.3 Keep the existing editing and completion flows unchanged.

## 3. Verification

- [x] 3.1 Run `npm run typecheck`.
- [x] 3.2 Inspect the workbench entry path for structured and fallback tasks.
- [x] 3.3 Archive the completed OpenSpec change.
