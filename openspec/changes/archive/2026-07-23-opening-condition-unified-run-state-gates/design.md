## Context

The opening-condition pilot now supports repeated real-file runs, basis preview governance, human review, report archive, and historical run drill-in. The frontend already has `deriveOpeningConditionPortalViewState`, but several pages still combine local checks for archived state, readiness, rerun mode, and current-run identity. That creates a production risk: an archived historical run can expose mutation controls, or the operator can find multiple ways to start a new run.

The fastest production-hardening step is to deepen the shared portal state model and make each page consume it instead of re-implementing the rules.

## Goals / Non-Goals

**Goals:**
- Make current-run mutation gates a single shared contract.
- Keep archived runs read-only across material intake, trial overview, governance, report, and history detail surfaces.
- Keep rectification rerun upload explicit: report/history starts rerun mode; material intake only uploads once that mode is active.
- Add smoke coverage for the shared gates so future UI changes cannot silently re-open archived mutation controls.

**Non-Goals:**
- No database migration or backend state-machine rewrite.
- No multi-tenant permission system.
- No broad visual redesign or theme overhaul.
- No new upload channel or provider integration.

## Decisions

1. **Centralize gates in `openingConditionPortalState.ts`.**
   - Decision: Extend `OpeningConditionPortalViewState` with explicit action gates and a reusable disabled-reason model.
   - Rationale: Existing pages already receive `portalState`; deepening it is less risky than introducing a separate store.
   - Alternative considered: Add local guards to each button. Rejected because it repeats the exact issue this change fixes.

2. **Separate current-run mutation from next-run upload.**
   - Decision: Archived runs always lock current-run mutation. Rerun mode only enables a new upload, not mutation of the archived run.
   - Rationale: This mirrors mature review platforms: history is evidence, new submission is a new version/round.
   - Alternative considered: Let material intake reinitialize from archived runs. Rejected because it blurs history and current operation.

3. **Keep report/history as the normal rerun entry.**
   - Decision: `onStartRectificationRerun` remains the canonical way to enter rerun upload mode.
   - Rationale: Operators decide whether to accept, reject, or request supplementation from the report outcome, not from a hidden execution console.
   - Alternative considered: Add a global "new run" button. Deferred until project/workspace management is formalized.

4. **Use smoke tests for boundary behavior.**
   - Decision: Add/strengthen UI boundary smoke around `deriveOpeningConditionPortalViewState` and representative page-source guards.
   - Rationale: The project currently uses lightweight smoke tests; this is enough for the risk without adding browser-level tests.

## Risks / Trade-offs

- **Risk: Too many gate booleans become hard to understand.** → Mitigation: Group gates under an `actions` object with labels/reasons where possible, and keep legacy booleans only as compatibility aliases while migrating pages.
- **Risk: Rerun upload becomes too hidden.** → Mitigation: Report/history keeps a visible "start rectification rerun" action, and material intake explains why it is read-only until rerun mode is entered.
- **Risk: Existing pages still use old booleans inconsistently.** → Mitigation: Update the execution panel and Trial Intake Overview in this change; leave broader visual cleanup for a later UI-focused change.
