## Why

The opening-condition console currently stops after three-material bootstrap: task history is not refreshed reliably, the detail page mixes source files with review items, and the progress panel remains at `packet_uploaded` instead of following the platform-owned review flow. The next MVP step is to make the platform itself orchestrate the first useful agent run while using the Dify workflow only as schema and prompt reference.

## What Changes

- Add a platform-owned opening-condition agent run sequence after upload: checklist extraction, packet inventory normalization, material matching, human-review queue generation, and report readiness.
- Keep Dify as a reference model for `check_items`, material matching, item review, and report shape, but persist all task facts in the platform task store.
- Refresh project task history immediately after successful upload and bind the UI to the returned backend task id instead of the workspace fallback id.
- Split task detail into two left-side groups: `资料文档库` for uploaded and packet files, and `待核查资料项` for checklist-derived review items with status chips.
- Render right-side progress from platform task state/events and report readiness instead of a static percent label.
- Restore corrupted Chinese labels in the opening-condition task detail.
- Fix the centered new-review home so its child content expands and centers within the available shell height without fixed-height or negative-offset clipping.
- Generate the opening-condition report asset from platform check item facts in the requested Markdown-style report structure.

## Capabilities

### New Capabilities

- `opening-condition-platform-orchestrated-agent-run`: Platform-owned orchestration of the opening-condition material review run after three-material upload.

### Modified Capabilities

- `opening-condition-pilot-execution-console`: Detail page layout, task-history refresh, no-task lookup behavior, progress display, and source-bound report rendering.

## Impact

- Frontend: `src/App.tsx`, `src/productWorkspacePages.tsx`, `src/styles/opening-condition.css`.
- Backend/domain: `server/openingConditionPilotStore.mjs`, `src/domain/openingConditionPilot.ts`, `src/domain/backendConnectivity.ts` if type/contract fields are required.
- Tests: opening-condition store smoke, HTTP smoke, UI boundary smoke.
- Docs/specs: OpenSpec capability specs and, if needed, opening-condition workflow guidance.
- No new external provider dependency; no direct frontend Dify/MaxKB/OCR Worker call.
