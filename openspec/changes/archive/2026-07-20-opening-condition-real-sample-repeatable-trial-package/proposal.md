## Why

The opening-condition pilot can now complete a backend-backed loop, but a real trial still depends on fragile manual observations: provider readiness can block matching, Chinese sample filenames and checklist adaptation need visible diagnostics, and report output is still an internal summary rather than a repeatable trial package. This change turns the single-project pilot into a repeatable real-sample trial package so the team can run the same basis/checklist/ZIP sample, record blockers, and produce an auditable auxiliary result without building the full production platform first.

## What Changes

- Add a repeatable trial-run package model for opening-condition pilot tasks, including run summary, input object refs, checklist-definition diagnostics, packet manifest diagnostics, execution blockers, and report/archive status.
- Extend real-file trial intake so operators can see whether the backend used direct checklist input, controlled template derivation, existing-task fallback, or manual-definition fallback.
- Extend packet diagnostics so ZIP manifest entry counts, bounded samples, and fallback reasons are visible throughout the task and portal.
- Add minimal OCR/provider handoff tracking for trial package evidence: task-owned evidence may record ingestion/job refs and bounded provider status without treating provider output as final review conclusions.
- Extend the report/archive flow so the generated auxiliary report can summarize real trial inputs, matching results, human decisions, diagnostics, and archive status as a repeatable trial artifact.
- Update the single-project trial runbook with step-by-step operator actions and expected logs/blockers.
- Do not add full multi-tenant authorization, formal database migration, a second upload channel, or direct frontend access to OCR/MaxKB providers.

## Capabilities

### New Capabilities
- `opening-condition-real-sample-trial-package`: Covers repeatable trial-run summaries, real-sample diagnostics, evidence/provider handoff status, and auxiliary trial report packaging for the opening-condition pilot.

### Modified Capabilities
- `opening-condition-pilot-execution-console`: Display trial-run diagnostics, provider/OCR handoff status, and real report package status in the operator console.
- `opening-condition-pilot-operational-api`: Extend pilot task contracts with bounded trial package diagnostics and report package fields.
- `opening-condition-single-project-trial-intake`: Harden real-file intake for repeatable sample runs and visible checklist/manifest diagnostics.

## Impact

- Frontend: `src/App.tsx`, `src/productWorkspacePages.tsx`, and `src/domain/backendConnectivity.ts` for typed contracts, operator diagnostics, and report package rendering.
- Domain types: `src/domain/openingConditionPilot.ts` for trial package summary, evidence handoff status, and report diagnostics.
- Backend: `server/openingConditionPilotStore.mjs`, `server/index.mjs`, checklist adapter, ZIP manifest handling, and targeted tests.
- Docs: `docs/opening-condition-single-project-trial-runbook.md` and next-stage notes.
- Storage: development file store schema remains local JSON; new fields must be normalized, bounded, and secret-redacted.
