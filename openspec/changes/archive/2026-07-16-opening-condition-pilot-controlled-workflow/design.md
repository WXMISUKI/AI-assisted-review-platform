## Context

The platform already separates unified login, product launcher, construction-plan review, and opening-condition review portals. Opening-condition review currently has typed frontend mock data and specs for workspace context, basis versions, master data, review packets, and a Dify bridge. The next milestone is a single-project pilot that can process real highway construction opening-condition materials while preserving enterprise boundaries: platform-owned facts, human review, safe diagnostics, and replaceable workflow execution.

The user confirmed two steering decisions:

- This milestone targets a single real pilot workspace, not a complete multi-tenant IAM/RBAC platform.
- The Dify workflow is useful as a reference, but the platform can implement an equivalent controlled workflow itself for better governance and future maintainability.

## Goals / Non-Goals

**Goals:**

- Build a platform-owned opening-condition check workflow that starts from a selected workspace and published basis version.
- Persist pilot business facts through stable contracts: basis, master data, packets, checklist items, evidence, task events, human decisions, and reports.
- Support deterministic material-completeness checks before deeper semantic correctness review.
- Preserve tenant, project, contract-package, and organization fields in contracts for future scaling.
- Keep workflow execution replaceable so Dify, Python workers, or other engines can later plug in behind the same task/event contracts.
- Add explicit credential hygiene tasks for exposed workflow service credentials.

**Non-Goals:**

- Full enterprise IAM, organization hierarchy, approval delegation, or fine-grained RBAC.
- Final production workflow runtime such as Temporal, Celery, BullMQ, or LangGraph.
- Full correctness verification of every uploaded document's business content.
- Vector database as authoritative storage for contracts, basis versions, decisions, or check results.
- Directly embedding the opening-condition portal inside the construction-plan review portal.

## Decisions

### 1. Pilot milestone is a single-workspace vertical slice

The first production-shaped milestone SHALL cover one project or contract package and one selected participating organization/workspace from basis preparation through report archive.

Alternatives considered:

- Full multi-tenant platform first: more complete, but delays real business validation.
- Dify demo first: fast to demo, but leaves business facts outside the platform.

Rationale: a single-workspace vertical slice proves the full operating model while keeping scope controlled.

### 2. Relational facts are the target source of truth

The design keeps PostgreSQL or an equivalent relational store as the target source of truth. The implementation may introduce a local development adapter first, but contracts must map cleanly to relational entities and object references.

Core entities:

- `OpeningConditionWorkspace`
- `BasisSetVersion`
- `BasisComponent`
- `ProjectMasterDataRecord`
- `OpeningConditionPacket`
- `OpeningConditionTask`
- `OpeningConditionCheckItem`
- `OpeningConditionEvidence`
- `OpeningConditionHumanReviewDecision`
- `OpeningConditionTaskEvent`
- `OpeningConditionReportAsset`

Object storage holds source archives, contract files, OCR artifacts, extracted evidence, and exported reports.

### 3. Platform controls the workflow state machine

Opening-condition task execution SHALL be represented by platform task state, even when some steps are delegated later.

Recommended states:

```text
draft
  -> blocked_missing_basis
  -> blocked_missing_master_data
  -> ready_for_packet
  -> packet_uploaded
  -> extracting
  -> matching
  -> awaiting_human_review
  -> report_ready
  -> archived
  -> failed
  -> canceled
```

Task events are replayable summaries for the UI and audit trail. They must not include secrets, raw provider traces, private object URLs, or unbounded document text.

### 4. Checks are split into deterministic matching and semantic assistance

The pilot prioritizes material completeness:

- Parse the submitted checklist into required item rows.
- Inventory uploaded archive contents.
- Match each required item to files, evidence locators, published basis, and published master data.
- Use LLM/OCR only as bounded assistance for ambiguous labels, document relevance, and extracted summaries.

This keeps pass/fail outcomes grounded in inspectable evidence. Semantic notes can explain ambiguity but must not overwrite deterministic rule verdicts.

### 5. Human review is a first-class workflow stop

The platform creates human-review queue items for low confidence, conflicting evidence, expired or missing basis, missing master data, uncertain stamp/signature recognition, or rule/semantic disagreement. Human decisions update platform records first; adapter feedback to Dify is optional.

### 6. Dify becomes an optional adapter/reference, not a dependency

The existing Dify workflow can inform step order and prompts, but the pilot workflow must run through platform contracts. Future Dify integration should behave like an adapter:

- receive bounded task/file references;
- return normalized extraction, match, human-review, or report-draft outputs;
- never own durable business records.

### 7. Credential hygiene is Task 0

The imported workflow file contained external service credentials. Before implementation uses any external workflow or OCR service configuration, those credentials must be rotated and moved into managed secrets or server-side environment variables. Specs and task summaries must explicitly forbid writing credentials to repository files, logs, persisted summaries, or frontend responses.

## Risks / Trade-offs

- Local persistence adapter drifts from PostgreSQL schema -> Define relational-shaped contracts and migration notes before implementation.
- Platform workflow becomes too large too early -> Implement vertical slices in task groups and keep advanced workflow engine adoption out of this change.
- LLM output is treated as authoritative -> Keep deterministic verdict fields separate from semantic notes and require evidence references.
- Human review queue grows without clear closure -> Add terminal decision states and report gating rules.
- Exposed credentials remain valid -> Rotate credentials before any real external calls and add redaction checks to payload handling.

## Migration Plan

1. Create opening-condition backend domain contracts and local development persistence adapter shaped for PostgreSQL.
2. Add pilot API routes behind the existing Node BFF boundary.
3. Connect frontend opening-condition pages to backend-owned pilot records while preserving mock fallback where useful for local demos.
4. Add controlled workflow execution steps for packet intake, extraction summary, deterministic matching, human review, and report archive.
5. When PostgreSQL is introduced, migrate the adapter without changing frontend contracts.

Rollback strategy: keep existing frontend mock data available while the pilot API is disabled or unavailable; never delete published basis/master-data records during failed workflow runs.

## Open Questions

- Which database migration tool will be selected when PostgreSQL is introduced?
- Which OCR/layout extraction provider will be used first for archive contents in the pilot?
- Which exact opening-condition checklist template should be the first acceptance-test fixture?
