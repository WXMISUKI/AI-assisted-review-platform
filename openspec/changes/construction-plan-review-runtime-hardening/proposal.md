## Why

The construction-plan review line still has one field-reported runtime blocker that is more about operational hardening than feature scope: some local backend processes still fail the DOCX object-review path with `DOCX parsing failed: Cannot find package 'node-fetch' imported from server/index.mjs`. At the same time, today's runtime-stability fixes for the opening-condition report workbench and oversized local review-task snapshots need an explicit verification slice so we can distinguish "old process/cache" from "current source regression".

## What Changes

- Add backend runtime diagnostics for local development so `/api/health` can show the active Node runtime and DOCX object-download fetch mode.
- Centralize DOCX object-download fetch resolution in the backend and make the failure message explicit about unsupported or stale local runtimes instead of implying a missing package dependency in current source.
- Add a focused smoke test for runtime diagnostics and the no-`node-fetch` source contract.
- Keep scope limited to runtime hardening and verification; do not expand construction-plan preview architecture or opening-condition business workflows in this slice.

## Capabilities

### New Capabilities
- `local-development-runtime`: health diagnostics expose active runtime support needed by DOCX object parsing.

### Modified Capabilities
- `document-review-task`: DOCX object review parsing uses the backend runtime fetch contract rather than an optional package dependency.

## Impact

- Backend: `server/index.mjs`
- Tests: add a focused backend runtime smoke under `server/`
- OpenSpec: sync `local-development-runtime` and `document-review-task`
- No frontend route, state-machine, provider, or report-format changes
