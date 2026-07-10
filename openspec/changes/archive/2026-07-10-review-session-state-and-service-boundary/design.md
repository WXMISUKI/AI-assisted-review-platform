## Context

The current MVP keeps document library state, streaming progress, selected document state, and result assets inside `App.tsx`, while issue state is owned by `ReviewWorkbenchPage.tsx`. This is acceptable for early interaction testing, but it makes later backend replacement difficult because each page owns a different slice of the business workflow.

The next milestone is not real AI integration. The next milestone is a stable front-end business state boundary that can support real parsing, AI streaming, persistence, and report generation later.

## Goals / Non-Goals

**Goals:**
- Define review task/session types that cover documents, lifecycle status, streaming stages, issues, processed paragraphs, and result assets.
- Move mock document/task/session data behind a repository/service layer.
- Add localStorage-backed mock persistence for MVP testing.
- Keep UI behavior equivalent while reducing direct mock ownership inside page components.
- Preserve current role and mode behavior.

**Non-Goals:**
- Do not implement real backend APIs, authentication, database persistence, PDF/DOCX parsing, AI calls, vector retrieval, or export generation.
- Do not redesign the UI or theme.
- Do not split every large component at once; only extract state and service boundaries needed for this workflow.

## Decisions

### Decision 1: Introduce a session service instead of page-owned mock state

`App.tsx` should coordinate application flow, but it should not be the source of truth for document/task business state. A `reviewSessionService` will expose functions such as listing documents, creating tasks, starting review, loading sessions, resolving issues, and completing review.

Alternative considered: keep state in `App.tsx` and add helper functions. This would be faster short-term, but it would keep later API integration coupled to page logic.

### Decision 2: Keep repository synchronous for the MVP

The repository can be synchronous because it uses in-memory/default data plus localStorage. Service functions can still be shaped like stable domain operations so later replacement with async APIs is straightforward.

Alternative considered: make every service function async immediately. That adds loading/error plumbing before the app has a real backend and would increase this change's scope.

### Decision 3: Store session state at task level

Each review task will own document metadata, streaming state, issues, paragraphs, mode, and optional result asset. This mirrors the future backend aggregate: a document review task is the unit users resume from the library.

Alternative considered: store issues globally by document id. This makes the mock simpler but weakens the future model where each review run has its own lifecycle and outputs.

### Decision 4: Local persistence is mock-only and versioned

localStorage will use one namespaced key and a small schema version. Invalid or missing data falls back to seeded mock data. This gives refresh resilience without committing to a database migration strategy.

Alternative considered: no local persistence. That would keep code smaller but makes it harder to test completed documents and result assets across refreshes.

## Risks / Trade-offs

- [Risk] Refactoring state can accidentally change current interactions. -> Mitigation: keep public UI behavior equivalent and verify the existing happy paths after migration.
- [Risk] Service boundaries can become over-engineered. -> Mitigation: only add operations currently used by the UI and avoid generic CRUD frameworks.
- [Risk] localStorage data can become stale after type changes. -> Mitigation: include a storage version and fall back to seed data when parsing fails or the version is unknown.
- [Risk] Large files remain large. -> Mitigation: this change focuses on domain/service extraction first; component splitting can be a later, targeted change.
