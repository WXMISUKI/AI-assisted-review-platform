## Why

The opening-condition agent flow still behaves like a single mutable workspace task in several places: new uploads can overwrite history, fallback workspace task ids still produce noisy 404 detail fetches, and duplicated checklist ids such as `docx-4` can break React list identity. This also blurs the Dify-inspired workflow boundary where contract/qualification basis should guide matching rather than be reviewed as packet evidence.

## What Changes

- Create a distinct run task id for every new-review upload instead of reusing `oc-pilot-<workspaceId>`.
- Keep task history append-only for new reviews and bind the UI to the bootstrap-returned task immediately.
- Prevent no-task refresh from fetching the fallback workspace task id when no backend task exists.
- Treat contract/qualification basis as task context and master-data/basis guidance, while packet source objects and inventory entries remain the evidence candidates for checklist matching.
- Render checklist-derived review rows with collision-free UI identity so duplicate backend ids do not trigger React key warnings or misroute review detail.
- Keep PDF deep splitting/OCR page annotation and legal rectification generation out of this first repair batch.

## Capabilities

### New Capabilities

### Modified Capabilities
- `opening-condition-pilot-execution-console`: new-review uploads append run tasks, avoid fallback detail 404s, and use collision-free checklist row identity.
- `opening-condition-pilot-intake-orchestration`: trial bootstrap and intake preserve the basis-vs-packet boundary.

## Impact

- Frontend orchestration in `src/App.tsx`.
- Agent upload/detail rendering in `src/productWorkspacePages.tsx`.
- Backend matching/intake guardrails in `server/openingConditionPilotStore.mjs` if needed for basis/evidence separation.
- Focused UI smoke and store tests.
