## Context

The Dify workflow already validated a useful report shape: a summary plus a nonconforming-item table with issue description, risk level, legal basis, and rectification requirement. The platform now owns richer task/checkItem/humanReview/reportAsset facts, but the page still emphasizes grouped cards and internal dispositions.

For quick pilot delivery, the next slice should make the report page read like a handoff checklist. This is more valuable than adding another provider or doing broad visual redesign because it directly affects whether supervisors can understand and use the output.

## Goals / Non-Goals

**Goals:**

- Add a scan-friendly rectification delivery list to the report page.
- Use existing `ReportFinding` fields and existing report data.
- Preserve grouped cards for detailed follow-up.
- Make each row include the fields needed by later DOCX/original-table export.

**Non-Goals:**

- No backend report package schema migration.
- No export adapter changes.
- No legal-basis enrichment from an LLM in this change.
- No document evidence preview or page locator implementation.

## Decisions

1. Build the list from `buildReportFindings`.
   - This keeps the list aligned with existing report package diagnostics when present.
   - If report package findings are absent, the existing checkItem fallback continues to work.

2. Include pending human-review items as handoff rows.
   - The Dify-style report focused on nonconforming items, but platform MVP also needs pending manual judgement surfaced as a delivery blocker.

3. Put the delivery list before grouped finding cards.
   - Operators should first see a report-like整改清单, then use the existing grouped cards for detail.

4. Keep styling local to `opening-condition.css`.
   - The project already has business-specific opening-condition styles; this change should not alter global theme tokens.

## Risks / Trade-offs

- [Risk] Basis and rectification text may still be generic when backend package data is sparse.
  → Mitigation: show the best available platform facts now; later issue-taxonomy/provider work can enrich the same fields.

- [Risk] The report page becomes denser.
  → Mitigation: the delivery list is compact and grouped cards remain below it rather than duplicating every field in a new expanded card.
