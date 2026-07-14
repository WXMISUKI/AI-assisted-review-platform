## 1. Direction and Spec

- [x] 1.1 Compare next major directions and select backend task materialization as the highest-value production slice.
- [x] 1.2 Create proposal and design for backend materialization of completed generation runs.
- [x] 1.3 Add delta requirements for review session state, document review task, review issue model, and review orchestration.

## 2. Backend Materialization Helper

- [x] 2.1 Add task-store mutation support for updating one persisted task with an updater function.
- [x] 2.2 Add a materialization helper that reads terminal run events and maps completion payloads into a review task aggregate.
- [x] 2.3 Merge generated issues idempotently with existing task issues and attach generation provenance.
- [x] 2.4 Persist review generation run snapshot, draft issue generation snapshot, preparation package, and safe activity events.
- [x] 2.5 Add safe failure materialization for dead-lettered runs without overwriting reviewable state.

## 3. Worker Integration

- [x] 3.1 Invoke materialization after successful review generation job execution.
- [x] 3.2 Invoke failure materialization when a job is dead-lettered and the run is marked failed.
- [x] 3.3 Preserve queue job semantics and existing run/event/SSE behavior.

## 4. Frontend Recovery Compatibility

- [x] 4.1 Ensure backend task refresh can expose materialized task snapshots to later page loads.
- [x] 4.2 Keep frontend live SSE completion idempotent when backend has already materialized the same run.
- [x] 4.3 Avoid new page-level workflow or visual changes.

## 5. Verification

- [x] 5.1 Smoke verify successful run materialization updates a persisted review task with issues and ready status.
- [x] 5.2 Smoke verify repeated materialization does not duplicate issues or activities.
- [x] 5.3 Smoke verify missing task materialization is safe and non-throwing.
- [x] 5.4 Run `npm run typecheck`.
- [x] 5.5 Run `node --check` on changed backend `.mjs` files.

## 6. Documentation and Archive

- [x] 6.1 Sync accepted requirements into main specs.
- [x] 6.2 Archive this OpenSpec change after implementation and verification.
