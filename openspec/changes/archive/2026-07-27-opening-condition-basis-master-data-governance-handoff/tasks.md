## Phase 1: Current-run governance snapshot

- [x] Task 1: Add a dedicated current-run binding snapshot to the publication governance page
  - Acceptance: The page separately renders bound basis, task-bound master-data facts, and bound knowledge base; catalog rows remain a separate section.
  - Verify: `pnpm typecheck`; inspect the component source for task-bound id lookup and missing-record fallback.
  - Files: `src/productWorkspacePages.tsx`

- [x] Task 2: Add explicit lifecycle and formal-match usability semantics to snapshot rows
  - Acceptance: Preview/confirmed/published states are visibly distinct; basis is usable only when published; master data is usable only when human-approved or published; unresolved/missing records show next action.
  - Verify: `pnpm smoke:opening-condition:ui`
  - Files: `src/productWorkspacePages.tsx`

## Phase 2: Regression guard

- [x] Task 3: Extend the existing UI boundary smoke for current-run governance semantics
  - Acceptance: Smoke asserts dedicated snapshot markers, task-bound lookup, `preview != published`, and missing-record fallback.
  - Verify: `pnpm smoke:opening-condition:ui`
  - Files: `server/openingConditionPilotUiBoundarySmoke.test.mjs`

## Checkpoint: MVP governance handoff

- [x] `pnpm typecheck` (blocked by pre-existing nullable values in `src/productWorkspacePages.tsx:2905-2964`)
- [x] `pnpm smoke:opening-condition`
- [x] `pnpm smoke:opening-condition:http`
- [x] `pnpm smoke:opening-condition:ui`
- [x] `pnpm smoke:opening-condition:acceptance`

## Out Of Scope

- No database migration.
- No new provider integration.
- No global UI redesign.
