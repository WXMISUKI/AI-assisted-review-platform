# Tasks

## 1. Spec

- [x] Choose the next direction by production value and implementation speed.
- [x] Create proposal, design, tasks, and spec deltas for decision activities.

## 2. Backend Activity Trail

- [x] Add safe activity helpers to the review task decision service.
- [x] Append activity records for issue resolve, draft edit, manual add/delete, and completion.
- [x] Add a task-scoped activity query function.

## 3. Backend Route

- [x] Expose `GET /api/review-tasks/:taskId/activities`.
- [x] Include the route in the backend root route list.
- [x] Return safe structured not-found responses.

## 4. Frontend Types and Display

- [x] Add `ReviewDecisionActivity` and task/session fields.
- [x] Show recent decision activities on the result preview page.

## 5. Verification

- [x] Run `node --check` on changed backend files.
- [x] Run `npm run typecheck`.
- [x] Run a lightweight backend smoke test and restore local data.

## 6. Archive

- [x] Sync accepted requirements into main specs and architecture decisions.
- [x] Mark all tasks complete.
- [x] Move the change to `openspec/changes/archive/2026-07-14-review-decision-activity-trail`.
