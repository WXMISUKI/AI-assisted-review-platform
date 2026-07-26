## Why

The construction-plan review MVP already reaches task completion and persists a `supervisor-report` result asset, but the delivery path still stops at an in-app preview. That means the current product is reviewable but not yet truly handoff-ready for teams that need a downloadable report artifact.

This change focuses on the fastest high-value delivery slice after DOCX parsing, review gating, and near-source preview: turn a completed `supervisor-report` result asset into a downloadable DOCX handoff through the existing backend-owned HTTP tools adapter boundary.

## What Changes

- Formalize construction-plan report export as a dedicated change instead of leaving it as a partial implementation.
- Generate bounded semantic HTML from `SupervisorReportAsset` on the backend.
- Expose `POST /api/review-tasks/:taskId/report/export-docx` for construction-plan report export.
- Let the result preview page trigger DOCX export and show a safe HTML fallback when export is unavailable.
- Add smoke coverage for report HTML generation and export API failure boundaries.

## Capabilities

### New Capabilities
- `review-completion-results`: completed construction-plan review results can be exported as DOCX through a backend-owned adapter boundary.

### Modified Capabilities
- `document-review-task`: completed tasks can expose a report export endpoint when a supervisor report result asset exists.

## Impact

- Backend report builder: `server/reviewReportHtml.mjs`
- Backend API: `server/index.mjs`
- Frontend connectivity: `src/domain/backendConnectivity.ts`
- Result preview UI: `src/appShellPages.tsx`
- Validation: new construction-plan export smoke coverage
- Docs: `docs/construction-plan-p0-docx-trial-roadmap.md`
