## Why

The backend review-agent SSE endpoint already supports a deterministic connectivity stream, but it still emits mostly generic stage summaries. We now have a richer recovered-structure contract in session state and loading views, so the SSE contract should speak the same language: paragraph-aware and section-aware review-preparation signals.

If we do not connect these layers, the backend will continue to look like a generic connectivity demo while the rest of the app has already moved toward real review-preparation semantics.

## What Changes

- Make the review-agent SSE endpoint emit structure-aware stage summaries when section/paragraph metadata is supplied.
- Preserve backward-compatible deterministic connectivity behavior when no structure metadata is present.
- Extend the SSE event contract with the small amount of metadata needed for stage-level paragraph/section context.
- Keep the endpoint safe, deterministic, and mock-friendly.

## Non-goals

- No real LLM issue generation.
- No backend persistence or queue integration.
- No change to the primary review workbench layout.

## Impact

- `server/reviewAgentStream.mjs`: generate structure-aware stage summaries and expose richer stage metadata.
- `server/index.mjs`: pass through optional structure context query parameters.
- `src/domain/backendConnectivity.ts`: expand the SSE event type to cover the new structure context fields.
- `src/appShellPages.tsx`: optionally surface the richer SSE stream details in the connectivity panel.
- `openspec/specs/review-streaming-api/spec.md`: define the structure-aware stream contract.
- `openspec/specs/llm-agent-adapter/spec.md`: keep the review-agent test endpoint aligned with the enriched event model.
