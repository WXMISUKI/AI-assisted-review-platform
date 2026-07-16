## Why

The opening-condition portal now needs to move from a typed mock workflow into a single-project pilot that can be used against real highway construction onboarding materials. The most valuable next step is not a full multi-tenant permission platform, but a platform-owned, auditable workflow that proves basis publication, master-data confirmation, checklist/package matching, human review, and auxiliary report archiving can work end to end.

## What Changes

- Introduce a platform-controlled opening-condition pilot workflow for one selected project, contract package, participating organization, and workspace.
- Add production-oriented persistence requirements for pilot business facts: workspace context, basis versions, master-data records, submitted packets, checklist items, evidence references, human decisions, task events, and report assets.
- Add a formal task state machine for opening-condition checks, including prerequisites, package intake, extraction, deterministic matching, semantic assistance, human review, report generation, and terminal states.
- Treat the existing Dify workflow as a reference or optional adapter, not as the required execution path or durable business record owner.
- Add security and credential hygiene requirements because the imported Dify workflow contained external service credentials that must not enter repository files, logs, persisted task summaries, or callback payloads.
- Keep tenant and organization fields in data contracts for future growth, while scoping implementation to a single pilot workspace instead of full IAM/RBAC.

## Capabilities

### New Capabilities
- `opening-condition-pilot-workflow`: Covers the platform-owned single-project pilot workflow, task state machine, persistence boundaries, controlled execution steps, human review queue, and report archiving.

### Modified Capabilities
- `opening-condition-review`: Clarify that formal review packets are backed by platform-owned task records and a controlled workflow, not only mock data or imported workflow output.
- `opening-condition-basis-workflow`: Add pilot persistence and publication gates for basis versions before task creation.
- `opening-condition-master-data`: Add pilot persistence and publication gates for reusable master data before item-level checks.
- `opening-condition-dify-bridge`: Reframe Dify as an optional adapter/reference workflow and require all imported outputs to be normalized into platform records.

## Impact

- Frontend: opening-condition workspace pages will later consume backend-owned task, basis, master-data, human-review, and report contracts instead of only static demo data.
- Backend: Node BFF will need opening-condition API routes, validation, task events, safe diagnostics, object references, and a persistence adapter that can start with a local development store and migrate to PostgreSQL.
- Storage: PostgreSQL or equivalent relational storage remains the target source of truth; MinIO/OSS stores uploads, extracted artifacts, evidence files, and report exports; vector search remains auxiliary only.
- Workflow: deterministic checks and semantic assistance are orchestrated by platform services first; Dify, Python workers, or other engines can be integrated later behind the same contracts.
- Security: exposed workflow credentials must be rotated outside this change, and future workflow configuration must come from environment or managed secret storage.
