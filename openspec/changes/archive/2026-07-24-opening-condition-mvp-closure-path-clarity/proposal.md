## Why

The opening-condition pilot already has backend support for intake, formal matching, human review, report generation/export, archive, and next-round rerun, but the portal still lets operators land on governance-oriented screens that look like the MVP is blocked. For the current phase, the product must make the minimum MVP path explicit before spending more time on semantic polish or asset-governance UI.

## What Changes

- Add an operator-facing MVP closure status that summarizes the current run against the minimum loop: intake, formal check, human review, report/export, archive/rerun.
- Mark basis/master-data publication governance as a later governance workspace rather than the primary MVP path.
- Add a small guidance panel and navigation affordance so operators can return to the correct MVP step from the governance page.
- Document the current project progress and remaining MVP acceptance tasks.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opening-condition-pilot-execution-console`: The portal shall expose the minimum MVP closure path and next MVP step.
- `opening-condition-context`: The workspace navigation shall distinguish MVP execution pages from follow-up governance pages.

## Impact

- Frontend: opening-condition navigation labels and governance page guidance.
- Docs: current MVP progress and next acceptance checklist.
- No backend data model changes and no new provider integration.
