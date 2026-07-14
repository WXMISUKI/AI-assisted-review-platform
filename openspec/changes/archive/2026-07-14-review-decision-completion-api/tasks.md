# Tasks

## 1. Direction and Spec

- [x] Compare the next major directions by production value, delivery speed, and architecture fit.
- [x] Create proposal and design artifacts for backend-owned reviewer decisions and completion.
- [x] Add spec deltas for task, issue, session, and result behavior.

## 2. Backend Decision Service

- [x] Add a backend service for resolving issues, editing suggestions, adding manual issues, deleting manual issues, and completing review tasks.
- [x] Validate inputs, bound string fields, refresh issue counts, and maintain task `updatedAt`.
- [x] Generate completion result assets from persisted task paragraphs and issues.

## 3. Backend API Routes

- [x] Add review decision and completion routes under `/api/review-tasks/:taskId`.
- [x] Return structured success and safe error payloads.
- [x] Include the new routes in the backend root route list.

## 4. Frontend API Integration

- [x] Add typed API helpers in `src/domain/backendConnectivity.ts`.
- [x] Update workbench action handlers in `src/App.tsx` to call backend operations with local fallback.
- [x] Use backend completion result when available and preserve current result navigation.

## 5. Verification

- [x] Run `node --check` on changed backend `.mjs` files.
- [x] Run `npm run typecheck`.
- [x] Run a lightweight backend smoke test against the file-backed review task store and restore any temporary data.

## 6. Archive

- [x] Sync accepted requirements into main specs.
- [x] Mark all tasks complete.
- [x] Move the change into `openspec/changes/archive/2026-07-14-review-decision-completion-api`.
