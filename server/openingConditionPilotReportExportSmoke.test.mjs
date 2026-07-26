import assert from "node:assert/strict";
import http from "node:http";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const context = {
  workspaceId: "ws-export-smoke",
  tenantId: "tenant-export-smoke",
  projectId: "project-export-smoke",
  contractPackageId: "contract-export-smoke",
  participatingOrganizationId: "org-export-smoke",
};

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
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  return {
    statusCode: response.status,
    payload: await response.json(),
  };
}

async function seedWorkspaceFacts(baseUrl) {
  const workspace = encodeURIComponent(context.workspaceId);

  await requestJson(baseUrl, "PUT", `/api/opening-condition/workspaces/${workspace}/basis/basis-export`, {
    title: "Export smoke basis",
    status: "published",
    version: "v1",
    sourceObject: {
      objectId: "basis-object-export",
      kind: "basis",
      fileName: "export-basis.pdf",
    },
  });

  await requestJson(baseUrl, "PUT", `/api/opening-condition/workspaces/${workspace}/master-data/md-export`, {
    type: "personnel",
    label: "Safety officer",
    status: "published",
  });

  await requestJson(baseUrl, "PUT", `/api/opening-condition/workspaces/${workspace}/knowledge-bases/kb-export`, {
    organizationId: context.participatingOrganizationId,
    contractPackageId: context.contractPackageId,
    subcontractTeamId: "team-export-smoke",
    label: "Export smoke knowledge base",
    status: "ready",
    summary: "Ready for export smoke.",
    providerRefs: [
      {
        provider: "maxkb",
        id: "kb-export-provider",
        datasetId: "kb-export-provider",
        syncStatus: "ready",
      },
    ],
  });
}

async function createReportReadyTask(baseUrl, taskId) {
  await seedWorkspaceFacts(baseUrl);

  const intake = await requestJson(baseUrl, "POST", "/api/opening-condition/pilot-tasks/intake-init", {
    taskId,
    context,
    basisVersionId: "basis-export",
    checklistObject: {
      objectId: `checklist-${taskId}`,
      kind: "checklist",
      fileName: "opening-condition-checklist.docx",
    },
    sourceObjects: [
      {
        objectId: `source-${taskId}`,
        kind: "source_archive",
        fileName: "unrelated-material.pdf",
      },
    ],
    checklistItems: [
      {
        id: "item-approval-form",
        category: "Documents",
        subCategory: "Approval",
        name: "Stamped approval form",
        required: true,
        expectedEvidenceHints: ["approval form", "stamp"],
        masterDataIds: ["md-export"],
      },
    ],
  });
  assert.equal(intake.statusCode, 200);

  const matched = await requestJson(baseUrl, "POST", `/api/opening-condition/pilot-tasks/${taskId}/match`, {});
  assert.equal(matched.statusCode, 200);

  const reviewId = matched.payload.humanReviewQueue[0]?.id;
  assert.ok(reviewId, "expected a human review item");
  const decision = await requestJson(
    baseUrl,
    "POST",
    `/api/opening-condition/pilot-tasks/${taskId}/human-review/${reviewId}/decision`,
    {
      decision: "reject",
      actorId: "export-smoke-reviewer",
      safeNote: "Export smoke marks the approval form as unresolved.",
    },
  );
  assert.equal(decision.statusCode, 200);

  const report = await requestJson(baseUrl, "POST", `/api/opening-condition/pilot-tasks/${taskId}/report`, {
    objectRef: {
      objectId: `report-${taskId}`,
      kind: "report",
      fileName: `${taskId}.md`,
    },
  });
  assert.equal(report.statusCode, 200, JSON.stringify(report.payload));
  return report.payload.task;
}

