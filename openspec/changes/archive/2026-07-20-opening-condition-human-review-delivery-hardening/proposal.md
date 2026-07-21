## Why

The real-sample trial has reached formal matching and produced human-review blockers. The fastest path toward pilot delivery is now to harden the human-review-to-report handoff so operators can reliably turn uncertain machine findings into auditable review decisions and an archiveable report package.

## What Changes

- Add a concise human-review delivery hardening slice for the opening-condition pilot.
- Show clearer human-review counts, blocking status, and next action on the human-review page.
- Keep report generation gated until the backend task is actually `report_ready`, not merely until the queue is empty.
- Document the recommended operator path after formal matching produces human-review items.
- Preserve current backend decision semantics: confirm/correct/reject close blockers; defer remains blocking; report generation stays backend-gated.

## Capabilities

### New Capabilities
- `opening-condition-human-review-delivery-hardening`: Defines the pilot delivery handoff from human-review blockers to report-ready and archived states.

### Modified Capabilities
- `opening-condition-pilot-execution-console`: Human-review and report pages need clearer task-owned handoff guidance and stricter report-action gating.

## Impact

- Frontend: `src/productWorkspacePages.tsx`
- Docs: `docs/opening-condition-single-project-trial-runbook.md`
- Specs: opening-condition execution console and new human-review delivery hardening capability.
- No backend API shape changes, new dependencies, OCR expansion, permission platform, or database migration.
