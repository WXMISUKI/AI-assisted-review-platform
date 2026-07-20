import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { normalizePositiveInteger, normalizeProviderStatus, normalizeProviderString } from "./providerContracts.mjs";

function loadDotEnv() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split("=");
    if (!key || process.env[key] != null) {
      continue;
    }

    process.env[key] = valueParts.join("=").replace(/^["']|["']$/g, "");
  }
}

loadDotEnv();

function normalizeOpenAIBaseURL(value) {
  const trimmedValue = value.trim().replace(/\/$/, "");
  if (!trimmedValue) {
    return "";
  }

  return /\/v\d+$/.test(trimmedValue) ? trimmedValue : `${trimmedValue}/v1`;
}

function normalizeBaseURL(value) {
  return typeof value === "string" ? value.trim().replace(/\/$/, "") : "";
}

function normalizeKnowledgeProvider(value) {
  const normalized = normalizeProviderString(value, "", 40).toLowerCase();
  return ["mock", "ragflow", "maxkb"].includes(normalized) ? normalized : "";
}

const selectedKnowledgeProvider =
  normalizeKnowledgeProvider(process.env.KNOWLEDGE_PROVIDER || "") ||
  (process.env.MAXKB_ENABLED === "true" ? "maxkb" : process.env.RAGFLOW_ENABLED === "true" ? "ragflow" : "mock");

export const config = {
  port: Number(process.env.BACKEND_PORT || 8787),
  openai: {
    apiKey: process.env.OPENAI_API_KEY || "",
    baseURL: normalizeOpenAIBaseURL(process.env.OPENAI_BASE_URL || ""),
    model: (process.env.OPENAI_MODEL || "").trim(),
  },
  paddleocr: {
    token: process.env.PADDLEOCR_TOKEN || "",
    jobUrl: process.env.PADDLEOCR_JOB_URL || "https://paddleocr.aistudio-app.com/api/v2/ocr/jobs",
    model: (process.env.PADDLEOCR_MODEL || "PaddleOCR-VL-1.6").trim(),
  },
  minio: {
    endpoint: normalizeBaseURL(process.env.MINIO_ENDPOINT || ""),
    publicEndpoint: normalizeBaseURL(process.env.MINIO_PUBLIC_ENDPOINT || ""),
    accessKey: process.env.MINIO_ACCESS_KEY || "",
    secretKey: process.env.MINIO_SECRET_KEY || "",
    bucket: process.env.MINIO_BUCKET || "construction-review-docs",
    region: process.env.MINIO_REGION || "us-east-1",
  },
  ragflow: {
    enabled: process.env.RAGFLOW_ENABLED === "true",
    baseURL: normalizeBaseURL(process.env.RAGFLOW_BASE_URL || ""),
    apiKey: process.env.RAGFLOW_API_KEY || "",
    defaultDatasetId: normalizeProviderString(process.env.RAGFLOW_DEFAULT_DATASET_ID || "", "", 180),
    healthPath: normalizeProviderString(process.env.RAGFLOW_HEALTH_PATH || "", "/api/v1/health", 180),
    datasetPath: normalizeProviderString(process.env.RAGFLOW_DATASET_PATH || "", "/api/v1/datasets", 180),
    documentPath: normalizeProviderString(
      process.env.RAGFLOW_DOCUMENT_PATH || "",
      "/api/v1/datasets/:datasetId/documents",
      220,
    ),
    chunkPath: normalizeProviderString(
      process.env.RAGFLOW_CHUNK_PATH || "",
      "/api/v1/documents/:documentId/chunks",
      220,
    ),
    retrievalPath: normalizeProviderString(process.env.RAGFLOW_RETRIEVAL_PATH || "", "/api/v1/retrieval", 180),
    timeoutMs: normalizePositiveInteger(process.env.RAGFLOW_TIMEOUT_MS, 5000, 60_000),
  },
  maxkb: {
    enabled: process.env.MAXKB_ENABLED === "true" || selectedKnowledgeProvider === "maxkb",
    baseURL: normalizeBaseURL(process.env.MAXKB_BASE_URL || ""),
    apiKey: process.env.MAXKB_API_KEY || "",
    username: process.env.MAXKB_USERNAME || "",
    password: process.env.MAXKB_PASSWORD || "",
    defaultKnowledgeId: normalizeProviderString(process.env.MAXKB_DEFAULT_KNOWLEDGE_ID || "", "", 180),
    healthPath: normalizeProviderString(process.env.MAXKB_HEALTH_PATH || "", "/api/health", 180),
    knowledgePath: normalizeProviderString(process.env.MAXKB_KNOWLEDGE_PATH || "", "/api/knowledge", 180),
    documentPath: normalizeProviderString(
      process.env.MAXKB_DOCUMENT_PATH || "",
      "/api/knowledge/:knowledgeId/document",
      220,
    ),
    retrievalPath: normalizeProviderString(process.env.MAXKB_RETRIEVAL_PATH || "", "/api/knowledge/:knowledgeId/search", 220),
    timeoutMs: normalizePositiveInteger(process.env.MAXKB_TIMEOUT_MS, 5000, 60_000),
  },
  knowledgeProvider: selectedKnowledgeProvider,
  agentService: {
    baseURL: normalizeBaseURL(process.env.AGENT_SERVICE_BASE_URL || ""),
    timeoutMs: normalizePositiveInteger(process.env.AGENT_SERVICE_TIMEOUT_MS, 5000, 60_000),
  },
};

