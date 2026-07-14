## 1. Spec and Contract

- [x] 1.1 Extend `review-agent-orchestration` with agent-service delegated review generation requirements.
- [x] 1.2 Extend `llm-agent-adapter` with a backend-facing agent service request/response schema.
- [x] 1.3 Extend `backend-connectivity` with safe Python agent service readiness diagnostics.
- [x] 1.4 Extend `local-development-runtime` with local fallback behavior when no agent service is configured.
- [x] 1.5 Extend `review-streaming-api` with source-aware safe run events while preserving existing replay behavior.

## 2. Backend Agent Service Adapter

- [x] 2.1 Add an agent service config loader for base URL, timeout, and enabled/configured status.
- [x] 2.2 Add a health/readiness helper that returns safe diagnostics only.
- [x] 2.3 Add a review-generation invocation adapter with bounded request payload construction.
- [x] 2.4 Validate agent service responses before they are persisted or streamed.
- [x] 2.5 Add local fallback execution behind the same adapter result contract.

## 3. Worker Integration

- [x] 3.1 Update the local worker execution path to call the agent service adapter.
- [x] 3.2 Preserve queue job claim, heartbeat, retry, dead-letter, and idempotent terminal-run behavior.
- [x] 3.3 Map adapter stage events into the existing persisted run event model.
- [x] 3.4 Persist adapter source, status, completion time, and safe diagnostics in run completion summaries.

## 4. Connectivity and Diagnostics

- [x] 4.1 Add agent service readiness to `/api/health` or the existing backend connectivity endpoint.
- [x] 4.2 Update frontend backend connectivity types to consume the new safe summary.
- [x] 4.3 Surface agent service readiness in the existing connectivity panel without making it a user workflow dependency.
- [x] 4.4 Ensure diagnostics never expose base URLs, tokens, prompts, raw OCR text, private object URLs, or raw provider traces.

## 5. Compatibility and Verification

- [x] 5.1 Verify behavior when no agent service is configured: local fallback still completes or degrades runs.
- [x] 5.2 Verify behavior when a configured service is unavailable or times out: safe fallback diagnostics are persisted.
- [x] 5.3 Verify behavior when a service response is invalid: unsafe payload is rejected and local fallback is used.
- [x] 5.4 Run `npm run typecheck`.
- [x] 5.5 Run `node --check` on changed backend `.mjs` files.

## 6. Documentation and Archive

- [x] 6.1 Update `docs/architecture-evolution-decisions.md` with the agent service bridge decision.
- [x] 6.2 Sync accepted requirements into main specs after implementation.
- [x] 6.3 Archive this OpenSpec change after implementation and verification.
