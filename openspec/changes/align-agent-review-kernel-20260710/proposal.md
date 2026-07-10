## Why

The platform currently models construction plan review as interactive issue handling, but the new `docs/20260709专项施工方案审查智能体 功能设计说明2.1.pdf` defines a stricter domain kernel: industry knowledge graph, hard rule checks, LLM semantic reasoning, traceable legal basis, and three scenario-specific outputs. Aligning the platform to that kernel now prevents later UI and agent work from being built on a shallow "free-form suggestion" model.

## What Changes

- Introduce an agent review kernel capability that formalizes review basis, check domains, rule/semantic engine separation, traceability, and output scenarios.
- Extend the construction plan review agent contract so it can consume project documents, future knowledge retrieval context, rule hits, semantic findings, and prompt versions.
- Extend the review issue model from generic findings to basis-backed compliance findings with check domain, clause references, engine source, scenario, verification standard, and rectification loop fields.
- Extend document review tasks with staged processing aligned to document parsing, knowledge/rule matching, semantic review, issue structuring, and output generation.
- Extend the review workbench requirements so every AI issue shown to users exposes basis, traceability, severity category, and scenario-specific meaning.
- Keep this change as a spec and planning alignment only; no production AI, vector database, real rule engine, or backend implementation is required in this change.

## Capabilities

### New Capabilities
- `agent-review-kernel`: Defines the domain review kernel for专项施工方案审查, including knowledge basis, hard-rule and semantic-review responsibilities, check domains, traceable references, and scenario outputs.

### Modified Capabilities
- `agent-asset-management`: Adds explicit configuration requirements for the construction plan review agent's kernel profile, prompt/schema binding, and future knowledge-base entry points.
- `review-issue-model`: Adds compliance-oriented fields required by the PDF 2.1 kernel, including engine source, check domain, normative/project references, clause traceability, verification criteria, and closed-loop rectification metadata.
- `document-review-task`: Adds review-processing stages that reflect parsing,危大/超危大 classification, rule matching, semantic reasoning, issue structuring, and scenario output generation.
- `review-workbench`: Requires the UI to expose basis-backed issue details and distinguish construction-unit self-check, supervisor formal review, and expert-review assistance outputs.

## Impact

- Affected source areas later: `src/domain/reviewTypes.ts`, `src/domain/mockReview.ts`, `src/domain/reviewUtils.ts`, review workbench issue cards, agent asset mock data, and document task state models.
- Affected future backend/API contracts: document parsing output, knowledge retrieval context, rule-engine result schema, LLM semantic result schema, structured issue schema, and report generation payload.
- No new runtime dependency is required for the spec phase.
- Existing theme, shell, upload, and draggable annotation work remains in scope but should not be redesigned by this change.
