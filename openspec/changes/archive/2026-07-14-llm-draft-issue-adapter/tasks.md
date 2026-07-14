## 1. Spec and Contract

- [x] 1.1 Define the LLM draft issue adapter contract in `llm-agent-adapter`.
- [x] 1.2 Extend `review-issue-model` with validated AI candidate requirements.
- [x] 1.3 Extend `review-session-state` with candidate issue merge and fallback persistence behavior.
- [x] 1.4 Extend `agent-review-kernel` with LLM semantic candidate validation expectations.

## 2. Backend Adapter

- [x] 2.1 Add a backend draft issue adapter module that accepts preparation package context and recovered paragraph excerpts.
- [x] 2.2 Add safe LLM JSON generation when the provider is configured.
- [x] 2.3 Add deterministic fallback behavior when LLM is unavailable or invalid.
- [x] 2.4 Wire `POST /api/review-agent/draft-issues` in the local BFF.

## 3. Frontend and Session Integration

- [x] 3.1 Add frontend client types and fetch helper for draft issue generation.
- [x] 3.2 Add a session service operation to merge generated AI candidates into a review task.
- [x] 3.3 Trigger candidate generation after a review-preparation package is persisted.
- [x] 3.4 Preserve existing deterministic draft issue behavior when backend generation is unavailable.

## 4. Verification

- [x] 4.1 Run `npm run typecheck`.
- [x] 4.2 Run `node --check` for changed backend `.mjs` files.
- [x] 4.3 Smoke test the fallback path without real LLM credentials.
- [x] 4.4 Archive the completed OpenSpec change.
