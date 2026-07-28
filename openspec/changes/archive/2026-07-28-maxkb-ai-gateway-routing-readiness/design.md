## Overview

This change adds a small platform-side readiness layer for the new MaxKB gateway contract. It does not implement a production Nacos client or a standalone AI Gateway service. Instead, the Node BFF can read a local YAML export of `ai-gateway-app-routing.yaml` or compatible environment values and report whether the deployment is ready to be routed by the enterprise gateway.

## Current Gap

The current platform has `MAXKB_*` configuration for a knowledge-base provider/proxy. That is useful for opening-condition retrieval support, but it is not the same as the new MaxKB gateway contract:

- Current: platform runtime calls a configured MaxKB provider/proxy through `MAXKB_BASE_URL` and `MAXKB_API_KEY`.
- Required by MaxKB M0: external callers address `/ai/apps/{app_code}/...`; the gateway resolves `app_code` to MaxKB `application_id` and injects `ApplicationApiKey`.

Therefore, the highest-value first slice is readiness and contract normalization, not another local UI fix and not a premature Nacos client.

## Design

Add a server-side module that:

1. Loads routing config from `AI_GATEWAY_ROUTING_CONFIG_PATH` when present.
2. Parses the limited YAML structure used by the MaxKB spec without introducing a new dependency.
3. Normalizes entries into safe diagnostics:
   - `appCode`
   - `workspaceId`
   - `hasMaxkbApplicationId`
   - `hasMaxkbApiKey`
   - `protocols.openai`
   - `protocols.mcp`
   - `routeEnabled`
   - `rateLimitConfigured`
   - `allowCallers`
4. Redacts the actual `maxkb_api_key`, authorization headers, raw prompts, and private traces.
5. Exposes the summary through `/api/health` and a dedicated read-only endpoint.

## Boundaries

- Do not add a browser-facing MaxKB token or MaxKB application id.
- Do not route frontend traffic directly to MaxKB.
- Do not make MaxKB the owner of opening-condition tasks, check items, human review decisions, or report assets.
- Do not add a Nacos SDK dependency in this slice. A later gateway/runtime service can own live Nacos subscription.

## Verification

- Add focused Node tests for YAML normalization, safe redaction, and degraded cases.
- Run OpenSpec validation for this change.
- Run the focused provider-contract smoke test.
