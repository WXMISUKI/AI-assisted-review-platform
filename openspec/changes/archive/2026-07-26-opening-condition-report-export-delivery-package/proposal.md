## Why

The opening-condition MVP already renders a rectification delivery list, but that list is still mostly a UI-facing structure. The next fastest production step is to make the report's delivery facts available as a stable, bounded package that DOCX export, original-form backfill, and future specialist agents can consume without scraping page copy.

## What Changes

- Add an export-ready report delivery package derived from platform-owned findings, human-review decisions, package diagnostics, and archive state.
- Surface the package summary on the report page so operators can see whether the current report is ready for export/backfill handoff.
- Document the package as the future input boundary for `docxToHtml` / `htmlToDocx`, original-table backfill, issue-taxonomy agents, and legal-rectification agents.
- Keep the scope bounded to report handoff structure and visibility; no new external adapter call is introduced in this change.

## Capabilities

### New Capabilities

- `opening-condition-report-export-delivery-package`: Defines the stable report delivery package used by export, original-form backfill, and specialist-agent handoff.

### Modified Capabilities

- `opening-condition-report-findings-delivery`: The report page now exposes the delivery package summary before lower-level report details.
- `opening-condition-export-handoff`: The export handoff now includes structured rectification rows and readiness metadata rather than only counts and adapter status.

## Impact

- Affected frontend/domain code: `src/productWorkspacePages.tsx`, `src/domain/openingConditionPilot.ts`.
- Affected documentation: `docs/opening-condition-review-task-workbench.md`.
- Affected specs: report findings delivery and export handoff.
- No database migration and no new runtime dependency.
