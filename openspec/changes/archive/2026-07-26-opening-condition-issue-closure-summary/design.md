## Context

The opening-condition MVP already has task ledger routing, report finding routing, focus return, report generation/export, and archive history. However, issue closure is spread across findings, human-review queue, rectification delivery rows, and report readiness. Operators need a compact "are we closed or still blocked?" view without opening every page.

## Goals / Non-Goals

**Goals:**
- Derive a read-only issue-closure summary from existing frontend facts.
- Show it in the selected task handoff and report delivery workbench.
- Explain the next action in business language: close human review, prepare rectification delivery, generate report, archive, or start rerun.
- Keep the summary deterministic and local to UI code for this MVP slice.

**Non-Goals:**
- Do not add backend fields, APIs, database tables, or migrations.
- Do not replace the formal report asset or DOCX export package.
- Do not introduce new AI agents, LLM prompts, or provider calls.
- Do not redesign the whole report page or task ledger.
- Do not touch construction-plan review flows.

## Decisions

1. Create a small `buildOpeningConditionIssueClosureSummary` helper in `productWorkspacePages.tsx`.
   - Rationale: the same derived values are needed by task rows and report delivery.
   - Alternative considered: inline summary objects in both components. That would duplicate rules and drift quickly.

2. Treat `blocked`, `fail`, `reject`, and unresolved human-review items as open closure work.
   - Rationale: those states block or inform report handoff in the current MVP.
   - Alternative considered: include warnings as blockers. Warnings should remain visible but not block the closure label.

3. Keep the summary read-only and navigation-adjacent.
   - Rationale: it should guide the operator but not mutate task, report, archive, or review state.

## Risks / Trade-offs

- [Risk] Frontend-derived closure summary may differ from future backend diagnostics.
  - Mitigation: name it as a UI handoff summary and keep it based on already displayed facts until backend owns a durable summary.
- [Risk] Another card may add visual density.
  - Mitigation: use existing compact summary/grid patterns and only show a few high-signal fields.
