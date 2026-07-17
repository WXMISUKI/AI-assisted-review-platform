# opening-condition-pilot-manual-execution-console

## Why

The opening-condition pilot already has backend-backed readiness, intake/init, deterministic checklist matching, human-review queue handling, and report/archive gates. However, the current portal still behaves like a hybrid demo:

- workspace sync eagerly seeds and runs pilot matching as soon as the workspace is opened;
- the review page mostly renders local mock packet content instead of task-backed execution status;
- operators do not have a clear, explicit place to initialize intake, trigger formal matching, refresh task state, and understand what is blocked before execution.

For enterprise trial users, this is the next highest-value gap. Before deeper OCR parsing or workflow expansion, the pilot needs an explicit, operator-driven execution console so the business flow is understandable, safe, and controllable.

## What Changes

- Add a manual execution console for the opening-condition pilot review page.
- Stop auto-running packet intake and checklist matching during workspace sync.
- Keep workspace sync focused on basis/master-data operational records and existing task hydration.
- Let operators explicitly:
  - initialize or reinitialize pilot intake,
  - run formal checklist matching,
  - refresh pilot task state,
  - see current readiness, task state, blocking reasons, and result summaries.
- Prefer pilot-task-backed check items, evidence, human-review queue, and report state when available, while keeping mock packet fallback for demo resilience.

## Impact

### User-facing

- The portal becomes more controllable and closer to a production operating flow.
- Users can clearly distinguish setup, intake, formal execution, human review, and report stages.

### Technical

- Frontend orchestration becomes explicit instead of hidden in workspace hydration.
- Existing backend routes are reused; no duplicate upload channel is introduced.
- No new infrastructure configuration is required for this slice.
