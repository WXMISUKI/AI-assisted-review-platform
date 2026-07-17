## Context

The pilot already has building blocks for workspace basis records, project master data, subcontract-team knowledge bases, packet intake, readiness, matching, human review, and reporting. What is missing is a backend-owned entry that initializes a formal pilot task from uploaded object references and workspace-owned facts, instead of forcing the frontend to call separate task, knowledge-base, and packet APIs in sequence.

This change sits directly on the critical path for a real pilot because it reduces orchestration leakage from the UI and makes intake behavior deterministic, testable, and easier to migrate later to PostgreSQL or queue-backed execution.

## Goals / Non-Goals

**Goals:**
- Add one domain orchestration endpoint for pilot task initialization and packet intake.
- Keep object upload separate by reusing the existing MinIO/object-storage path.
- Bind published basis, approved master data, optional knowledge-base support, and packet refs in one backend mutation.
- Persist enough safe basis-source traceability on the task so contract or basis objects can be traced from the pilot task.
- Return structured readiness and orchestration diagnostics to the frontend.

**Non-Goals:**
- Do not add a new multipart upload API in the opening-condition domain.
- Do not implement ZIP extraction, OCR parsing, or automatic checklist matching inside the intake endpoint.
- Do not add new provider configuration or force RAGFlow usage.
- Do not replace the separate basis, master-data, or knowledge-base management APIs.

## Decisions

1. **Use a dedicated intake/init orchestration endpoint.**
   - Decision: add `POST /api/opening-condition/pilot-tasks/intake-init`.
   - Rationale: a task may not exist yet, and this flow is semantically different from generic task upsert.
   - Alternative considered: continue composing `PUT task` + `POST bind` + `POST packet` from the frontend. Rejected because it keeps workflow ownership outside the domain model.

2. **Reuse existing object upload channels.**
   - Decision: the intake endpoint accepts safe object references only; file transfer continues to use existing MinIO or object-storage APIs.
   - Rationale: keeps the upload seam stable and avoids duplicating file ingestion logic.
   - Alternative considered: add a new opening-condition multipart endpoint. Rejected because it duplicates infrastructure and muddies domain boundaries.

3. **Resolve workspace facts during orchestration.**
   - Decision: the backend resolves the published basis record, approved master-data refs, and knowledge-base binding candidates from workspace-owned records.
   - Rationale: readiness gates should derive from backend facts, not frontend guesses.
   - Alternative considered: make the frontend pass fully assembled task objects. Rejected because it weakens backend authority and increases drift risk.

4. **Persist safe basis-source traceability on the task.**
   - Decision: extend the task-bound basis reference with optional safe `sourceObject` and `evidenceRefs`.
   - Rationale: this satisfies the pilot need to trace which contract or basis object anchored the initialized task without persisting unsafe URLs or raw text.

5. **Auto-bind only when it is deterministic.**
   - Decision: if `knowledgeBaseId` is provided, bind it; otherwise auto-bind only when exactly one ready knowledge base exists in the workspace.
   - Rationale: preserves convenience without making ambiguous binding choices silently.

## Risks / Trade-offs

- Ambiguous workspace knowledge bases can still require manual selection -> Mitigation: return explicit orchestration diagnostics and keep readiness blocked rather than guessing.
- Frontend demo data may not carry full uploaded-object provenance -> Mitigation: keep basis object refs optional and derive as much as possible from workspace-owned basis records.
- Atomic intake orchestration adds more logic to the file-backed store -> Mitigation: keep logic in one focused store helper and cover it with targeted tests.

## Migration Plan

1. Add OpenSpec proposal, design, specs, and tasks for intake orchestration.
2. Extend task-bound basis references and add the store orchestration helper.
3. Add the new backend route and frontend client contract.
4. Update the opening-condition operational panel to call the new init flow.
5. Run focused tests and type checks, sync main specs/docs, then archive the change.

Rollback is straightforward: remove the orchestration endpoint and frontend usage while leaving the existing task, packet, and knowledge-base APIs intact.

## Open Questions

- Should a later production phase require explicit `requiredMasterDataIds` selection instead of auto-binding all approved workspace master data?
- Should later OCR or ZIP automation feed this same orchestration endpoint, or write a queue-owned pre-intake artifact first?
