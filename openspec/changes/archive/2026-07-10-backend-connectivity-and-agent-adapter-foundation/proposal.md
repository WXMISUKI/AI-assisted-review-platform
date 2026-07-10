## Why

The front-end MVP now has a review task/session state boundary, but all AI review, OCR parsing, and streaming progress are still mock-only. Before implementing full document review intelligence, the platform needs a small backend connectivity foundation that proves LLM access, OCR job access, SSE streaming, and adapter contracts without committing secrets or building the full production workflow.

## What Changes

- Add a lightweight Node backend BFF for local development.
- Add environment-based configuration for OpenAI-compatible NewAPI and PaddleOCR credentials.
- Add an OpenAI SDK client adapter with non-streaming and streaming connectivity checks.
- Add a PaddleOCR-VL HTTP client wrapper for job submit, status polling, and result URL handling.
- Add a review agent adapter that emits review-task style events the front end can consume later.
- Add front-end data-assets connectivity checks for LLM, OCR configuration, and streaming readiness.
- Keep the scope foundation-only: no real file storage, production auth, database, knowledge-base retrieval, or full review replacement.

## Capabilities

### New Capabilities
- `backend-connectivity`: Defines local backend BFF, environment configuration, health checks, and safe secret handling.
- `llm-agent-adapter`: Defines OpenAI-compatible LLM client and review-agent connectivity/streaming contracts.
- `ocr-document-extraction`: Defines PaddleOCR-VL job submission and polling wrapper contracts.
- `review-streaming-api`: Defines backend streaming event API shape for future replacement of front-end mock streaming.

### Modified Capabilities
- `agent-asset-management`: Data assets page SHALL expose backend connectivity status for configured agent resources.
- `review-session-state`: Review task/session state SHALL have a backend event contract that can later replace mock repository updates.
- `streaming-review-workbench`: Streaming review events SHALL be compatible with backend SSE event payloads.

## Impact

- Affected code: `package.json`, `vite.config.ts`, new `server/*` files, `src/App.tsx`, and CSS for the connectivity panel.
- New dependency: official `openai` SDK.
- No real API keys or tokens will be committed. `.env.example` will document required variables only.
- Browser-facing code must never receive raw API keys or OCR tokens.
