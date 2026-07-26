## Context

The platform is converging on a task-ledger-driven opening-condition MVP: intake, matching, human review, report, DOCX export, archive, and rerun history. Recent work added a rectification delivery list to the report page, and the backend already stores an `exportHandoff` object when report assets are generated or exported.

The remaining gap is the boundary between report rendering and downstream consumption. Mature engineering review platforms keep report facts, action ownership, and export payloads as explicit handoff objects; they do not ask exporters or agents to infer meaning from UI labels.

## Goals / Non-Goals

**Goals:**

- Build a bounded delivery package from the selected run's findings and report diagnostics.
- Preserve supervisor-facing fields: issue, category, risk, disposition, legal basis, rectification requirement, evidence or human-review notes.
- Add readiness metadata for export/backfill consumers: schema version, package id, source task id, read-only state, row counts, blocking counts, adapter status, and next action.
- Display the package summary in the report page ahead of detailed cards.

**Non-Goals:**

- Do not redesign the full report UI.
- Do not add evidence preview or page-level highlight navigation.
- Do not call `docxToHtml` or `htmlToDocx` beyond the existing DOCX export path.
- Do not introduce a database migration.

## Decisions

1. **Derive package in frontend for this slice.**
   The backend already provides enough task-owned facts. Building the package in `productWorkspacePages.tsx` gives the MVP visible value without changing server persistence. Later, the same shape can be moved backend-side once database persistence is introduced.

2. **Use bounded row fields only.**
   The package contains checklist context, issue description, labels, basis, rectification, and short notes. It does not include raw OCR text, prompts, private object URLs, or unbounded provider output.

3. **Keep exporter readiness separate from export execution.**
   A report can be ready for handoff before a DOCX adapter runs. The package should show whether rows exist and whether unresolved human-review/blocking items remain.

## Risks / Trade-offs

- Frontend-derived package is not yet persisted independently -> Mitigation: keep the type and builder pure so it can be moved into backend generation later.
- Existing report labels have mixed legacy wording -> Mitigation: package fields use stable keys and readable labels without starting a broad copy rewrite.
- Operators may confuse handoff readiness with approval -> Mitigation: package status distinguishes `ready_for_handoff`, `blocked_by_review`, and `empty`.
