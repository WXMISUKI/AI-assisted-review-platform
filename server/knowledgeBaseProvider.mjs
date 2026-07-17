import { config } from "./config.mjs";
import {
  buildProviderHealthSummary,
  normalizePositiveInteger,
  normalizeProviderRef,
  normalizeProviderRefs,
  normalizeProviderStatus,
  normalizeProviderString,
  normalizeRetrievalHit,
  normalizeRetrievalHits,
  sanitizeProviderValue,
} from "./providerContracts.mjs";

const MAX_DATASET_LABEL_LENGTH = 240;
const MAX_DOCUMENT_TITLE_LENGTH = 240;
const MAX_CHUNK_TEXT_LENGTH = 1200;

const mockStore = {
  datasets: new Map(),
};

function nowIsoString() {
  return new Date().toISOString();
}

function createMockDatasetId(prefix = "kb-dataset") {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function getConfig() {
  return config.ragflow;
}

function buildConfiguredSummary(providerName, ready, summary) {
  return buildProviderHealthSummary({
    provider: providerName,
    configured: true,
    ready,
    status: ready ? "ready" : "degraded",
    source: providerName,
    summary,
    metadata: {
      baseURL: Boolean(getConfig().baseURL),
      datasetId: Boolean(getConfig().defaultDatasetId),
      timeoutMs: getConfig().timeoutMs,
    },
  });
}

function buildNotConfiguredSummary(providerName, summary) {
  return buildProviderHealthSummary({
    provider: providerName,
    configured: false,
    ready: false,
    status: "disabled",
    source: "local-fallback",
    summary,
  });
}

async function fetchJsonWithTimeout(url, options = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => ({}));
    return { response, payload };
  } finally {
    clearTimeout(timer);
  }
}

