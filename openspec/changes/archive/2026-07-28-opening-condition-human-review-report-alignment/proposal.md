## Why

Recent opening-condition trial checks show that the main agent workbench is close to runnable, but three interaction gaps still make the review loop feel inconsistent: human-review decisions are recorded without clearly driving the final Markdown report, out-of-scope site-check rows can still appear in material-review lists, and history actions use different delete/hide semantics across surfaces.

This change tightens the MVP closure path so the platform-owned run, human decisions, checklist display, and report output all tell the same story.

## What Changes

- Final Markdown reports will derive reportable findings from platform facts that include human-review outcomes and safe notes, rather than only from the original automatic checklist verdict.
- `现场核查` / current-MVP out-of-scope checklist rows will stay non-reportable and will not appear as actionable material-review rows in the selected-task workbench.
- Opening-condition history actions will use one deletion contract across sidebar and report/history surfaces, while preserving read-only archived run behavior.
- Report action copy will be aligned with the final Markdown-report delivery step instead of older “摘要” wording.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opening-condition-platform-orchestrated-agent-run`: report readiness and Markdown report content must reflect human-review decisions and keep out-of-scope rows non-actionable.
- `opening-condition-pilot-execution-console`: selected-task and history surfaces must hide non-actionable site-check rows and expose consistent history deletion/report delivery wording.

## Impact

- Backend/domain: `server/openingConditionPilotStore.mjs`
- Frontend: `src/productWorkspacePages.tsx`, potentially `src/App.tsx`
- Tests: `server/openingConditionPilotStore.test.mjs`, `server/openingConditionPilotUiBoundarySmoke.test.mjs`
- Specs: existing opening-condition platform orchestration and pilot execution console specifications
