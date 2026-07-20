## Context

The project is currently validating the opening-condition pilot as the fastest production-adjacent path: uploaded basis/checklist/material packet refs become a task, the backend owns readiness and matching state, uncertain items go to human review, and a backend report asset can be archived. The previous completion loop proved the control flow but also exposed real-trial risks: provider readiness can block matching, terminal/API simulation can damage Chinese filenames, checklist adaptation needs explicit diagnostics, and report output does not yet read like a repeatable trial package.

The implementation must preserve the current project positioning: the platform owns tasks, business facts, human decisions, and report/archive records; OCR Worker and MaxKB remain support providers. The change should continue using the existing MinIO upload channel, local development JSON store, and backend-first execution rendering.

## Goals / Non-Goals

**Goals:**
- Make one real sample run repeatable from the portal: basis file, checklist file, and material ZIP can be uploaded and produce a task-owned trial summary.
- Surface bounded diagnostics for checklist-definition resolution, ZIP manifest resolution, provider readiness, blocking reasons, and report/archive status.
- Add minimal OCR/provider handoff tracking fields on evidence/report diagnostics so provider work can be attached without becoming final approval logic.
- Produce a backend report package summary that lets a trial operator and developer replay what happened.
- Update the runbook with exact operator steps and expected observations.

**Non-Goals:**
- No full multi-tenant authorization model.
- No production database migration.
- No second upload path or server-local path reading.
- No direct frontend calls to OCR Worker or MaxKB.
- No attempt to make OCR/MaxKB output an automatic final conclusion.

## Decisions

1. **Attach trial package diagnostics to the pilot task instead of introducing a separate service.**
   - Rationale: the current value comes from one task-owned flow; a separate trial-run service would add indirection before the pilot is validated.
   - Alternative considered: create a standalone trial-run store. Deferred until multiple task versions or cross-project analytics are needed.

2. **Use bounded summary fields and events for repeatability.**
   - Rationale: the local JSON store already normalizes events and redacts unsafe keys. The trial package can be reconstructed from task, packet, checklistDefinition, checkItems, evidence, humanReviewQueue, reportAsset, and a compact `trialRun`.
   - Alternative considered: persist raw OCR text or full ZIP manifest. Rejected because it increases privacy and storage risk before production boundaries exist.

3. **Keep provider handoff status advisory.**
   - Rationale: provider readiness and OCR jobs should explain evidence quality and next actions, not replace human review or platform state.
   - Alternative considered: block every run until provider returns ready. Rejected because real trials must still expose provider degradation as a recorded blocker.

4. **Render diagnostics in existing pages.**
   - Rationale: `资料接入`, `资料核查`, `人工复核`, and `报告归档` already map to the operator workflow. New cards should be compact and backend-backed rather than a new dashboard.
   - Alternative considered: build a new trial cockpit page. Deferred to avoid UI churn.

## Risks / Trade-offs

- **Existing local store contains polluted test events** -> Provide a later reset/versioning task; for this change, new trial summaries should make the latest run clear.
- **Provider readiness differs between health summary and proxy status** -> Store both bounded provider diagnostics and readiness blockers so the operator can see why matching is blocked.
- **Chinese filenames can be damaged by shell-based smoke tests** -> Treat browser upload as the authoritative real-file path; runbook must tell the operator to use the file picker.
- **Report package may be mistaken for formal approval** -> Keep the auxiliary disclaimer and explicitly list human decisions and unresolved/deferred items.
- **Adding fields can break old tasks** -> Normalize all new fields as optional and derive summaries from existing task data when absent.
