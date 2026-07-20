import assert from "node:assert/strict";
import test from "node:test";

import { getSafeProviderStatus } from "./config.mjs";
import {
  createMaxkbKnowledgeBaseProvider,
  createMockKnowledgeBaseProvider,
  normalizeMaxkbReadinessPayload,
} from "./knowledgeBaseProvider.mjs";
import {
  buildProviderHealthSummary,
  normalizeProviderRef,
  normalizeRetrievalHit,
  sanitizeProviderValue,
} from "./providerContracts.mjs";

test("redacts unsafe provider diagnostic fields recursively", () => {
  const sanitized = sanitizeProviderValue({
    status: "failed",
    authorization: "Bearer secret",
    rawText: "full document",
    nested: {
      providerTrace: "trace",
      safeSummary: "bounded",
      privateUrl: "https://private.example/object",
    },
  });

  assert.deepEqual(sanitized, {
    status: "failed",
    nested: {
      safeSummary: "bounded",
    },
  });
});

test("normalizes provider health summaries without leaking secrets", () => {
  const summary = buildProviderHealthSummary({
    provider: "ragflow",
    configured: true,
    ready: false,
    status: "degraded",
    source: "ragflow",
    summary: "RAGFlow health check degraded.",
    diagnostics: [
      {
        statusCode: 500,
        message: "Provider failed.",
        apiKey: "must-redact",
        headers: {
          authorization: "must-redact",
        },
      },
    ],
  });

  assert.equal(summary.provider, "ragflow");
  assert.equal(summary.configured, true);
  assert.equal(summary.ready, false);
  assert.equal("apiKey" in summary.diagnostics[0], false);
  assert.equal("headers" in summary.diagnostics[0], false);
});

test("normalizes retrieval hits as supporting recall only", () => {
  const hit = normalizeRetrievalHit({
    provider: "ragflow",
    datasetId: "dataset-1",
    documentId: "doc-1",
    chunkId: "chunk-1",
    score: 0.92,
    title: "承台施工资料模板",
    snippet: "专职安全员证书应与项目主数据一致。",
    rawText: "must-redact",
    masterDataIds: ["md-person-1"],
    evidenceIds: ["ev-1"],
  });

  assert.equal(hit.provider, "ragflow");
  assert.equal(hit.providerDatasetId, "dataset-1");
  assert.equal(hit.providerChunkId, "chunk-1");
  assert.equal(hit.safeSnippet, "专职安全员证书应与项目主数据一致。");
  assert.equal("rawText" in hit, false);
});

test("normalizes MaxKB provider refs with knowledge id support", () => {
  const ref = normalizeProviderRef({
    provider: "maxkb",
    knowledgeId: "019f787c-644e-7162-bfe5-f4ee02a91539",
    documentId: "doc-1",
    chunkId: "chunk-1",
    syncStatus: "ready",
    apiKey: "must-redact",
  });

  assert.equal(ref.provider, "maxkb");
  assert.equal(ref.id, "019f787c-644e-7162-bfe5-f4ee02a91539");
  assert.equal(ref.datasetId, ref.id);
  assert.equal(ref.knowledgeId, "019f787c-644e-7162-bfe5-f4ee02a91539");
  assert.equal(ref.documentId, "doc-1");
  assert.equal("apiKey" in ref, false);
});

test("normalizes MaxKB retrieval hits as supporting recall only", () => {
  const hit = normalizeRetrievalHit(
    {
      provider: "maxkb",
      knowledgeId: "knowledge-1",
      documentId: "doc-1",
      chunkId: "chunk-1",
      score: 0.87,
      title: "安全生产许可证",
      content: "should not be used directly",
      snippet: "安全生产许可证有效期应与平台主数据一致。",
      password: "must-redact",
    },
    "maxkb",
  );

  assert.equal(hit.provider, "maxkb");
  assert.equal(hit.providerDatasetId, "knowledge-1");
  assert.equal(hit.knowledgeId, "knowledge-1");
  assert.equal(hit.providerDocumentId, "doc-1");
  assert.equal(hit.safeSnippet, "安全生产许可证有效期应与平台主数据一致。");
  assert.equal("password" in hit, false);
});

