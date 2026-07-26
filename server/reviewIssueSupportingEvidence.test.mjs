import assert from "node:assert/strict";
import test from "node:test";

import { createBackendServer } from "./index.mjs";
import { upsertReviewTask } from "./reviewTaskStore.mjs";

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve(`http://127.0.0.1:${server.address().port}`);
    });
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function requestJson(baseUrl, path) {
  const response = await fetch(`${baseUrl}${path}`);
  return {
    statusCode: response.status,
    payload: await response.json(),
  };
}

test("review task issue supporting evidence returns safe normalized hits", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    if (url.includes("/api/knowledge/") && url.includes("/search")) {
      return new Response(
        JSON.stringify({
          data: {
            records: [
              {
                id: "chunk-issue-evidence-1",
                documentId: "doc-issue-evidence-1",
                documentName: "Deep excavation safety measures",
                title: "Monitoring requirements",
                content: "must-not-leak",
                snippet: "Deep excavation requires enclosure, dewatering, monitoring and emergency plan.",
                locator: "Chapter 4",
                similarity: 0.91,
                authorization: "must-not-leak",
              },
            ],
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return originalFetch(input, init);
  };

  const server = createBackendServer();

  try {
    await upsertReviewTask("task-evidence-1", {
      id: "task-evidence-1",
      name: "plan.docx",
      project: "Test project",
      uploader: "tester",
      updatedAt: new Date().toISOString(),
      status: "ready",
      issueCount: 1,
      mode: "review",
      paragraphs: [
        {
          id: "p-1",
          section: "4.3.1 Excavation measures",
          text: "Deep excavation requires enclosure, dewatering, monitoring and emergency plan.",
        },
      ],
      issues: [
        {
          id: "issue-1",
          source: "ai",
          status: "pending",
          severity: "high",
          anchor: {
            paragraphId: "p-1",
            startOffset: 0,
            endOffset: 16,
            text: "Deep excavation",
          },
          finding: {
            title: "Deep excavation safety measures need review",
            reason: "Deep excavation requires enclosure, dewatering, monitoring and emergency plan.",
            basis: "Foundation pit support code JGJ120",
            suggestion: "Add enclosure, dewatering, monitoring and emergency measures.",
          },
          resolution: {
            action: null,
            editedText: null,
            resolvedAt: null,
          },
          kernel: {
            engineSource: "hybrid",
            checkDomain: "professional-technical",
            checkItem: "Deep excavation plan",
            outputScenario: "supervisor-formal-review",
            complianceCategory: "general-norm",
            basisPriority: "primary",
            schemaVersion: "v1",
            basisReferences: [
              {
                type: "normative-standard",
                sourceTitle: "Foundation pit support code",
                version: "JGJ120",
                summary: "Deep excavation requires enclosure, dewatering, monitoring and emergency plan.",
                priority: "primary",
              },
            ],
          },
        },
      ],
      streamStageIndex: 0,
    });

    const baseUrl = await listen(server);
    const response = await requestJson(
      baseUrl,
      "/api/review-tasks/task-evidence-1/issues/issue-1/supporting-evidence",
    );

    assert.equal(response.statusCode, 200);
    assert.equal(response.payload.taskId, "task-evidence-1");
    assert.equal(response.payload.issueId, "issue-1");
    assert.equal(response.payload.ok, true);
    assert.equal(response.payload.hits.length, 1);
    assert.equal(response.payload.hits[0].provider, "maxkb");
    assert.equal(response.payload.hits[0].title, "Monitoring requirements");
    assert.equal(
      response.payload.hits[0].safeSnippet,
      "Deep excavation requires enclosure, dewatering, monitoring and emergency plan.",
    );
    assert.equal("content" in response.payload.hits[0], false);
    assert.equal("authorization" in response.payload.hits[0], false);
  } finally {
    globalThis.fetch = originalFetch;
    await close(server);
  }
});
