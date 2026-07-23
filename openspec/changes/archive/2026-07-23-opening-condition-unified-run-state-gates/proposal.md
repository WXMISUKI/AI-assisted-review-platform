## Why

The opening-condition pilot has reached a point where the same backend run can be surfaced in material intake, trial overview, governance, human review, and report history. Some controls still derive mutability locally, which risks archived runs being mutated, rerun entry points appearing in multiple places, and operators seeing inconsistent next-action guidance.

This change consolidates run-level mutability, read-only history, and rectification rerun entry semantics into the shared portal view model so the pilot can be repeated reliably with real materials.

## What Changes

- Strengthen the shared opening-condition portal state model with explicit action gates for:
  - current-run initialization,
  - current-run governance mutation,
  - formal matching,
  - report generation/archive,
  - new rectification upload creation.
- Route material-intake execution controls and Trial Intake Overview controls through the shared gate state instead of local archived/readiness checks.
- Keep the only normal next-round entry on the report/history side; material intake can upload a rerun only after that mode is explicitly entered.
- Add UI boundary smoke coverage proving archived historical rounds cannot trigger mutation actions and rerun upload stays explicit.
- Document the state model as the next production-hardening priority before larger UI polish, permissions, or database migration.

## Capabilities

### New Capabilities
- `opening-condition-unified-run-state-gates`: Shared run-level action gates for current-run mutation, archived read-only history, and rectification rerun upload.

### Modified Capabilities
- `opening-condition-portal-view-model`: Strengthen shared portal state derivation so pages consume centralized action gates rather than scattering local conditions.
- `opening-condition-rectification-rerun-history`: Clarify that archived history remains read-only and the next-round upload mode must be explicitly started from report/history flow.
- `opening-condition-action-ownership`: Align next-action guidance with the unified gates so read-only history does not advertise mutation actions.

## Impact

- Frontend state model: `src/openingConditionPortalState.ts`
- Opening-condition pages: `src/productWorkspacePages.tsx`
- UI boundary smoke: `server/openingConditionPilotUiBoundarySmoke.test.mjs`
- Documentation: `docs/opening-condition-next-stage-plan.md`
- No backend API contract change, no database migration, no new provider dependency.
