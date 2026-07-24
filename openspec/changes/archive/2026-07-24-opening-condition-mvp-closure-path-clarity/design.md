## Context

The current screenshot shows the operator on the publication governance page with missing basis, master-data, and knowledge-base gates. That page is technically useful for later asset governance, but it is not the main path for the current MVP. The minimum MVP success path is:

1. Upload and initialize a run.
2. Run formal checklist matching.
3. Resolve human-review blockers.
4. Generate/export the report.
5. Archive the run and start a new rectification rerun when needed.

## Goals / Non-Goals

**Goals:**

- Make the MVP path visible from the portal.
- Explain that governance readiness is a later asset-management concern when a run is already being tested through the MVP loop.
- Give the operator one obvious next page based on run state.
- Keep UI changes minimal and functional.

**Non-Goals:**

- No visual redesign of the workbench.
- No new master-data extraction flow.
- No database migration.
- No changes to the report generation/export adapter.

## Decisions

- Add a small frontend-only MVP status helper rather than introducing a new backend endpoint.
- Reuse existing task state, readiness, report asset, archive state, and human-review queue.
- Keep governance page accessible, but relabel it as follow-up governance and add guidance back to the MVP path.

## Risks / Trade-offs

- The page remains visually dense -> acceptable for now because the priority is MVP path clarity, not final UI polish.
- Frontend-only status can drift from backend -> mitigated by deriving status directly from existing backend task fields.
