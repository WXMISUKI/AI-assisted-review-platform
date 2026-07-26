## Context

The MVP direction is a repeatable single-project trial loop:

```text
workspace assets -> intake -> formal matching -> human review -> report -> archive -> next rectification run
```

The platform already owns `deliveryHandoff`, `exportHandoff`, `deliveryPackage`, decision ledger, findings, and run history. What is missing is a small, durable acceptance snapshot that tells supervisors and developers whether the run satisfied the MVP delivery chain.

## Goals

- Keep the acceptance judgment backend-owned and persisted with the report asset.
- Make it bounded and safe for UI, archive replay, smoke, and future handoff adapters.
- Avoid a new state machine. The snapshot is derived from existing task/report facts.
- Keep the UI addition compact and secondary to the main report actions.

## Non-Goals

- Do not redesign the report page.
- Do not change matching, human-review decisions, or archive rules.
- Do not introduce a database migration.
- Do not add a new API endpoint.
- Do not call MaxKB, OCR, LLM, or HTTP tools from this snapshot.

## Data Shape

`OpeningConditionPilotReportPackageDiagnostics.mvpAcceptance` should include:

- `schemaVersion`
- `status`: `blocked`, `ready_for_archive`, `archived`, or `failed`
- `statusLabel`
- `completed`: boolean
- `readOnly`: boolean
- `currentOwner`
- `nextAction`
- `blockingReasons`
- `steps`: intake, match, human review, report, archive
- `generatedAt`

Each step should include `key`, `label`, `status`, and `detail`.

## Derivation Rules

- Intake is complete when a packet exists.
- Match is complete when check items exist or task state has reached human review/report/archive.
- Human review is complete when no `open` or `deferred` items remain and matching has run.
- Report is complete when a report asset exists or report status is ready/archived.
- Archive is complete only when the task is archived.
- `completed=true` only when archived.
- `blocked` explains the earliest incomplete or blocking stage.
- `ready_for_archive` means report exists and no blocking human review remains.

## UI Placement

Render the snapshot near the top of the report delivery workbench, after the selected-run ownership summary. It should be a compact checklist-style panel, not another diagnostic wall.

## Safety

The snapshot only contains bounded labels, counts, and reasons. It must not include raw OCR text, raw prompts, provider secrets, private URLs, or unbounded document text.
