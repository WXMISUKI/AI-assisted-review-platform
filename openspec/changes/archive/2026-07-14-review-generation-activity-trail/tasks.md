## 1. Spec and Contract

- [x] 1.1 Define review generation activity trail requirements in `review-session-state`.
- [x] 1.2 Extend `review-agent-orchestration` with safe generation lifecycle activity semantics.
- [x] 1.3 Extend `review-workbench` with compact activity visibility requirements.

## 2. Domain and Session Service

- [x] 2.1 Add review generation activity types and optional task/session fields.
- [x] 2.2 Add session service helper(s) to append safe activity events.
- [x] 2.3 Append activity events from generation start, retry, stage update, package persistence, draft issue generation, terminal ready/degraded, and failure.
- [x] 2.4 Keep older tasks without activity trails backward compatible.

## 3. UI Visibility

- [x] 3.1 Show the latest safe activity summary in document task surfaces.
- [x] 3.2 Show recent generation activities in the locked loading view when available.
- [x] 3.3 Avoid exposing unsafe diagnostics or raw provider output.

## 4. Verification and Archive

- [x] 4.1 Run `npm run typecheck`.
- [x] 4.2 Smoke check activity appends across retry and degraded completion.
- [x] 4.3 Archive the completed OpenSpec change.
