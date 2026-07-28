## Why

After the run-identity fixes, the agent detail page still feels cramped and inconsistent with the intended workflow: history rows show percent text instead of compact progress, progress events use English labels, the right progress pane cannot be collapsed, and file/review detail opens inside the left pane where previews are too small.

## What Changes

- Render project history task progress as compact circular progress instead of plain percent text.
- Translate agent workflow timeline labels/status copy into Chinese.
- Allow the right-side agent progress pane to collapse so operators can focus on document/review work.
- Make file preview and checklist review detail replace the full `opening-agent-detail` workbench content instead of staying inside the left pane.
- Improve the human-review summary card so it explains review mode, evidence status, missing/ambiguous material, and why human judgement is needed.
- Keep large-PDF deep splitting/OCR annotations and legal rectification generation out of this batch.

## Capabilities

### New Capabilities

### Modified Capabilities
- `opening-condition-pilot-execution-console`: selected task detail workbench usability, Chinese timeline, collapsible progress, full-width preview/review modes.

## Impact

- `src/productWorkspacePages.tsx` for agent detail state and rendering.
- `src/styles/opening-condition.css` for token-backed layout and progress ring styling.
- `server/openingConditionPilotUiBoundarySmoke.test.mjs` for focused UI smoke assertions.
