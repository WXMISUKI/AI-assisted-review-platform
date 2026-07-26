## Context

The opening-condition MVP has shifted the primary operator entry to the task ledger. Report detail already contains a rectification closure comparison, but operators still need to open a report to know whether a rerun solved previous blockers, carried them forward, introduced new issues, or still needs human judgement.

This change keeps the existing frontend-derived approach: use archived/current task facts and the existing rectification diff helper, then surface a compact read-only summary in the ledger and selected-task handoff. No backend schema, provider, OCR, knowledge-base, or DOCX export behavior changes are included.

## Goals / Non-Goals

**Goals:**
- Show compact rectification closure counts in the task ledger when a previous archived run exists.
- Show the selected task's rectification closure counts in the handoff detail.
- Keep labels actionable for MVP operation: resolved, still open, new, and needs human judgement.
- Reuse existing task/run facts so the summary remains consistent with the report page.

**Non-Goals:**
- Redesign the full opening-condition workspace navigation.
- Add backend APIs, database migrations, or persisted derived fields.
- Change formal matching, human-review decisions, report generation, or DOCX export.
- Build document page-level preview or annotation workflows.

## Decisions

1. Reuse existing rectification diff logic instead of adding another classifier.
   - Rationale: the report page already depends on this interpretation; duplicating it would make ledger and report disagree.
   - Alternative considered: create ledger-specific status rules. Rejected because it increases state surface without adding MVP value.

2. Render summaries only when previous-run comparison data exists.
   - Rationale: first-run tasks do not have a meaningful closure baseline; showing zeroes would imply a completed comparison that has not happened.
   - Alternative considered: always show a placeholder. Rejected because the ledger is already dense and MVP should reduce noise.

3. Keep the summary read-only and derived at render time.
   - Rationale: avoids migrations and keeps the change deployable as a frontend MVP slice.
   - Alternative considered: persist closure counts on report assets. Deferred until backend report assets become the source of truth for cross-user audit.

## Risks / Trade-offs

- [Risk] Frontend-derived summaries can drift from future backend report logic.
  - Mitigation: centralize on the existing helper and extend smoke tests around visible labels/counts.
- [Risk] Ledger rows become visually crowded.
  - Mitigation: use a compact four-count summary and only show it when comparison data exists.
- [Risk] Archived/current task selection has incomplete history in demo data.
  - Mitigation: gracefully omit the summary when no previous archived run can be compared.
