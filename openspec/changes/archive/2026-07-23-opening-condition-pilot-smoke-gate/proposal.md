## Why

The opening-condition pilot can now be operated through real intake, matching, human review, report generation, archival, and rerun history, but the production risk is that these steps are still mostly validated by manual clicking. Before investing more in UI polish, the project needs a repeatable smoke gate that proves the delivery chain and state-machine guardrails still work after every change.

## What Changes

- Add a project-owned opening-condition pilot acceptance smoke capability.
- Add a retained Node test that runs the backend domain flow from intake through formal matching, human-review resolution, report generation, archive, and new-run retry.
- Add an npm script so the team can run this smoke check without remembering a long command.
- Keep the smoke bounded to platform-owned data and safe object refs; no provider secrets, raw OCR text, or browser-local paths.

## Capabilities

### New Capabilities

- `opening-condition-pilot-acceptance-smoke`: Defines the repeatable backend smoke gate for the single-project opening-condition pilot delivery chain.

### Modified Capabilities

- None.

## Impact

- Affected code: `server/openingConditionPilotStore.test.mjs`, `package.json`.
- Affected workflow: trial delivery verification before UI changes, report changes, or provider integration changes.
- No API shape changes and no new runtime dependency.
