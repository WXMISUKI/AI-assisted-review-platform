import { existsSync, readFileSync } from "node:fs";
import { config } from "./config.mjs";
import {
  buildProviderHealthSummary,
  normalizePositiveInteger,
  normalizeProviderStatus,
  normalizeProviderString,
  sanitizeProviderValue,
} from "./providerContracts.mjs";

function parseScalar(value) {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) {
    return "";
  }
  if (trimmed === "true") {
    return true;
  }
  if (trimmed === "false") {
    return false;
  }
  if (trimmed === "[]") {
    return [];
  }
  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed);
  }
  return trimmed.replace(/^["']|["']$/g, "");
}

function parseKeyValue(line) {
  const index = line.indexOf(":");
  if (index < 0) {
    return null;
  }
  return {
    key: line.slice(0, index).trim(),
    value: parseScalar(line.slice(index + 1)),
  };
}

export function parseAiGatewayRoutingYaml(content = "") {
  const result = {
    version: 0,
    maxkb: {},
    apps: [],
  };
  let section = "";
  let app = null;
  let appSection = "";
  let appIndent = 0;

  for (const rawLine of String(content).split(/\r?\n/)) {
    const withoutComment = rawLine.replace(/\s+#.*$/, "");
    if (!withoutComment.trim()) {
      continue;
    }

    const indent = withoutComment.match(/^\s*/)?.[0].length ?? 0;
    const line = withoutComment.trim();

    if (indent === 0 && line === "maxkb:") {
      section = "maxkb";
      appSection = "";
      continue;
    }
    if (indent === 0 && line === "apps:") {
      section = "apps";
      appSection = "";
      continue;
    }

    if (section === "apps" && app && indent >= 4 && line.startsWith("-")) {
      if (appSection === "allow_callers") {
        app.allow_callers = [...(Array.isArray(app.allow_callers) ? app.allow_callers : []), parseScalar(line.slice(1))];
      }
      continue;
    }

    if (section === "apps" && line.startsWith("- ")) {
      app = {};
      result.apps.push(app);
      appSection = "";
      appIndent = indent;
      const kv = parseKeyValue(line.slice(2));
      if (kv) {
        app[kv.key] = kv.value;
      }
      continue;
    }

    const kv = parseKeyValue(line);
    if (!kv) {
      continue;
    }

    if (indent === 0) {
      result[kv.key] = kv.value;
      continue;
    }

    if (section === "maxkb" && indent >= 2) {
      result.maxkb[kv.key] = kv.value;
      continue;
    }

    if (section === "apps" && app) {
      if (indent === appIndent + 2 && kv.value === "") {
        appSection = kv.key;
        app[appSection] = appSection === "allow_callers" ? [] : {};
        continue;
      }

      if (indent === appIndent + 2) {
        app[kv.key] = kv.value;
        appSection = "";
        continue;
      }

      if (indent > appIndent + 2 && appSection) {
        if (Array.isArray(app[appSection])) {
          continue;
        }
        app[appSection][kv.key] = kv.value;
      }
    }
  }

  return result;
}

function normalizeGatewayApp(app = {}, index = 0) {
  const appCode = normalizeProviderString(app.app_code ?? app.appCode, "", 120);
  const workspaceId = normalizeProviderString(app.workspace_id ?? app.workspaceId, "", 120);
  const routePolicy = app.route_policy && typeof app.route_policy === "object" ? app.route_policy : {};
  const protocols = app.protocols && typeof app.protocols === "object" ? app.protocols : {};
  const rateLimit = app.rate_limit && typeof app.rate_limit === "object" ? app.rate_limit : {};
  const allowCallers = Array.isArray(app.allow_callers)
    ? app.allow_callers.map((item) => normalizeProviderString(item, "", 120)).filter(Boolean).slice(0, 50)
    : [];
  const hasMaxkbApplicationId = Boolean(normalizeProviderString(app.maxkb_application_id ?? app.maxkbApplicationId, "", 180));
  const hasMaxkbApiKey = Boolean(normalizeProviderString(app.maxkb_api_key ?? app.maxkbApiKey, "", 240));
  const openai = protocols.openai === true;
  const mcp = protocols.mcp === true;
  const routeEnabled = routePolicy.enabled === true;
  const rps = normalizePositiveInteger(rateLimit.rps, 0, 100_000);
  const burst = normalizePositiveInteger(rateLimit.burst, 0, 100_000);
  const missingFields = [
    !appCode ? "app_code" : "",
    !workspaceId ? "workspace_id" : "",
    !hasMaxkbApplicationId ? "maxkb_application_id" : "",
    !hasMaxkbApiKey ? "maxkb_api_key" : "",
    !openai && !mcp ? "protocols.openai_or_mcp" : "",
    !routeEnabled ? "route_policy.enabled" : "",
    !rps ? "rate_limit.rps" : "",
    !burst ? "rate_limit.burst" : "",
  ].filter(Boolean);
  const ready = missingFields.length === 0;

  return sanitizeProviderValue({
    id: appCode || `app-${index + 1}`,
    appCode: appCode || null,
    workspaceId: workspaceId || null,
    ready,
    status: normalizeProviderStatus(ready ? "ready" : "degraded", "degraded"),
    hasMaxkbApplicationId,
    hasMaxkbApiKey,
    protocols: {
      openai,
      mcp,
    },
    routeEnabled,
    rateLimitConfigured: Boolean(rps && burst),
    rateLimit: rps && burst ? { rps, burst } : undefined,
    allowCallers,
    missingFields,
  });
}

export function normalizeAiGatewayRoutingConfig(rawConfig = {}, options = {}) {
  const apps = Array.isArray(rawConfig.apps) ? rawConfig.apps.map(normalizeGatewayApp) : [];
  const configured = Boolean(options.configured ?? apps.length > 0);
  const readyApps = apps.filter((item) => item.ready);
  const ready = configured && apps.length > 0 && readyApps.length === apps.length;
  const maxkb = rawConfig.maxkb && typeof rawConfig.maxkb === "object" ? rawConfig.maxkb : {};

  return buildProviderHealthSummary({
    provider: "ai-gateway",
    configured,
    ready,
    status: configured ? (ready ? "ready" : "degraded") : "disabled",
    source: normalizeProviderString(options.source, configured ? "routing-config" : "local-fallback", 120),
    summary: configured
      ? ready
        ? "AI gateway routing config satisfies the MaxKB M0 app routing contract."
        : "AI gateway routing config is present but some app routes are incomplete."
      : "AI gateway routing config is not configured.",
    diagnostics: apps
      .filter((item) => !item.ready)
      .slice(0, 5)
      .map((item) => ({
        appCode: item.appCode,
        status: item.status,
        missingFields: item.missingFields,
      })),
    metadata: {
      version: normalizePositiveInteger(rawConfig.version, 0, 1000) || undefined,
      routingDataId: normalizeProviderString(options.routingDataId, config.aiGateway.routingDataId, 180),
      routingGroup: normalizeProviderString(options.routingGroup, config.aiGateway.routingGroup, 120),
      hasMaxkbBaseUrl: Boolean(normalizeProviderString(maxkb.base_url ?? maxkb.baseURL, "", 300)),
      chatApiPrefix: normalizeProviderString(maxkb.chat_api_prefix ?? maxkb.chatApiPrefix, "/chat/api", 120),
      appCount: apps.length,
      readyAppCount: readyApps.length,
      apps,
    },
  });
}

export function getAiGatewayRoutingReadiness(options = {}) {
  const routingConfigPath = normalizeProviderString(
    options.routingConfigPath ?? config.aiGateway.routingConfigPath,
    "",
    500,
  );

  if (!routingConfigPath) {
    return normalizeAiGatewayRoutingConfig({}, {
      configured: false,
      source: "local-fallback",
      routingDataId: config.aiGateway.routingDataId,
      routingGroup: config.aiGateway.routingGroup,
    });
  }

  if (!existsSync(routingConfigPath)) {
    return buildProviderHealthSummary({
      provider: "ai-gateway",
      configured: true,
      ready: false,
      status: "degraded",
      source: "local-fallback",
      summary: "AI gateway routing config path is set but the file does not exist.",
      diagnostics: [{ status: "missing_file", message: "Routing config file not found." }],
      metadata: {
        routingConfigPath: true,
        routingDataId: config.aiGateway.routingDataId,
        routingGroup: config.aiGateway.routingGroup,
      },
    });
  }

  try {
    const rawConfig = parseAiGatewayRoutingYaml(readFileSync(routingConfigPath, "utf8"));
    return normalizeAiGatewayRoutingConfig(rawConfig, {
      configured: true,
      source: "routing-config",
      routingDataId: config.aiGateway.routingDataId,
      routingGroup: config.aiGateway.routingGroup,
    });
  } catch (error) {
    return buildProviderHealthSummary({
      provider: "ai-gateway",
      configured: true,
      ready: false,
      status: "degraded",
      source: "local-fallback",
      summary: "AI gateway routing config could not be parsed.",
      diagnostics: [
        {
          status: "parse_failed",
          message: error instanceof Error ? error.message : "Failed to parse routing config.",
        },
      ],
      metadata: {
        routingConfigPath: true,
        routingDataId: config.aiGateway.routingDataId,
        routingGroup: config.aiGateway.routingGroup,
      },
    });
  }
}
