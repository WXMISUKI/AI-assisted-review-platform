## Why

The opening-condition agent entry still behaves like a blocking upload modal and loses selected files when the dialog is closed. Current matching and report rendering also expose two production risks: repeated checklist IDs can collide in React keys, and basis documents can still be treated like material evidence instead of review context.

## What Changes

- Keep selected upload files as a temporary draft owned by the agent console, not by the modal instance.
- Close the upload modal immediately after "start parsing" and insert an optimistic pending task row while uploads/bootstrap continue.
- Replace the optimistic row with the backend task when bootstrap returns, or remove it and surface an error if bootstrap fails.
- Use collision-free UI keys for report finding and rectification rows when backend checklist IDs repeat.
- Keep contract/qualification basis and checklist files out of packet material evidence candidates; only material package source objects and derived packet entries can satisfy checklist material evidence.

## Capabilities

### New Capabilities

<!-- None. -->

### Modified Capabilities

- `opening-condition-pilot-execution-console`: Agent upload entry becomes asynchronous with temporary file retention and collision-free report/detail row identity.
- `opening-condition-evidence-grounded-material-review`: Material evidence matching explicitly excludes basis/checklist objects and treats basis as context/master-data support only.

## Impact

- Frontend: `src/App.tsx`, `src/productWorkspacePages.tsx`.
- Backend matching: `server/openingConditionPilotStore.mjs`.
- Tests: `server/openingConditionPilotUiBoundarySmoke.test.mjs` and focused backend store tests if an existing matching smoke is available.
- Specs: execution console and evidence-grounded material review.
- No provider credentials, direct browser-to-MaxKB/OCR calls, report law-generation, or construction-plan platform changes.
