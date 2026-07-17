## Context

The opening-condition pilot already has a platform-owned task model, file-backed development store, preflight gates, deterministic checklist matching, human-review decisions, and report archival. The previous provider work also clarified that OCR, LLM, MinIO, Dify-like workflows, and RAGFlow-style knowledge bases are adapters, not sources of truth.

The highest-value next step is therefore not deeper provider tuning, full multi-tenant RBAC, or database migration. The next production-oriented milestone is a single-project real pilot that an operator can actually run: create or inspect a task, manage the subcontract-team knowledge base, bind it to the task, and see readiness before formal packet matching.

## Goals / Non-Goals

**Goals:**
- Add backend operational routes for opening-condition pilot tasks, subcontract-team knowledge bases, task knowledge-base binding, and task readiness inspection.
- Keep the platform as the owner of basis versions, master data, knowledge-base records, readiness summaries, evidence, human decisions, and reports.
- Expose typed frontend client contracts and a concise operational panel so the pilot status is visible without relying on mock-only domain data.
- Document that the next recommended direction is single-project pilot operability, not local over-optimization.

**Non-Goals:**
- Do not build full organization/tenant permission management in this change.
- Do not require RAGFlow or any new external provider configuration.
- Do not migrate the development file store to PostgreSQL in this change.
- Do not implement full ZIP extraction, OCR parsing, or semantic retrieval orchestration here.

## Decisions

1. **Prioritize single-project pilot operability.**
   - Decision: add the missing operational API and UI surface around the existing store.
   - Rationale: this turns existing modeling into something usable for a real trial fastest.
   - Alternative considered: continue improving RAGFlow/provider depth. Rejected for this milestone because retrieval is not the current blocker for an end-to-end pilot.

2. **Use platform-owned readiness as the shared contract.**
   - Decision: expose readiness through a task endpoint and reuse the existing preflight derivation rules.
   - Rationale: frontend, reports, and future workflow engines can all depend on the same bounded status fields.
   - Alternative considered: recompute readiness in the frontend. Rejected because readiness is a workflow gate and belongs to the backend domain model.

3. **Treat subcontract knowledge bases as first-class pilot records.**
   - Decision: expose list/upsert and bind APIs for workspace-scoped knowledge-base records, including optional provider refs.
   - Rationale: the pilot requires a durable organization/subcontract-team support source before formal matching can run.
   - Alternative considered: only use external RAGFlow datasets. Rejected because external retrieval cannot own contract boundary, master data, or human decisions.

4. **Keep frontend changes operational and restrained.**
   - Decision: add a compact backend-backed panel to the existing opening-condition portal instead of redesigning the entire product shell.
   - Rationale: the goal is a demonstrable trial control surface, not a broad UI rebuild.

## Risks / Trade-offs

- File store remains a development adapter -> mitigate by keeping API contracts stable and preserving future PostgreSQL migration boundaries.
- Knowledge-base records can look more authoritative than they are -> mitigate by labeling them as support sources and keeping basis/master-data/evidence as formal facts.
- Frontend can become half mock, half backend -> mitigate by showing backend-backed pilot readiness as an operational supplement rather than pretending all screens are live.
- Route surface can grow before auth is complete -> mitigate by limiting this to local/pilot APIs and documenting that production RBAC is a later milestone.

## Migration Plan

1. Add OpenSpec requirements and task breakdown.
2. Add backend routes over the existing store helpers.
3. Add typed frontend clients and a small operational panel.
4. Add focused store/API-adjacent tests and run syntax/type checks.
5. Sync main specs/docs and archive the change.

Rollback is straightforward: remove the added routes/client functions/panel and leave existing workflow behavior intact.

## Open Questions

- Which PostgreSQL schema and migration framework will be selected for production persistence?
- Which RAGFlow API version and dataset conventions will be standardized for external retrieval?
- Which roles can create/bind knowledge bases in the production RBAC model?
