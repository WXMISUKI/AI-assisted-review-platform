## Context

The current MVP proves the review workbench interaction: document markers, issue cards, accept/reject decisions, manual annotations, and role-based review modes. The new PDF `docs/20260709专项施工方案审查智能体 功能设计说明2.1.pdf` changes the center of gravity from "AI finds text problems" to "a regulated review kernel produces traceable compliance findings".

The kernel must support public road and water transport engineering专项施工方案 review. Its stated baseline includes JT/T 1495-2024, JTG F90-2015, JTG G10-2016, current laws, mandatory standards, local requirements,危大工程 management requirements, and project-specific documents such as tender documents, bid commitments, construction contracts,施工组织设计, drawings, and safety risk assessment reports.

This change is a planning/spec alignment. It prepares the front-end mock model and future backend contracts without implementing a real knowledge graph, vector store, rule engine, or LLM workflow.

## Goals / Non-Goals

**Goals:**
- Define a domain review kernel capability that separates hard-rule checks from LLM semantic reasoning.
- Make every AI issue basis-backed, traceable, and suitable for supervisor review records.
- Align review task stages with parsing, rule matching, semantic reasoning, issue structuring, and scenario output generation.
- Preserve the existing workbench interaction while requiring issue cards to expose legal/project basis and整改闭环 information.
- Reserve future integration points for knowledge graph, vector retrieval, rule libraries, prompt assets, and report agents.

**Non-Goals:**
- Do not build the production backend, database schema, vector database, rule engine, OCR pipeline, or LLM calls in this spec.
- Do not redesign login, theme, app shell, upload UX, or annotation popover behavior.
- Do not certify legal completeness of every cited clause; the implementation must later source clauses from a controlled knowledge base.
- Do not make the mock MVP claim formal regulatory validity.

## Decisions

### Decision 1: Treat the PDF as the agent kernel contract, not as a prompt-only document

The PDF describes architecture, check domains, procedural review, expert review, and output scenarios. Encoding it only as prompt text would make the system hard to audit and would reintroduce LLM hallucination risk. The platform shall instead model it as structured capabilities: review basis, check domain, engine source, traceable references, severity category, and output scenario.

Alternative considered: add a longer construction-plan-review prompt to the existing agent asset mock. This is faster but loses structured rule coverage, makes UI cards too vague, and does not support later rule-engine or knowledge-base integration.

### Decision 2: Use a dual-engine result model

Hard constraints such as missing statutory content,危大/超危大 classification, signature/seal requirements, expert group count, and quantitative thresholds belong to a rule engine. Flexible judgment such as process logic, measure specificity,工艺适配性, and整改建议 belongs to semantic reasoning. The issue model shall identify whether a finding came from `rule`, `semantic`, or `hybrid`.

Alternative considered: a single `ai` source. This is simpler but cannot express deterministic compliance checks or confidence boundaries clearly enough for a supervisor workflow.

### Decision 3: Represent basis as first-class data

Each finding shall carry structured references, including reference type, document name, clause number, quote/summary, priority, and whether the basis is normative or project-specific. Project bid commitments can be higher priority than generic tender requirements, so basis priority must be explicit.

Alternative considered: store basis as one free-text field. This matches the current mock but prevents filtering, citation rendering, report generation, and source-trace validation.

### Decision 4: Keep scenario outputs separate from issue decisions

The same finding can feed construction-unit self-check, supervisor formal review, and expert-review assistance. User decisions in the workbench remain reversible and separate from the original finding. Scenario output generation should consume issues plus decisions, rather than mutate the original issue details.

Alternative considered: create different issue types for each role. That would duplicate findings and make cross-role traceability harder.

## Risks / Trade-offs

- [Risk] The spec may look broader than the current front-end MVP can implement immediately. -> Mitigation: tasks explicitly split mock model alignment from future backend integration.
- [Risk] Cited standards and clause coverage can become stale. -> Mitigation: all normative basis must later come from versioned knowledge assets, not hard-coded prompt text.
- [Risk] Rule-engine requirements may be over-modeled before backend architecture exists. -> Mitigation: the MVP may mock rule hits as structured data while keeping the contract stable.
- [Risk] UI issue cards may become too dense. -> Mitigation: show summary, severity, and main basis by default; reveal detailed references and整改闭环 fields in expandable sections.

## Migration Plan

1. Update domain types and mock review data with kernel fields while preserving current accept/reject behavior.
2. Update issue rendering to show engine source, check domain, references, and整改/核验 fields.
3. Update agent asset mock pages to expose kernel profile, prompt schema, and future knowledge-base bindings.
4. Update document task mock stages to match the kernel flow.
5. Keep old mock issue fields as compatibility aliases until all UI references use the new structure.

Rollback is straightforward during MVP: revert the mock type/data/UI changes and keep the existing generic `finding.reason/basis/suggestion` fields.

## Open Questions

- Which PDF/DOCX parser will become the production source of paragraph/page anchors: PDF.js/PyMuPDF/MinerU or a backend HTML conversion pipeline?
- Which rule-engine format should hold deterministic checks: JSON rules, decision tables, a DSL, or code-based validators?
- Which knowledge store should own normative clauses and project documents: pgvector-only, Qdrant/Milvus, or a graph-plus-vector hybrid?
- How much of the expert-review assistance output should be visible to construction users versus supervisor/admin users?
