## Why

The backend opening-condition acceptance smoke now protects the domain state machine, but trial production still depends on HTTP route wiring and operator-facing report handoff. The next most valuable slice is to verify the chain through API/browser-level gates and make the report page readable as a trial delivery artifact.

## What Changes

- Extend the opening-condition acceptance smoke capability from backend-domain-only checks to HTTP and lightweight UI smoke checks.
- Strengthen report handoff requirements so failed, blocked, resolved, and historical findings are understandable to supervisors without exposing raw internal enums.
- Document the trial handoff sequence so real-sample runs can be accepted by a repeatable checklist rather than manual memory.
- Keep this focused on production-readiness guardrails and report semantics; do not redesign the whole workspace UI in this change.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opening-condition-pilot-acceptance-smoke`: Add HTTP/API and lightweight UI smoke expectations on top of the existing retained backend smoke.
- `opening-condition-report-findings-delivery`: Add stricter delivery semantics for report handoff, history detail, and rectification-ready output.
- `opening-condition-report-delivery-workbench`: Add acceptance-oriented report workbench behavior for selected run details and historical inspection.

## Impact

- Affected code: likely `server/index.mjs`, `server/openingConditionPilotStore.test.mjs`, possible new retained smoke script, `src/productWorkspacePages.tsx`, and `src/styles/opening-condition.css`.
- Affected docs: `docs/opening-condition-single-project-trial-runbook.md` and the production roadmap.
- No database migration and no new provider dependency.
