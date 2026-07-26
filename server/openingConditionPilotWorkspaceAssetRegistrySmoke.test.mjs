import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { createBackendServer } from "./index.mjs";

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

async function requestJson(baseUrl, method, path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: body == null ? undefined : { "Content-Type": "application/json" },
    body: body == null ? undefined : JSON.stringify(body),
  });
  const payload = await response.json();
  return {
    statusCode: response.status,
    payload,
  };
}

test("HTTP smoke exposes backend-owned workspace asset registry summaries", async () => {
  const directory = await mkdtemp(join(tmpdir(), "oc-asset-registry-smoke-"));
  const server = createBackendServer({
    openingConditionStorePath: join(directory, "tasks.json"),
  });

  try {
    const baseUrl = await listen(server);

    await requestJson(baseUrl, "PUT", "/api/opening-condition/workspaces/ws-asset-a/basis/basis-a", {
      title: "Published basis A",
      status: "published",
      version: "v1",
      sourceObject: {
        objectId: "basis-a",
        kind: "basis",
        fileName: "basis-a.pdf",
      },
    });
    await requestJson(baseUrl, "PUT", "/api/opening-condition/workspaces/ws-asset-a/master-data/md-a", {
      type: "personnel",
      label: "Safety officer A",
      status: "human_approved",
    });
    await requestJson(baseUrl, "PUT", "/api/opening-condition/workspaces/ws-asset-a/knowledge-bases/kb-a", {
      organizationId: "org-a",
      contractPackageId: "package-a",
      subcontractTeamId: "team-a",
      label: "Knowledge Base A",
      status: "ready",
      summary: "Ready KB A",
      providerRefs: [
        {
          provider: "maxkb",
          id: "kb-a-provider",
          datasetId: "kb-a-provider",
          syncStatus: "ready",
        },
      ],
    });

    await requestJson(baseUrl, "POST", "/api/opening-condition/pilot-tasks/intake-init", {
      taskId: "task-asset-a-1",
      context: {
        workspaceId: "ws-asset-a",
        tenantId: "tenant-a",
        projectId: "project-a",
        contractPackageId: "package-a",
        participatingOrganizationId: "org-a",
      },
      basisVersionId: "basis-a",
      checklistObject: {
        objectId: "checklist-a",
        kind: "checklist",
        fileName: "checklist-a.docx",
      },
      sourceObjects: [
        {
          objectId: "source-a",
          kind: "source_archive",
          fileName: "source-a.zip",
        },
      ],
      checklistItems: [
        {
          id: "item-a",
          category: "Documents",
          subCategory: "Packet",
          name: "Source archive present",
          required: true,
          expectedEvidenceHints: ["source-a"],
          masterDataIds: ["md-a"],
        },
      ],
      knowledgeBaseId: "kb-a",
      requiredMasterDataIds: ["md-a"],
    });

    await requestJson(baseUrl, "POST", "/api/opening-condition/pilot-tasks/task-asset-a-1/match", {});
    await requestJson(baseUrl, "POST", "/api/opening-condition/pilot-tasks/task-asset-a-1/report", {});
    await requestJson(baseUrl, "POST", "/api/opening-condition/pilot-tasks/task-asset-a-1/archive", {});

    await requestJson(baseUrl, "POST", "/api/opening-condition/pilot-tasks/intake-init", {
      taskId: "task-asset-a-2",
      context: {
        workspaceId: "ws-asset-a",
        tenantId: "tenant-a",
        projectId: "project-a",
        contractPackageId: "package-a",
        participatingOrganizationId: "org-a",
      },
      basisVersionId: "basis-a",
      checklistObject: {
        objectId: "checklist-a-2",
        kind: "checklist",
        fileName: "checklist-a-2.docx",
      },
      sourceObjects: [
        {
          objectId: "source-a-2",
          kind: "source_archive",
          fileName: "source-a-2.zip",
        },
      ],
      checklistItems: [
        {
          id: "item-a-2",
          category: "Documents",
          subCategory: "Packet",
          name: "Source archive present again",
          required: true,
          expectedEvidenceHints: ["source-a-2"],
          masterDataIds: ["md-a"],
        },
      ],
      knowledgeBaseId: "kb-a",
      requiredMasterDataIds: ["md-a"],
    });

    await requestJson(baseUrl, "PUT", "/api/opening-condition/workspaces/ws-asset-b/master-data/md-b", {
      type: "equipment",
      label: "Crane B",
      status: "provisional",
    });

    const registry = await requestJson(
      baseUrl,
      "GET",
      "/api/opening-condition/workspace-asset-registry?workspaceId=ws-asset-a&workspaceId=ws-asset-b&workspaceId=ws-asset-c",
    );

    assert.equal(registry.statusCode, 200);
    assert.equal(registry.payload.ok, true);
    assert.equal(Array.isArray(registry.payload.summaries), true);

    const workspaceA = registry.payload.summaries.find((item) => item.workspaceId === "ws-asset-a");
    const workspaceB = registry.payload.summaries.find((item) => item.workspaceId === "ws-asset-b");
    const workspaceC = registry.payload.summaries.find((item) => item.workspaceId === "ws-asset-c");

    assert.ok(workspaceA);
    assert.equal(workspaceA.basis.published, 1);
    assert.equal(workspaceA.masterData.currentRunConfirmed, 1);
    assert.equal(workspaceA.knowledgeBase.present, true);
    assert.equal(workspaceA.knowledgeBase.status, "ready");
    assert.equal(workspaceA.runHistory.total, 2);
    assert.equal(workspaceA.runHistory.archived, 1);
    assert.equal(workspaceA.runHistory.active, 1);
    assert.equal(workspaceA.currentRunBinding.status, "ready");
    assert.equal(typeof workspaceA.currentRunBinding.summary, "string");
    assert.equal("workspace" in workspaceA, false);

    assert.ok(workspaceB);
    assert.equal(workspaceB.basis.total, 0);
    assert.equal(workspaceB.masterData.total, 1);
    assert.equal(workspaceB.knowledgeBase.present, false);
    assert.equal(workspaceB.runHistory.total, 0);
    assert.equal(workspaceB.currentRunBinding.status, "no_run");

    assert.ok(workspaceC);
    assert.equal(workspaceC.basis.total, 0);
    assert.equal(workspaceC.masterData.total, 0);
    assert.equal(workspaceC.runHistory.total, 0);
    assert.equal(workspaceC.currentRunBinding.status, "no_run");
  } finally {
    await close(server);
    await rm(directory, { recursive: true, force: true });
  }
});
