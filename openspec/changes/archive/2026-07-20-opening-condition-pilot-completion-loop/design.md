## Context

The opening-condition review portal already has a business shell, real-file trial intake, object-storage upload, backend task readiness, ZIP manifest extraction, deterministic checklist matching, human-review API, report generation API, and archive API. The current gap is operator continuity: after matching, the review page still leans on local packet summaries in several places, and the backend completion actions are not wired into the main pilot workflow.

The next production-oriented milestone should therefore be a "single-project real pilot completion loop": initialize a task, run formal matching, decide human-review blockers, generate an internal report summary, and archive it. This keeps us out of local infinite optimization while exposing the true integration risks.

## Goals / Non-Goals

**Goals:**

- Make backend pilot-task results the primary display for check items, evidence, human-review queue, and report state when available.
- Wire explicit human-review decisions, report generation, and archive actions from the opening-condition portal to existing backend APIs.
- Keep every long-running or state-mutating step operator-triggered, visible, and refreshable.
- Preserve the existing two-product shell and opening-condition page structure.
- Record the recommended next development direction and task split in project docs.

**Non-Goals:**

- Do not create a full multi-tenant permission model.
- Do not redesign the opening-condition UI or shared component system.
- Do not add a new upload channel; keep using the existing MinIO upload and pilot bootstrap/intake APIs.
- Do not make the frontend call MaxKB or OCR Worker directly.
- Do not replace deterministic matching with LLM or RAG matching in this slice.

## Decisions

### Decision: Complete the existing pilot loop before broadening scope

Choose the smallest end-to-end production trial over broader platform construction. The current architecture already has enough primitives to run one project through a credible loop, and that will reveal the next real blockers faster than building organization/permission depth first.

Alternatives considered:

- Full multi-tenant platform first: more enterprise-complete, but slower and risks building around untested review flow assumptions.
- Deeper OCR/MaxKB integration first: useful later, but provider quality cannot be validated without a platform-owned task and decision loop.
- UI polish first: recently restored enough; further polish has lower production leverage than finishing the workflow.

### Decision: Use backend task data as the source of truth after task creation

Once a pilot task exists, the page should render backend `checkItems`, `evidence`, `humanReviewQueue`, and `reportAsset` ahead of the local demo packet. The local packet remains a fallback for initial demo context.

### Decision: Keep completion actions explicit

Report generation and archive must not happen automatically after match. Human-review decisions, report generation, and archive remain separate operator actions so the trial can expose blocking states clearly.

## Risks / Trade-offs

- Backend task may be unavailable -> keep local packet fallback and show bounded operator status.
- Existing task may be blocked by readiness -> leave matching and report actions disabled or returning backend-safe error messages rather than hiding the blocker.
- Human review "confirm/correct/reject/defer" is still coarse -> acceptable for this slice; richer evidence annotation belongs to a later task.
- Report asset is currently an internal summary, not a final downloadable DOCX/PDF -> acceptable; archival proves state ownership first.

## Migration Plan

1. Add frontend wiring for existing completion APIs.
2. Render backend-backed results when `pilotTask` exists.
3. Add a short planning document section for the recommended next direction.
4. Validate with `npm run typecheck`, OpenSpec validation, and a lightweight browser or API smoke check.
5. Archive the OpenSpec change after verification.
