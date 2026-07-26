## Context

The task ledger is now the opening-condition MVP entry, and report pages already contain rich findings and delivery package data. The next useful MVP step is to expose a compact issue handoff inside the selected task detail so operators can decide whether to inspect checklist results, process human review, or move to report/archive.

## Goals / Non-Goals

**Goals:**
- Summarize the selected run's issue state directly in the task ledger detail.
- Separate AI-detected problems from pending human-review decisions.
- Reuse existing frontend builders such as `buildReportFindings` and existing task facts.
- Keep all actions routed to existing pages.

**Non-Goals:**
- Do not build a file/page evidence preview yet.
- Do not add inline human-review mutation controls to the task ledger.
- Do not change backend payloads or report generation.
- Do not alter construction-plan review.

## Decisions

1. Use frontend-derived selected-task rows for this slice.
   - Rationale: the backend already returns bounded check items, human review, evidence, and report diagnostics; a new endpoint is unnecessary for MVP.
   - Alternative considered: backend-owned task-detail summary. This is better for production but would add API work before the UI flow is validated.

2. Limit the selected detail to top findings and counts.
   - Rationale: the ledger should guide action, while the checklist and report pages remain the full detail surfaces.

3. Route instead of mutate.
   - Rationale: keeping mutations on existing pages reduces accidental state changes and protects archived read-only behavior.

## Risks / Trade-offs

- [Risk] Findings without report assets are still deterministic/checklist-derived and may lack rich legal text. -> Mitigation: show bounded reason, category, evidence, and route to checklist detail.
- [Risk] The ledger may become dense again. -> Mitigation: cap visible findings and pending review rows, and keep full lists on existing pages.
