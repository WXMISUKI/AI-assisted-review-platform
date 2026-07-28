## Why

ZIP material packets are now split into inventory rows and derived preview assets, but entry identity can still be order-based or duplicated in historical data. This causes React duplicate-key warnings, incorrect document preview selection, and confusion when operators open packet files during human review.

## What Changes

- Make ZIP inventory entry ids stable and unique for a source archive plus normalized relative path.
- Keep manifest entries and derived preview entries aligned to the same entry id for the same ZIP path.
- Add a frontend UI-safe material-file id for historical tasks whose stored inventory ids are duplicated.
- Keep the browser-extension `chrome-extension://` console noise out of scope because it is not loaded by the platform code path.

## Capabilities

### New Capabilities

### Modified Capabilities
- `opening-condition-packet-item-assets`: ZIP packet item assets require stable, path-derived manifest identities.
- `opening-condition-pilot-execution-console`: The document library must use collision-free UI keys and preview selectors for packet inventory rows.

## Impact

- Backend ZIP manifest/preview extraction in `server/openingConditionZipManifest.mjs`.
- Opening-condition selected-task document library rendering in `src/productWorkspacePages.tsx`.
- Focused regression coverage in opening-condition pilot store and UI smoke tests.
