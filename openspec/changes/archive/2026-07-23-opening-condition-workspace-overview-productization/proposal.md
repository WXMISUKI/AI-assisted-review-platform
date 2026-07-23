## Why

The opening-condition pilot now has a runnable review loop, checklist matrix, responsibility handoff, and report delivery workbench. The remaining high-impact gap is the workspace overview: it still reads like a demo/debug page in places, and it does not yet act as a mature product entry that clearly frames project, review object, participating entity, current run, and next action.

## What Changes

- Productize the opening-condition workspace overview as the single entry context for project/object/run orientation.
- Make the project, review object, participating entity, current run, readiness, and responsibility state immediately readable.
- Replace unreadable placeholder labels with operator-facing Chinese copy.
- Improve object switching as a dense enterprise workbench pattern inspired by mature construction review platforms: context first, status second, action last.
- Keep uploads, matching, review decisions, and report actions on their existing workflow pages.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `opening-condition-project-object-model`: The overview shall render project, review object, and participating entity as first-class context cards and switchable records.
- `opening-condition-single-project-trial-intake`: The overview shall remain a summary/entry page and route operators to material intake rather than exposing all run controls.
- `opening-condition-responsibility-workqueue`: The overview shall surface the responsibility workqueue as the primary continuation guide for the selected run.

## Impact

- `src/productWorkspacePages.tsx`: Update `OpeningConditionObjectOverviewPage` copy, structure, and object/run entry rendering.
- `src/styles/opening-condition.css`: Add scoped overview and object switcher styles using existing semantic tokens.
- `openspec/specs/*`: Sync updated overview expectations after implementation.
