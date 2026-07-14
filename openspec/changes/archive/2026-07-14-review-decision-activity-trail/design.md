# Design

## Direction Selection

After backend-owned decision APIs, the remaining high-value directions are:

1. Review decision activity trail.
   - Best fast-production value because it makes human actions traceable.
   - Builds directly on the completed decision API.
   - Minimal UI and storage risk.
2. Backend role and permission enforcement.
   - Very important, but needs a clearer user/session identity contract.
3. Report export and knowledge grounding.
   - Valuable, but larger and less useful without durable review records.

This change chooses option 1.

## Activity Model

Add `reviewDecisionActivities` to the task aggregate.

Activity shape:

```ts
{
  id: string;
  type:
    | "issue-resolved"
    | "issue-draft-updated"
    | "manual-issue-added"
    | "manual-issue-deleted"
    | "review-completed";
  occurredAt: string;
  actor: {
    id: string;
    label: string;
    role?: string;
  };
  issueId?: string;
  issueTitle?: string;
  decision?: "accepted" | "rejected";
  mode?: "review" | "revise";
  resultAssetId?: string;
  message?: string;
}
```

The current MVP has no real auth. The backend records a safe default actor (`system-reviewer`) unless the caller passes bounded `actor` metadata. This keeps the schema future-compatible with real login.

## Backend Behavior

`server/reviewTaskDecisionService.mjs` appends decision activities as part of the same task mutation that changes issues or completion state. This keeps the activity trail aligned with persisted task state in the file-backed adapter.

Activity storage is bounded to the latest 200 records. Messages and labels are sanitized to remove URL/secrets patterns and capped in length.

Add helper:

- `getReviewTaskDecisionActivities(taskId, { limit })`

Add route:

- `GET /api/review-tasks/:taskId/activities`

## Frontend Behavior

Frontend types gain `ReviewDecisionActivity`.

The result preview page shows the most recent decision activities, because completion results are where a reviewer most expects to verify the record behind the generated asset. The workbench can later reuse the same field or endpoint for a fuller audit drawer.

## Risks

- This is not an immutable audit ledger. The design explicitly treats it as a production-shaped activity trail, not a compliance-grade audit store.
- Without auth, actor identity is only a placeholder. The schema reserves actor fields so the later auth slice can fill them without reshaping activities.
