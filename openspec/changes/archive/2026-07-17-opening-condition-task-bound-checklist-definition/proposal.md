# opening-condition-task-bound-checklist-definition

## Why

The opening-condition pilot can now initialize intake explicitly and run formal matching from the portal. However, formal matching still depends on the frontend sending `checklistItems` at execution time. This leaves a major production gap:

- checklist definitions are not persisted as part of the pilot task;
- the backend cannot replay or rerun formal matching from task-owned inputs alone;
- the formal review contract still mixes task execution with frontend-local demo data.

The highest-value next step is to make the pilot task own a normalized checklist definition so the backend can execute formal matching from task-bound business inputs.

## What Changes

- Add a task-bound checklist-definition field to the opening-condition pilot task model.
- Allow intake/init to accept and persist normalized checklist-definition items.
- Allow formal match to use stored checklist-definition items when the request omits `checklistItems`.
- Update the frontend intake flow to send checklist-definition items during initialization.
- Update the frontend formal match flow to rely on stored task-bound checklist definitions by default.

## Impact

### User-facing

- Pilot tasks become replayable and less dependent on hidden frontend state.
- Operators can re-run formal matching from a task that already owns its checklist definition.

### Technical

- Moves more of the business truth into backend-owned pilot task records.
- Keeps checklist parsing itself out of scope for this slice.
- No new external configuration is required.
