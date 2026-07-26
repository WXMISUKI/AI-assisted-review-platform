## Context

The report page now derives a delivery package from report findings and diagnostics. The backend already owns report generation, archive mutation, DOCX export mutation, and redaction/normalization. It is therefore the correct place to persist the delivery package for durable handoff.

## Goals / Non-Goals

**Goals:**

- Add backend derivation for `deliveryPackage`.
- Normalize package rows, status, counts, notes, diagnostics, and generated timestamps.
- Preserve archive read-only semantics in the package.
- Keep existing frontend fallback for older report assets.

**Non-Goals:**

- Do not add evidence preview.
- Do not call external docx/html services.
- Do not change the report approval rules.
- Do not redesign the report UI.

## Decisions

1. **Backend owns persisted delivery package.**
   The package is derived beside `deliveryHandoff` and `exportHandoff` in `deriveReportPackageDiagnostics`. This keeps report generation, archive, and export mutation consistent.

2. **Rows reuse report findings.**
   The backend package rows are derived from structured findings rather than check-item UI state. Older tasks still work because `deriveReportPackageFindings` already falls back to check-item facts.

3. **Normalization mirrors existing report diagnostics.**
   The store clamps strings, arrays, counts, statuses, and diagnostics. Unknown or unsafe fields are discarded by normalization.

## Risks / Trade-offs

- Existing tasks may not have persisted packages -> frontend fallback remains.
- Backend package row labels may differ slightly from frontend labels -> prefer backend package once available and keep row fields operator-facing.
- Smoke tests could become brittle if they assert exact wording -> assert stable status/counts/row presence instead.
