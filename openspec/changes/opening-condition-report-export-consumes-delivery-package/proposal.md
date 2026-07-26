## Why

The backend now persists `deliveryPackage` as the report handoff source of truth, but the generated HTML/DOCX report still builds its issue table directly from `findings`. The export path should consume the same delivery package that the page and future adapters consume, otherwise report output can drift from archived platform facts.

## What Changes

- Make report HTML generation prefer `packageDiagnostics.deliveryPackage.rows`.
- Keep the existing findings-based table as a fallback for older report assets without a delivery package.
- Add smoke coverage proving generated report HTML includes delivery-package row fields.
- Do not change http_tools integration, DOCX conversion, or report approval rules.

## Capabilities

### New Capabilities

<!-- None. -->

### Modified Capabilities

- `opening-condition-report-export-delivery-package`: Delivery package rows become the primary source for exported report content.
- `opening-condition-export-handoff`: Exported report content references the stable delivery package rather than independently reconstructing issue rows.

## Impact

- Affected backend: `server/openingConditionPilotStore.mjs`, existing smoke tests.
- Affected exported output: internal report HTML/DOCX table wording and row source.
- No new API, dependency, or database migration.
