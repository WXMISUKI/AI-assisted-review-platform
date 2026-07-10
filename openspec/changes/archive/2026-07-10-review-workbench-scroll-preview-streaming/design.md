## Context

The app uses a left navigation shell for document library, knowledge base, and data assets. Review detail currently opens as a separate full-page workbench. The document preview section at the bottom renders every paragraph continuously, but its paragraph styling is too flat for document review. The loading state is currently a centered card, while the product direction expects users to enter detail and watch the AI audit progress across outline, document, and issue panels.

External patterns from mature document review tools are consistent: navigation, document, and comments/issues are independent scroll regions; comments or findings are anchored to document locations; long documents are handled with outline navigation, pagination/virtualization, or a scrollable page canvas; streaming AI systems commonly push stage events and incremental findings via SSE or WebSocket.

## Goals / Non-Goals

**Goals:**
- Keep sidebar height fixed to viewport and move page overflow into `shell-main` / `shell-content`.
- Make processed preview look like a readable document canvas rather than plain separated rows.
- Add a mock streaming review page that visually proves outline/document/issues can update while AI processing runs.
- Keep implementation front-end only and scoped.

**Non-Goals:**
- Do not implement real SSE, WebSocket, backend workers, PDF parsing, or virtualized rendering.
- Do not redesign the entire workbench or theme system.
- Do not change the accept/reject decision model.

## Decisions

### Decision 1: Independent scroll containers

Use `height: 100vh` and `overflow: hidden` on the grid shell, then `overflow: auto` on `shell-main` or `shell-content`. This prevents the sidebar from stretching with document lists while preserving normal scroll inside the content panel.

### Decision 2: Paper-like continuous preview

The processed preview should become a centered document canvas with page-like width, padding, paragraph rhythm, light dividers, and subtle section headers. For the MVP we keep continuous flow because it is simple and compatible with existing mock data. For production, the same surface can be upgraded to pagination or virtualization.

### Decision 3: Mock streaming first, SSE later

The loading detail will show three panels and a staged event timeline. A timer-driven mock stream is enough to validate user perception. Production can map backend events such as `parse.section.created`, `review.issue.created`, and `review.complete` to the same UI model using EventSource or WebSocket.

## Risks / Trade-offs

- [Risk] A continuous preview still may not scale to thousands of paragraphs. -> Mitigation: spec documents pagination/virtualization as the production path while MVP keeps simple rendering.
- [Risk] Mock streaming may be mistaken for real AI integration. -> Mitigation: label it as mock progress and keep data deterministic.
- [Risk] Changing shell overflow can reveal nested height bugs. -> Mitigation: keep changes local to shell classes and verify document library and loading page.
