# Architecture Evolution Decisions

Decision date: 2026-07-14

## Positioning

The platform is not a single-shot AI conclusion generator. It is a human-in-the-loop construction plan review platform that must support traceable document ingestion, recoverable AI review generation, reviewer decisions, review records, report assets, and future knowledge-base grounding.

The current Node.js backend is a deliberate BFF layer for MVP integration. It is suitable for frontend-facing upload, MinIO, OCR status, LLM connectivity, SSE progress, safe provider diagnostics, and review-generation run bridging. It is not intended to be the final long-running intelligent-agent runtime.

## Architecture Decision

Do not replace the Node BFF with Python immediately. Instead, evolve the system in layers:

```text
Frontend React
  -> Node BFF / API Gateway
       - auth and permission gate
       - upload and object-storage bridge
       - stable review task interface
       - SSE/WebSocket fan-out
       - safe provider summaries
       - no durable long-running workflow ownership
  -> Durable storage
       - documents
       - review tasks
       - review generation runs
       - review issues
       - activity/audit events
       - report assets
  -> Queue / workflow runtime
       - retry
       - idempotency
       - worker leasing
       - resumable status events
  -> Python Worker / Agent Service
       - OCR result parsing
       - document structure recovery
       - LLM review agents
       - RAG and knowledge retrieval
       - report/export generation
```

The next architectural priority is backend-owned durable review task state. Once review documents, tasks, runs, issues, and activities have a stable backend persistence contract, Python workers can be introduced behind the same interface without disrupting the workbench.

## Near-Term Iteration Order

1. Backend task persistence foundation
   - backend-owned document/task/run/issue/activity snapshots
   - localStorage kept only as a compatibility fallback
   - stable frontend service interface for list/open/update review tasks

2. Worker queue foundation
   - durable review runs
   - retry and terminal states
   - event replay for loading pages
   - worker-safe idempotency
   - local file-backed queue adapter as a development bridge
   - explicit lease, heartbeat, retry, and dead-letter semantics before production queue adoption

3. Python agent service bridge
   - OCR/layout/RAG/review/report execution
   - small backend-facing interface
   - Node BFF remains the frontend-facing contract

4. Audit and compliance hardening
   - immutable activity log
   - organization/project scoping
   - permission checks
   - exportable review records

## Why This Order

Moving straight to a Python agent runtime would still leave the system without durable review state. Mature review platforms need persistence, recovery, traceability, permissions, and audit trails before a complex worker layer can safely carry production work.

The current run snapshot, activity trail, preparation package, draft issue provenance, and backend generation run bridge are already shaped to support this migration. The next step is to make that state backend-owned.

## Queue Foundation Decision

After backend-owned task snapshots and replayable run events, the next implementation layer is a local worker queue adapter behind the Node BFF. This is still not the final production worker runtime. It is a development bridge that introduces the contracts a production queue and Python worker must later honor:

- enqueue review-generation work when a run is created;
- claim jobs through a worker lease instead of executing directly in the request path;
- heartbeat active work so interrupted jobs can be retried;
- mark jobs succeeded, retryable failed, dead-lettered, skipped, or canceled;
- keep run status and event replay as the frontend-facing source of truth;
- persist only safe job summaries and diagnostics.

This keeps the Node BFF as the frontend-facing API seam while making execution ownership replaceable. Redis, PostgreSQL-backed queues, Temporal, Celery, BullMQ, or Python workers can later replace the local adapter without changing the review-loading UI contract.

## Python Agent Service Bridge Decision

After the local worker queue foundation, the next implementation layer is a backend-facing Python agent service bridge. This is still not the final production agent runtime. It is a small contract that lets the Node worker delegate review-generation execution to a configured Python service when ready, while preserving the existing local Node fallback path.

The bridge introduces the runtime shape future Python services must honor:

- expose a safe health/readiness endpoint;
- accept bounded review-generation context with run id, task id, mode, structure summary, paragraph excerpts, max issue count, and safe provider summaries;
- return schema-valid stage events, preparation package output, draft issue generation output, completion metadata, and safe diagnostics;
- never require the browser to know service URLs, auth headers, prompts, raw provider traces, private object URLs, or unbounded OCR text;
- degrade to local fallback when the service is disabled, unavailable, timed out, or returns invalid payloads;
- keep run status, run events, replayable SSE, and worker queue ownership as the frontend-facing source of truth.

