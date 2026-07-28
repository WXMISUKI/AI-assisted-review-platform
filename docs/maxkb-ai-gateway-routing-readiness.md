# MaxKB AI Gateway Routing Readiness

Updated: 2026-07-28

## Current Conclusion

The platform is partially ready for the new MaxKB gateway contract.

Ready parts:

- MaxKB is already treated as an external provider, not as the owner of review tasks.
- Provider diagnostics are server-side and redacted before frontend display.
- Opening-condition review keeps basis, master data, evidence, human review, check items, and report assets platform-owned.

Missing before enterprise rollout:

- The platform did not previously understand the new `app_code -> MaxKB application` gateway routing contract.
- There was no readiness summary for OpenAI-compatible and MCP route enablement.
- There was no safe way to check route policy, caller allow-list, and rate-limit policy from a Nacos routing export.

## M0 Platform Scope

This project now supports a local exported routing config path:

```env
AI_GATEWAY_ROUTING_CONFIG_PATH=C:\secure-config\ai-gateway-app-routing-dev.yaml
AI_GATEWAY_ROUTING_DATA_ID=ai-gateway-app-routing-dev.yaml
AI_GATEWAY_ROUTING_GROUP=AI_GATEWAY
```

The expected YAML shape follows MaxKB's gateway contract:

```yaml
version: 1
maxkb:
  base_url: "http://maxkb-web:8080"
  chat_api_prefix: "/chat/api"

apps:
  - app_code: "construction-plan-assistant"
    workspace_id: "construction"
    maxkb_application_id: "a18c9f22-xxxx"
    maxkb_api_key: "${enc:xxxx}"
    protocols:
      openai: true
      mcp: true
    route_policy:
      enabled: true
    rate_limit:
      rps: 10
      burst: 20
    allow_callers:
      - "construction-platform"
```

The backend exposes:

- `GET /api/ai-gateway/routing/status`
- `GET /api/health` under `aiGateway`

The response intentionally shows booleans such as `hasMaxkbApplicationId` and `hasMaxkbApiKey`, not the values themselves.

## Next Production Slice

The next most valuable production slice is the actual gateway runtime or gateway configuration deployment:

1. Put the routing YAML into Nacos under `AI_GATEWAY`.
2. Make the gateway, not business frontend code, expose:
   - `/ai/apps/{app_code}/openai/v1/chat/completions`
   - `/ai/apps/{app_code}/mcp`
3. Gateway injects `Authorization: Bearer {maxkb_api_key}` only on the internal MaxKB hop.
4. Gateway logs safe audit fields: request id, caller system, app code, workspace, protocol, status, latency, rate-limit hit, and upstream target.
5. Business platforms keep using platform-owned review records and only consume MaxKB output as normalized support evidence.