export function createMockKnowledgeBaseProvider() {
  return {
    provider: "mock",
    async getReadiness() {
      return buildProviderHealthSummary({
        provider: "knowledge-base",
        configured: false,
        ready: false,
        status: "disabled",
        source: "local-fallback",
        summary: "Local knowledge-base mock provider is available for development.",
      });
    },
    async upsertDataset(input = {}) {
      const id = normalizeProviderString(input.id, createMockDatasetId(), 180);
      const dataset = sanitizeProviderValue({
        provider: "mock",
        id,
        label: normalizeProviderString(input.label, id, MAX_DATASET_LABEL_LENGTH),
        workspaceId: normalizeProviderString(input.workspaceId, "", 160) || undefined,
        organizationId: normalizeProviderString(input.organizationId, "", 160) || undefined,
        contractPackageId: normalizeProviderString(input.contractPackageId, "", 160) || undefined,
        subcontractTeamId: normalizeProviderString(input.subcontractTeamId, "", 160) || undefined,
        summary: normalizeProviderString(input.summary, "", 500) || undefined,
        updatedAt: nowIsoString(),
        documents: [],
      });
      mockStore.datasets.set(id, dataset);
      return {
        ok: true,
        dataset,
      };
    },
    async upsertDocument(datasetId, input = {}) {
      const dataset = mockStore.datasets.get(datasetId);
      if (!dataset) {
        return {
          ok: false,
          status: "not_found",
          message: "Mock knowledge-base dataset not found.",
        };
      }

      const documentId = normalizeProviderString(input.documentId ?? input.id, createMockDatasetId("kb-doc"), 180);
      const document = sanitizeProviderValue({
        provider: "mock",
        datasetId,
        documentId,
        title: normalizeProviderString(input.title, documentId, MAX_DOCUMENT_TITLE_LENGTH),
        summary: normalizeProviderString(input.summary, "", 500) || undefined,
        sourceObjectId: normalizeProviderString(input.sourceObjectId, "", 180) || undefined,
        updatedAt: nowIsoString(),
        chunks: [],
      });

      dataset.documents = [...dataset.documents.filter((item) => item.documentId !== documentId), document];
      mockStore.datasets.set(datasetId, dataset);
      return {
        ok: true,
        document,
      };
    },
    async upsertChunk(datasetId, documentId, input = {}) {
      const dataset = mockStore.datasets.get(datasetId);
      if (!dataset) {
        return {
          ok: false,
          status: "not_found",
          message: "Mock knowledge-base dataset not found.",
        };
      }

      const document = dataset.documents.find((item) => item.documentId === documentId);
      if (!document) {
        return {
          ok: false,
          status: "not_found",
          message: "Mock knowledge-base document not found.",
        };
      }

      const chunkId = normalizeProviderString(input.chunkId ?? input.id, createMockDatasetId("kb-chunk"), 180);
      const chunk = sanitizeProviderValue({
        provider: "mock",
        datasetId,
        documentId,
        chunkId,
        title: normalizeProviderString(input.title, chunkId, MAX_DOCUMENT_TITLE_LENGTH),
        safeSnippet: normalizeProviderString(input.safeSnippet ?? input.snippet, "", MAX_CHUNK_TEXT_LENGTH),
        locator: normalizeProviderString(input.locator, "", 240) || undefined,
        score: Number.isFinite(Number(input.score)) ? Number(input.score) : undefined,
        masterDataIds: Array.isArray(input.masterDataIds) ? input.masterDataIds : [],
        evidenceIds: Array.isArray(input.evidenceIds) ? input.evidenceIds : [],
        updatedAt: nowIsoString(),
      });

      document.chunks = [...document.chunks.filter((item) => item.chunkId !== chunkId), chunk];
      mockStore.datasets.set(datasetId, dataset);
      return {
        ok: true,
        chunk,
      };
    },
    async search(input = {}) {
      const query = normalizeProviderString(input.query, "", 500);
      const datasetIds = Array.isArray(input.datasetIds) ? input.datasetIds : [];
      const topK = normalizePositiveInteger(input.topK, 5, 20) || 5;
      const hits = [];

      for (const datasetId of datasetIds) {
        const dataset = mockStore.datasets.get(datasetId);
        if (!dataset) {
          continue;
        }

        for (const document of dataset.documents) {
          for (const chunk of document.chunks) {
            if (hits.length >= topK) {
              break;
            }
            const searchable = `${document.title} ${document.summary ?? ""} ${chunk.title} ${chunk.safeSnippet}`.toLowerCase();
            if (!query || searchable.includes(query.toLowerCase())) {
              hits.push(
                normalizeRetrievalHit({
                  provider: "mock",
                  providerDatasetId: datasetId,
                  providerDocumentId: document.documentId,
                  providerChunkId: chunk.chunkId,
                  score: chunk.score ?? 0.5,
                  title: chunk.title,
                  safeSnippet: chunk.safeSnippet,
                  locator: chunk.locator,
                  sourceObjectId: document.sourceObjectId,
                  masterDataIds: chunk.masterDataIds ?? [],
                  evidenceIds: chunk.evidenceIds ?? [],
                }),
              );
            }
          }
        }
      }

      return {
        ok: true,
        hits: hits.filter(Boolean).slice(0, topK),
      };
    },
  };
}

