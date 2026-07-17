## Context

The opening-condition portal is moving from a Dify-inspired prototype toward a platform-owned review product. The strongest next product increment is not deeper Dify Human Input integration, and not a complete multi-tenant permission platform. It is a preflight-controlled single-project pilot: basis confirmation and project master-data initialization must happen before formal material review, and organization/subcontract-team knowledge must be reusable across review tasks.

Current code already has workspace context, basis versions, master data, pilot tasks, evidence, human-review records, and report assets. The missing product layer is readiness: a task should clearly show whether the workspace has a published basis version, sufficient published master data, and a bound subcontract-team knowledge base before the user can run formal material review.

## Goals / Non-Goals

**Goals:**

- Make basis confirmation and project master-data initialization mandatory preflight gates.
- Add a platform-owned organization/subcontract-team knowledge-base concept for reusable verification material.
- Use the knowledge base as a retrieval and evidence support layer, while keeping structured facts in basis, master data, evidence, and human-decision records.
- Add readiness summaries so users can understand why a task is ready, blocked, or still provisional.
- Keep the next implementation small enough for rapid trial delivery.

**Non-Goals:**

- Build complete enterprise RBAC or tenant administration.
- Build a production vector database integration.
- Implement Dify Human Input or make Dify a core workflow dependency.
- Prove signature or stamp legal authenticity.
- Replace formal database migration planning; the current code may continue using local development persistence until a database change is explicitly scoped.

## Decisions

1. **Prioritize preflight gates over broader workflow automation.**

   Formal material review must be blocked until the selected workspace has a published basis version and sufficient published or human-approved master data. This gives the pilot a stable foundation and prevents repeated LLM reinterpretation of contracts and personnel/equipment facts.

   Alternative considered: let users upload a checklist and package first, then let the agent infer missing context. Rejected because it makes results unstable and hard to audit.

2. **Use a subcontract-team knowledge base as a support object, not the fact source.**

   The knowledge base stores reusable templates, historical evidence summaries, artificial-intelligence extraction notes, and human correction records scoped to organization, contract package, and participating subcontract team. The platform still treats basis versions, project master data, evidence, and human decisions as the source of truth.

   Alternative considered: use a global vector store as the primary reference. Rejected because semantic retrieval cannot replace compliance facts or reviewer decisions.

3. **Treat Dify as reference/adapter only.**

   Existing Dify workflow logic can inform extraction steps and prompt structure, but the platform should own the task state machine, preflight readiness, review results, and audit trail.

   Alternative considered: keep inserting Dify Human Input into the main path. Rejected because it would make maintenance and state recovery harder.

4. **Decompose the next implementation into deployable task groups.**

   The recommended sequence is:

   1. Readiness model and labels.
   2. Knowledge-base records and workspace binding.
   3. Preflight gate enforcement.
   4. Portal visibility for readiness blockers.
   5. Focused tests and documentation.

## Risks / Trade-offs

- [Risk] Knowledge-base scope can become too broad. -> Mitigation: start with metadata, evidence summaries, and references; defer vector ingestion.
- [Risk] Preflight gates may feel restrictive. -> Mitigation: show clear readiness reasons and allow draft/provisional setup work before formal review.
- [Risk] Local persistence may diverge from future database schema. -> Mitigation: name records after likely production entities and keep API payloads explicit.
- [Risk] Users may expect Dify behavior to remain available. -> Mitigation: document Dify as reference/adapter and keep platform-owned records as the only formal path.

## Migration Plan

- Add optional preflight readiness and knowledge-base records without breaking existing task payloads.
- Keep existing pilot task APIs stable where possible.
- Enforce preflight gates only when starting formal match/review, not while creating drafts.
- Update demo data and docs to show the recommended flow.
