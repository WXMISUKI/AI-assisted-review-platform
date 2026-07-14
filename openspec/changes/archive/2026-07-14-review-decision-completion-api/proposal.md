# Review Decision Completion API

## Why

The project has already moved OCR, review-generation runs, queue ownership, Python agent bridging, and backend materialization into the backend layer. The highest-value next production step is to move reviewer decisions and review completion from frontend-local state into explicit backend business operations.

Mature review platforms need the human-in-the-loop decisions to be durable and recoverable: accepting, rejecting, editing AI suggestions, adding manual findings, deleting manual findings, and completing the review must survive refreshes and browser disconnects without depending on best-effort bulk snapshot sync.

## What Changes

- Add backend review-task decision operations for issue resolve, draft edit, manual issue add, manual issue delete, and review completion.
- Add stable HTTP endpoints under `/api/review-tasks/:taskId/...` for these business actions.
- Have the frontend call these endpoints when available, while preserving the existing local session-service fallback for MVP resilience.
- Generate the result asset from the persisted backend task state on completion, so review-mode reports and revise-mode snapshots can be reopened from backend task snapshots.

## Scope

In scope:

- File-backed backend development adapter behavior.
- Safe request validation and bounded string handling.
- Issue-count and task `updatedAt` maintenance.
- Manual issue deletion limited to manual-source issues.
- Completion blocked unless every issue is resolved.
- Frontend best-effort backend call with local fallback.

Out of scope:

- Authentication, tenant isolation, immutable audit ledger, and permission enforcement.
- Production database migration.
- Real report export to PDF, Word, or Excel.
- Replacing the Python agent service bridge or queue runtime.

## Value

This closes the core MVP business loop:

```text
OCR / AI generation -> persisted review issues -> human decisions -> persisted completion result
```

It is more production-critical than further provider tuning because it makes generated findings actionable, recoverable, and ready for later audit, permissions, report generation, and Python workflow orchestration.
