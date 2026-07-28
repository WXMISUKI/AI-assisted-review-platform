## Why

MaxKB has introduced an enterprise gateway contract based on Nacos-managed `app_code` routing, OpenAI-compatible calls, MCP calls, caller isolation, rate-limit policy, and safe audit metadata. The current platform already supports MaxKB as a knowledge provider, but it does not yet expose a platform-level way to verify whether a deployment is ready for that new gateway contract.

## What Changes

- Add a platform-owned AI gateway routing readiness capability that can read a bounded local export of the Nacos routing YAML contract.
- Normalize `app_code -> MaxKB application` entries into safe readiness summaries without exposing MaxKB API keys, internal bearer headers, or raw prompts.
- Surface whether each configured app supports OpenAI-compatible and MCP routing, caller allow-list policy, and rate-limit policy.
- Keep existing opening-condition MaxKB knowledge-base usage as retrieval support only; do not move review task state, human decisions, or report assets into MaxKB.
- Document the remaining gap between this project and the MaxKB M0 gateway rollout.

## Capabilities

### New Capabilities
- `ai-gateway-routing-readiness`: Platform-safe validation and diagnostics for MaxKB AI gateway `app_code` routing configuration.

### Modified Capabilities
- `external-provider-integration-contracts`: Clarify that MaxKB gateway routing is the preferred enterprise-facing access boundary while provider outputs remain non-authoritative.

## Impact

- Backend config and provider diagnostics.
- Backend HTTP health/status API payloads.
- Provider contract tests.
- MaxKB/OpenAI/MCP gateway documentation under `docs/`.
- No new frontend direct provider calls.
- No MaxKB core-code changes.
