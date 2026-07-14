# Design

## Context

Current flow after the previous slice:

```text
review generation run
  running -> ready      -> workbench
          -> degraded   -> workbench with safe degraded context
          -> failed     -> document list only
```

The missing piece is the recovery action from `failed` back into a fresh generation run.

## Recovery Semantics

Retry should be conservative:

- A retry starts a new `ReviewGenerationRunSnapshot.runId`.
- The new run clears prior run diagnostics.
- Existing task data remains available unless normal generation merge/dedupe updates it.
- The task enters the same locked loading flow as a first-time review start.

Degraded runs are not failures:

- `degraded` remains openable in the workbench.
- The document list may show safe degraded context.
- A future explicit regenerate action can be added later, but this slice only needs failed-run retry.

## UI Behavior

Document library actions should follow orchestration state:

- `failed` generation run or failed task: show a primary retry action.
- `running`: show open/loading behavior.
- `ready` or `degraded`: open the workbench.
- completed task with result: keep result entry.
- older task without generation run: keep legacy status fallback.

## Safety

The UI must not show raw provider traces, prompts, keys, private object URLs, or raw document text in recovery context. Status chips may show high-level labels such as `request-failed`, `no-candidates`, or `OCR failed`.

## Risks

- Retrying with the same run id would make run history ambiguous. Generate a fresh run id whenever a terminal run is restarted.
- Failed OCR tasks may not have recovered structure. Retry should still route through the existing start flow and let the current OCR/review fallback logic decide the next state.
- Do not clear manual decisions or result assets as a side effect of retry in this slice.
