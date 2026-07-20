## Why

The project has already restored the product shell and built the opening-condition pilot intake, ZIP manifest extraction, backend matching, human-review, report, and archive APIs. The highest-value next step is to connect those pieces into a visible single-project completion loop so the team can run a real trial end to end and discover production blockers.

This is more valuable now than building a full multi-tenant permission platform, redesigning the UI, or further optimizing provider internals, because it proves the platform's core business value: basis and master-data gates, material packet matching, human adjudication, and auditable report archival.

## What Changes

- Promote the opening-condition pilot execution console from intake/match only to a completion loop that shows backend-backed match results, human-review decisions, report generation, and archive actions.
- Prefer backend pilot-task `checkItems`, `evidence`, `humanReviewQueue`, and `reportAsset` over local demo packet output whenever a task exists.
- Add typed frontend orchestration for human-review decisions, report generation, and archive actions using the existing backend APIs.
- Add bounded operator status messages and disabled states so each step is explicit and recoverable.
- Document the next-stage task breakdown around "single-project real pilot completion" rather than local UI polishing or full platform tenancy.
- Do not change OCR Worker, MaxKB provider, upload channels, object-storage semantics, or multi-tenant authorization in this slice.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `opening-condition-pilot-execution-console`: The console must support backend-backed completion actions after formal matching: review decisions, report generation, and archive.
- `opening-condition-pilot-operational-api`: The frontend contract must treat existing human-review, report, and archive endpoints as part of the single-project pilot completion loop.

## Impact

- Affected frontend: `src/appShellPages.tsx`, `src/domain/backendConnectivity.ts` imports/usages only if needed.
- Affected docs: a concise handoff or planning note in `docs/` describing why this is the recommended next direction.
- Affected specs: delta specs for `opening-condition-pilot-execution-console` and `opening-condition-pilot-operational-api`.
- No backend storage schema changes expected.
- No external provider configuration required.
