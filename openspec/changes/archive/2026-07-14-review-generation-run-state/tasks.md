## 1. Spec and Contract

- [x] 1.1 Define review generation run snapshot requirements in `review-session-state`.
- [x] 1.2 Extend `review-agent-orchestration` with task-level run lifecycle semantics.
- [x] 1.3 Extend `review-workbench` with run-snapshot-based unlock/reopen behavior.

## 2. Session State

- [x] 2.1 Add review generation run snapshot types to the domain model.
- [x] 2.2 Add session service helpers for starting, updating, completing, degrading, and failing a generation run.
- [x] 2.3 Link preparation package and draft issue generation snapshot ids into the run snapshot.
- [x] 2.4 Keep existing pipeline, package, and issue provenance behavior backward compatible.

## 3. UI Flow Integration

- [x] 3.1 Start or update the run snapshot when review preparation begins.
- [x] 3.2 Mark the run ready or degraded after preparation and draft issue generation finish.
- [x] 3.3 Use the run snapshot as the preferred loading/workbench unlock source while preserving legacy status fallback.
- [x] 3.4 Surface only safe run status summaries in document/task panels.

## 4. Verification and Archive

- [x] 4.1 Run `npm run typecheck`.
- [x] 4.2 Smoke check ready and degraded run snapshots through the review-preparation path.
- [x] 4.3 Archive the completed OpenSpec change after implementation.
