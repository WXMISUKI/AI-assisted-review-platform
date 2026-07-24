## Why

The opening-condition pilot can already run through intake, matching, human review, report generation, export, and archive, but master-data records still read like trial placeholders instead of governed facts. This blocks MVP trust because operators cannot clearly see what personnel, equipment, certificate, organization, or system-document facts the platform intends to store and use for formal checks.

## What Changes

- Introduce an operator-facing master-data candidate preview contract aligned with the existing basis preview pattern.
- Make each current-run master-data candidate explain its source file, extracted facts, missing fields, confidence, confirmation state, publication readiness, and next action.
- Separate candidate approval from final publication so `human_approved` no longer feels like an unexplained internal shortcut.
- Show the current run's usable published master-data snapshot separately from workspace-level candidate and catalog records.
- Keep the change scoped to the single-project opening-condition MVP; do not introduce multi-tenant permissions, full database migration, or broad UI redesign.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opening-condition-master-data`: Add candidate preview governance, explicit confirmation/publication lifecycle, and current-run snapshot clarity.
- `opening-condition-intake-preview-and-publish-gate`: Require the intake gate to expose master-data preview readiness before formal matching.
- `opening-condition-pilot-operational-api`: Expose safe API behavior for master-data candidate decisions and publication readiness.

## Impact

- Backend store: master-data normalization, decision semantics, and readiness diagnostics.
- Backend API: existing workspace master-data endpoints may return richer preview metadata and clearer decision results.
- Frontend: basis/master-data page and intake overview should display candidate facts, missing fields, source evidence, and run-bound published records with operator-facing labels.
- Smoke tests: add assertions that a current run can distinguish provisional candidates, confirmed candidates, published usable records, and rejected exceptions.
