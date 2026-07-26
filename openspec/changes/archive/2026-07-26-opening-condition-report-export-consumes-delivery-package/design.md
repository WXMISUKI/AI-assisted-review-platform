## Context

Recent changes made `deliveryPackage` a normalized backend report diagnostic. This package is intended to be the shared handoff for DOCX export, original-form backfill, archive replay, and future specialist agents.

The current HTML builder still maps `findings` into report rows. That worked before the package existed, but it creates two row-building paths: one for platform handoff and one for exported report content.

## Goals / Non-Goals

**Goals:**

- Use `deliveryPackage.rows` as the first source for the exported report issue table.
- Preserve the existing findings fallback.
- Keep exported HTML safe by continuing to escape all row fields.
- Add targeted smoke assertions around generated HTML.

**Non-Goals:**

- Do not redesign report visuals.
- Do not implement original-form backfill.
- Do not change report generation gating.
- Do not call external conversion services in tests.

## Decisions

1. **Prefer package rows, fallback to findings.**
   This supports existing archived tasks while aligning all new reports with backend handoff facts.

2. **Keep helper functions local to report HTML generation.**
   The change is output-specific and should not create another cross-module abstraction yet.

3. **Test via HTML builder.**
   Testing `buildOpeningConditionPilotReportHtml` verifies the actual DOCX input without needing http_tools.

## Risks / Trade-offs

- Delivery rows have fewer columns than raw findings -> Mitigation: table maps stable row fields to supervisor-facing report columns and keeps issue type summaries separately.
- Old reports without packages still exist -> Mitigation: findings fallback remains.
