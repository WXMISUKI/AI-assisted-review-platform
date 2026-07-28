## Context

The current opening-condition UI can still submit new-review uploads using the selected pilot task id or the workspace fallback id. That makes repeated uploads behave like reinitialization and can overwrite history. The refresh path also treats fallback ids as fetchable task ids in some flows, causing `GET /api/opening-condition/pilot-tasks/oc-pilot-<workspaceId>` 404s. Separately, checklist items extracted from uploaded documents can carry duplicate ids such as `docx-4`; the review list uses those ids directly as React keys.

The Dify workflow separates inputs conceptually: contract/qualification basis is used to understand project, organization, personnel, equipment, and contract boundaries; checklist rows define what must be checked; material packets provide evidence. This first repair batch aligns the platform with that boundary without adding PDF page-level splitting or legal rectification generation.

## Goals / Non-Goals

**Goals:**
- New-review uploads always create a new run task id and update history immediately.
- Empty workspaces render first-review state without fetching fallback task details.
- Checklist review rows use UI-safe ids while retaining backend target ids for decisions.
- Basis objects remain visible in the document library but are not introduced as packet evidence candidates.

**Non-Goals:**
- Implement large-PDF OCR splitting, page annotations, or evidence chunk extraction.
- Implement the legal-basis lookup and rectification text generation node.
- Redesign the whole opening-condition detail layout beyond identity and orchestration fixes.

## Decisions

- Prefer frontend-generated run ids through `getNextOpeningPilotRunTaskId()` for every new-review upload. The backend remains capable of upserting an explicit task id, but the UI must not reuse workspace fallback ids for the new-review entry.
- Treat fallback workspace ids as legacy/bootstrap identifiers only. Refresh should resolve from the task list first and return `null` when no task is present.
- Add a `targetId` or equivalent to agent review rows so UI identity can diverge from backend checklist ids without breaking review decision routing.
- Keep basis in `basisVersion.sourceObject` and workspace facts. Matching candidates must continue to come from `packet.inventoryEntries` and `packet.sourceObjects`, not from basis source objects.

## Risks / Trade-offs

- Historical tasks may already use fixed workspace ids -> keep refresh and selection compatible with existing rows returned by the task list.
- Duplicate checklist ids can still exist in backend facts -> UI key composition must include task id, row index, and checklist fields while decisions still use the original target id.
- Some old workflows may expect reinitialize behavior from the upload panel -> this batch optimizes for the confirmed new-review path; explicit reinitialization can remain on secondary execution controls.
