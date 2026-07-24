## Context

The opening-condition product has grown from a demo chain into a repeatable pilot loop. It now has workspace context, basis and master-data governance, formal checklist matching, human-review decisions, structured findings, export handoff, run history, and archived read-only behavior.

The remaining MVP gap is not another provider capability. It is the operator-facing delivery contract: the generated report package should explicitly say whether the selected run is report-ready, archived, blocked, or still pending human action; who owns the next action; and whether the current view is read-only history.

## Goals / Non-Goals

**Goals:**

- Add stable delivery handoff facts to report package diagnostics.
- Derive handoff facts from platform-owned task state, not provider output.
- Render the handoff in the report page for current and historical runs.
- Preserve archived immutability and explicit rectification-rerun entry.
- Keep the change small enough to support the current MVP delivery line.

**Non-Goals:**

- No full database migration.
- No new permission model.
- No new provider or model orchestration.
- No comprehensive visual redesign.
- No implementation of the future twelve-agent taxonomy system.

## Decisions

1. Store delivery handoff inside `reportAsset.packageDiagnostics`.

Rationale: report diagnostics are already the stable, bounded delivery package consumed by the page and DOCX export. Adding the handoff there keeps exporters and historical views from recomputing business meaning from raw task state.

Alternative considered: derive everything in the React page. Rejected because historical report facts and future exporters need the same semantics without page-specific logic.

2. Keep the handoff bounded and operator-facing.

The contract will include `status`, `currentOwner`, `nextAction`, `recommendedPage`, `readOnly`, `blockingCount`, `generatedAt`, and safe notes. It will not include raw OCR text, prompts, private URLs, or provider traces.

3. Reuse existing run-gate semantics but avoid creating a hard frontend dependency in the backend.

The backend will derive equivalent delivery facts from task state and queue counts. The frontend can still render richer shared gate summaries through `openingConditionPortalState.ts`.

## Risks / Trade-offs

- Report handoff could drift from frontend gate labels -> Mitigation: keep field names generic and add smoke assertions for the backend package.
- This does not make the page beautiful -> Mitigation: this change intentionally prioritizes a stable MVP contract; visual redesign remains a later phase.
- Historical report packages generated before this change may not have handoff facts -> Mitigation: frontend falls back to selected-run action ownership when the package field is absent.
