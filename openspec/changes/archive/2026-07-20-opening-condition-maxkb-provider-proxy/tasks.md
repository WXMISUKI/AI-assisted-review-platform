## 1. Specification

- [x] 1.1 Create proposal, design, and delta specs for MaxKB Provider Proxy integration.
- [x] 1.2 Document the proxy boundary, required env vars, and credential ownership.

## 2. Implementation

- [x] 2.1 Add `MAXKB_STATUS_PATH` to backend config and safe provider status.
- [x] 2.2 Update MaxKB readiness to prefer proxy status and normalize proxy health/status payloads safely.
- [x] 2.3 Configure local `.env` with the provided Worker/Proxy endpoint and paths.

## 3. Verification and Archive

- [x] 3.1 Add focused tests for MaxKB proxy readiness normalization and secret redaction.
- [x] 3.2 Run lightweight syntax/type/provider checks.
- [x] 3.3 Archive the OpenSpec change after validation.