export function createRagflowKnowledgeBaseProvider() {
  const ragflow = getConfig();

  return {
    provider: "ragflow",
    async getReadiness() {
      const configured = Boolean(ragflow.enabled && ragflow.baseURL && ragflow.apiKey);
      if (!configured) {
        return buildNotConfiguredSummary(
          "ragflow",
          ragflow.enabled
            ? "RAGFlow provider is enabled but missing base URL or API key."
            : "RAGFlow provider is disabled.",
        );
      }

      if (!ragflow.healthPath) {
        return buildConfiguredSummary("ragflow", true, "RAGFlow provider is configured.");
      }

      try {
        const { response, payload } = await fetchJsonWithTimeout(
          `${ragflow.baseURL}${ragflow.healthPath}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${ragflow.apiKey}`,
              Accept: "application/json",
            },
          },
          ragflow.timeoutMs,
        );

        const ready = response.ok && payload?.ok !== false;
        return buildProviderHealthSummary({
          provider: "ragflow",
          configured: true,
          ready,
          status: ready ? "ready" : "degraded",
          source: ready ? "ragflow" : "local-fallback",
          summary: ready ? "RAGFlow provider is ready." : "RAGFlow provider health check is degraded.",
          diagnostics: [
            sanitizeProviderValue({
              statusCode: response.status,
              status: payload?.status,
              message: payload?.message ?? `Health check returned HTTP ${response.status}.`,
            }),
          ],
          metadata: {
            baseURL: Boolean(ragflow.baseURL),
            datasetId: Boolean(ragflow.defaultDatasetId),
            timeoutMs: ragflow.timeoutMs,
          },
        });
      } catch (error) {
        return buildProviderHealthSummary({
          provider: "ragflow",
          configured: true,
          ready: false,
          status: "degraded",
          source: "local-fallback",
          summary: "RAGFlow provider health check failed.",
          diagnostics: [
            sanitizeProviderValue({
              status: error?.name === "AbortError" ? "timeout" : "request_failed",
              message: error instanceof Error ? error.message : "RAGFlow health check failed.",
            }),
          ],
          metadata: {
            baseURL: Boolean(ragflow.baseURL),
            datasetId: Boolean(ragflow.defaultDatasetId),
            timeoutMs: ragflow.timeoutMs,
          },
        });
      }
    },
    async upsertDataset(input = {}) {
      if (!ragflow.enabled || !ragflow.baseURL || !ragflow.apiKey) {
        return {
          ok: false,
          status: "not_configured",
          message: "RAGFlow provider is not configured.",
        };
      }

      const datasetId = normalizeProviderString(input.datasetId ?? input.id ?? ragflow.defaultDatasetId, "", 180);
      const body = sanitizeProviderValue({
        name: normalizeProviderString(input.label ?? input.name, datasetId, MAX_DATASET_LABEL_LENGTH),
        workspaceId: normalizeProviderString(input.workspaceId, "", 160) || undefined,
        organizationId: normalizeProviderString(input.organizationId, "", 160) || undefined,
        contractPackageId: normalizeProviderString(input.contractPackageId, "", 160) || undefined,
        subcontractTeamId: normalizeProviderString(input.subcontractTeamId, "", 160) || undefined,
        summary: normalizeProviderString(input.summary, "", 500) || undefined,
      });
      const path = ragflow.datasetPath || "/api/v1/datasets";
      const requestUrl = datasetId ? `${ragflow.baseURL}${path}/${encodeURIComponent(datasetId)}` : `${ragflow.baseURL}${path}`;
      const response = await fetch(requestUrl, {
        method: datasetId ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${ragflow.apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        return {
          ok: false,
          status: "failed",
          message: payload?.message || payload?.error || "RAGFlow dataset upsert failed.",
        };
      }

      return {
        ok: true,
        dataset: normalizeProviderRef({
          provider: "ragflow",
          id: payload?.data?.id || payload?.id || datasetId || createMockDatasetId(),
          datasetId: payload?.data?.id || payload?.id || datasetId || createMockDatasetId(),
          syncStatus: "ready",
          summary: body.name || "RAGFlow dataset",
          lastSyncedAt: nowIsoString(),
        }),
      };
    },
    async upsertDocument(datasetId, input = {}) {
      if (!ragflow.enabled || !ragflow.baseURL || !ragflow.apiKey) {
        return {
          ok: false,
          status: "not_configured",
          message: "RAGFlow provider is not configured.",
        };
      }

      const path = ragflow.documentPath || "/api/v1/datasets/:datasetId/documents";
      const requestUrl = `${ragflow.baseURL}${path.replace(":datasetId", encodeURIComponent(datasetId))}`;
      const response = await fetch(requestUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ragflow.apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(sanitizeProviderValue({
          title: normalizeProviderString(input.title, "", MAX_DOCUMENT_TITLE_LENGTH),
          sourceObjectId: normalizeProviderString(input.sourceObjectId, "", 180) || undefined,
          summary: normalizeProviderString(input.summary, "", 500) || undefined,
        })),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        return {
          ok: false,
          status: "failed",
          message: payload?.message || payload?.error || "RAGFlow document upsert failed.",
        };
      }

      const documentId = payload?.data?.id || payload?.id || normalizeProviderString(input.documentId, "", 180);
      return {
        ok: true,
        document: normalizeProviderRef({
          provider: "ragflow",
          id: documentId,
          datasetId,
          documentId,
          syncStatus: "ready",
          summary: normalizeProviderString(input.title, documentId, MAX_DOCUMENT_TITLE_LENGTH),
          lastSyncedAt: nowIsoString(),
        }),
      };
    },
    async upsertChunk(datasetId, documentId, input = {}) {
      if (!ragflow.enabled || !ragflow.baseURL || !ragflow.apiKey) {
        return {
          ok: false,
          status: "not_configured",
          message: "RAGFlow provider is not configured.",
        };
      }

      const path = ragflow.chunkPath || "/api/v1/documents/:documentId/chunks";
      const requestUrl = `${ragflow.baseURL}${path.replace(":documentId", encodeURIComponent(documentId))}`;
      const response = await fetch(requestUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ragflow.apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(sanitizeProviderValue({
          title: normalizeProviderString(input.title, "", MAX_DOCUMENT_TITLE_LENGTH),
          safeSnippet: normalizeProviderString(input.safeSnippet ?? input.snippet, "", MAX_CHUNK_TEXT_LENGTH),
          locator: normalizeProviderString(input.locator, "", 240) || undefined,
          score: Number.isFinite(Number(input.score)) ? Number(input.score) : undefined,
        })),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        return {
          ok: false,
          status: "failed",
          message: payload?.message || payload?.error || "RAGFlow chunk upsert failed.",
        };
      }

      const chunkId = payload?.data?.id || payload?.id || normalizeProviderString(input.chunkId, "", 180);
      return {
        ok: true,
        chunk: normalizeProviderRef({
          provider: "ragflow",
          id: chunkId,
          datasetId,
          documentId,
          chunkId,
          syncStatus: "ready",
          summary: normalizeProviderString(input.title, chunkId, MAX_DOCUMENT_TITLE_LENGTH),
          lastSyncedAt: nowIsoString(),
        }),
      };
    },
    async search(input = {}) {
      if (!ragflow.enabled || !ragflow.baseURL || !ragflow.apiKey) {
        return {
          ok: false,
          status: "not_configured",
          message: "RAGFlow provider is not configured.",
          hits: [],
        };
      }

      const path = ragflow.retrievalPath || "/api/v1/retrieval";
      const requestUrl = `${ragflow.baseURL}${path}`;
      const response = await fetch(requestUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ragflow.apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(sanitizeProviderValue({
          query: normalizeProviderString(input.query, "", 500),
          datasetIds: Array.isArray(input.datasetIds) ? input.datasetIds : [ragflow.defaultDatasetId].filter(Boolean),
          topK: normalizePositiveInteger(input.topK, 5, 20) || 5,
          filters: sanitizeProviderValue(input.filters ?? {}),
          correlationId: normalizeProviderString(input.correlationId, "", 120) || undefined,
        })),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        return {
          ok: false,
          status: "failed",
          message: payload?.message || payload?.error || "RAGFlow retrieval failed.",
          hits: [],
        };
      }

      const rawHits = payload?.data?.hits ?? payload?.hits ?? payload?.data ?? [];
      return {
        ok: true,
        hits: normalizeRetrievalHits(rawHits, "ragflow"),
      };
    },
  };
}

export function createKnowledgeBaseProvider() {
  const ragflow = getConfig();
  return ragflow.enabled ? createRagflowKnowledgeBaseProvider() : createMockKnowledgeBaseProvider();
}

export async function getKnowledgeBaseProviderReadiness() {
  return createKnowledgeBaseProvider().getReadiness();
}

export async function searchKnowledgeBase(input = {}) {
  return createKnowledgeBaseProvider().search(input);
}

export async function upsertKnowledgeBaseDataset(input = {}) {
  return createKnowledgeBaseProvider().upsertDataset(input);
}

export async function upsertKnowledgeBaseDocument(datasetId, input = {}) {
  return createKnowledgeBaseProvider().upsertDocument(datasetId, input);
}

export async function upsertKnowledgeBaseChunk(datasetId, documentId, input = {}) {
  return createKnowledgeBaseProvider().upsertChunk(datasetId, documentId, input);
}
