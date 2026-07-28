## Context

The opening-condition platform now owns orchestration state, checklist extraction, packet inventory, human-review decisions, and report assets. The recent workbench changes render task history, document previews, human-review decisions, and a final Markdown report in the agent console.

The remaining gap is not a new workflow stage. It is alignment: once an operator confirms, corrects, or rejects a human-review item, that decision must become the basis for reportable findings. Likewise, checklist rows outside the current material-review MVP should remain visible only as diagnostics where needed, not as actionable `待核查资料项` rows.

## Goals / Non-Goals

**Goals:**

- Make final Markdown report rows use human-review-aware findings.
- Include human safe notes in the report issue description or handoff context when present.
- Keep out-of-scope `现场核查` rows out of the selected-task material-review list and reportable Markdown table.
- Unify visible history deletion semantics across task history surfaces.

**Non-Goals:**

- No large-PDF page splitting, OCR annotation, or page-level evidence marking.
- No live legal-basis or rectification LLM generation.
- No migration of old historical task data beyond safe rendering fallbacks.

## Decisions

- Use the existing report package finding derivation as the canonical human-review-aware source for final report Markdown. It already merges checklist items, evidence labels, latest review status, and safe notes, which avoids duplicating decision logic.
- Treat confirmed human review as closed/non-reportable when the operator accepts the item, while corrected/rejected/deferred states remain reportable according to their final disposition.
- Filter out `scopeStatus: "out_of_scope"` and `finalDisposition: "not_applicable"` from selected-task checklist rows. Diagnostics can still keep counts elsewhere, but the main material-review list should only show actionable material checks.
- Keep deletion wired through the existing backend delete endpoint and App-level state refresh. Report/history pages should use the same delete action when deletion is offered, instead of a separate hide-only test mechanism as the primary visible action.

## Risks / Trade-offs

- Human-review status semantics are still bounded: `confirm` means accepted/closed, `correct` and `reject` remain reportable. If future review states need richer meaning, the report finding mapper will need extension.
- Existing archived/historical tasks may have old queue/status combinations. The UI should fail soft by showing read-only report diagnostics rather than mutating archived records.
- Removing out-of-scope rows from the main list could make some diagnostics less visible. This is acceptable for the current MVP because the user explicitly wants only material-review items in `待核查资料项`.
