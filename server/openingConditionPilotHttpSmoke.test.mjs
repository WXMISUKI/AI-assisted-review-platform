import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { createBackendServer } from "./index.mjs";

const context = {
  workspaceId: "ws-http-smoke",
  tenantId: "tenant-http-smoke",
  projectId: "project-http-smoke",
  contractPackageId: "contract-http-smoke",
  participatingOrganizationId: "org-http-smoke",
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
    headers: body == null ? undefined : { "Content-Type": "application/json" },
    body: body == null ? undefined : JSON.stringify(body),
  });
  const payload = await response.json();
  return {
    statusCode: response.status,
    payload,
  };
}

async function seedWorkspaceFacts(baseUrl) {
  const workspace = encodeURIComponent(context.workspaceId);

  await requestJson(baseUrl, "PUT", `/api/opening-condition/workspaces/${workspace}/basis/basis-http`, {
    title: "HTTP smoke published basis",
    status: "published",
    version: "v1",
    sourceObject: {
      objectId: "basis-object-http",
      kind: "basis",
      fileName: "subcontract-basis.pdf",
      privateUrl: "must-redact",
    },
  });

  await requestJson(baseUrl, "PUT", `/api/opening-condition/workspaces/${workspace}/master-data/md-http`, {
    type: "personnel",
    label: "Safety officer",
    status: "published",
  });

  await requestJson(baseUrl, "PUT", `/api/opening-condition/workspaces/${workspace}/knowledge-bases/kb-http`, {
    organizationId: context.participatingOrganizationId,
    contractPackageId: context.contractPackageId,
    subcontractTeamId: "team-http-smoke",
    label: "HTTP smoke subcontract knowledge base",
    status: "ready",
    summary: "Ready for HTTP smoke.",
    providerRefs: [
      {
        provider: "maxkb",
        id: "kb-http-provider",
        datasetId: "kb-http-provider",
        syncStatus: "ready",
      },
    ],
  });
}