This keeps the current Node BFF valuable as the API gateway and review-loading contract while making the long-running intelligent-agent execution layer replaceable.

## Review Decision Completion Decision

After backend generation run materialization, the next production-critical layer is backend-owned reviewer decisions and completion. OCR and AI generation only create value after a human reviewer can accept, reject, edit, add manual findings, and complete the task through a durable backend contract.

This layer makes the current MVP closer to mature review platforms:

- AI-generated and manual issues become actionable business records, not only frontend-local state;
- review-mode completion can persist a supervisor report asset;
- review-revise mode can persist a revised-plan snapshot generated from accepted issue resolutions;
- the frontend may still use local fallback for MVP resilience, but backend task snapshots become the preferred source after successful reviewer actions;
- audit logs, permissions, tenant scoping, report export, and Python report agents can later build on the same stable task action contract.

This should be prioritized before deeper workflow-engine work because durable human decisions are the bridge between generated issues and production review records.

## Review Decision Activity Trail Decision

After backend-owned reviewer decisions and completion, the next production-critical layer is a safe reviewer activity trail. Mature review platforms need users and later auditors to understand which issue was accepted, rejected, edited, manually added, deleted, or used to complete a result asset.

This slice intentionally stops short of an immutable audit ledger. It records bounded, safe activity summaries on the review task aggregate and exposes task-scoped activity reads. That is enough to support result provenance, later audit UI, role-aware accountability, and report export preparation without forcing a premature authentication, tenancy, or database migration.

The activity trail must remain safe:

- store action type, time, actor placeholder, issue/result references, decision, mode, and short messages;
- exclude prompts, provider traces, secrets, tokens, private URLs, and unbounded document text;
- keep the Node BFF as the current task API boundary while leaving room for a future durable audit store.

## Opening Condition Review Direction Decision

Opening-condition review should be developed as an independent business portal beside construction plan review, not as a direct menu item inside the construction-plan review shell and not as a separate throwaway contest demo. It reuses the same platform principles: human-in-the-loop, traceable evidence, recoverable task state, safe provider summaries, and report assets.

The product topology is:

```text
Unified login
  -> Product launcher
      -> Construction Plan Review portal
      -> Opening Condition Review portal
```

Each portal owns its route namespace, sidebar, landing page, business context, and state machine. The shared platform layer owns identity, provider summaries, object storage, OCR, task status, Dify/agent gateways, report assets, and safe diagnostics.

The near-term implementation uses a typed platform-owned review packet and mock data to demonstrate the workflow. Dify remains valuable for workflow orchestration, OCR/LLM extraction, Human Input review nodes, and report drafting. However, durable business records must belong to the platform:

- basis versions and applicability confirmation;
- project personnel, equipment, certificate, company, and system-document master data;
- check item rule verdicts and semantic notes;
- evidence references and confidence summaries;
- human review triggers and decisions;
- auxiliary report summaries and audit records.

This direction supports rapid contest delivery while preserving the future migration path to backend persistence and Python/Dify agent service bridges. It also prevents local prompt optimization from becoming the architecture.

## Opening Condition Storage Decision

Opening-condition review requires structured records before deeper workflow automation becomes production-safe. The storage direction is:

- PostgreSQL or an equivalent relational store is the target source of truth for tenants, projects, contract packages, participating organizations, workspaces, basis-set versions, master data, review packets, check items, evidence references, human decisions, and audit events.
- MinIO or compatible object storage holds uploaded archives, contracts, OCR outputs, source evidence, report files, and exported ledgers.
- A vector index can support semantic retrieval and similarity matching, but it must not be the authoritative store for contracts, basis versions, pass/fail decisions, or reviewer approvals.
- SQLite is acceptable only for local prototype state, development snapshots, or automated tests.

This keeps Dify workflow output and embedding search useful without letting either become the compliance record.
