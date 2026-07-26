## Context

The opening-condition portal already has the backend pilot state machine, task rows, selected-task handoff, report package diagnostics, and MVP acceptance snapshot. The remaining MVP friction is interaction-level: operators can still interpret the portal as many independent panels instead of one review-task register with a clear next action.

## Goals / Non-Goals

**Goals:**
- Make the task ledger the first-place operator summary for the current workspace.
- Surface backend `mvpAcceptance` status in the selected-task handoff when a report exists.
- Clarify which sidebar entries are primary operator destinations and which execution pages are reached from task actions.
- Keep historical archived runs visibly read-only and route report/archive actions from the selected task.

**Non-Goals:**
- Do not redesign the full visual language.
- Do not change opening-condition backend state transitions, matching rules, report export, provider integration, or storage.
- Do not modify construction-plan review behavior.
- Do not introduce route parameters or a new global router.

## Decisions

1. Keep routing state local to the existing opening-condition shell.
   - Rationale: this is enough for the MVP and avoids a routing migration.
   - Alternative considered: introduce route params for selected run. That is useful later, but too broad for this slice.

2. Extend task-row view models from existing task facts.
   - Rationale: backend already owns task state, report asset, action ownership, and MVP acceptance diagnostics.
   - Alternative considered: add a new API endpoint for task ledger rows. That is better for production scale, but not necessary for the current local pilot.

3. Keep secondary execution pages hidden from primary sidebar but named in the task handoff.
   - Rationale: mature review platforms start from a register and drill into the next required action, while still allowing detailed execution when needed.

## Risks / Trade-offs

- [Risk] A selected historical row cannot deep-link directly into its own details on secondary pages yet. → Mitigation: keep historical report/detail inspection on report workbench and use this slice only to clarify routing.
- [Risk] More information in the task ledger could become another dense panel. → Mitigation: show only status, owner, next action, counts, MVP acceptance, and primary/secondary actions.