test("exposes MaxKB safe provider status without credentials", async () => {
  const status = getSafeProviderStatus();
  assert.equal(typeof status.maxkb.enabled, "boolean");
  assert.equal(typeof status.maxkb.hasApiKey, "boolean");
  assert.equal(typeof status.maxkb.hasPassword, "boolean");
  assert.equal(typeof status.maxkb.statusPath, "string");
  assert.equal("apiKey" in status.maxkb, false);
  assert.equal("password" in status.maxkb, false);

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({
        providers: {
          maxkb: {
            provider: "maxkb",
            configured: true,
            ready: true,
            status: "ready",
            summary: "MaxKB knowledge provider is configured.",
            workspaceId: "default",
            defaultKnowledgeId: "knowledge-1",
            capabilities: {
              ingestion: true,
              retrieval: true,
              documentStatus: false,
            },
            authorization: "must-redact",
          },
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );

  const provider = createMaxkbKnowledgeBaseProvider();
  try {
    const readiness = await provider.getReadiness();
    assert.equal(readiness.provider, "maxkb");
    assert.equal(readiness.ready, true);
    assert.equal(readiness.source, "maxkb-proxy");
    assert.equal(readiness.metadata.defaultKnowledgeId, "knowledge-1");
    assert.equal("apiKey" in readiness, false);
    assert.equal("password" in readiness, false);
    assert.equal("authorization" in readiness, false);
    assert.equal("authorization" in readiness.metadata, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("normalizes MaxKB proxy readiness payload safely", () => {
  const readiness = normalizeMaxkbReadinessPayload(
    {
      service: "preflight-ocr-worker",
      ready: true,
      status: "ready",
      providers: {
        maxkb: {
          provider: "maxkb",
          configured: true,
          ready: true,
          status: "ready",
          summary: "MaxKB knowledge provider is configured.",
          workspaceId: "default",
          defaultKnowledgeId: "019f787c-644e-7162-bfe5-f4ee02a91539",
          capabilities: {
            ingestion: true,
            retrieval: true,
            documentStatus: false,
          },
          token: "must-redact",
        },
      },
    },
    {
      responseOk: true,
      responseStatus: 200,
      metadata: {
        statusPath: "/api/knowledge-base/provider/status",
        retrievalPath: "/api/knowledge/:knowledgeId/search",
      },
    },
  );

  assert.equal(readiness.provider, "maxkb");
  assert.equal(readiness.ready, true);
  assert.equal(readiness.status, "ready");
  assert.equal(readiness.source, "maxkb-proxy");
  assert.equal(readiness.metadata.workspaceId, "default");
  assert.equal(readiness.metadata.defaultKnowledgeId, "019f787c-644e-7162-bfe5-f4ee02a91539");
  assert.equal(readiness.metadata.capabilities.retrieval, true);
  assert.equal("token" in readiness.metadata, false);
});

test("mock knowledge-base provider returns normalized retrieval hits", async () => {
  const provider = createMockKnowledgeBaseProvider();
  const datasetResult = await provider.upsertDataset({
    id: "mock-dataset-1",
    label: "承台施工分包队伍知识库",
    workspaceId: "ws-1",
  });
  await provider.upsertDocument(datasetResult.dataset.id, {
    documentId: "mock-doc-1",
    title: "人员证照资料模板",
    sourceObjectId: "obj-1",
  });
  await provider.upsertChunk(datasetResult.dataset.id, "mock-doc-1", {
    chunkId: "mock-chunk-1",
    title: "专职安全员证书",
    safeSnippet: "专职安全员证书应与项目主数据一致。",
    masterDataIds: ["md-person-1"],
  });

  const result = await provider.search({
    datasetIds: ["mock-dataset-1"],
    query: "安全员",
    topK: 3,
  });

  assert.equal(result.ok, true);
  assert.equal(result.hits.length, 1);
  assert.equal(result.hits[0].providerDatasetId, "mock-dataset-1");
  assert.equal(result.hits[0].providerChunkId, "mock-chunk-1");
  assert.deepEqual(result.hits[0].masterDataIds, ["md-person-1"]);
});
