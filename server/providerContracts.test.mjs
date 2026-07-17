import assert from "node:assert/strict";
import test from "node:test";

import { createMockKnowledgeBaseProvider } from "./knowledgeBaseProvider.mjs";
import {
  buildProviderHealthSummary,
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
