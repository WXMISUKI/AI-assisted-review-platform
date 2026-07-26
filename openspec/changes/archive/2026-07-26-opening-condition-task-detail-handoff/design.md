## Context

The current workbench already lists runs and points each row to a recommended page. That is a useful register, but mature construction review platforms usually let operators inspect the selected task before acting: current stage, ball-in-court, blockers, report state, and history/read-only status are visible together.

The project should not jump straight to a full evidence preview or visual redesign. The next high-value slice is a compact selected-task handoff panel that makes the existing MVP loop easier to operate.

## Goals / Non-Goals

**Goals:**

- Let the operator select a task row and inspect one selected run.
- Show stage progress using existing task facts.
- Show current owner, next action, report status, issue counts, human-review count, and read-only state.
- Offer a primary "continue next action" and a secondary "open report/archive" action when useful.
- Keep all routing through existing `OpeningConditionPortalPage` values.

**Non-Goals:**

- No new backend task summary endpoint.
- No document preview/highlight implementation.
- No full visual redesign.
- No changes to report generation, archive, or rerun state machine.

## Decisions

1. Reuse the existing workbench row helper.
   - It already derives owner, next action, report status, and counts.
   - The selected detail panel should consume the same row shape rather than recomputing a separate view model.

2. Select the first row by default.
   - This mirrors task-register behavior: opening the workbench shows the newest/current task detail immediately.
   - If the task list changes, reset to the first available row when the previous selection disappears.

3. Stage progress is derived from row fields.
   - Intake is complete when a task row exists.
   - Matching is complete when check item count is non-zero.
   - Human review is complete when there are no open human-review items after matching.
   - Report is complete when the report label indicates generated/archived.
   - Archive is complete when the row is read-only and report/archive state is visible.

## Risks / Trade-offs

- [Risk] Stage derivation is frontend-only and approximate.
  → Mitigation: it is a handoff aid, not the authoritative state machine; backend smoke remains authoritative.

- [Risk] More UI inside the overview could become dense again.
  → Mitigation: show only one selected-task detail panel, not every row expanded at once.

- [Risk] Archived rows still have a primary action from ownership.
  → Mitigation: archived task action routes to reports and the detail marks it read-only.
