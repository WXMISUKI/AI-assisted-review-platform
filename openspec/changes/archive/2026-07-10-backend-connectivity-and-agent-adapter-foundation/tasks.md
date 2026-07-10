## 1. Backend Foundation

- [x] 1.1 Add `.env.example` and update ignore rules for local secret files.
- [x] 1.2 Add the official `openai` SDK dependency and backend npm scripts.
- [x] 1.3 Add a minimal Node backend with `/api/health` and safe config status.

## 2. Provider Adapters

- [x] 2.1 Add OpenAI-compatible LLM client with connectivity and streaming helpers.
- [x] 2.2 Add PaddleOCR-VL client wrapper for config status, URL job submit, and job status polling.
- [x] 2.3 Add deterministic review-agent SSE connectivity endpoint.

## 3. Frontend Connectivity Panel

- [x] 3.1 Add frontend API helpers for backend health, LLM check, OCR status, and stream test.
- [x] 3.2 Add a data-assets connectivity panel that displays safe provider readiness and test results.
- [x] 3.3 Keep existing mock review workflow unchanged.

## 4. Verification And Archive

- [x] 4.1 Run `npm run typecheck`.
- [x] 4.2 Run backend health/connectivity smoke tests without real secrets.
- [x] 4.3 Validate and archive the OpenSpec change.
