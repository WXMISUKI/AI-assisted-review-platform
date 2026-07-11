## Why

The platform now gates review work on OCR completion, but the post-OCR phase is still too opaque for users and too coarse for future backend replacement. We need a clearer orchestration contract that can show review-preparation progress, current paragraph activity, and the agent boundary between OCR normalization, review analysis, and report generation.

## What Changes

- Add a first-class review orchestration capability that models the post-OCR pipeline as staged progress instead of a single "reviewing" state.
- Expose paragraph-level and stage-level progress in the review loading/detail experience so users can see what the system is processing.
- Expand the data-assets area to include agent inventory entries for document structure restoration, construction plan review, and report generation, plus prompt asset binding surfaces.
- Extend the review streaming event contract so future backend events can carry current paragraph, stage, and agent metadata.
- Keep the change mock-friendly for now, but make the state model replaceable by real backend orchestration later.

## Capabilities

### New Capabilities
- `review-agent-orchestration`: post-OCR review pipeline stages, paragraph-level progress, and agent handoff boundaries.

### Modified Capabilities
- `document-review-task`: add review-preparation visibility and locked in-progress detail behavior after OCR completes.
- `review-session-state`: extend task/session state with pipeline snapshots that can survive refresh and backend replacement.
- `review-streaming-api`: enrich review stream events with stage, paragraph, and agent metadata.
- `agent-asset-management`: expand the asset inventory to include the normalization/structure-restoration agent and its prompt binding surface.

## Impact

Frontend task state, review-loading/detail rendering, document library status labels, mock session persistence, data-assets content, and future backend SSE/event contracts will all be affected. The work should stay compatible with the current mock flow while opening a cleaner seam for real OCR-to-review orchestration later.
