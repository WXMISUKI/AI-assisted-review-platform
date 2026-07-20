const unsafeKeyPattern =
  /(api[_-]?key|token|secret|password|authorization|credential|prompt|rawtrace|raw_trace|providertrace|provider_trace|presigned|privateurl|private_url|fileurl|file_url|rawtext|raw_text|fulltext|full_text|cookie|session|headers?)/i;

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function normalizeProviderString(value, fallback = "", maxLength = 160) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maxLength) : fallback;
}

export function normalizePositiveInteger(value, fallback = 0, max = Number.MAX_SAFE_INTEGER) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    return fallback;
  }

  return Math.min(Math.floor(numberValue), max);
}

export function normalizeProviderStatus(value, fallback = "degraded") {
  return ["ready", "degraded", "failed", "disabled", "unconfigured", "provisional", "blocked"].includes(value)
    ? value
    : fallback;
}

export function sanitizeProviderValue(value, maxStringLength = 2000) {
  if (typeof value === "string") {
    return value.slice(0, maxStringLength);
  }

  if (Array.isArray(value)) {
    return value.slice(0, 100).map((item) => sanitizeProviderValue(item, maxStringLength));
  }

  if (!isPlainObject(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !unsafeKeyPattern.test(key))
      .map(([key, nestedValue]) => [key, sanitizeProviderValue(nestedValue, maxStringLength)]),
  );
}

export function buildProviderHealthSummary({
  provider,
  configured,
  ready,
  status,
  source,
  summary,
  diagnostics = [],
  metadata = {},
}) {
  return sanitizeProviderValue({
    provider: normalizeProviderString(provider, "provider", 80),
    configured: Boolean(configured),
    ready: Boolean(ready),
    status: normalizeProviderStatus(status, ready ? "ready" : configured ? "degraded" : "disabled"),
    source: normalizeProviderString(source, configured ? "remote" : "local-fallback", 120),
    summary: normalizeProviderString(summary, configured ? "Provider readiness check completed." : "Provider is not configured.", 500),
    diagnostics: Array.isArray(diagnostics) ? diagnostics.slice(0, 5).map((item) => sanitizeProviderValue(item)) : [],
    metadata: sanitizeProviderValue(metadata),
  });
}

export function normalizeProviderRef(value, fallbackProvider = "ragflow") {
  if (!isPlainObject(value)) {
    return null;
  }

  const provider = normalizeProviderString(value.provider, fallbackProvider, 80);
  const id = normalizeProviderString(
    value.id ?? value.providerDatasetId ?? value.datasetId ?? value.knowledgeId,
    "",
    180,
  );
  if (!provider || !id) {
    return null;
  }

  const knowledgeId = normalizeProviderString(value.knowledgeId, "", 180) || undefined;
  return sanitizeProviderValue({
    provider,
    id,
    datasetId: normalizeProviderString(value.datasetId, id, 180),
    knowledgeId,
    documentId: normalizeProviderString(value.documentId, "", 180) || undefined,
    chunkId: normalizeProviderString(value.chunkId, "", 180) || undefined,
    syncStatus: ["ready", "provisional", "stale", "unreachable", "disabled"].includes(value.syncStatus)
      ? value.syncStatus
      : "provisional",
    summary: normalizeProviderString(value.summary, "", 500) || undefined,
    lastSyncedAt: normalizeProviderString(value.lastSyncedAt, "", 80) || undefined,
  });
}

export function normalizeProviderRefs(value, fallbackProvider = "ragflow") {
  return Array.isArray(value)
    ? value.map((item) => normalizeProviderRef(item, fallbackProvider)).filter(Boolean)
    : [];
}

export function normalizeRetrievalHit(value, fallbackProvider = "ragflow") {
  if (!isPlainObject(value)) {
    return null;
  }

  const provider = normalizeProviderString(value.provider, fallbackProvider, 80);
  const providerDatasetId = normalizeProviderString(
    value.providerDatasetId ?? value.datasetId ?? value.knowledgeId,
    "",
    180,
  );
  const title = normalizeProviderString(value.title, "", 240);
  const safeSnippet = normalizeProviderString(value.safeSnippet ?? value.snippet, "", 1000);
  if (!provider || !providerDatasetId || !title || !safeSnippet) {
    return null;
  }

  return sanitizeProviderValue({
    provider,
    providerDatasetId,
    knowledgeId: normalizeProviderString(value.knowledgeId, "", 180) || undefined,
    providerDocumentId: normalizeProviderString(value.providerDocumentId ?? value.documentId, "", 180) || undefined,
    providerChunkId: normalizeProviderString(value.providerChunkId ?? value.chunkId, "", 180) || undefined,
    score: Number.isFinite(Number(value.score)) ? Number(value.score) : undefined,
    title,
    safeSnippet,
    locator: normalizeProviderString(value.locator, "", 240) || undefined,
    sourceObjectId: normalizeProviderString(value.sourceObjectId, "", 180) || undefined,
    masterDataIds: Array.isArray(value.masterDataIds)
      ? value.masterDataIds.map((item) => normalizeProviderString(item, "", 180)).filter(Boolean).slice(0, 50)
      : [],
    evidenceIds: Array.isArray(value.evidenceIds)
      ? value.evidenceIds.map((item) => normalizeProviderString(item, "", 180)).filter(Boolean).slice(0, 50)
      : [],
  });
}

export function normalizeRetrievalHits(value, fallbackProvider = "ragflow") {
  return Array.isArray(value)
    ? value.map((item) => normalizeRetrievalHit(item, fallbackProvider)).filter(Boolean)
    : [];
}
