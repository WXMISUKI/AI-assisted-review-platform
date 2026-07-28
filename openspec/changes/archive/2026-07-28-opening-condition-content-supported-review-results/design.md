## Context

The opening-condition pilot already owns task state, packet inventory, content facts, retrieval diagnostics, human-review decisions, and report assets. The highest-value remaining gap is not another provider route; it is using those platform facts consistently when deriving check-item outcomes, human-review reasons, and the operator-facing Markdown report.

Current implementation already has a conservative match path, but two issues reduce confidence: one material-review scope filter contains corrupted Chinese text, and generated report rows can be too generic or empty when findings are derived from fallback check items and human-review decisions.

## Goals / Non-Goals

**Goals:**

- Keep formal matching limited to资料核查/material-review items for the current MVP.
- Treat filename-only matches as insufficient when content facts are pending, unsupported, missing, or mismatched.
- Preserve concise content-verification diagnostics in check items, human-review reasons, and report findings.
- Generate a Markdown report table from platform findings and latest human-review decisions.

**Non-Goals:**

- Do not implement OCR, page splitting, page-level PDF annotation, or large-file chunking in this batch.
- Do not call MaxKB/OCR Worker from the browser.
- Do not generate legal rectification requirements with a model in this batch.
- Do not change the persistence backend or introduce a queue.

## Decisions

1. **Fix scope filtering in the deterministic backend.**

   The platform should exclude现场核查、现场检查、现场确认、应急响应、应急演练、现场观测 from this MVP. This keeps generated checklist definitions aligned with the Dify workflow's current material-review scope.

2. **Make semantic diagnostics first-class but bounded.**

   Check items should retain `semanticMatch` notes and statuses derived from content facts and retrieval diagnostics. Human-review reasons should translate those statuses into concrete Chinese operator language.

3. **Report rows are derived from platform findings, not UI mock data.**

   `generateOpeningConditionPilotReport` should use normalized report-package findings and latest human-review decisions. If a human corrected or rejected an AI finding, the Markdown issue text must include the human note.

## Risks / Trade-offs

- Metadata-only facts may still be mistaken for content verification -> keep `pending`/`unsupported` wording explicit and route to human review.
- Deterministic content matching is shallow until OCR/provider facts improve -> report language must say “内容事实未证明” rather than overclaiming non-compliance.
- Legal basis remains generic in this batch -> use platform rule/basis references and keep LLM legal generation as a later task.
