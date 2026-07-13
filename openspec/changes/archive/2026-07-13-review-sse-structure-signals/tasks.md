## 1. Spec and Contract

- [x] 1.1 Update `review-streaming-api` and `llm-agent-adapter` specs to describe structure-aware SSE stage summaries.
- [x] 1.2 Extend the SSE contract to keep legacy consumers working without structure metadata.

## 2. Implementation

- [x] 2.1 Update `server/reviewAgentStream.mjs` to derive stage issue summaries from supplied section/paragraph context.
- [x] 2.2 Pass through optional structure context query parameters in `server/index.mjs` and expand the frontend SSE event type.
- [x] 2.3 Keep the connectivity panel compatible with the richer stage metadata.

## 3. Verification

- [x] 3.1 Run `npm run typecheck`.
- [x] 3.2 Run `node --check` on touched backend `.mjs` files.
- [x] 3.3 Archive the completed OpenSpec change.
