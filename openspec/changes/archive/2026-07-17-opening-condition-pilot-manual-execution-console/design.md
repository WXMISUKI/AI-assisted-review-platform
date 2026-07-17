# Design

## Decision

Implement the next pilot slice as a **manual execution console**, not as a deeper parsing engine.

This choice is recommended because:

1. the backend already contains a usable pilot execution backbone;
2. the current weakest point is operator control and business transparency;
3. this delivers faster trial value than introducing checklist parsers, OCR field extraction, or additional provider coupling.

## Scope

### In scope

- explicit intake/init action from the opening-condition review portal;
- explicit formal match action from the opening-condition review portal;
- explicit refresh of pilot task status;
- task-backed rendering for execution-stage data when a pilot task exists;
- removal of automatic formal execution during workspace synchronization.

### Out of scope

- parsing checklist files directly from DOCX/XLSX objects;
- ZIP unpacking and object inventory extraction;
- OCR field-level extraction for signatures, stamps, or handwritten dates;
- RBAC, database migration, or queue/worker redesign.

## Flow

```text
workspace selected
  -> sync basis/master-data operational records only
  -> hydrate existing pilot task if present
  -> operator clicks intake/init
  -> backend binds packet object refs + workspace facts
  -> operator reviews readiness/blockers
  -> operator clicks formal match
  -> backend deterministic matching
  -> human-review queue and report stages continue as before
```

## UI contract

The review page should become the main execution surface for the pilot task:

- show pilot task state and readiness summary at the top;
- show explicit action buttons for:
  - intake/init,
  - formal match,
  - refresh;
- show backend-backed metrics and result lists when task data exists;
- fall back to the local packet only when backend task data is missing.

## Data mapping

The portal still uses the current mock packet as the temporary source for:

- checklist item definitions sent to `/match`;
- synthetic checklist object and source object refs for demo intake;
- basis/master-data demo records when no backend task is present.

But task execution state becomes backend-first:

- `pilotTask.checkItems`
- `pilotTask.evidence`
- `pilotTask.humanReviewQueue`
- `pilotTask.reportAsset`
- `pilotTask.preflightReadiness`

## Risks

### Risk: Users expect automatic matching after workspace selection

Mitigation:
- show explicit status and buttons;
- make intake and match actions visible in the execution console.

### Risk: Portal still depends on mock checklist definitions

Mitigation:
- keep this as an intentional temporary adapter;
- document checklist parsing as a later milestone, not part of this slice.
