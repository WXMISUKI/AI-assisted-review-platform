## 1. Spec and Contract

- [x] 1.1 Extend `review-session-state` with backend-owned task snapshot persistence requirements.
- [x] 1.2 Extend `document-review-task` with backend list/read/upsert task contract requirements.
- [x] 1.3 Extend `review-workbench` with backend-backed reopen and local fallback behavior.
- [x] 1.4 Extend `local-development-runtime` with local dev storage adapter expectations.

## 2. Backend Persistence Module

- [x] 2.1 Add a backend review task store module with a small interface for list, get, upsert, and bulk replace/upsert.
- [x] 2.2 Implement a file-backed development adapter with schema version, safe default seed behavior, and basic bounds.
- [x] 2.3 Add `GET /api/review-tasks`.
- [x] 2.4 Add `GET /api/review-tasks/:taskId`.
- [x] 2.5 Add `PUT /api/review-tasks/:taskId`.
- [x] 2.6 Add `POST /api/review-tasks/bulk`.
- [x] 2.7 Ensure backend responses never expose credentials, tokens, private URLs, prompts, or provider raw traces.

## 3. Frontend Repository Integration

- [x] 3.1 Add backend connectivity helpers for review task list and bulk sync.
- [x] 3.2 Update `reviewTaskRepository` to prefer backend loading when available.
- [x] 3.3 Keep localStorage seed and fallback behavior when backend is unavailable or empty.
- [x] 3.4 Add best-effort backend sync on save without making current session service flows async.
- [x] 3.5 Preserve existing task normalization for recovered structures, issues, and pipeline snapshots.

## 4. Compatibility and Recovery

- [x] 4.1 Ensure existing localStorage tasks are not destructively overwritten by an empty backend response.
- [x] 4.2 Ensure backend-loaded tasks still expose review generation run, activity trail, package, draft snapshot, issues, result asset, OCR job, and source object data.
- [x] 4.3 Keep document library, loading flow, workbench, and result preview behavior unchanged.
- [x] 4.4 Document the limitation that file-backed storage is a development adapter, not production concurrency storage.

## 5. Verification and Archive

- [x] 5.1 Run `npm run typecheck`.
- [x] 5.2 Run `node --check` on changed backend `.mjs` files.
- [x] 5.3 Smoke check backend task list, bulk upsert, and frontend repository fallback assumptions.
- [x] 5.4 Sync main specs and archive the completed OpenSpec change after implementation.