async function overrideTaskReportPackageDiagnostics(storePath, taskId, packageDiagnostics) {
  const snapshot = JSON.parse(await readFile(storePath, "utf8"));
  const task = snapshot.tasks.find((item) => item.id === taskId);
  assert.ok(task?.reportAsset, "expected report asset before overriding package diagnostics");
  task.reportAsset.packageDiagnostics = packageDiagnostics;
  await writeFile(storePath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
}

function buildCustomPackageDiagnostics(taskId) {
  return {
    inputObjects: {
      basisFileName: "export-basis.pdf",
      checklistFileName: "opening-condition-checklist.docx",
      sourceFileNames: ["approval-form.pdf"],
      sourceCount: 1,
    },
    matching: {
      total: 1,
      passed: 0,
      failed: 1,
      warnings: 0,
      humanReview: 0,
      evidenceCount: 0,
    },
    humanReview: {
      total: 1,
      blockingCount: 0,
      confirmed: 0,
      corrected: 0,
      rejected: 1,
      deferred: 0,
    },
    decisionLedger: [],
    findings: [
      {
        id: "finding-fallback",
        checkItemId: "item-approval-form",
        title: "Stamped approval form",
        category: "Documents",
        subCategory: "Approval",
        required: true,
        disposition: "reject",
        issueTypeId: "approval_signature_gap",
        issueTypeLabel: "Approval signature gap",
        issueTypeGroup: "Approval",
        riskLevel: "high",
        legalBasis: [{ title: "Mock basis", clause: "1.0" }],
        rectificationRequirement: "This findings fallback text should not win.",
        description: "Findings fallback should not be exported when delivery rows exist.",
        evidenceIds: [],
        evidenceLabels: [],
        humanReviewIds: [],
        humanReviewLabels: [],
      },
    ],
    summaryByIssueType: [
      {
        issueTypeId: "approval_signature_gap",
        issueTypeLabel: "Approval signature gap",
        issueTypeGroup: "Approval",
        riskLevel: "high",
        count: 1,
      },
    ],
    nextRectificationAdvice: {
      headline: "补齐审批资料后重新提交。",
      actions: ["按 persisted delivery package 行进行导出。"],
    },
    exportHandoff: {
      adapterId: "opening-condition-export-adapter",
      adapterLabel: "原表回填/导出适配器",
      deliveryKind: "docx_export",
      status: "ready_for_adapter",
      templateId: "opening-condition-original-form-template-v1",
      templateLabel: "开工条件原表模板",
      inputSummary: {
        basisFileName: "export-basis.pdf",
        checklistFileName: "opening-condition-checklist.docx",
        sourceCount: 1,
        findingCount: 1,
      },
      safeDiagnostics: ["deliveryPackage:ready"],
      nextAction: "Call html2docx.",
    },
    deliveryPackage: {
      schemaVersion: "opening-condition-report-delivery-package.v1",
      packageId: `oc-report-delivery-${taskId}`,
      taskId,
      status: "ready_for_handoff",
      statusLabel: "可交付给导出/回填",
      generatedAt: "2026-07-26T10:00:00.000Z",
      readOnly: false,
      rowCount: 1,
      blockingCount: 0,
      pendingHumanReviewCount: 0,
      adapterStatus: "ready_for_adapter",
      nextAction: "Use delivery rows for export.",
      rows: [
        {
          sequence: 1,
          id: "delivery-row-1",
          checkItem: "Stamped approval form",
          category: "Documents / Approval",
          issueDescription: "Persisted delivery package row should win.",
          riskLabel: "High",
          dispositionLabel: "人工驳回",
          basis: "Persisted export basis",
          rectification: "Persisted export rectification",
          notes: ["Persisted export note"],
        },
      ],
      safeDiagnostics: ["rows=1"],
    },
    blockingReasons: [],
    archiveStatus: "ready",
    generatedAt: "2026-07-26T10:00:00.000Z",
  };
}

async function withBackend(tempDir, envOverrides = {}) {
  const previousBaseUrl = process.env.HTTP_TOOLS_BASE_URL;
  const previousTimeout = process.env.HTTP_TOOLS_TIMEOUT_MS;
  if ("HTTP_TOOLS_BASE_URL" in envOverrides) {
    process.env.HTTP_TOOLS_BASE_URL = envOverrides.HTTP_TOOLS_BASE_URL;
  }
  if ("HTTP_TOOLS_TIMEOUT_MS" in envOverrides) {
    process.env.HTTP_TOOLS_TIMEOUT_MS = envOverrides.HTTP_TOOLS_TIMEOUT_MS;
  }

  const storePath = join(tempDir, "opening-condition-export-smoke.json");
  const backendModule = await import(
    `${new URL("./index.mjs", import.meta.url).href}?opening-condition-export-smoke=${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
  const configModule = await import(new URL("./config.mjs", import.meta.url).href);
  const { createBackendServer } = backendModule;
  const config = configModule.config;
  const previousConfigBaseUrl = config.httpTools.baseURL;
  const previousConfigTimeout = config.httpTools.timeoutMs;
  if ("HTTP_TOOLS_BASE_URL" in envOverrides) {
    config.httpTools.baseURL = envOverrides.HTTP_TOOLS_BASE_URL;
  }
  if ("HTTP_TOOLS_TIMEOUT_MS" in envOverrides) {
    config.httpTools.timeoutMs = Number(envOverrides.HTTP_TOOLS_TIMEOUT_MS);
  }
  const server = createBackendServer({
    openingConditionStorePath: storePath,
  });

  return {
    server,
    storePath,
    restore() {
      if (previousBaseUrl === undefined) {
        delete process.env.HTTP_TOOLS_BASE_URL;
      } else {
        process.env.HTTP_TOOLS_BASE_URL = previousBaseUrl;
      }
      if (previousTimeout === undefined) {
        delete process.env.HTTP_TOOLS_TIMEOUT_MS;
      } else {
        process.env.HTTP_TOOLS_TIMEOUT_MS = previousTimeout;
      }
      config.httpTools.baseURL = previousConfigBaseUrl;
      config.httpTools.timeoutMs = previousConfigTimeout;
    },
  };
}

test("opening-condition export endpoint returns missing_report before report asset exists", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "oc-export-missing-report-"));
  const { server, restore } = await withBackend(tempDir, { HTTP_TOOLS_BASE_URL: "" });

  try {
    const baseUrl = await listen(server);
    await seedWorkspaceFacts(baseUrl);
    const intake = await requestJson(baseUrl, "POST", "/api/opening-condition/pilot-tasks/intake-init", {
      taskId: "task-export-no-report",
      context,
      basisVersionId: "basis-export",
      checklistObject: {
        objectId: "checklist-no-report",
        kind: "checklist",
        fileName: "opening-condition-checklist.docx",
      },
      sourceObjects: [
        {
          objectId: "source-no-report",
          kind: "source_archive",
          fileName: "approval-form.pdf",
        },
      ],
    });
    assert.equal(intake.statusCode, 200);

    const response = await requestJson(
      baseUrl,
      "POST",
      "/api/opening-condition/pilot-tasks/task-export-no-report/report/export-docx",
      {},
    );
    assert.equal(response.statusCode, 400);
    assert.equal(response.payload.ok, false);
    assert.equal(response.payload.status, "missing_report");
  } finally {
    await close(server);
    restore();
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("opening-condition export endpoint returns safe export_failed fallback when adapter is not configured", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "oc-export-not-configured-"));
  const { server, restore } = await withBackend(tempDir, {
    HTTP_TOOLS_BASE_URL: "",
    HTTP_TOOLS_TIMEOUT_MS: "1500",
  });

  try {
    const baseUrl = await listen(server);
    await createReportReadyTask(baseUrl, "task-export-no-adapter");

    const response = await requestJson(
      baseUrl,
      "POST",
      "/api/opening-condition/pilot-tasks/task-export-no-adapter/report/export-docx",
      {},
    );
    assert.equal(response.statusCode, 503);
    assert.equal(response.payload.ok, false);
    assert.equal(response.payload.status, "export_failed");
    assert.equal(response.payload.adapterStatus, "not_configured");
    assert.equal(response.payload.fallback, "html");
    assert.ok(Array.isArray(response.payload.safeDiagnostics));
    assert.ok(response.payload.safeDiagnostics.includes("capability:html2docx"));
  } finally {
    await close(server);
    restore();
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("opening-condition export endpoint uses persisted delivery rows and records adapter handoff", async () => {
  const tempDir = await mkdtemp(join(tmpdir(), "oc-export-success-"));
  let capturedHtml = "";
  const adapterServer = http.createServer(async (request, response) => {
    if (request.method === "POST" && request.url === "/api/capabilities/html2docx") {
      const chunks = [];
      for await (const chunk of request) {
        chunks.push(chunk);
      }
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      capturedHtml = body.html;
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(
        JSON.stringify({
          success: true,
          downloadUrl: "https://example.test/opening-condition-export.docx",
          fileKey: "exports/opening-condition-export.docx",
          fileName: "opening-condition-export.docx",
          fileSize: 4096,
          message: "html2docx ok",
        }),
      );
      return;
    }

    response.writeHead(404, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ success: false, message: "not found" }));
  });
  const adapterBaseUrl = await listen(adapterServer);
  const { server, storePath, restore } = await withBackend(tempDir, {
    HTTP_TOOLS_BASE_URL: adapterBaseUrl,
    HTTP_TOOLS_TIMEOUT_MS: "3000",
  });

  try {
    const baseUrl = await listen(server);
    await createReportReadyTask(baseUrl, "task-export-success");
    await overrideTaskReportPackageDiagnostics(
      storePath,
      "task-export-success",
      buildCustomPackageDiagnostics("task-export-success"),
    );

    const response = await requestJson(
      baseUrl,
      "POST",
      "/api/opening-condition/pilot-tasks/task-export-success/report/export-docx",
      {},
    );
    assert.equal(response.statusCode, 200);
    assert.equal(response.payload.ok, true);
    assert.equal(response.payload.status, "exported");
    assert.equal(response.payload.export.fileName, "opening-condition-export.docx");
    assert.equal(response.payload.exportHandoff.status, "exported");
    assert.equal(response.payload.reportAsset.objectRef.fileName, "opening-condition-export.docx");
    assert.equal(response.payload.reportAsset.packageDiagnostics.deliveryPackage.adapterStatus, "exported");
    assert.match(capturedHtml, /Persisted delivery package row should win\./);
    assert.match(capturedHtml, /Persisted export rectification/);
    assert.doesNotMatch(capturedHtml, /Findings fallback should not be exported when delivery rows exist\./);
  } finally {
    await close(server);
    await close(adapterServer);
    restore();
    await rm(tempDir, { recursive: true, force: true });
  }
});
