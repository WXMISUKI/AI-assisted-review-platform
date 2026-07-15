## Context

The current platform is a human-in-the-loop construction plan review workbench with a React/Vite frontend, Node BFF, local persistence adapters, OCR integration, LLM draft issue generation, SSE progress, reviewer decisions, completion assets, and safe activity records. The urgent contest direction is a related but more structured workflow: opening-condition review for construction readiness materials.

The supplied Dify workflow already demonstrates a useful MVP flow: upload a material package and checklist document, unzip materials, OCR each material, convert the checklist table, extract check items, match materials, aggregate project information, generate a Markdown report, and export a DOCX. Its limitation is that personnel, equipment, certificates, basis versions, low-confidence fields, and review conclusions are not yet platform-owned records.

The target users are construction units doing self-check and supervisors doing assisted review. The output is an internal auxiliary opinion, not an administrative approval result. This lets the system automate deterministic checks aggressively while keeping basis confirmation, key fields, and high-risk conclusions reviewable by humans.

## Goals / Non-Goals

**Goals:**

- Add an opening-condition review foundation that can be shown in the platform without waiting for a database migration.
- Represent basis confirmation, project master data, check items, evidence, rule outcomes, Dify human-review triggers, and report summary as typed domain data.
- Show a contest-ready page that explains the recommended task groups and displays a realistic review result.
- Document the architecture decision that Dify remains a workflow/HITL bridge while the platform owns durable review records.
- Keep the implementation compatible with future backend persistence and Python/Dify agent bridges.

**Non-Goals:**

- Do not replace the existing construction plan review flow.
- Do not import or execute the Dify YAML inside the app in this slice.
- Do not add a production database schema, migration, auth model, or real Dify API callback endpoint yet.
- Do not build a complete rules engine UI; the first slice uses deterministic mock rule outcomes to express the contract.

## Decisions

### Decision 1: Build a platform-owned opening-condition domain model first

The foundation adds TypeScript domain objects for basis versions, project master data, review packets, check items, evidence, verdicts, human-review triggers, and report summary.

Alternatives considered:

- Keep logic entirely in Dify: fastest for prompt iteration, but weak for traceability, data reuse, and audit.
- Add backend/database first: stronger long-term, but too heavy for the contest slice and current MVP state.

Rationale: typed frontend/domain data gives a stable contract that can later move behind backend APIs without changing the UI narrative.

### Decision 2: Treat Dify as orchestration and Human Input, not as source of truth

Dify should continue to run OCR/LLM workflow steps and human input nodes for basis confirmation, master-data correction, and high-risk conclusion review. The platform should own canonical records and expose bounded payloads to Dify.

Alternatives considered:

- Full custom workflow runtime now: better control but too slow.
- Pure Dify workflow now: fast demo but not enterprise-grade.

Rationale: this matches the existing architecture decision that Node BFF is a frontend-facing gateway and long-running agent/workflow execution remains replaceable.

### Decision 3: Prioritize a vertical contest slice over local optimization

The first implementation should show the complete business story: basis status, master data initialization, rule/semantic result, evidence, human-review queue, and report summary. It should not spend this round perfecting OCR confidence math or rule authoring.

Alternatives considered:

- Start with detailed evidence extraction: useful but risks a narrow rabbit hole.
- Start with backend persistence: important later but slower to demonstrate.

Rationale: the highest-value contest artifact is a convincing, inspectable review workflow.

## Risks / Trade-offs

- Mock data may be mistaken for production readiness -> label the page as foundation/contest slice and document backend migration as next step.
- Dify and platform records can diverge -> future bridge must use stable task ids, basis version ids, and review packet ids.
- Human review in Dify may not be enough for platform audit -> persist human decisions back to platform in the next backend slice.
- Rule outcomes can become prompt-dependent if not separated -> keep deterministic rule verdict fields distinct from semantic notes.

## Migration Plan

1. Land the typed domain model and frontend presentation with mock data.
2. Add docs describing opening-condition review as a sibling business capability under the same platform.
3. In a later change, add backend endpoints for basis versions, master data packets, check item results, and Dify callback ingestion.
4. Replace mock data with backend task snapshots once persistence is ready.
5. Keep the page route and domain names stable so the contest UI survives the backend migration.

## Open Questions

- Which roles are allowed to confirm basis versions in production: supervisor only, platform admin only, or both?
- Which Dify deployment interface will be used for Human Input callbacks in the contest environment?
- Will project personnel/equipment/certificate master data be imported only from uploaded files, or can users manually maintain it before review?
