## Context

The opening-condition MVP already has runtime gates for archived runs, rectification reruns, and report handoff. The remaining risk is regression: future changes may keep the logic correct but weaken the smoke coverage that proves operators cannot mutate history or confuse a rerun with an archived run.

## Goals / Non-Goals

**Goals:**
- Prove archived runs reject follow-on mutation attempts through HTTP routes.
- Prove a new run can still be created after archive without reusing the archived task id.
- Prove the UI smoke still exposes read-only archived controls and rerun-only entry semantics.
- Keep the report handoff visible and understandable for current vs historical runs.

**Non-Goals:**
- Redesign the report page.
- Add new backend lifecycle endpoints.
- Change persistence or task-state rules.

## Decisions

1. Treat smoke coverage as the contract boundary.
   - Rationale: the lifecycle code already exists; the highest value work is preventing drift.
2. Keep the scope to retained smoke and minimal UI text assertions.
   - Rationale: this is the fastest way to protect the lifecycle without expanding the UI surface.
3. Do not introduce new state fields or migration work.
   - Rationale: the MVP risk is validation, not missing data.

## Risks / Trade-offs

- [Risk] Smoke assertions can become brittle if labels drift.
  - Mitigation: assert only the stable lifecycle and handoff semantics.
- [Risk] The report handoff can become visually crowded.
  - Mitigation: keep the change focused on read-only semantics and rerun entry.
