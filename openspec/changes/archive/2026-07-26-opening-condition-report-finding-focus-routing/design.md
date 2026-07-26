## Context

The opening-condition MVP now uses the task ledger as the primary entry and can route selected task issue rows to focused checklist or human-review destinations. The report page still presents findings as static report content, so operators must manually locate the related checklist row or human-review item when they want to verify or continue handling a report problem.

## Goals / Non-Goals

**Goals:**
- Let report findings route to the focused checklist detail using the finding/check-item id.
- Let report findings route to the focused human-review view when an unresolved review item exists for that finding.
- Reuse the current shell-level transient focus state and destination focus banners.
- Keep the implementation frontend-only and scoped to opening-condition MVP usability.

**Non-Goals:**
- Do not introduce URL deep links, browser history routing, or durable focus storage.
- Do not change matching, human-review mutation APIs, report generation, export, archive, or backend task payloads.
- Do not redesign the report page or refactor the thick report workbench component in this slice.
- Do not touch construction-plan review flows.

## Decisions

1. Reuse `focusOpeningChecklistItem` and `focusOpeningHumanReviewItem` from `OpeningConditionWorkspaceShell`.
   - Rationale: the report page is another route origin for the same transient navigation context.
   - Alternative considered: create report-local highlight state. That would not solve the operator's need to land on the actionable destination.

2. Derive report-to-human-review routing from the selected task's `humanReviewQueue`.
   - Rationale: `ReportFinding.id` already corresponds to the check item id for current generated/fallback findings, while human-review ids are separate and should be looked up by `targetId`.
   - Alternative considered: parse `finding.humanReview` labels. Labels are display text and should not become routing data.

3. Keep actions read-only.
   - Rationale: a report finding is a conclusion/handoff artifact. Clicking it should navigate and focus only; human decisions remain explicit on the human-review page.

## Risks / Trade-offs

- [Risk] Historical selected tasks may route to current-run checklist data because destination pages currently render the active `pilotTask`.
  - Mitigation: keep the action best-effort for MVP and avoid mutating historical data; durable historical detail routing can be added when URL/task-scoped routing is introduced.
- [Risk] Some report findings may not have a matching unresolved human-review item.
  - Mitigation: always provide checklist focus; show human-review focus action only when a matching open/deferred review exists.
