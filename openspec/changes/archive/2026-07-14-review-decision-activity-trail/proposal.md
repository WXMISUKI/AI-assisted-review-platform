# Review Decision Activity Trail

## Why

The backend now owns reviewer decisions and review completion. The next highest-value production step is to persist a safe activity trail for those human-in-the-loop actions.

Mature review platforms do not only store final issue statuses. They also show who did what, when, and against which issue or result. This first slice makes reviewer decisions traceable without jumping directly into full authentication, tenant permissions, or immutable audit infrastructure.

## What Changes

- Add a bounded `reviewDecisionActivities` trail on review task snapshots.
- Append safe activity records when the backend resolves an issue, edits a suggestion, adds a manual issue, deletes a manual issue, or completes a task.
- Expose a task-scoped activity endpoint for reading recent review decision activities.
- Add frontend types and show a recent activity summary on the result preview page.
- Keep activity payloads safe: no prompts, provider traces, secrets, private URLs, or raw long document text.

## Scope

In scope:

- File-backed development persistence using the existing review task store.
- Safe, bounded activity records embedded in the task aggregate.
- Task-scoped read endpoint.
- Result-page display of recent reviewer actions.

Out of scope:

- Immutable audit ledger.
- Authentication, real actor identity, organization scoping, or permissions.
- Cross-task audit search.
- Exporting audit records to report files.

## Value

This makes the review workflow more production-shaped:

```text
AI issues -> reviewer decisions -> result asset
                     |
                     v
              decision activity trail
```

It prepares the project for audit, permission enforcement, role-based reviewer accountability, and exportable review records while remaining small enough to finish quickly.
