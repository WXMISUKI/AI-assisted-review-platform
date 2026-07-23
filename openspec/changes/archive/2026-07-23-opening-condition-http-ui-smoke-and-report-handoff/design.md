## Context

The platform now has a retained backend smoke script, `npm run smoke:opening-condition`, that verifies the domain state machine. Real pilot acceptance still has two gaps: route wiring can break without domain tests noticing, and the report page can remain too internal for supervisor handoff even when the backend chain is correct.

This change is the next production-oriented slice after backend smoke. It borrows the mature-platform pattern of clear status, next action, history, and report handoff, while postponing broad visual redesign and full persistence migration.

## Goals / Non-Goals

**Goals:**

- Add an HTTP/API smoke layer for the same critical pilot chain already protected at the domain layer.
- Add a lightweight UI smoke or equivalent render-level guard for archived read-only controls and report handoff entry points.
- Improve report handoff semantics so findings, human decisions, and historical round details are readable without raw enum interpretation.
- Update the runbook so real-sample trial acceptance has explicit commands and expected outcomes.

**Non-Goals:**

- Do not redesign the whole opening-condition workspace overview.
- Do not introduce a full production database migration.
- Do not add new OCR, MaxKB, Dify, or LLM capability.
- Do not build final docx/pdf export in this slice.

## Decisions

1. **Layer smoke checks instead of replacing the backend smoke.**
   - Backend domain smoke remains the fastest regression gate.
   - HTTP smoke catches endpoint wiring, status code, and safe payload regressions.
   - UI smoke is limited to critical operator boundaries: archived read-only, primary rerun entry, report generation/archive visibility.

2. **Report handoff uses platform facts only.**
   - Report rows derive from task-owned `checkItems`, `humanReviewQueue`, `reportAsset.packageDiagnostics`, and historical run records.
   - Provider/OCR/LLM outputs can appear only as bounded evidence or notes, not as final authority.

3. **Keep visual changes scoped.**
   - Any report UI changes should improve grouping, labels, and scanability.
   - Avoid global theme work unless a token or shared component is clearly needed.

## Risks / Trade-offs

- HTTP smoke may need a test server lifecycle -> keep it local and deterministic, and avoid depending on port 5173 if a direct server harness exists.
- UI smoke can become brittle -> only assert core text/state/action boundaries, not pixel layout.
- Report handoff could expand into full report-generation scope -> keep docx/pdf export and rich template generation as later work.
