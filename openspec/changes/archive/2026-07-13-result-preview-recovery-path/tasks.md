## 1. Spec and Contract

- [x] 1.1 Update `review-completion-results` to describe result provenance and workbench recovery entry.

## 2. Implementation

- [x] 2.1 Pass a workbench reopen callback into the result preview page.
- [x] 2.2 Show result source provenance in the result preview header.
- [x] 2.3 Add a recovery action that reopens the workbench from both the normal preview and fallback shell.

## 3. Verification

- [x] 3.1 Run `npm run typecheck`.
- [x] 3.2 Inspect the result page for session-sourced, task-sourced, and missing-result states.
- [x] 3.3 Archive the completed OpenSpec change.
