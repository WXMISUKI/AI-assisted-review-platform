## Why

The opening-condition MVP now has a task ledger as the primary entry, but the selected task detail still mostly explains routing. Operators need to see the current run's problem summary and human-review needs directly in that detail layer before drilling into checklist, human review, or report pages.

## What Changes

- Add an issue-centered selected-task summary to the opening-condition task ledger.
- Show prioritized findings, pending human-review items, matched evidence count, and report handoff readiness for the selected run.
- Route each summary section to the existing MVP page that can resolve it: checklist detail, human review, or report/archive.
- Keep this as a compact handoff view, not a full evidence preview or visual redesign.
- Do not change matching rules, human-review decisions, report generation, provider integrations, or construction-plan flows.

## Capabilities

### New Capabilities
<!-- None. -->

### Modified Capabilities
- `opening-condition-pilot-execution-console`: selected-task detail handoff includes issue and human-review summary sections.

## Impact

- Frontend: `src/productWorkspacePages.tsx` task ledger selected-detail area.
- Styles: opening-condition-specific CSS only, using existing tokens.
- Tests: UI smoke guards for selected issue summary.
- Specs: pilot execution console spec.
