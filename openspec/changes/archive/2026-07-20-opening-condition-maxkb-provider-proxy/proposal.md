## Why

MaxKB knowledge retrieval has now been exposed through the external OCR Worker / MaxKB Provider Proxy. The platform should integrate that proxy boundary instead of connecting directly to a MaxKB container or storing MaxKB administrator credentials.

This keeps the opening-condition platform focused on project facts, review state, evidence records, human decisions, and reports, while the Worker/Proxy owns MaxKB login, safe retrieval forwarding, and provider-specific credential handling.

## What Changes

- Configure the platform-side MaxKB provider to call the Worker/Proxy with `MAXKB_BASE_URL`, `MAXKB_API_KEY`, `MAXKB_STATUS_PATH`, and `MAXKB_RETRIEVAL_PATH`.
- Treat `MAXKB_API_KEY` as the platform's server-side Bearer token for the Worker/Proxy, not as a browser-visible credential.
- Prefer the proxy provider status endpoint for readiness and normalize both direct status payloads and nested `/api/health.providers.maxkb` payloads.
- Document that `MAXKB_USERNAME` and `MAXKB_PASSWORD` belong inside the Worker/Proxy environment only and are not required by this platform.
- Update local `.env` to the provided Worker/Proxy联调 endpoint.
- **BREAKING**: None. Existing mock/RAGFlow fallback and legacy MaxKB paths remain optional.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `external-provider-integration-contracts`: Clarify that MaxKB is consumed through a provider proxy, with server-side Bearer authentication and safe readiness normalization.
- `backend-connectivity`: Include MaxKB proxy status path and safe provider metadata in connectivity summaries.
- `opening-condition-preflight-knowledge-base`: Bind opening-condition knowledge support to a MaxKB proxy `knowledgeId` without making MaxKB the business fact source.

## Impact

- Affects `server/config.mjs`, `server/knowledgeBaseProvider.mjs`, provider contract tests, `.env`, and MaxKB integration docs.
- Does not implement full OCR ingestion, material package review, database migration, or browser-side MaxKB access.
