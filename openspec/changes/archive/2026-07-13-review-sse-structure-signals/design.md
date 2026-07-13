## Context

The project now has a deterministic recovered-structure pipeline:

1. OCR hydration produces structured sections and paragraphs.
2. Session state rebinding and draft issue generation already use that structure.
3. Loading views can display structure-derived summaries.

The backend SSE endpoint should not lag behind this contract. Even though it remains a deterministic test stream, it should reflect structure-aware review preparation when structure context is supplied.

## Decisions

### 1. Keep the stream deterministic

**Decision:** The SSE endpoint continues to emit a fixed sequence of stages, but the emitted stage summaries are derived from supplied structure metadata.
**Why:** This keeps the endpoint safe for testing and easy to reason about.

### 2. Accept richer structure context

**Decision:** The endpoint may accept section and paragraph summary metadata through query parameters and use those values in stage metadata.
**Why:** This keeps the stream aligned with the recovered-structure contract without requiring a backend document payload.

### 3. Preserve legacy consumers

**Decision:** If no structure metadata is supplied, the stream falls back to the existing connectivity sequence.
**Why:** Existing smoke tests and simple consumers must continue to work.

## Risks / Trade-offs

- [Risk] Stage summaries can become too verbose.
  [Mitigation] Keep summaries short and paragraph-centric.
- [Risk] A richer event contract could drift from the frontend type definition.
  [Mitigation] Update the frontend SSE event type in the same change.
- [Risk] The stream could feel like a real review pipeline without actually being one.
  [Mitigation] Keep the endpoint explicitly deterministic and connectivity-oriented in wording.
