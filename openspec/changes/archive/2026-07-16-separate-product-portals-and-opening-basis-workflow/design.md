## Context

The project started as an AI-assisted construction-plan review platform. A recent opening-condition review slice was added quickly to demonstrate adjacent value, but it was placed directly inside the existing construction-plan review shell. That shape conflicts with the desired enterprise product direction: construction-plan review and opening-condition review should be separate business portals with independent entrances, navigation, context, and lifecycle semantics, while sharing platform services such as identity, OCR, object storage, task status, Dify/agent gateways, evidence handling, and audit summaries.

The opening-condition review workflow also has a more complex domain than a simple material-completeness check. It needs organization/project/contract context, a confirmed basis set, published master data, checklist and packet submission, deterministic completeness checks, AI-assisted correctness checks, human adjudication, and traceable internal auxiliary reporting.

## Goals / Non-Goals

**Goals:**

- Establish a product topology with unified identity, a product launcher, and two independent business portals.
- Correct the existing platform-shell requirement that currently frames opening-condition review as a direct menu entry in the construction-plan review portal.
- Define the opening-condition context hierarchy and workspace selection before upload/review begins.
- Define a versioned basis-set lifecycle where contracts, checklist versions, regulations, and project-specific requirements are provisional until human-confirmed and published.
- Define a master-data lifecycle for personnel, equipment, certificates, companies, and system documents.
- Define the platform/Dify boundary so Dify remains an orchestration adapter and the platform remains the system of record.
- Keep the next implementation valuable and shippable: product boundary correction first, then opening-condition portal foundation, then basis/master-data workflow.

**Non-Goals:**

- Do not replace the existing Node BFF with a Python workflow engine in this change.
- Do not implement final authentication, multi-tenant RBAC, or production database migrations in the first slice.
- Do not attempt full document-content correctness adjudication before basis and master data are trustworthy.
- Do not make vector storage the source of truth for compliance facts.
- Do not archive or rewrite previous commits; this is a forward corrective change.

## Decisions

### Decision 1: Unified identity with independent product portals

Use one login and a product launcher, then route into separate portals:

```text
Login
  -> Product Launcher
      -> Construction Plan Review Portal
      -> Opening Condition Review Portal
```

Each portal owns its route namespace, sidebar, landing page, business context, and state machine. Shared services sit below the portals and are accessed through stable domain service boundaries.

Alternatives considered:

- One shared shell with product switching: faster short term, but it encourages mixed navigation, unclear permissions, and accidental coupling.
- Fully separate apps/auth/deployments: clean isolation, but too heavy for the current MVP and duplicates identity/OCR/storage integrations.

### Decision 2: Opening-condition context is project and contract-package scoped

Opening-condition review should not start from a generic organization alone. Users first enter the opening-condition portal, then choose or create a workspace context containing tenant/customer, project, contract package or section, participating organization, and role.

Recommended vocabulary:

- Tenant/customer: the platform customer or top-level account.
- Project: the highway or engineering project.
- Contract package/section: the work package being reviewed.
- Participating organization: construction unit, general contractor, subcontractor, supervisor, or owner-related party.
- Workspace/group: a review workspace bound to a project, package, organization, and review purpose.

This preserves the user's need to distinguish different institutions while avoiding an organization-only model that cannot bind contract responsibilities or project-specific basis.

### Decision 3: Basis set is a versioned published record

A basis set is the frozen set of authoritative materials a review task can rely on. It includes contracts and supplements, checklist template/version, applicable regulations, project management rules, and confirmed project-specific requirements.

Lifecycle:

```text
Uploaded basis files
  -> OCR/AI extraction
  -> provisional basis candidates
  -> human confirmation/correction/scoring
  -> published basis-set version
  -> review task binds to published version
```

AI output is not enough to publish a basis set. Human confirmation is required because the basis set controls later pass/fail reasoning.

### Decision 4: Master data must be published before formal checking

Personnel, equipment, certificates, company records, and system documents are extracted into provisional records first. A human reviewer confirms fields, validity, evidence, and confidence/scoring, then publishes them as reusable master data.

This keeps the actual opening-condition check from repeatedly re-reading raw files with unbounded LLM prompts and gives later checks stable references.

### Decision 5: Dify is an execution adapter, not the data owner

Dify can orchestrate archive extraction, OCR, checklist parsing, semantic matching, Human Input, and report drafting. The platform owns durable records:

- workspace context
- basis sets and versions
- master data
- review packets and check items
- evidence references
- human decisions
- report summaries and audit events

Dify callbacks or imported workflow outputs must be normalized into platform contracts before being shown as official task state.

### Decision 6: Storage direction is relational source of truth plus object storage

The target storage model is:

- PostgreSQL-style relational storage for canonical structured records.
- MinIO/object storage for original files, OCR artifacts, report files, and evidence assets.
- Vector index for retrieval and semantic search only.
- SQLite only for local prototype/testing or embedded development snapshots.

This avoids treating embeddings or workflow JSON as compliance records.

## Risks / Trade-offs

- Product split may feel slower than extending the current sidebar -> Mitigation: implement the first slice as launcher plus shell boundary correction before deep backend persistence.
- Context hierarchy may be over-modeled for MVP -> Mitigation: start with mock or local persisted tenant/project/package/organization/workspace records using the final names.
- Human confirmation adds workflow steps -> Mitigation: keep confirmation tables simple and focused on field correction, status, score, evidence, and publish action.
- Dify workflow output may not match platform contracts -> Mitigation: add a normalization layer and reject unsafe or incomplete fields into review-needed status.
- Previous implementation already added direct opening-condition menu entry -> Mitigation: treat this change as forward correction and avoid history rewrites.

## Migration Plan

1. Update documentation and specs to state that construction-plan review and opening-condition review are separate product portals under unified login.
2. Implement product launcher and route namespace foundation while keeping existing construction-plan review behavior reachable.
3. Move opening-condition UI from direct construction-plan shell navigation into the opening-condition portal shell.
4. Add opening-condition context selection using mock/local data first.
5. Add basis-set and master-data domain contracts with provisional/confirmed/published states.
6. Add Dify bridge normalization contracts before connecting real callbacks.
7. Later migrate mock/local records into the chosen structured backend persistence.

Rollback strategy: keep the existing construction-plan review portal as the default route; if the new product launcher is disabled, route directly into the construction-plan review portal.

## Open Questions

- Whether the first visible launcher should be a full product-selection page after login or a lightweight product switcher for users with only one authorized product.
- Whether the workspace term shown to users should be “项目组”, “标段工作区”, or “核查工作区”.
- Which roles can publish a basis set: supervisor only, platform admin, construction-unit self-check lead, or a configurable permission.
- Whether human “scoring” should mean extraction quality score, compliance confidence, business pass/fail rating, or all three as separate fields.
