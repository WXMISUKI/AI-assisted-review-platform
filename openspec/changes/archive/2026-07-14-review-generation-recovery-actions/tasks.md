## 1. Spec and Contract

- [x] 1.1 Add failed generation retry requirements to `review-session-state`.
- [x] 1.2 Add recovery action requirements to `review-workbench`.

## 2. Session and Orchestration

- [x] 2.1 Ensure starting review generation after a terminal run creates a fresh run id.
- [x] 2.2 Clear stale run diagnostics when a retry starts.
- [x] 2.3 Keep degraded runs reviewable and failed runs recoverable through orchestration snapshots.
- [x] 2.4 Preserve legacy task behavior when no generation run snapshot exists.

## 3. UI Recovery Actions

- [x] 3.1 Show a retry action for failed review generation tasks in the document library.
- [x] 3.2 Keep ready/degraded tasks opening the workbench.
- [x] 3.3 Avoid exposing unsafe diagnostics in recovery labels.

## 4. Verification and Archive

- [x] 4.1 Run `npm run typecheck`.
- [x] 4.2 Smoke check retry starts a new run id after failure.
- [x] 4.3 Archive the completed OpenSpec change.
