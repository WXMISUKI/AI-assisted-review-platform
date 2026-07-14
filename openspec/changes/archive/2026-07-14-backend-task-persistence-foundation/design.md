# Design

## Context

Current state ownership:

```text
Frontend session service
  -> reviewTaskRepository
       -> localStorage

Backend
  -> MinIO/OCR/LLM/provider checks
  -> generation run bridge
  -> no durable review task store yet
```

This keeps the MVP fast, but mature review workflows need backend-owned task state before introducing durable workers.

## Target Slice

Introduce a backend persistence module behind the Node BFF:

```text
Frontend reviewTaskRepository
  -> backend task API when available
  -> localStorage fallback when unavailable

Node BFF
  -> reviewTaskStore interface
       -> file-backed dev adapter for now
       -> later PostgreSQL adapter
```

This is a bridge to durable architecture, not the final storage implementation.

## Backend Interface

Add endpoints:

- `GET /api/review-tasks`
  - returns all stored review task snapshots
- `GET /api/review-tasks/:taskId`
  - returns one stored task snapshot
- `PUT /api/review-tasks/:taskId`
  - upserts a full task snapshot
- `POST /api/review-tasks/bulk`
  - replaces or upserts a bounded task list for MVP sync

The first implementation can use a JSON file under a local dev data directory such as `.local-data/review-tasks.json`. The file location should remain backend-private and easy to replace.

## Task Snapshot Shape

The backend should store the existing `ReviewTask` aggregate shape as a versioned snapshot:

- `schemaVersion`
- `tasks`
- task metadata
- source object and OCR job
- recovered structure
- paragraphs
- issues and resolutions
- preparation package
- draft issue generation snapshot
- review generation run snapshot
- review generation activities
- failure
- result asset

Do not split into normalized SQL tables in this slice. The point is to move ownership to the backend while preserving current app behavior. Later PostgreSQL work can normalize the model deliberately.

## Frontend Strategy

The existing repository seam is `src/domain/reviewTaskRepository.ts`. Keep that seam small:

- `loadReviewTasks()`
- `saveReviewTasks(tasks)`

Change the implementation to prefer backend persistence when possible:

```text
loadReviewTasks()
  try backend list
  else localStorage
  else seed tasks

saveReviewTasks(tasks)
  write localStorage for compatibility
  best-effort sync backend
  return tasks immediately
```

Because most session service functions are synchronous today, the first slice should avoid turning all page flows async. Backend sync can be best-effort after local updates. A later change can introduce fully async repository operations once the backend contract is proven.

## Safety

- Backend accepts only JSON review task snapshots from the trusted local app in MVP.
- Validate schema shape enough to reject non-object payloads and oversized arrays.
- Do not persist credentials, tokens, private presigned URLs, raw provider traces, or raw prompts.
- Source object keys are allowed; private object URLs should not be stored as task state.

## Compatibility

- Existing localStorage tasks must continue loading if backend is unavailable.
- Backend-empty first run should still seed the current mock tasks.
- Existing review generation, retry, activity trail, workbench, and result preview flows should not change visually.
- The backend storage adapter must be replaceable by PostgreSQL without changing page-level callers.

## Risks

- A synchronous frontend repository with async backend sync can lose backend writes if the tab closes immediately. This is acceptable for the first foundation slice but should be documented.
- JSON file storage is not suitable for concurrent production traffic. It is a development adapter only.
- Persisting full task snapshots can grow; add basic array bounds now and normalize later.
