## Why

The report delivery package is now visible in the frontend, but production handoff should not depend on browser-side derivation. Persisting the package in backend report diagnostics makes DOCX export, archive replay, original-form backfill, and future specialist agents consume the same source of truth.

## What Changes

- Generate `deliveryPackage` inside backend report package diagnostics when a report asset is created.
- Normalize and bound `deliveryPackage` during store reads/writes so unsafe fields cannot leak through persisted task state.
- Refresh the package when archived reports become read-only and when report export updates handoff metadata.
- Keep the frontend fallback derivation for older stored tasks, but prefer backend-provided `deliveryPackage`.

## Capabilities

### New Capabilities

<!-- None. -->

### Modified Capabilities

- `opening-condition-report-export-delivery-package`: Delivery packages are backend-generated and persisted as report diagnostics.
- `opening-condition-pilot-operational-api`: Report, archive, and export responses preserve or refresh delivery package diagnostics.

## Impact

- Affected backend: `server/openingConditionPilotStore.mjs`, existing opening-condition smoke tests.
- Affected frontend: `src/productWorkspacePages.tsx` only if compatibility is needed.
- Affected specs: report export delivery package and pilot operational API.
- No new endpoint, dependency, or database migration.
