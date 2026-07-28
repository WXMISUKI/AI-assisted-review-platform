import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  getAiGatewayRoutingReadiness,
  normalizeAiGatewayRoutingConfig,
  parseAiGatewayRoutingYaml,
} from "./aiGatewayRouting.mjs";

const sampleRoutingYaml = `
version: 1
maxkb:
  base_url: "http://maxkb-web:8080"
  chat_api_prefix: "/chat/api"

apps:
  - app_code: "construction-plan-assistant"
    workspace_id: "construction"
    maxkb_application_id: "a18c9f22-xxxx"
    maxkb_api_key: "\${enc:secret}"
    protocols:
      openai: true
      mcp: true
    route_policy:
      enabled: true
      gray_tags: []
    rate_limit:
      rps: 10
      burst: 20
    allow_callers:
      - "construction-platform"
`;

test("parses MaxKB AI gateway routing YAML shape", () => {
  const parsed = parseAiGatewayRoutingYaml(sampleRoutingYaml);

  assert.equal(parsed.version, 1);
  assert.equal(parsed.maxkb.base_url, "http://maxkb-web:8080");
  assert.equal(parsed.apps.length, 1);
  assert.equal(parsed.apps[0].app_code, "construction-plan-assistant");
  assert.equal(parsed.apps[0].protocols.openai, true);
  assert.equal(parsed.apps[0].protocols.mcp, true);
  assert.deepEqual(parsed.apps[0].allow_callers, ["construction-platform"]);
});

test("normalizes routing readiness without leaking MaxKB secrets", () => {
  const readiness = normalizeAiGatewayRoutingConfig(parseAiGatewayRoutingYaml(sampleRoutingYaml), {
    configured: true,
    source: "routing-config",
  });

  assert.equal(readiness.provider, "ai-gateway");
  assert.equal(readiness.ready, true);
  assert.equal(readiness.metadata.appCount, 1);
  assert.equal(readiness.metadata.apps[0].appCode, "construction-plan-assistant");
  assert.equal(readiness.metadata.apps[0].hasMaxkbApplicationId, true);
  assert.equal(readiness.metadata.apps[0].hasMaxkbApiKey, true);
  assert.equal("maxkb_api_key" in readiness.metadata.apps[0], false);
  assert.equal(JSON.stringify(readiness).includes("${enc:secret}"), false);
});

test("reports degraded app routes with bounded missing-field diagnostics", () => {
  const readiness = normalizeAiGatewayRoutingConfig(
    {
      version: 1,
      maxkb: { base_url: "http://maxkb-web:8080", chat_api_prefix: "/chat/api" },
      apps: [
        {
          app_code: "opening-condition-assistant",
          workspace_id: "opening-condition",
          protocols: { openai: true, mcp: false },
          route_policy: { enabled: true },
          rate_limit: { rps: 10 },
          maxkb_api_key: "secret",
        },
      ],
    },
    { configured: true },
  );

  assert.equal(readiness.ready, false);
  assert.equal(readiness.status, "degraded");
  assert.deepEqual(readiness.metadata.apps[0].missingFields, ["maxkb_application_id", "rate_limit.burst"]);
  assert.deepEqual(readiness.diagnostics[0].missingFields, ["maxkb_application_id", "rate_limit.burst"]);
  assert.equal(JSON.stringify(readiness).includes("secret"), false);
});

test("reads local routing config export when configured by path", async () => {
  const directory = await mkdtemp(join(tmpdir(), "ai-gateway-routing-"));
  const configPath = join(directory, "ai-gateway-app-routing.yaml");

  try {
    await writeFile(configPath, sampleRoutingYaml, "utf8");
    const readiness = getAiGatewayRoutingReadiness({ routingConfigPath: configPath });

    assert.equal(readiness.ready, true);
    assert.equal(readiness.metadata.readyAppCount, 1);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
