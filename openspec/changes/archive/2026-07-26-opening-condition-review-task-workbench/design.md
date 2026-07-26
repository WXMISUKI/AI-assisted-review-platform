## Context

The product direction is now clear: for MVP validation, the user should not start with basis/master-data/knowledge-base panels. They should see a review-task workbench similar to mature construction platforms: a list of submitted review tasks, their state, responsibility, problems, and report access.

## Goals / Non-Goals

**Goals:**

- Make the workspace overview act as a task-list workbench.
- Show one row per pilot run with status, current owner, next action, issue counts, report/export/archive state, and a direct action.
- Use existing task state and report/check-item/human-review fields.
- Keep the change frontend-first and low risk.

**Non-Goals:**

- No new OCR or file preview implementation in this change.
- No full UI redesign.
- No new backend storage model.
- No replacement of detailed pages; the task row routes into existing pages.

## Decisions

- Reuse `deriveOpeningConditionRunActionOwnership` so task rows share the same responsibility and next-action logic as existing pages.
- Use `allPilotTasks` filtered by selected workspace to populate the workbench, falling back to the current `pilotTask`.
- Compute issue counts from task check items and human-review queue rather than adding a backend summary endpoint.
- Route the primary row action to the recommended page; detailed report and evidence-preview pages remain future work.

## Risks / Trade-offs

- The workbench is still inside the existing overview page, so the broader shell is not redesigned yet. This is acceptable for MVP because it puts the right mental model first without destabilizing working flows.
- Issue counts are derived client-side. If later backend report packages become authoritative for summaries, this helper should be swapped to that contract.
