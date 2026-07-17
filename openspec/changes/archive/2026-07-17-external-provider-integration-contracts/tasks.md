## 1. Provider Contract Foundation

- [x] 1.1 Add shared provider health/readiness types for configured, ready, status, source, summary, and safe diagnostics.
- [x] 1.2 Extend server configuration loading with optional RAG provider settings without exposing raw environment values.
- [x] 1.3 Add safe diagnostic sanitization coverage for provider auth headers, prompts, raw text, private URLs, and provider traces.

## 2. RAG / Knowledge-Base Adapter

- [x] 2.1 Create a provider-neutral knowledge-base adapter interface for dataset refs, document refs, chunk refs, ingestion status, and retrieval hits.
- [x] 2.2 Implement a local/mock RAG provider that satisfies the interface for development and tests.
- [x] 2.3 Add a RAGFlow adapter behind `RAG_PROVIDER=ragflow` and `RAGFLOW_ENABLED=true`, using server-side API key configuration only.
- [x] 2.4 Normalize RAGFlow dataset/document/chunk identifiers into platform provider refs without treating provider metadata as formal facts.

## 3. Opening-Condition Knowledge-Base Binding

- [x] 3.1 Extend subcontract-team knowledge-base records with optional external provider refs and safe sync status.
- [x] 3.2 Update preflight readiness derivation to distinguish ready, provisional, blocked, stale, and unreachable external knowledge-base support.
- [x] 3.3 Use retrieval hits only as supporting recall for material review explanations and human-review evidence summaries.

## 4. Backend Connectivity And Operations

- [x] 4.1 Add RAG provider readiness to backend health/connectivity summaries.
- [x] 4.2 Add optional agent-worker provider readiness summary using the same provider envelope.
- [x] 4.3 Document required environment variables and disabled/degraded behavior for RAGFlow and future worker providers.

## 5. Verification

- [x] 5.1 Add focused tests for provider config normalization and safe diagnostic redaction.
- [x] 5.2 Add focused tests for mock RAG retrieval hit normalization and conflict handling.
- [x] 5.3 Run targeted validation: backend tests for changed modules, `node --check` for changed `.mjs`, and `npm run typecheck`.