export function getSafeProviderStatus() {
  const openaiConfigured = Boolean(config.openai.apiKey && config.openai.model);
  const paddleConfigured = Boolean(config.paddleocr.token && config.paddleocr.jobUrl && config.paddleocr.model);
  const minioConfigured = Boolean(
    config.minio.endpoint && config.minio.accessKey && config.minio.secretKey && config.minio.bucket,
  );
  const ragflowConfigured = Boolean(config.ragflow.enabled && config.ragflow.baseURL && config.ragflow.apiKey);
  const maxkbConfigured = Boolean(
    config.maxkb.enabled && config.maxkb.baseURL && (config.maxkb.apiKey || (config.maxkb.username && config.maxkb.password)),
  );
  const knowledgeProviderConfigured =
    config.knowledgeProvider === "maxkb"
      ? maxkbConfigured
      : config.knowledgeProvider === "ragflow"
        ? ragflowConfigured
        : false;
  const readyCount = [openaiConfigured, paddleConfigured, minioConfigured].filter(Boolean).length;

  return {
    openai: {
      configured: openaiConfigured,
      hasBaseURL: Boolean(config.openai.baseURL),
      model: config.openai.model || null,
    },
    paddleocr: {
      configured: paddleConfigured,
      hasToken: Boolean(config.paddleocr.token),
      jobUrl: config.paddleocr.jobUrl,
      model: config.paddleocr.model,
    },
    minio: {
      configured: minioConfigured,
      hasEndpoint: Boolean(config.minio.endpoint),
      hasPublicEndpoint: Boolean(config.minio.publicEndpoint),
      hasAccessKey: Boolean(config.minio.accessKey),
      hasSecretKey: Boolean(config.minio.secretKey),
      bucket: config.minio.bucket || null,
      region: config.minio.region,
    },
    ragflow: {
      configured: ragflowConfigured,
      enabled: config.ragflow.enabled,
      hasBaseURL: Boolean(config.ragflow.baseURL),
      hasApiKey: Boolean(config.ragflow.apiKey),
      defaultDatasetId: config.ragflow.defaultDatasetId || null,
      healthPath: config.ragflow.healthPath,
      retrievalPath: config.ragflow.retrievalPath,
      status: normalizeProviderStatus(
        ragflowConfigured ? "ready" : config.ragflow.enabled ? "degraded" : "disabled",
        "disabled",
      ),
      summary: ragflowConfigured
        ? "RAGFlow provider is configured for retrieval support."
        : config.ragflow.enabled
          ? "RAGFlow provider is enabled but not fully configured."
          : "RAGFlow provider is disabled.",
    },
    maxkb: {
      configured: maxkbConfigured,
      enabled: config.maxkb.enabled,
      selected: config.knowledgeProvider === "maxkb",
      hasBaseURL: Boolean(config.maxkb.baseURL),
      hasApiKey: Boolean(config.maxkb.apiKey),
      hasUsername: Boolean(config.maxkb.username),
      hasPassword: Boolean(config.maxkb.password),
      defaultKnowledgeId: config.maxkb.defaultKnowledgeId || null,
      healthPath: config.maxkb.healthPath,
      retrievalPath: config.maxkb.retrievalPath,
      status: normalizeProviderStatus(
        maxkbConfigured ? "ready" : config.maxkb.enabled ? "degraded" : "disabled",
        "disabled",
      ),
      summary: maxkbConfigured
        ? "MaxKB provider is configured for project-level knowledge retrieval support."
        : config.maxkb.enabled
          ? "MaxKB provider is enabled but not fully configured."
          : "MaxKB provider is disabled.",
    },
    knowledgeProvider: {
      selected: config.knowledgeProvider,
      configured: knowledgeProviderConfigured,
      status: normalizeProviderStatus(
        config.knowledgeProvider === "mock" ? "disabled" : knowledgeProviderConfigured ? "ready" : "degraded",
        "disabled",
      ),
      summary:
        config.knowledgeProvider === "maxkb"
          ? "MaxKB is selected as the knowledge-base provider."
          : config.knowledgeProvider === "ragflow"
            ? "RAGFlow is selected as the knowledge-base provider."
            : "Mock knowledge-base provider is selected for local development.",
    },
    agentService: {
      configured: Boolean(config.agentService.baseURL),
      timeoutMs: config.agentService.timeoutMs,
    },
    summary: {
      total: 3,
      ready: readyCount,
      overall: readyCount === 3 ? "ready" : readyCount > 0 ? "degraded" : "unconfigured",
      optional: {
        total: 2,
        ready: [ragflowConfigured, maxkbConfigured].filter(Boolean).length,
      },
    },
  };
}
