import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { createBackendServer } from "./index.mjs";

const context = {
  workspaceId: "ws-master-data-preview",
  tenantId: "tenant-master-data-preview",
  projectId: "project-master-data-preview",
  contractPackageId: "contract-master-data-preview",
  participatingOrganizationId: "org-master-data-preview",
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

test("master-data provider preview smoke keeps candidate facts gated and sanitized", async () => {
  const directory = await mkdtemp(join(tmpdir(), "oc-master-data-preview-smoke-"));
  const server = createBackendServer({
    openingConditionStorePath: join(directory, "tasks.json"),
  });

  try {
    const baseUrl = await listen(server);
    const workspace = encodeURIComponent(context.workspaceId);

    const basis = await requestJson(baseUrl, "PUT", `/api/opening-condition/workspaces/${workspace}/basis/basis-master-data`, {
      title: "Published basis for master-data preview smoke",
      status: "published",
      version: "v1",
      sourceObject: {
        objectId: "basis-master-data-object",
        kind: "basis",
        fileName: "published-basis.pdf",
      },
    });
    assert.equal(basis.statusCode, 200);

    const knowledgeBase = await requestJson(
      baseUrl,
      "PUT",
      `/api/opening-condition/workspaces/${workspace}/knowledge-bases/kb-master-data`,
      {
        organizationId: context.participatingOrganizationId,
        contractPackageId: context.contractPackageId,
        subcontractTeamId: "team-master-data-preview",
        label: "Master-data preview smoke KB",
        status: "ready",
        summary: "Ready knowledge base for preview smoke.",
        providerRefs: [
          {
            provider: "maxkb",
            id: "kb-master-data-provider",
            datasetId: "kb-master-data-provider",
            syncStatus: "ready",
          },
        ],
      },
    );
    assert.equal(knowledgeBase.statusCode, 200);

    const provisionalRecord = await requestJson(
      baseUrl,
      "PUT",
      `/api/opening-condition/workspaces/${workspace}/master-data/md-preview`,
      {
        type: "personnel",
        label: "Safety officer candidate",
        status: "provisional",
        normalizedFields: {
          role: "Safety officer",
        },
        evidenceRefs: [
          {
            objectId: "md-evidence-1",
            kind: "evidence",
            fileName: "safety-officer-certificate.pdf",
            privateUrl: "must-redact",
          },
        ],
      },
    );
    assert.equal(provisionalRecord.statusCode, 200);
    assert.equal(provisionalRecord.payload.masterDataRecord.status, "provisional");

    const providerPreview = await requestJson(
      baseUrl,
      "POST",
      `/api/opening-condition/workspaces/${workspace}/master-data/md-preview/provider-preview`,
      {
        providerOutput: {
          provider: "mock-ocr-provider",
          jobId: "job-master-data-preview",
          documentId: "doc-master-data-preview",
          chunkId: "chunk-master-data-preview",
          score: 0.82,
          confidence: "high",
          prompt: "must-redact",
          facts: {
            holderName: "Zhang San",
            certificateNo: "AQ-2026-001",
            token: "must-redact",
            privateUrl: "must-redact",
            rawText: "must-redact",
          },
          snippets: [
            "Safety officer certificate, page 1",
            {
              text: "Role: safety officer",
            },
          ],
        },
        sourceEvidence: [
          {
            fileName: "safety-officer-certificate.pdf",
            privateUrl: "must-redact",
          },
          "project roster page 2",
        ],
        missingFields: ["issueDate"],
        nextAction: "Need operator confirmation before formal matching.",
        safeNote: "Provider preview imported for candidate governance.",
      },
    );
    assert.equal(providerPreview.statusCode, 200);
    assert.equal(providerPreview.payload.ok, true);

    const previewRecord = providerPreview.payload.masterDataRecord;
    assert.equal(previewRecord.status, "provisional");
    assert.equal(previewRecord.readinessGroup, "pending_confirmation");
    assert.deepEqual(
      previewRecord.preview.facts.map((fact) => fact.label),
      ["holderName", "certificateNo"],
    );
    assert.equal(previewRecord.preview.facts.some((fact) => fact.label === "token"), false);
    assert.equal(previewRecord.preview.facts.some((fact) => fact.label === "privateUrl"), false);
    assert.equal(previewRecord.preview.facts.some((fact) => fact.label === "rawText"), false);
    assert.deepEqual(previewRecord.preview.sourceEvidence, ["safety-officer-certificate.pdf", "project roster page 2"]);
    assert.deepEqual(previewRecord.preview.missingFields, ["issueDate"]);
    assert.equal(previewRecord.preview.confidence, "high");
    assert.equal(previewRecord.preview.provenance.provider, "mock-ocr-provider");
    assert.equal("prompt" in previewRecord.preview.provenance, false);

    const intake = await requestJson(baseUrl, "POST", "/api/opening-condition/pilot-tasks/intake-init", {
      taskId: "task-master-data-preview",
      context,
      basisVersionId: "basis-master-data",
      knowledgeBaseId: "kb-master-data",
      requiredMasterDataIds: ["md-preview"],
      checklistObject: {
        objectId: "checklist-master-data-preview",
        kind: "checklist",
        fileName: "master-data-preview-checklist.docx",
      },
      sourceObjects: [
        {
          objectId: "packet-source-master-data-preview",
          kind: "source_archive",
          fileName: "candidate-packet.zip",
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
          masterDataIds: ["md-preview"],
        },
      ],
    });
    assert.equal(intake.statusCode, 200);
    assert.equal(intake.payload.task.state, "blocked_missing_master_data");
    assert.equal(intake.payload.preflightReadiness.status, "blocked");
    assert.equal(intake.payload.preflightReadiness.masterData, "missing");
    assert.equal(
      intake.payload.preflightReadiness.blockingReasons.includes("published_master_data_required"),
      true,
    );
  } finally {
    await close(server);
    await rm(directory, { recursive: true, force: true });
  }
});
