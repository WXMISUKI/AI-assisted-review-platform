## Context

The opening-condition MVP now starts from a task ledger and exposes selected-task issue and human-review summaries. The remaining usability gap is that the destination pages do not know which item triggered navigation, so operators must search again.

## Goals / Non-Goals

**Goals:**
- Carry focused checklist item id and human-review item id from the selected task summary into existing destination pages.
- Show a bounded focus banner and visually mark the matching row/card.
- Keep the focus state local to the opening-condition shell because it is navigation context, not a durable business fact.

**Non-Goals:**
- Do not introduce URL routing, deep links, or browser history integration.
- Do not add evidence preview, file page rendering, or inline annotation.
- Do not change backend task payloads or human-review decision APIs.
- Do not touch construction-plan review.

## Decisions

1. Use `focusedCheckItemId` and `focusedHumanReviewId` local state in `OpeningConditionWorkspaceShell`.
   - Rationale: this gives immediate MVP value without a router migration.
   - Alternative considered: URL query params. Better later for sharing links, but broader than this slice.

2. Pass focus props down only to checklist and human-review pages.
   - Rationale: keeps ownership clear and prevents focus state from leaking into reports or governance pages.

3. Highlight and explain, not auto-mutate.
   - Rationale: focused routing should reduce search cost while preserving existing explicit review actions.

## Risks / Trade-offs

- [Risk] Focus is lost on refresh. -> Mitigation: acceptable for MVP; durable routing can be added when route params are introduced.
- [Risk] A selected historical task may not be the active task on destination pages. -> Mitigation: actions keep routing to existing current-run pages and focus is best-effort.
