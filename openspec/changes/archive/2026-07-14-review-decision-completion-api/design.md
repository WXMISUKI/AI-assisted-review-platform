# Design

## Direction Selection

The previous larger directions can be ranked by near-term production value:

1. Backend-owned reviewer decisions and completion.
   - Highest value because it turns generated issues into durable business state.
   - Lowest integration risk because it builds on the existing review task store and frontend session service.
   - Directly unlocks audit/compliance/report work later.
2. Deeper Python agent/workflow runtime.
   - Important, but less useful before reviewer decisions and completion have stable backend contracts.
3. More provider diagnostics and connectivity polish.
   - Useful, but now lower value because the guardrail layer already exists.

This change chooses option 1.

## Backend Service

Add `server/reviewTaskDecisionService.mjs` as the backend business boundary for reviewer actions. It will use `mutateReviewTask` from `server/reviewTaskStore.mjs` so each action updates one persisted task atomically within the file-backed adapter.

Operations:

- `resolveReviewTaskIssue(taskId, issueId, input)`
- `updateReviewTaskIssueDraft(taskId, issueId, input)`
- `addManualReviewTaskIssue(taskId, input)`
- `deleteManualReviewTaskIssue(taskId, issueId)`
- `completeReviewTaskDecision(taskId, input)`

Each operation returns a structured result:

```json
{
  "ok": true,
  "task": {},
  "issue": {},
  "resultAsset": {}
}
```

Errors use safe statuses such as `invalid_input`, `not_found`, `not_allowed`, and `incomplete_review`.

## API Routes

Add routes:

- `POST /api/review-tasks/:taskId/issues/:issueId/resolve`
- `PATCH /api/review-tasks/:taskId/issues/:issueId/draft`
- `POST /api/review-tasks/:taskId/issues/manual`
- `DELETE /api/review-tasks/:taskId/issues/:issueId`
- `POST /api/review-tasks/:taskId/complete`

The routes remain frontend-facing Node BFF endpoints. They do not expose provider traces, prompts, private object URLs, or raw workflow internals.

## Completion Rules

The backend derives completion from the persisted task snapshot:

- every issue must be non-pending;
- completion mode defaults to the task mode unless explicitly set to `review` or `revise`;
- review-mode completion creates a supervisor-report asset;
- revise-mode completion applies accepted suggestions into processed paragraphs and creates a revised-plan snapshot;
- the task is marked `completed`, `issueCount` is refreshed, and the result asset is persisted.

## Frontend Integration

`src/domain/backendConnectivity.ts` gains typed helpers for the new operations.

`src/App.tsx` keeps its existing immediate local state behavior, then attempts the backend operation and replaces local state with the backend task if successful. If the backend is unavailable, the local state remains valid and the existing bulk-sync compatibility path can still save snapshots.

## Risk Controls

- Do not introduce auth or tenant logic in this slice; document it as a future hardening layer.
- Limit request strings to bounded lengths to keep file-backed storage safe.
- Enforce `source: "manual"` when creating manual issues and when deleting.
- Keep result generation deterministic and local to the backend service for now.
