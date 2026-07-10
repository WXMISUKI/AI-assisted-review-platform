## Context

The current app is a Vite React front end with a mock review-session service. The next step is to validate external service connectivity while keeping the production workflow mock-backed. The company NewAPI endpoint is OpenAI-compatible and should be accessed through the official OpenAI SDK from the server side. PaddleOCR-VL exposes an asynchronous HTTP job API that can be wrapped as a server-side tool.

## Goals / Non-Goals

**Goals:**
- Create a minimal local backend BFF that can run alongside Vite.
- Keep secrets in environment variables and expose only safe status metadata to the browser.
- Provide `/api/health`, LLM connectivity, OCR configuration/connectivity, and SSE streaming test endpoints.
- Shape backend events so they can later map to `ReviewStreamingStage` and `ReviewIssue`.
- Add a data-assets connectivity panel for manual testing.

**Non-Goals:**
- Do not implement production login, authorization, database persistence, real file storage, vector knowledge retrieval, or final report generation.
- Do not upload real user documents through the front end in this change.
- Do not replace the existing mock review workflow yet.

## Decisions

### Decision 1: Node BFF with native HTTP server

Use a small Node ESM backend under `server/` rather than introducing Express/Fastify. Native HTTP is enough for health checks, JSON endpoints, and SSE, keeping dependency count low.

Alternative considered: Express. It is familiar but unnecessary for this foundation and adds dependency surface.

### Decision 2: Official OpenAI SDK on the server

Use the `openai` package server-side with `apiKey` and `baseURL` from environment variables. This supports OpenAI-compatible NewAPI while preventing keys from reaching browser code.

Alternative considered: direct fetch to NewAPI. That would reduce dependencies but would bypass the user's SDK requirement and make future OpenAI API updates less ergonomic.

### Decision 3: PaddleOCR as a tool adapter

Wrap PaddleOCR as `submitOcrJob`, `getOcrJobStatus`, and `getOcrJsonlResult` operations. The first implementation may expose configuration status and URL-mode submit shape without wiring front-end file uploads.

Alternative considered: Python worker. Better for heavy OCR processing later, but too large for the first connectivity foundation.

### Decision 4: SSE first, full workflow later

Add a streaming test endpoint that emits deterministic review events and optionally LLM token deltas. This validates frontend/backend streaming plumbing before replacing the review task workflow.

Alternative considered: immediately replace mock review processing. That would couple too many unknowns: OCR output quality, prompt schema, model stability, and UI state updates.

## Risks / Trade-offs

- [Risk] Internal NewAPI may not be reachable from the dev machine. -> Mitigation: endpoints return safe error summaries and status codes without crashing the app.
- [Risk] Real credentials could be accidentally committed. -> Mitigation: only `.env.example` is added and `.gitignore` covers `.env` variants.
- [Risk] OCR polling can be long-running. -> Mitigation: foundation exposes adapter functions and status checks; full polling workflow can be a later spec.
- [Risk] SSE connection lifecycle can be flaky. -> Mitigation: start with a deterministic streaming test endpoint.
