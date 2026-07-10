## Why

The MVP now supports document upload, streaming review, structured AI/manual issues, and reversible accept/reject decisions, but it does not yet close the business loop after all issues are processed. Users need a clear finish action that creates review-mode reports or review-revise result snapshots and makes those outputs discoverable from the document library.

## What Changes

- Add a review completion capability that enables submission only after all issues have decisions.
- Generate mode-specific mock result assets:
  - Review mode creates a supervisor review report.
  - Review-revise mode creates a revised-plan snapshot.
- Add result preview surfaces for reports and revised-plan snapshots.
- Update the document library so completed documents expose a report/result entry point.
- Keep all behavior front-end mock only; no real PDF/Word export, backend persistence, or report-agent API is implemented.

## Capabilities

### New Capabilities
- `review-completion-results`: Defines review completion, result asset generation, report/snapshot preview, and document-library result entry behavior.

### Modified Capabilities
- `review-workbench`: Adds completion gating, confirmation, and mode-specific finish behavior.
- `document-review-task`: Adds completed result asset state and document library result entry expectations.

## Impact

- Affected files: `src/App.tsx`, `src/ReviewWorkbenchPage.tsx`, `src/domain/reviewTypes.ts`, `src/domain/reviewUtils.ts`, and `src/styles.css`.
- Existing upload, streaming review, issue handling, manual annotation, and preview behavior should remain compatible.
- Future backend integration can replace mock result generation with report-agent and document-snapshot APIs.
