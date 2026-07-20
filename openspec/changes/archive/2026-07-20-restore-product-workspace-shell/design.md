## Context

The platform now has two business products: construction-plan review and opening-condition review. They share platform services such as authentication, MinIO, OCR, LLM diagnostics, and MaxKB provider proxy integration, but they must not share a single mixed workbench UI or product task state.

The recent opening-condition pilot controls made the real intake path testable, but they were surfaced on the product landing page together with readiness, matching, evidence, task planning, and reports. That creates a demo-board experience and hides the intended enterprise flow: login, business selection, product workspace, then focused workflow pages.

## Goals / Non-Goals

**Goals:**

- Restore the login title and copy to a neutral "AI资料审查平台" identity.
- Keep the product launcher as the authenticated business selection portal.
- Render opening-condition review inside its own left-sidebar workspace.
- Put trial intake and ZIP/material packet controls into the "资料接入" page only.
- Preserve construction-plan review as its own product workspace.
- Document MaxKB-side cooperation requirements for material packets and mixed file types.

**Non-Goals:**

- Do not build a full multi-tenant permission platform in this slice.
- Do not replace the existing upload channel.
- Do not implement full OCR ingestion into MaxKB for every file type in this slice.
- Do not let MaxKB own business facts, human decisions, project state, or report status.

## Decisions

### Decision: Product shell before workflow depth

Restore the information architecture first: authenticated users enter the product launcher, then a product-specific workspace. Opening-condition pages are split by workflow step: 工作台概览, 资料接入, 依据与主数据, 资料核查, 人工复核, 报告归档.

Alternative considered: keep a single opening-condition pilot page and collapse panels. This is faster, but it continues the demo-like UX the user explicitly rejected.

### Decision: Platform owns ZIP manifest and business classification

The front platform is responsible for uploaded object ownership, project/task/team context, ZIP manifest extraction, initial file type classification, in-scope/out-of-scope tagging, idempotency keys, and human confirmation state. OCR Worker / MaxKB Provider Proxy may process files and return OCR, ingestion, and retrieval results, but MaxKB remains a retrieval provider.

Alternative considered: ask MaxKB to parse and classify uploaded ZIP packages end-to-end. This would make MaxKB a hidden workflow engine and weaken traceability.

### Decision: Trial controls are operational tools, not product homepage content

The real pilot bootstrap panel remains available but is scoped to "资料接入". The opening-condition overview shows status, context, and next actions without exposing every operational control at once.

Alternative considered: remove trial controls from the UI completely. That would make the current integration hard to test and slow the single-project trial milestone.

## Risks / Trade-offs

- Existing Chinese copy has some garbled legacy strings -> restore the high-traffic entry and product boundary copy now; avoid mass rewriting unrelated construction-plan pages in this slice.
- Opening-condition workspace remains mock-backed in some pages -> keep copy explicit that only 资料接入 is wired to the current pilot API.
- MaxKB batch ingestion endpoint may not exist yet -> document the needed provider-side contract so the MaxKB project can implement it independently.