test("HTTP smoke protects the opening-condition pilot delivery chain", async () => {
  const directory = await mkdtemp(join(tmpdir(), "oc-pilot-http-smoke-"));
  const server = createBackendServer({
    openingConditionStorePath: join(directory, "tasks.json"),
  });

  try {
    const baseUrl = await listen(server);
    const previewBasis = await requestJson(
      baseUrl,
      "PUT",
      "/api/opening-condition/workspaces/ws-http-smoke/basis/basis-http-preview",
      {
        title: "HTTP preview basis",
        status: "pending_confirmation",
        sourceObject: {
          objectId: "basis-preview-object-http",
          kind: "basis",
          fileName: "preview-basis.pdf",
          privateUrl: "must-redact",
        },
        ingestionPreview: {
          status: "needs_confirmation",
          source: "metadata_derived",
          facts: {
            projectId: "project-http-smoke",
            contractPackageId: "contract-http-smoke",
            token: "must-redact",
          },
          factSummary: "HTTP smoke preview basis facts.",
          missingFields: [],
          confidence: "medium",
        },
      },
    );
    assert.equal(previewBasis.statusCode, 200);
    assert.equal(previewBasis.payload.basisVersion.ingestionPreview.status, "needs_confirmation");
    assert.equal("privateUrl" in previewBasis.payload.basisVersion.sourceObject, false);
    assert.equal("token" in previewBasis.payload.basisVersion.ingestionPreview.facts, false);

    const blockedPreviewPublish = await requestJson(
      baseUrl,
      "POST",
      "/api/opening-condition/workspaces/ws-http-smoke/basis/basis-http-preview/publish",
      { actorId: "http-smoke-reviewer" },
    );
    assert.equal(blockedPreviewPublish.statusCode, 400);
    assert.equal(blockedPreviewPublish.payload.status, "basis_preview_confirmation_required");

    const confirmedPreview = await requestJson(
      baseUrl,
      "POST",
      "/api/opening-condition/workspaces/ws-http-smoke/basis/basis-http-preview/decision",
      {
        decision: "confirm",
        actorId: "http-smoke-reviewer",
        safeNote: "HTTP smoke confirmed preview facts.",
      },
    );
    assert.equal(confirmedPreview.statusCode, 200);
    assert.equal(confirmedPreview.payload.basisVersion.ingestionPreview.status, "confirmed");

    const publishedPreview = await requestJson(
      baseUrl,
      "POST",
      "/api/opening-condition/workspaces/ws-http-smoke/basis/basis-http-preview/publish",
      { actorId: "http-smoke-reviewer" },
    );
    assert.equal(publishedPreview.statusCode, 200);
    assert.equal(publishedPreview.payload.basisVersion.ingestionPreview.status, "published");

    await seedWorkspaceFacts(baseUrl);

    const intake = await requestJson(baseUrl, "POST", "/api/opening-condition/pilot-tasks/intake-init", {
      taskId: "task-http-run-1",
      context,
      basisVersionId: "basis-http",
      checklistObject: {
        objectId: "checklist-http-1",
        kind: "checklist",
        fileName: "opening-condition-checklist.docx",
      },
      sourceObjects: [
        {
          objectId: "source-http-1",
          kind: "source_archive",
          fileName: "safety-officer-certificate.pdf",
          summary: "safety officer certificate for current contractor package",
        },
      ],
      checklistItems: [
        {
          id: "item-safety-officer",
          category: "Documents",
          subCategory: "Personnel",
          name: "Safety officer certificate",
          required: true,
          expectedEvidenceHints: ["safety officer", "certificate"],
          masterDataIds: ["md-http"],
        },
        {
          id: "item-approval-form",
          category: "Documents",
          subCategory: "Approval",
          name: "Stamped approval form",
          required: true,
          expectedEvidenceHints: ["approval form", "stamp"],
          masterDataIds: [],
        },
      ],
    });

    assert.equal(intake.statusCode, 200);
    assert.equal(intake.payload.ok, true);
    assert.equal(intake.payload.task.state, "packet_uploaded");
    assert.equal(intake.payload.preflightReadiness.status, "ready");

    const matched = await requestJson(baseUrl, "POST", "/api/opening-condition/pilot-tasks/task-http-run-1/match", {});
    assert.equal(matched.statusCode, 200);
    assert.equal(matched.payload.ok, true);
    assert.equal(matched.payload.task.state, "awaiting_human_review");
    assert.equal(matched.payload.checkItems.length, 2);
    assert.equal(matched.payload.humanReviewQueue.length, 1);

    const blockedReport = await requestJson(baseUrl, "POST", "/api/opening-condition/pilot-tasks/task-http-run-1/report", {});
    assert.equal(blockedReport.statusCode, 400);
    assert.equal(blockedReport.payload.status, "human_review_blocking");

    const humanReview = await requestJson(baseUrl, "GET", "/api/opening-condition/pilot-tasks/task-http-run-1/human-review");
    assert.equal(humanReview.statusCode, 200);
    assert.equal(humanReview.payload.blockingCount, 1);
    assert.equal(humanReview.payload.humanReviewQueue[0].targetLabel, "Stamped approval form");

    const decision = await requestJson(
      baseUrl,
      "POST",
      "/api/opening-condition/pilot-tasks/task-http-run-1/human-review/hr-item-approval-form/decision",
      {
        decision: "reject",
        actorId: "http-smoke-reviewer",
        safeNote: "The packet did not include a stable approval-form match.",
        privateUrl: "must-redact",
      },
    );
    assert.equal(decision.statusCode, 200);
    assert.equal(decision.payload.ok, true);
    assert.equal(decision.payload.blockingCount, 0);
    assert.equal(decision.payload.task.state, "report_ready");

    const report = await requestJson(baseUrl, "POST", "/api/opening-condition/pilot-tasks/task-http-run-1/report", {
      objectRef: {
        objectId: "report-http-1",
        kind: "report",
        fileName: "opening-condition-http-smoke-report.md",
        token: "must-redact",
      },
    });
    assert.equal(report.statusCode, 200);
    assert.equal(report.payload.reportAsset.status, "ready");
    assert.equal(report.payload.reportAsset.packageDiagnostics.decisionLedger.length, 1);
    assert.equal("token" in report.payload.reportAsset.objectRef, false);

    const archived = await requestJson(baseUrl, "POST", "/api/opening-condition/pilot-tasks/task-http-run-1/archive", {
      message: "HTTP smoke archived the completed run.",
    });
    assert.equal(archived.statusCode, 200);
    assert.equal(archived.payload.task.state, "archived");
    assert.equal(archived.payload.reportAsset.status, "archived");
    const archivedEventCount = archived.payload.task.events.length;

    const rematchArchived = await requestJson(baseUrl, "POST", "/api/opening-condition/pilot-tasks/task-http-run-1/match", {});
    assert.equal(rematchArchived.statusCode, 400);
    assert.equal(rematchArchived.payload.status, "invalid_state");

    const regenerateArchived = await requestJson(baseUrl, "POST", "/api/opening-condition/pilot-tasks/task-http-run-1/report", {});
    assert.equal(regenerateArchived.statusCode, 400);
    assert.equal(regenerateArchived.payload.status, "invalid_state");

    const reinitializeArchived = await requestJson(baseUrl, "POST", "/api/opening-condition/pilot-tasks/intake-init", {
      taskId: "task-http-run-1",
      context,
      checklistObject: {
        objectId: "checklist-http-archived",
        kind: "checklist",
        fileName: "replacement-checklist.docx",
      },
      sourceObjects: [
        {
          objectId: "source-http-archived",
          kind: "source_archive",
          fileName: "replacement-packet.zip",
        },
      ],
    });
    assert.equal(reinitializeArchived.statusCode, 409);
    assert.equal(reinitializeArchived.payload.status, "invalid_state");

    const nextRun = await requestJson(baseUrl, "POST", "/api/opening-condition/pilot-tasks/intake-init", {
      taskId: "task-http-run-2",
      context,
      basisVersionId: "basis-http",
      checklistObject: {
        objectId: "checklist-http-2",
        kind: "checklist",
        fileName: "rectification-checklist.docx",
      },
      sourceObjects: [
        {
          objectId: "source-http-2",
          kind: "source_archive",
          fileName: "rectification-approval.pdf",
        },
      ],
      checklistItems: [
        {
          id: "item-next-run",
          category: "Documents",
          subCategory: "Approval",
          name: "Rectification approval form",
          expectedEvidenceHints: ["rectification approval"],
          masterDataIds: [],
        },
      ],
    });
    assert.equal(nextRun.statusCode, 200);
    assert.equal(nextRun.payload.task.id, "task-http-run-2");
    assert.equal(nextRun.payload.task.state, "packet_uploaded");

    const listed = await requestJson(baseUrl, "GET", "/api/opening-condition/pilot-tasks");
    const oldRun = listed.payload.tasks.find((task) => task.id === "task-http-run-1");
    const newRun = listed.payload.tasks.find((task) => task.id === "task-http-run-2");
    assert.equal(oldRun.state, "archived");
    assert.equal(oldRun.events.length, archivedEventCount);
    assert.equal(newRun.state, "packet_uploaded");
  } finally {
    await close(server);
    await rm(directory, { recursive: true, force: true });
  }
});
