## Context

The real-file opening-condition trial is intended to be run repeatedly against updated sample packets. The current portal uses the workspace base id `oc-pilot-{workspaceId}` for browser uploads. Once that task is archived, the backend state machine rejects intake/bootstrap mutation for that id, which protects archive integrity but blocks the next trial run.

## Goals / Non-Goals

**Goals:**
- Preserve the backend terminal-state guard for archived tasks.
- Let the operator upload real files again after archive without clearing local store data or manually editing task ids.
- Keep the current portal pointed at the newest run returned by bootstrap so formal matching, human review, report generation, archive, and refresh operate on the same task.
- Document the expected repeat-run behavior for trial operators.

**Non-Goals:**
- No multi-tenant permission platform.
- No database migration or long-term run registry.
- No OCR worker, MaxKB ingestion, or report download expansion.
- No visual redesign beyond concise status text/labels needed for the workflow.

## Decisions

1. Use frontend-generated run ids only when needed.
   - Decision: the real-file upload panel receives the current pilot task. If the current task is archived, it submits `oc-pilot-{workspaceId}-run-{timestamp}`; otherwise it reuses the current/base id.
   - Rationale: this resolves the operator bug without weakening backend invariants or introducing a run registry.
   - Alternative considered: allow backend bootstrap to overwrite archived tasks. Rejected because archived report packages must remain immutable.

2. Track the current run in app state.
   - Decision: `App` maintains the returned task as the current pilot task and refreshes `openingPilotTask?.id` when present.
   - Rationale: after a run-specific bootstrap, follow-on actions must not silently fall back to the workspace base task.
   - Alternative considered: always query only the base id. Rejected because it loses the run-specific task immediately after bootstrap.

3. Keep backend state machine behavior intact and guard it with a regression test.
   - Decision: backend tests explicitly assert that archived tasks still reject reinitialization by the same id.
   - Rationale: the product fix is new-run creation, not archive mutation.

## Risks / Trade-offs

- [Risk] Timestamp task ids are simple but not a full run registry. -> Mitigation: this is acceptable for the single-project pilot package; future production hardening can add run listing/history when needed.
- [Risk] Browser clock differences can affect id readability. -> Mitigation: uniqueness is sufficient for pilot runs; state remains backend-owned after bootstrap.
- [Risk] Existing base task may be archived while the app has stale state. -> Mitigation: if the backend still returns an archived-state error, the UI shows the safe backend message and the operator can refresh; current fix handles the observed archived task in app state.
