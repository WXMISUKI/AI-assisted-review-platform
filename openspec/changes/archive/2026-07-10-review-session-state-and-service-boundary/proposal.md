## Why

The MVP now proves the full interaction loop from document library to review workbench and result assets, but the business state is still assembled inside page components and static mock files. Before adding real AI, document parsing, persistence, or knowledge-base integration, the platform needs a stable review-session state boundary that can be replaced by backend APIs later without rewriting the UI.

## What Changes

- Add a review session state capability that defines document records, review task lifecycle, streaming events, issue resolution state, processed paragraphs, and result assets as one coherent contract.
- Introduce a mock repository/service layer for document library, review processing, workbench loading, issue decisions, and review completion.
- Add localStorage-backed mock persistence so uploaded documents, issue decisions, and generated result assets survive page refresh during MVP testing.
- Refactor page components to consume service/session state instead of owning all mock state directly.
- Keep the scope mock-only: no real PDF/DOCX parsing, backend database, AI API, knowledge retrieval, authentication backend, or export generation.

## Capabilities

### New Capabilities
- `review-session-state`: Defines the shared front-end contract for review tasks, review sessions, streaming events, local mock persistence, and service boundaries.

### Modified Capabilities
- `document-review-task`: Document task creation, processing, and library state SHALL use the review-session service contract.
- `streaming-review-workbench`: Streaming progress SHALL be represented as review events that can later map to SSE or WebSocket messages.
- `review-workbench`: Issue decisions and processed previews SHALL be loaded from and written through the review session state boundary.
- `review-completion-results`: Generated result assets SHALL be stored through the review session service contract.

## Impact

- Affected code: `src/App.tsx`, `src/ReviewWorkbenchPage.tsx`, `src/domain/*`, and possibly small supporting hooks or storage helpers.
- No new runtime dependencies are expected.
- Existing UI behavior should remain functionally equivalent: login, upload, start review, streaming mock, issue handling, completion, and result preview must continue to work.
- This change intentionally limits refactoring to the state/service boundary and avoids broad visual redesign.
