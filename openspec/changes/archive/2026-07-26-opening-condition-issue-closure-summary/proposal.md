## Why

The opening-condition MVP can now initialize, match, review, report, archive, and navigate between task/report findings and detail pages. The remaining operator gap is that the platform does not summarize whether the current issue set is actually closed, still blocked, waiting for human judgement, or ready for report/archive handoff.

## What Changes

- Add a derived issue-closure summary using existing report findings, human-review queue items, and rectification delivery rows.
- Show the summary in the selected task handoff so operators can see the current run's issue closure state before opening detail pages.
- Show the same summary in the report delivery workbench so report/archive decisions have a clear issue-closure context.
- Keep the summary frontend-derived and read-only; do not add backend fields, provider calls, database migrations, or new review decisions.

## Capabilities

### New Capabilities
<!-- None. -->

### Modified Capabilities
- `opening-condition-pilot-execution-console`: selected task and report pages expose an issue-closure summary derived from current run facts.

## Impact

- Frontend: `src/productWorkspacePages.tsx`.
- Tests: `server/openingConditionPilotUiBoundarySmoke.test.mjs`.
- Specs: `openspec/specs/opening-condition-pilot-execution-console/spec.md`.
- No backend API, data persistence, provider, DOCX export, or construction-plan changes.
