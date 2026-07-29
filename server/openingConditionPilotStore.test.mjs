import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { extractOpeningConditionZipManifestEntries } from "./openingConditionZipManifest.mjs";
import {
  archiveOpeningConditionPilotTask,
  bindOpeningConditionPilotKnowledgeBase,
  bootstrapOpeningConditionPilotTrial,
  buildOpeningConditionPilotReportHtml,
  canTransitionOpeningConditionPilotTask,
  completeOpeningConditionPilotHumanReview,
  decideOpeningConditionPilotBasisPreview,
  decideOpeningConditionPilotHumanReviewItem,
  decideOpeningConditionPilotMasterDataRecord,
  deleteOpeningConditionPilotTask,
  deriveOpeningConditionPilotPreflightReadiness,
  generateOpeningConditionPilotReport,
  initializeOpeningConditionPilotTaskIntake,
  ingestOpeningConditionPilotPacketContentFacts,
  intakeOpeningConditionPilotPacket,
  getOpeningConditionPilotTask,
  getOpeningConditionPilotTaskReadiness,
  listOpeningConditionPilotKnowledgeBases,
  listOpeningConditionPilotHumanReviewItems,
  listOpeningConditionPilotBasisVersions,
  listOpeningConditionPilotTasks,
  listOpeningConditionPilotMasterData,
  publishOpeningConditionPilotBasisVersion,
  refreshOpeningConditionPilotBasisPreview,
  recordOpeningConditionPilotReportDocumentExport,
  runOpeningConditionPilotChecklistMatch,
  sanitizeOpeningConditionPilotValue,
  transitionOpeningConditionPilotTask,
  upsertOpeningConditionPilotBasisVersion,
  upsertOpeningConditionPilotKnowledgeBase,
  upsertOpeningConditionPilotMasterDataRecord,
  upsertOpeningConditionPilotTask,
  validateOpeningConditionPilotTaskInput,
} from "./openingConditionPilotStore.mjs";

const zipFixtureBase64 =
  "UEsDBBQAAAgIAFqN8VxOe43fEAAAAA4AAAAgAAAA5Lq65ZGYXOS4k+iBjOWuieWFqOWRmOivgeS5pi50eHR7v3t/WmZFSWlRqm4iLxcAUEsDBBQAAAgIAFqN8VwXxcvdEAAAAA4AAAAgAAAA6K6+5aSHXOaxvei9puWQiuajgOmqjOaKpeWRii50eHR7v3t/WmZFSWlRqm4SLxcAUEsBAhQAFAAACAgAWo3xXE57jd8QAAAADgAAACAAAAAAAAAAAAAAAAAAAAAAAOS6uuWRmFzkuJPogYzlronlhajlkZjor4HkuaYudHh0UEsBAhQAFAAACAgAWo3xXBfFy90QAAAADgAAACAAAAAAAAAAAAAAAAAATgAAAOiuvuWkh1zmsb3ovablkIrmo4DpqozmiqXlkYoudHh0UEsFBgAAAAACAAIAnAAAAJwAAAAAAA==";
const zipFixtureBuffer = Buffer.from(zipFixtureBase64, "base64");

const crc32Table = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function crc32(buffer) {
  let value = 0xffffffff;
  for (const byte of buffer) {
    value = crc32Table[(value ^ byte) & 0xff] ^ (value >>> 8);
  }
  return (value ^ 0xffffffff) >>> 0;
}

function createStoredZipBuffer(entries) {
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuffer = Buffer.from(entry.name, "utf8");
    const dataBuffer = Buffer.from(entry.content ?? "", "utf8");
    const checksum = crc32(dataBuffer);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(checksum, 14);
    localHeader.writeUInt32LE(dataBuffer.length, 18);
    localHeader.writeUInt32LE(dataBuffer.length, 22);
    localHeader.writeUInt16LE(nameBuffer.length, 26);
    localHeader.writeUInt16LE(0, 28);
    localParts.push(localHeader, nameBuffer, dataBuffer);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(checksum, 16);
    centralHeader.writeUInt32LE(dataBuffer.length, 20);
    centralHeader.writeUInt32LE(dataBuffer.length, 24);
    centralHeader.writeUInt16LE(nameBuffer.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, nameBuffer);

    offset += localHeader.length + nameBuffer.length + dataBuffer.length;
  }

  const centralOffset = offset;
  const centralDirectory = Buffer.concat(centralParts);
  const endHeader = Buffer.alloc(22);
  endHeader.writeUInt32LE(0x06054b50, 0);
  endHeader.writeUInt16LE(0, 4);
  endHeader.writeUInt16LE(0, 6);
  endHeader.writeUInt16LE(entries.length, 8);
  endHeader.writeUInt16LE(entries.length, 10);
  endHeader.writeUInt32LE(centralDirectory.length, 12);
  endHeader.writeUInt32LE(centralOffset, 16);
  endHeader.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDirectory, endHeader]);
}

function validTaskInput() {
  return {
    context: {
      workspaceId: "ws-1",
      tenantId: "tenant-1",
      projectId: "project-1",
      contractPackageId: "contract-1",
      participatingOrganizationId: "org-1",
    },
    basisVersion: {
      id: "basis-1",
      workspaceId: "ws-1",
      version: "v1",
      status: "published",
      publishedAt: "2026-07-16T00:00:00.000Z",
    },
    requiredMasterData: [
      {
        id: "md-1",
        workspaceId: "ws-1",
        type: "personnel",
        status: "published",
        label: "专职安全员",
      },
    ],
    knowledgeBaseRef: {
      id: "kb-1",
      workspaceId: "ws-1",
      organizationId: "org-1",
      contractPackageId: "contract-1",
      subcontractTeamId: "team-1",
      label: "承台施工分包队伍知识库",
      status: "ready",
      summary: "已确认人员、设备、证照和历史修正摘要。",
    },
  };
}

test("validates required pilot workspace context", () => {
  const result = validateOpeningConditionPilotTaskInput({ context: { workspaceId: "ws-1" } });

  assert.equal(result.ok, false);
  assert.match(result.errors.join("\n"), /tenantId/);
});

test("redacts unsafe diagnostic fields recursively", () => {
  const sanitized = sanitizeOpeningConditionPilotValue({
    safe: "ok",
    token: "secret-token",
    nested: {
      providerTrace: "raw trace",
      summary: "bounded summary",
      privateUrl: "https://private.example",
    },
  });

  assert.deepEqual(sanitized, {
    safe: "ok",
    nested: {
      summary: "bounded summary",
    },
  });
});

test("enforces opening-condition pilot state transitions", () => {
  assert.equal(canTransitionOpeningConditionPilotTask("ready_for_packet", "packet_uploaded"), true);
  assert.equal(canTransitionOpeningConditionPilotTask("archived", "matching"), false);
  assert.equal(canTransitionOpeningConditionPilotTask("unknown", "matching"), false);
});

test("persists and transitions pilot tasks through the local adapter", async () => {
  const directory = await mkdtemp(join(tmpdir(), "oc-pilot-store-"));
  const storePath = join(directory, "tasks.json");

  try {
    const created = await upsertOpeningConditionPilotTask("task-1", validTaskInput(), { storePath });
    assert.equal(created.ok, true);
    assert.equal(created.task.state, "ready_for_packet");

    const transitioned = await transitionOpeningConditionPilotTask(
      "task-1",
      "packet_uploaded",
      {
        type: "packet.uploaded",
        message: "资料包已接收。",
        safeDiagnostics: {
          token: "must-redact",
          fileCount: 2,
        },
      },
      { storePath },
    );

    assert.equal(transitioned.ok, true);
    assert.equal(transitioned.task.state, "packet_uploaded");
    assert.equal(transitioned.event.safeDiagnostics.fileCount, 2);
    assert.equal("token" in transitioned.event.safeDiagnostics, false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("publishes one basis version per workspace and supersedes the previous published version", async () => {
  const directory = await mkdtemp(join(tmpdir(), "oc-pilot-basis-"));
  const storePath = join(directory, "tasks.json");

  try {
    await upsertOpeningConditionPilotBasisVersion(
      "ws-1",
      "basis-1",
      {
        title: "合同依据",
        status: "confirmed",
        sourceObject: {
          objectId: "obj-1",
          kind: "basis",
          fileName: "合同.pdf",
          privateUrl: "must-redact",
        },
      },
      { storePath },
    );
    await publishOpeningConditionPilotBasisVersion("ws-1", "basis-1", { actorId: "reviewer-1" }, { storePath });

    await upsertOpeningConditionPilotBasisVersion(
      "ws-1",
      "basis-2",
      {
        title: "补充协议",
        status: "confirmed",
      },
      { storePath },
    );
    await publishOpeningConditionPilotBasisVersion("ws-1", "basis-2", { actorId: "reviewer-2" }, { storePath });

    const listed = await listOpeningConditionPilotBasisVersions("ws-1", { storePath });
    const first = listed.basisVersions.find((item) => item.id === "basis-1");
    const second = listed.basisVersions.find((item) => item.id === "basis-2");

    assert.equal(first.status, "superseded");
    assert.equal(second.status, "published");
    assert.equal("privateUrl" in first.sourceObject, false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("requires human-confirmed basis ingestion preview before publication", async () => {
  const directory = await mkdtemp(join(tmpdir(), "oc-pilot-basis-preview-"));
  const storePath = join(directory, "tasks.json");

  try {
    const upserted = await upsertOpeningConditionPilotBasisVersion(
      "ws-1",
      "basis-preview-1",
      {
        title: "Contract and qualification basis",
        status: "pending_confirmation",
        sourceObject: {
          objectId: "basis-object-1",
          kind: "basis",
          fileName: "contract-basis.pdf",
          privateUrl: "must-redact",
        },
        ingestionPreview: {
          status: "needs_confirmation",
          source: "metadata_derived",
          facts: {
            projectId: "project-1",
            contractPackageId: "contract-1",
            rawText: "must-redact",
          },
          factSummary: "Preview generated from uploaded basis metadata.",
          missingFields: [],
          confidence: "medium",
          token: "must-redact",
        },
      },
      { storePath },
    );

    assert.equal(upserted.ok, true);
    assert.equal(upserted.basisVersion.ingestionPreview.status, "needs_confirmation");
    assert.equal(upserted.basisVersion.ingestionPreview.provenance.extractor, "deterministic_basis_preview_v1");
    assert.equal("privateUrl" in upserted.basisVersion.sourceObject, false);
    assert.equal("rawText" in upserted.basisVersion.ingestionPreview.facts, false);
    assert.equal("token" in upserted.basisVersion.ingestionPreview, false);

    const refreshed = await refreshOpeningConditionPilotBasisPreview(
      "ws-1",
      "basis-preview-1",
      {
        projectId: "project-1",
        contractPackageId: "contract-1",
        participatingOrganizationId: "org-1",
        previewText:
          "项目名称：ws-1 trial project\n施工单位：Preview subcontract team\n资质范围：trial qualification boundary\n人员范围：project manager and safety officer\n设备范围：crane and pump equipment\n有效期：2026-07-23 至 2026-08-23",
      },
      { storePath },
    );
    assert.equal(refreshed.ok, true);
    assert.equal(refreshed.basisVersion.status, "pending_confirmation");
    assert.equal(refreshed.basisVersion.ingestionPreview.status, "needs_confirmation");
    assert.equal(refreshed.basisVersion.ingestionPreview.provenance.source, "metadata_and_text");

    const blockedPublish = await publishOpeningConditionPilotBasisVersion(
      "ws-1",
      "basis-preview-1",
      { actorId: "reviewer-1" },
      { storePath },
    );
    assert.equal(blockedPublish.ok, false);
    assert.equal(blockedPublish.status, "basis_preview_confirmation_required");

    const confirmed = await decideOpeningConditionPilotBasisPreview(
      "ws-1",
      "basis-preview-1",
      {
        decision: "confirm",
        actorId: "reviewer-1",
        safeNote: "Preview facts are acceptable for trial publication.",
      },
      { storePath },
    );
    assert.equal(confirmed.ok, true);
    assert.equal(confirmed.basisVersion.status, "confirmed");
    assert.equal(confirmed.basisVersion.ingestionPreview.status, "confirmed");

    const published = await publishOpeningConditionPilotBasisVersion(
      "ws-1",
      "basis-preview-1",
      { actorId: "reviewer-1" },
      { storePath },
    );
    assert.equal(published.ok, true);
    assert.equal(published.basisVersion.status, "published");
    assert.equal(published.basisVersion.ingestionPreview.status, "published");

    await upsertOpeningConditionPilotMasterDataRecord(
      "ws-1",
      "md-1",
      {
        type: "personnel",
        label: "Safety officer",
        status: "published",
      },
      { storePath },
    );
    await upsertOpeningConditionPilotKnowledgeBase(
      "ws-1",
      "kb-1",
      {
        organizationId: "org-1",
        contractPackageId: "contract-1",
        subcontractTeamId: "team-1",
        label: "Preview smoke KB",
        status: "ready",
      },
      { storePath },
    );
    await upsertOpeningConditionPilotMasterDataRecord(
      "ws-1",
      "md-1",
      {
        id: "md-1",
        workspaceId: "ws-1",
        type: "system_document",
        label: "试点资料包主数据",
        status: "published",
      },
      { storePath },
    );
    await upsertOpeningConditionPilotMasterDataRecord(
      "ws-1",
      "md-1",
      {
        type: "system_document",
        label: "试点资料包主数据",
        status: "published",
      },
      { storePath },
    );

    const initialized = await initializeOpeningConditionPilotTaskIntake(
      {
        taskId: "task-preview-1",
        context: validTaskInput().context,
        basisVersionId: "basis-preview-1",
        checklistObject: {
          objectId: "checklist-1",
          kind: "checklist",
          fileName: "opening-condition-checklist.docx",
        },
        sourceObjects: [
          {
            objectId: "source-1",
            kind: "source_archive",
            fileName: "safety-officer-certificate.pdf",
          },
        ],
      },
      { storePath },
    );
    assert.equal(initialized.ok, true);
    assert.equal(initialized.preflightReadiness.status, "ready");
    assert.equal(initialized.task.basisVersion.ingestionPreview.status, "published");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("records master-data decisions with safe notes only", async () => {
  const directory = await mkdtemp(join(tmpdir(), "oc-pilot-master-"));
  const storePath = join(directory, "tasks.json");

  try {
    await upsertOpeningConditionPilotMasterDataRecord(
      "ws-1",
      "md-1",
      {
        type: "personnel",
        label: "安全员",
        normalizedFields: {
          name: "张工",
          token: "must-redact",
        },
        status: "confirmed",
      },
      { storePath },
    );

    const approved = await decideOpeningConditionPilotMasterDataRecord(
      "ws-1",
      "md-1",
      {
        decision: "approve",
        actorId: "reviewer-1",
        safeNote: "current run checked",
      },
      { storePath },
    );

    assert.equal(approved.ok, true);
    assert.equal(approved.masterDataRecord.status, "human_approved");
    assert.equal(approved.masterDataRecord.publishedAt, undefined);
    assert.equal(approved.masterDataRecord.readinessGroup, "current_run_confirmed");
    assert.equal(approved.masterDataRecord.preview.lifecycleLabel, "Confirmed for current pilot run");
    assert.equal(approved.masterDataRecord.preview.facts.some((fact) => fact.label === "name"), true);

    const decided = await decideOpeningConditionPilotMasterDataRecord(
      "ws-1",
      "md-1",
      {
        decision: "publish",
        actorId: "reviewer-1",
        safeNote: "证书有效。",
      },
      { storePath },
    );
    const listed = await listOpeningConditionPilotMasterData("ws-1", { storePath });

    assert.equal(decided.ok, true);
    assert.equal(decided.masterDataRecord.status, "published");
    assert.equal(decided.masterDataRecord.readinessGroup, "published");
    assert.equal(decided.masterDataRecord.preview.lifecycleLabel, "Published reusable workspace fact");
    assert.equal(listed.masterDataRecords[0].normalizedFields.name, "张工");
    assert.equal("token" in listed.masterDataRecords[0].normalizedFields, false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("derives preflight readiness with basis, master-data, knowledge-base, and packet reasons", () => {
  const missingAll = deriveOpeningConditionPilotPreflightReadiness({
    context: validTaskInput().context,
  });
  assert.equal(missingAll.status, "provisional");
  assert.equal(missingAll.basis, "missing");
  assert.equal(missingAll.masterData, "missing");
  assert.equal(missingAll.knowledgeBase, "missing");
  assert.deepEqual(missingAll.blockingReasons, [
    "published_basis_required",
    "published_master_data_required",
    "subcontract_knowledge_base_required",
  ]);

  const readyForPacket = deriveOpeningConditionPilotPreflightReadiness(validTaskInput());
  assert.equal(readyForPacket.status, "ready");
  assert.equal(readyForPacket.basis, "ready");
  assert.equal(readyForPacket.masterData, "ready");
  assert.equal(readyForPacket.knowledgeBase, "ready");
  assert.equal(readyForPacket.materialPacket, "missing");

  const provisionalKnowledgeBase = deriveOpeningConditionPilotPreflightReadiness({
    ...validTaskInput(),
    knowledgeBaseRef: {
      ...validTaskInput().knowledgeBaseRef,
      status: "needs_review",
    },
  });
  assert.equal(provisionalKnowledgeBase.status, "provisional");
  assert.equal(provisionalKnowledgeBase.knowledgeBase, "provisional");
  assert.deepEqual(provisionalKnowledgeBase.blockingReasons, ["subcontract_knowledge_base_required"]);

  const staleProviderKnowledgeBase = deriveOpeningConditionPilotPreflightReadiness({
    ...validTaskInput(),
    knowledgeBaseRef: {
      ...validTaskInput().knowledgeBaseRef,
      providerRefs: [
        {
          provider: "ragflow",
          id: "dataset-1",
          datasetId: "dataset-1",
          syncStatus: "stale",
        },
      ],
    },
  });
  assert.equal(staleProviderKnowledgeBase.status, "provisional");
  assert.equal(staleProviderKnowledgeBase.knowledgeBase, "stale");
  assert.deepEqual(staleProviderKnowledgeBase.blockingReasons, [
    "subcontract_knowledge_base_required",
    "subcontract_knowledge_base_provider_stale",
  ]);
});

test("stores and binds subcontract-team knowledge bases without exposing unsafe fields as facts", async () => {
  const directory = await mkdtemp(join(tmpdir(), "oc-pilot-kb-"));
  const storePath = join(directory, "tasks.json");

  try {
    await upsertOpeningConditionPilotTask(
      "task-1",
      {
        ...validTaskInput(),
        knowledgeBaseRef: undefined,
      },
      { storePath },
    );

    const upserted = await upsertOpeningConditionPilotKnowledgeBase(
      "ws-1",
      "kb-team-1",
      {
        organizationId: "org-1",
        contractPackageId: "contract-1",
        subcontractTeamId: "team-1",
        label: "承台施工分包队伍知识库",
        status: "ready",
        summary: "沉淀模板、历史证据摘要和人工修正记录。",
        rawText: "must-redact",
        entries: [
          {
            id: "kb-entry-1",
            type: "human_correction",
            title: "签章日期复核修正",
            summary: "审批表签章日期需人工确认后再进入报告。",
            masterDataIds: ["md-1"],
            evidenceIds: ["ev-1"],
            sourceObject: {
              objectId: "source-1",
              kind: "evidence",
              fileName: "开工申请审批表.pdf",
              privateUrl: "must-redact",
            },
          },
        ],
      },
      { storePath },
    );
    assert.equal(upserted.ok, true);
    assert.equal(upserted.knowledgeBase.entries.length, 1);
    assert.equal("rawText" in upserted.knowledgeBase, false);
    assert.equal("privateUrl" in upserted.knowledgeBase.entries[0].sourceObject, false);

    const listed = await listOpeningConditionPilotKnowledgeBases("ws-1", { storePath });
    assert.equal(listed.ok, true);
    assert.equal(listed.knowledgeBases.length, 1);
    assert.equal(listed.knowledgeBases[0].entries[0].type, "human_correction");

    const bound = await bindOpeningConditionPilotKnowledgeBase("task-1", "kb-team-1", { storePath });
    assert.equal(bound.ok, true);
    assert.equal(bound.task.knowledgeBaseRef.id, "kb-team-1");
    assert.equal(bound.preflightReadiness.knowledgeBase, "ready");
    assert.equal(bound.preflightReadiness.status, "ready");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("upserting a task preserves workspace operational records and exposes readiness", async () => {
  const directory = await mkdtemp(join(tmpdir(), "oc-pilot-operational-"));
  const storePath = join(directory, "tasks.json");

  try {
    await upsertOpeningConditionPilotKnowledgeBase(
      "ws-1",
      "kb-team-1",
      {
        organizationId: "org-1",
        contractPackageId: "contract-1",
        subcontractTeamId: "team-1",
        label: "承台施工分包队伍知识库",
        status: "ready",
        summary: "已确认资料模板和人工修正记录。",
      },
      { storePath },
    );

    await upsertOpeningConditionPilotTask("task-1", validTaskInput(), { storePath });
    await upsertOpeningConditionPilotTask(
      "task-2",
      {
        ...validTaskInput(),
        knowledgeBaseRef: undefined,
      },
      { storePath },
    );

    const listed = await listOpeningConditionPilotKnowledgeBases("ws-1", { storePath });
    assert.equal(listed.knowledgeBases.length, 1);

    const readiness = await getOpeningConditionPilotTaskReadiness("task-2", { storePath });
    assert.equal(readiness.ok, true);
    assert.equal(readiness.preflightReadiness.knowledgeBase, "missing");
    assert.deepEqual(readiness.preflightReadiness.blockingReasons, ["subcontract_knowledge_base_required"]);

    const bound = await bindOpeningConditionPilotKnowledgeBase("task-2", "kb-team-1", { storePath });
    assert.equal(bound.ok, true);
    assert.equal(bound.preflightReadiness.status, "ready");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("initializes intake from workspace facts in one orchestration flow", async () => {
  const directory = await mkdtemp(join(tmpdir(), "oc-pilot-intake-init-"));
  const storePath = join(directory, "tasks.json");

  try {
    await upsertOpeningConditionPilotBasisVersion(
      "ws-1",
      "basis-1",
      {
        title: "承台施工分包合同",
        status: "published",
        version: "v1",
        publishedAt: "2026-07-17T00:00:00.000Z",
        sourceObject: {
          objectId: "basis-object-1",
          kind: "basis",
          fileName: "承台施工分包合同.pdf",
        },
      },
      { storePath },
    );
    await upsertOpeningConditionPilotMasterDataRecord(
      "ws-1",
      "md-1",
      {
        type: "personnel",
        label: "专职安全员",
        status: "published",
      },
      { storePath },
    );
    await upsertOpeningConditionPilotKnowledgeBase(
      "ws-1",
      "kb-1",
      {
        organizationId: "org-1",
        contractPackageId: "contract-1",
        subcontractTeamId: "team-1",
        label: "承台施工分包队伍知识库",
        status: "ready",
        summary: "已确认分包资料模板。",
      },
      { storePath },
    );

    const initialized = await initializeOpeningConditionPilotTaskIntake(
      {
        taskId: "task-init-1",
        context: validTaskInput().context,
        basisVersionId: "basis-1",
        checklistObject: {
          objectId: "checklist-1",
          kind: "checklist",
          fileName: "承台施工条件核查表.docx",
        },
        sourceObjects: [
          {
            objectId: "source-1",
            kind: "source_archive",
            fileName: "承台开工资料包.zip",
          },
        ],
      },
      { storePath },
    );

    assert.equal(initialized.ok, true);
    assert.equal(initialized.task.state, "packet_uploaded");
    assert.equal(initialized.task.basisVersion.id, "basis-1");
    assert.equal(initialized.task.basisVersion.sourceObject.objectId, "basis-object-1");
    assert.equal(initialized.task.knowledgeBaseRef.id, "kb-1");
    assert.equal(initialized.preflightReadiness.status, "ready");
    assert.equal(initialized.intake.knowledgeBaseResolution, "auto_bound_single_ready");
    assert.equal(initialized.intake.inventoryResolution, "derived_from_source_objects");
    assert.equal(initialized.intake.inventoryEntryCount, 1);
    assert.equal(initialized.intake.checklistDefinitionResolution, "derived_from_template");
    assert.equal(initialized.intake.selectedChecklistTemplateId, "pier-cap-opening-condition-checklist");
    assert.equal(initialized.task.checklistDefinition.length, 22);
    assert.equal(initialized.task.packet.inventoryEntries.length, 1);
    assert.equal(initialized.task.checklistDefinition[0].id, "1-1-1");
    assert.equal(initialized.task.checklistDefinition[0].expectedEvidenceHints.includes("施工单位营业执照"), true);
    assert.equal(initialized.task.checklistDefinition[21].rowIndex, 24);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("prefers uploaded checklist extraction over templates and can delete history tasks", async () => {
  const directory = await mkdtemp(join(tmpdir(), "oc-pilot-dynamic-checklist-"));
  const storePath = join(directory, "tasks.json");

  try {
    await upsertOpeningConditionPilotBasisVersion(
      "ws-1",
      "basis-1",
      {
        title: "Dynamic checklist basis",
        status: "published",
      },
      { storePath },
    );
    await upsertOpeningConditionPilotMasterDataRecord(
      "ws-1",
      "md-system-1",
      {
        type: "system_document",
        label: "business license qualification certificate",
        status: "published",
      },
      { storePath },
    );
    await upsertOpeningConditionPilotKnowledgeBase(
      "ws-1",
      "kb-1",
      {
        organizationId: "org-1",
        contractPackageId: "contract-1",
        subcontractTeamId: "team-1",
        label: "Dynamic checklist KB",
        status: "ready",
      },
      { storePath },
    );

    const initialized = await initializeOpeningConditionPilotTaskIntake(
      {
        taskId: "task-dynamic-checklist-1",
        context: validTaskInput().context,
        basisVersionId: "basis-1",
        checklistObject: {
          objectId: "checklist-dynamic-1",
          kind: "checklist",
          fileName: "pier-cap-opening-condition-checklist.docx",
          storageKey: "checklists/dynamic.docx",
        },
        sourceObjects: [
          {
            objectId: "source-dynamic-1",
            kind: "source_archive",
            fileName: "business-license.pdf",
          },
        ],
      },
      {
        storePath,
        readObjectBuffer: async () => ({ buffer: Buffer.from("fake-docx") }),
        extractChecklistDefinitionFromBuffer: async () => [
          {
            id: "dynamic-1",
            category: "资料核查",
            subCategory: "人员",
            name: "Business license and qualification certificate are complete.★",
            required: true,
            expectedEvidenceHints: ["business license", "qualification certificate"],
            rowIndex: 3,
          },
        ],
      },
    );

    assert.equal(initialized.ok, true);
    assert.equal(initialized.intake.checklistDefinitionResolution, "derived_from_uploaded_checklist");
    assert.equal(initialized.task.checklistDefinition.length, 1);
    assert.equal(initialized.task.checklistDefinition[0].id, "dynamic-1");
    assert.equal(initialized.task.checklistDefinition[0].name.includes("Business license"), true);

    const listedBeforeDelete = await listOpeningConditionPilotTasks({ storePath });
    assert.equal(listedBeforeDelete.tasks.some((task) => task.id === "task-dynamic-checklist-1"), true);

    const deleted = await deleteOpeningConditionPilotTask("task-dynamic-checklist-1", { storePath });
    assert.equal(deleted.ok, true);
    assert.equal(deleted.deleted, true);

    const listedAfterDelete = await listOpeningConditionPilotTasks({ storePath });
    assert.equal(listedAfterDelete.tasks.some((task) => task.id === "task-dynamic-checklist-1"), false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("bootstraps a single-project trial with MaxKB refs and ZIP manifest inventory", async () => {
  const directory = await mkdtemp(join(tmpdir(), "oc-pilot-trial-bootstrap-"));
  const storePath = join(directory, "tasks.json");

  try {
    const result = await bootstrapOpeningConditionPilotTrial(
      {
        taskId: "task-trial-1",
        context: validTaskInput().context,
        basisObject: {
          objectId: "basis-object-1",
          kind: "basis",
          fileName: "结构资质报审表及附件(1).pdf",
          storageKey: "basis.pdf",
          privateUrl: "must-redact",
        },
        checklistObject: {
          objectId: "checklist-object-1",
          kind: "checklist",
          fileName: "承台施工条件核查表.docx",
          storageKey: "checklist.docx",
        },
        sourceObjects: [
          {
            objectId: "packet-object-1",
            kind: "source_archive",
            fileName: "条件核查.zip",
            storageKey: "packet.zip",
            token: "must-redact",
          },
        ],
        knowledgeBaseProviderRef: {
          provider: "maxkb",
          id: "019f787c-644e-7162-bfe5-f4ee02a91539",
          datasetId: "019f787c-644e-7162-bfe5-f4ee02a91539",
          knowledgeId: "019f787c-644e-7162-bfe5-f4ee02a91539",
          syncStatus: "ready",
        },
        reviewScope: "completeness_and_compliance",
      },
      {
        storePath,
        readObjectBuffer: async () => ({
          buffer: zipFixtureBuffer,
        }),
        uploadObjectBuffer: async ({ filename, contentType, buffer }) => ({
          key: `derived/${filename}`,
          contentType,
          size: buffer.length,
        }),
      },
    );

    assert.equal(result.ok, true, JSON.stringify({ status: result.status, message: result.message, errors: result.errors }));
    assert.equal(result.task.id, "task-trial-1");
    assert.equal(result.task.state, "awaiting_human_review");
    assert.equal(result.task.basisVersion.status, "published");
    assert.equal(result.task.requiredMasterData.length, 3);
    assert.equal(result.task.knowledgeBaseRef.providerRefs[0].provider, "maxkb");
    assert.equal(result.task.knowledgeBaseRef.providerSyncStatus, "ready");
    assert.equal(result.packet.inventoryEntries.length, 2);
    assert.equal(result.intake.inventoryResolution, "derived_from_zip_manifest");
    assert.equal(result.intake.checklistDefinitionResolution, "derived_from_template");
    assert.equal(result.preflightReadiness.status, "ready");
    assert.equal(result.task.trialPackage.status, "awaiting_human_review");
    assert.equal(result.task.trialPackage.inputObjects.sourceCount, 1);
    assert.equal(result.task.trialPackage.diagnostics.inventoryResolution, "derived_from_zip_manifest");
    assert.equal(result.task.trialPackage.diagnostics.inventoryEntryCount, 2);
    assert.equal(result.task.trialPackage.diagnostics.checklistDefinitionResolution, "derived_from_template");
    assert.equal(result.task.trialPackage.providerReadiness.status, "ready");
    assert.equal(result.task.reviewScope, "completeness_and_compliance");
    assert.equal(result.task.checklistDefinition.length, 22);
    assert.equal(result.task.checkItems.length, 22);
    assert.equal(
      result.task.packet.inventoryEntries.every((entry) => entry.assetizationStatus === "derived_object_ready"),
      true,
    );
    assert.equal(
      result.task.packet.inventoryEntries.every((entry) => entry.derivedObjectRef?.storageKey?.startsWith("derived/")),
      true,
    );
    assert.equal(result.task.events.some((event) => event.type === "human_review.waiting"), true);
    assert.equal(result.task.humanReviewQueue.length > 0, true);
    assert.equal(result.orchestration.ok, true);
    assert.equal(result.orchestration.finalState, "awaiting_human_review");
    assert.equal("privateUrl" in result.task.basisVersion.sourceObject, false);
    assert.equal("token" in result.task.packet.sourceObjects[0], false);
    assert.equal("token" in result.task.trialPackage, false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("async trial bootstrap returns early and continues matching in the background", async () => {
  const directory = await mkdtemp(join(tmpdir(), "oc-pilot-trial-bootstrap-async-"));
  const storePath = join(directory, "tasks.json");

  try {
    const result = await bootstrapOpeningConditionPilotTrial(
      {
        taskId: "task-trial-async-1",
        context: validTaskInput().context,
        basisObject: {
          objectId: "basis-object-async-1",
          kind: "basis",
          fileName: "trial-basis.pdf",
          storageKey: "basis.pdf",
        },
        checklistObject: {
          objectId: "checklist-object-async-1",
          kind: "checklist",
          fileName: "鎵垮彴鏂藉伐鏉′欢鏍告煡琛?docx",
          storageKey: "checklist.docx",
        },
        sourceObjects: [
          {
            objectId: "packet-object-async-1",
            kind: "source_archive",
            fileName: "trial-packet.zip",
            storageKey: "packet.zip",
          },
        ],
        checklistItems: [
          {
            id: "async-check-item-1",
            category: "Documents",
            subCategory: "Personnel",
            name: "Async bootstrap safety officer material",
            required: true,
            expectedEvidenceHints: ["safety officer", "certificate"],
            masterDataIds: [],
          },
        ],
        knowledgeBaseProviderRef: {
          provider: "maxkb",
          id: "kb-provider-async",
          datasetId: "kb-provider-async",
          knowledgeId: "kb-provider-async",
          syncStatus: "ready",
        },
        reviewScope: "completeness",
        asyncWorkflow: true,
      },
      {
        storePath,
        readObjectBuffer: async () => ({
          buffer: zipFixtureBuffer,
        }),
        uploadObjectBuffer: async ({ filename, contentType, buffer }) => ({
          key: `derived/${filename}`,
          contentType,
          size: buffer.length,
        }),
      },
    );

    assert.equal(result.ok, true, JSON.stringify({ status: result.status, message: result.message, errors: result.errors }));
    assert.equal(result.orchestration.status, "background_started");
    assert.equal(result.task.state, "packet_uploaded");

    let backgroundTask = result.task;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 25));
      const refreshed = await getOpeningConditionPilotTask("task-trial-async-1", { storePath });
      if (refreshed?.state && refreshed.state !== "packet_uploaded") {
        backgroundTask = refreshed;
        break;
      }
    }

    assert.notEqual(backgroundTask.state, "packet_uploaded");
    assert.ok(
      ["matching", "awaiting_human_review", "report_ready"].includes(backgroundTask.state),
      `unexpected async background state: ${backgroundTask.state}; last event: ${
        backgroundTask.events.at(-1)?.message ?? "none"
      }`,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("extracts bounded ZIP manifest entries from a real archive buffer", async () => {
  const entries = await extractOpeningConditionZipManifestEntries(zipFixtureBuffer, {
    sourceObjectId: "archive-1",
  });

  assert.equal(entries.length, 2);
  assert.deepEqual(
    entries.map((item) => item.relativePath),
    ["人员/专职安全员证书.txt", "设备/汽车吊检验报告.txt"],
  );
  assert.equal(entries[0].sourceObjectId, "archive-1");
  assert.equal(entries[0].fileName, "专职安全员证书.txt");
});

test("assigns stable unique ZIP inventory ids for duplicate basenames in different folders", async () => {
  const duplicateBasenameZipBuffer = createStoredZipBuffer([
    { name: "personnel/docx-4.docx", content: "personnel file" },
    { name: "equipment/docx-4.docx", content: "equipment file" },
  ]);
  const entries = await extractOpeningConditionZipManifestEntries(duplicateBasenameZipBuffer, {
    sourceObjectId: "archive-duplicate",
  });

  assert.equal(entries.length, 2);
  assert.deepEqual(
    entries.map((item) => item.fileName),
    ["docx-4.docx", "docx-4.docx"],
  );
  assert.deepEqual(
    entries.map((item) => item.relativePath),
    ["personnel/docx-4.docx", "equipment/docx-4.docx"],
  );
  assert.equal(new Set(entries.map((item) => item.id)).size, 2);
  assert.equal(
    entries[0].id,
    `archive-duplicate-entry-${Buffer.from("personnel/docx-4.docx", "utf8").toString("base64url")}`,
  );
  assert.equal(
    entries[1].id,
    `archive-duplicate-entry-${Buffer.from("equipment/docx-4.docx", "utf8").toString("base64url")}`,
  );
});

test("initializes packet inventory from ZIP manifest when a readable ZIP source object is provided", async () => {
  const directory = await mkdtemp(join(tmpdir(), "oc-pilot-zip-init-"));
  const storePath = join(directory, "tasks.json");

  try {
    await upsertOpeningConditionPilotBasisVersion(
      "ws-1",
      "basis-1",
      {
        title: "承台施工分包合同",
        status: "published",
      },
      { storePath },
    );
    await upsertOpeningConditionPilotMasterDataRecord(
      "ws-1",
      "md-1",
      {
        type: "personnel",
        label: "专职安全员",
        status: "published",
      },
      { storePath },
    );
    await upsertOpeningConditionPilotKnowledgeBase(
      "ws-1",
      "kb-1",
      {
        organizationId: "org-1",
        contractPackageId: "contract-1",
        subcontractTeamId: "team-1",
        label: "承台施工分包队伍知识库",
        status: "ready",
        summary: "已确认分包资料模板。",
      },
      { storePath },
    );

    const initialized = await initializeOpeningConditionPilotTaskIntake(
      {
        taskId: "task-init-zip",
        context: validTaskInput().context,
        basisVersionId: "basis-1",
        checklistItems: [
          {
            id: "item-person",
            name: "专职安全员证书",
            expectedEvidenceHints: ["专职安全员", "证书", "person-certificate"],
            masterDataIds: ["md-1"],
          },
        ],
        checklistObject: {
          objectId: "checklist-1",
          kind: "checklist",
          fileName: "承台施工条件核查表.docx",
        },
        sourceObjects: [
          {
            objectId: "archive-1",
            kind: "source_archive",
            fileName: "承台开工资料包.zip",
            storageKey: "uploads/archive-1.zip",
          },
        ],
      },
      {
        storePath,
        readObjectBuffer: async () => ({ buffer: zipFixtureBuffer }),
        uploadObjectBuffer: async ({ filename, contentType, buffer }) => ({
          key: `derived/${filename}`,
          contentType,
          size: buffer.length,
        }),
      },
    );

    assert.equal(initialized.ok, true, JSON.stringify({ status: initialized.status, message: initialized.message, errors: initialized.errors }));
    assert.equal(initialized.intake.inventoryResolution, "derived_from_zip_manifest");
    assert.equal(initialized.intake.inventoryEntryCount, 2);
    assert.equal(initialized.intake.inventoryFallbackReason, undefined);
    assert.equal(initialized.task.packet.inventoryEntries[0].derivedObjectRef?.storageKey?.startsWith("derived/"), true);
    assert.equal(initialized.task.packet.inventoryEntries[0].assetizationStatus, "derived_object_ready");
    assert.equal(initialized.task.packet.inventoryEntries[0].relativePath, "人员/专职安全员证书.txt");
    assert.equal(initialized.task.packet.inventoryEntries[1].derivedObjectRef?.storageKey?.startsWith("derived/"), true);
    assert.equal(initialized.task.packet.inventoryEntries[1].assetizationStatus, "derived_object_ready");

    const matchResult = await runOpeningConditionPilotChecklistMatch("task-init-zip", {}, { storePath });
    assert.equal(matchResult.ok, true);
    assert.equal(matchResult.checkItems[0].verdict, "pass");
    assert.equal(matchResult.evidence[0].objectRef.storageKey?.startsWith("derived/"), true);
    assert.equal(matchResult.evidence[0].locator, "人员/专职安全员证书.txt");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("keeps manifest-only ZIP child matches from pretending to have standalone preview objects", async () => {
  const directory = await mkdtemp(join(tmpdir(), "oc-pilot-manifest-only-match-"));
  const storePath = join(directory, "tasks.json");

  try {
    await upsertOpeningConditionPilotBasisVersion(
      "ws-1",
      "basis-1",
      {
        title: "承台施工分包合同",
        status: "published",
      },
      { storePath },
    );
    await upsertOpeningConditionPilotKnowledgeBase(
      "ws-1",
      "kb-1",
      {
        organizationId: "org-1",
        contractPackageId: "contract-1",
        subcontractTeamId: "team-1",
        label: "承台施工分包队伍知识库",
        status: "ready",
      },
      { storePath },
    );
    await upsertOpeningConditionPilotMasterDataRecord(
      "ws-1",
      "md-1",
      {
        type: "system_document",
        label: "试点资料包主数据",
        status: "published",
      },
      { storePath },
    );

    const initialized = await initializeOpeningConditionPilotTaskIntake(
      {
        taskId: "task-manifest-only-match",
        context: validTaskInput().context,
        basisVersionId: "basis-1",
        knowledgeBaseId: "kb-1",
        requiredMasterDataIds: ["md-1"],
        checklistItems: [
          {
            id: "item-permit-contract",
            category: "资料核查",
            subCategory: "许可",
            name: "渣土泥浆外运合同",
            expectedEvidenceHints: ["渣土泥浆外运合同"],
          },
        ],
        checklistObject: {
          objectId: "checklist-1",
          kind: "checklist",
          fileName: "承台施工条件核查表.docx",
        },
        sourceObjects: [
          {
            objectId: "archive-1",
            kind: "source_archive",
            fileName: "条件核查.zip",
            storageKey: "uploads/archive-1.zip",
          },
        ],
        inventoryEntries: [
          {
            id: "archive-1-entry-permit-contract",
            sourceObjectId: "archive-1",
            fileName: "渣土泥浆外运合同.pdf",
            relativePath: "许可/渣土泥浆外运合同.pdf",
            assetizationStatus: "manifest_only",
            fallbackReason: "zip_entry_unsupported",
          },
        ],
        contentFacts: [
          {
            id: "fact-entry-1",
            packetEntryId: "entry-1",
            fileName: "浜哄憳/涓撹亴瀹夊叏鍛樿瘉涔?pdf",
            status: "ready",
            safeSummary: "person-certificate",
            confidence: "high",
          },
        ],
      },
      { storePath },
    );

    assert.equal(initialized.ok, true, JSON.stringify({ status: initialized.status, message: initialized.message, errors: initialized.errors }));
    assert.equal(initialized.task.packet.inventoryEntries[0].assetizationStatus, "manifest_only");

    const matchResult = await runOpeningConditionPilotChecklistMatch("task-manifest-only-match", {}, { storePath });
    assert.equal(
      matchResult.ok,
      true,
      JSON.stringify({
        status: matchResult.status,
        message: matchResult.message,
        errors: matchResult.errors,
        preflightReadiness: matchResult.preflightReadiness,
      }),
    );
    assert.equal(matchResult.checkItems[0].verdict, "needs_human_review");
    assert.equal(matchResult.checkItems[0].documentPresence, "present");
    assert.equal(matchResult.evidence[0].objectRef.fileName, "渣土泥浆外运合同.pdf");
    assert.equal(matchResult.evidence[0].objectRef.storageKey, undefined);
    assert.equal(matchResult.humanReviewQueue.length, 1);
    assert.match(matchResult.humanReviewQueue[0].reason, /独立预览资产/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("reuses existing checklist definition when the new checklist object is not recognized", async () => {
  const directory = await mkdtemp(join(tmpdir(), "oc-pilot-checklist-fallback-"));
  const storePath = join(directory, "tasks.json");

  try {
    await upsertOpeningConditionPilotBasisVersion(
      "ws-1",
      "basis-1",
      {
        title: "承台施工分包合同",
        status: "published",
      },
      { storePath },
    );
    await upsertOpeningConditionPilotMasterDataRecord(
      "ws-1",
      "md-1",
      {
        type: "personnel",
        label: "专职安全员",
        status: "published",
      },
      { storePath },
    );
    await upsertOpeningConditionPilotKnowledgeBase(
      "ws-1",
      "kb-1",
      {
        organizationId: "org-1",
        contractPackageId: "contract-1",
        subcontractTeamId: "team-1",
        label: "承台施工分包队伍知识库",
        status: "ready",
        summary: "ready",
      },
      { storePath },
    );

    await initializeOpeningConditionPilotTaskIntake(
      {
        taskId: "task-init-fallback",
        context: validTaskInput().context,
        basisVersionId: "basis-1",
        checklistItems: [
          {
            id: "item-a",
            category: "资料核查",
            name: "专职安全员证书",
            expectedEvidenceHints: ["专职安全员", "证书", "method-plan", "safety-certificate"],
            masterDataIds: ["md-1"],
          },
        ],
        checklistObject: {
          objectId: "checklist-known",
          kind: "checklist",
          fileName: "人工维护核查表.docx",
        },
        sourceObjects: [
          {
            objectId: "source-1",
            kind: "source_archive",
            fileName: "承台开工资料包.zip",
          },
        ],
      },
      { storePath },
    );

    const reinitialized = await initializeOpeningConditionPilotTaskIntake(
      {
        taskId: "task-init-fallback",
        context: validTaskInput().context,
        basisVersionId: "basis-1",
        checklistObject: {
          objectId: "checklist-unknown",
          kind: "checklist",
          fileName: "未知模板核查表.docx",
        },
        sourceObjects: [
          {
            objectId: "source-2",
            kind: "source_archive",
            fileName: "承台开工资料包-v2.zip",
          },
        ],
      },
      { storePath },
    );

    assert.equal(reinitialized.ok, true);
    assert.equal(reinitialized.intake.checklistDefinitionResolution, "reused_existing_task");
    assert.equal(reinitialized.task.checklistDefinition.length, 1);
    assert.equal(reinitialized.task.checklistDefinition[0].id, "item-a");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("returns manual checklist-definition diagnostics when no source can be resolved", async () => {
  const directory = await mkdtemp(join(tmpdir(), "oc-pilot-checklist-manual-"));
  const storePath = join(directory, "tasks.json");

  try {
    await upsertOpeningConditionPilotBasisVersion(
      "ws-1",
      "basis-1",
      {
        title: "承台施工分包合同",
        status: "published",
      },
      { storePath },
    );
    await upsertOpeningConditionPilotMasterDataRecord(
      "ws-1",
      "md-1",
      {
        type: "personnel",
        label: "专职安全员",
        status: "published",
      },
      { storePath },
    );
    await upsertOpeningConditionPilotKnowledgeBase(
      "ws-1",
      "kb-1",
      {
        organizationId: "org-1",
        contractPackageId: "contract-1",
        subcontractTeamId: "team-1",
        label: "承台施工分包队伍知识库",
        status: "ready",
        summary: "ready",
      },
      { storePath },
    );

    const initialized = await initializeOpeningConditionPilotTaskIntake(
      {
        taskId: "task-init-manual",
        context: validTaskInput().context,
        basisVersionId: "basis-1",
        checklistObject: {
          objectId: "checklist-unknown",
          kind: "checklist",
          fileName: "未知模板核查表.docx",
        },
        sourceObjects: [
          {
            objectId: "source-1",
            kind: "source_archive",
            fileName: "承台开工资料包.zip",
          },
        ],
      },
      { storePath },
    );

    assert.equal(initialized.ok, true);
    assert.equal(initialized.intake.checklistDefinitionResolution, "manual_definition_required");
    assert.equal(initialized.task.checklistDefinition.length, 0);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("keeps intake ready state blocked when multiple knowledge-base candidates exist", async () => {
  const directory = await mkdtemp(join(tmpdir(), "oc-pilot-intake-kb-"));
  const storePath = join(directory, "tasks.json");

  try {
    await upsertOpeningConditionPilotBasisVersion(
      "ws-1",
      "basis-1",
      {
        title: "承台施工分包合同",
        status: "published",
      },
      { storePath },
    );
    await upsertOpeningConditionPilotMasterDataRecord(
      "ws-1",
      "md-1",
      {
        type: "personnel",
        label: "专职安全员",
        status: "published",
      },
      { storePath },
    );
    await upsertOpeningConditionPilotKnowledgeBase(
      "ws-1",
      "kb-1",
      {
        organizationId: "org-1",
        contractPackageId: "contract-1",
        subcontractTeamId: "team-1",
        label: "知识库一",
        status: "ready",
        summary: "ready",
      },
      { storePath },
    );
    await upsertOpeningConditionPilotKnowledgeBase(
      "ws-1",
      "kb-2",
      {
        organizationId: "org-1",
        contractPackageId: "contract-1",
        subcontractTeamId: "team-2",
        label: "知识库二",
        status: "ready",
        summary: "ready",
      },
      { storePath },
    );

    const initialized = await initializeOpeningConditionPilotTaskIntake(
      {
        taskId: "task-init-2",
        context: validTaskInput().context,
        checklistObject: {
          objectId: "checklist-1",
          kind: "checklist",
          fileName: "承台施工条件核查表.docx",
        },
        sourceObjects: [
          {
            objectId: "source-1",
            kind: "source_archive",
            fileName: "承台开工资料包.zip",
          },
        ],
      },
      { storePath },
    );

    assert.equal(initialized.ok, true);
    assert.equal(initialized.task.knowledgeBaseRef, undefined);
    assert.equal(initialized.preflightReadiness.status, "blocked");
    assert.equal(initialized.intake.knowledgeBaseResolution, "multiple_ready_candidates");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("rejects invalid intake/init requests before mutating the store", async () => {
  const directory = await mkdtemp(join(tmpdir(), "oc-pilot-intake-invalid-"));
  const storePath = join(directory, "tasks.json");

  try {
    const result = await initializeOpeningConditionPilotTaskIntake(
      {
        taskId: "task-init-3",
        context: validTaskInput().context,
        sourceObjects: [],
      },
      { storePath },
    );

    assert.equal(result.ok, false);
    assert.equal(result.status, "invalid_input");
    assert.match(result.errors.join("\n"), /checklistObject/);

    const snapshot = await listOpeningConditionPilotTasks({ storePath });
    assert.equal(snapshot.tasks.length, 0);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("intakes a packet as bounded object summaries and records an event", async () => {
  const directory = await mkdtemp(join(tmpdir(), "oc-pilot-packet-"));
  const storePath = join(directory, "tasks.json");

  try {
    await upsertOpeningConditionPilotTask("task-1", validTaskInput(), { storePath });

    const intake = await intakeOpeningConditionPilotPacket(
      "task-1",
      {
        checklistObject: {
          objectId: "checklist-1",
          kind: "checklist",
          fileName: "开工条件核查表.xlsx",
          privateUrl: "must-redact",
        },
        sourceObjects: [
          {
            objectId: "source-1",
            kind: "source_archive",
            fileName: "人员证书.zip",
            token: "must-redact",
          },
          {
            objectId: "source-2",
            kind: "source_archive",
            fileName: "设备资料.zip",
          },
        ],
        inventoryEntries: [
          {
            id: "entry-1",
            sourceObjectId: "source-1",
            fileName: "人员/专职安全员证书.pdf",
            relativePath: "人员/专职安全员证书.pdf",
            summary: "专职安全员证书扫描件",
          },
          {
            id: "entry-2",
            sourceObjectId: "source-2",
            fileName: "设备/汽车吊检验报告.pdf",
            relativePath: "设备/汽车吊检验报告.pdf",
          },
        ],
      },
      { storePath },
    );

    assert.equal(intake.ok, true, JSON.stringify({ status: intake.status, message: intake.message, errors: intake.errors }));
    assert.equal(intake.task.state, "packet_uploaded");
    assert.equal(intake.packet.sourceObjects.length, 2);
    assert.equal(intake.packet.inventoryEntries.length, 2);
    assert.equal("privateUrl" in intake.packet.checklistObject, false);
    assert.equal("token" in intake.packet.sourceObjects[0], false);
    assert.equal(intake.event.safeDiagnostics.inventoryResolution, "direct_input");
    assert.equal(intake.event.safeDiagnostics.inventoryEntryCount, 2);
    assert.deepEqual(intake.event.safeDiagnostics.sourceFileNames, ["人员证书.zip", "设备资料.zip"]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("falls back to source-object inventory when ZIP manifest extraction cannot start", async () => {
  const directory = await mkdtemp(join(tmpdir(), "oc-pilot-zip-fallback-"));
  const storePath = join(directory, "tasks.json");

  try {
    await upsertOpeningConditionPilotTask("task-1", validTaskInput(), { storePath });

    const intake = await intakeOpeningConditionPilotPacket(
      "task-1",
      {
        checklistObject: {
          objectId: "checklist-1",
          kind: "checklist",
          fileName: "开工条件核查表.xlsx",
        },
        sourceObjects: [
          {
            objectId: "archive-1",
            kind: "source_archive",
            fileName: "承台开工资料包.zip",
          },
        ],
      },
      { storePath },
    );

    assert.equal(intake.ok, true);
    assert.equal(intake.task.packet.inventoryEntries.length, 1);
    assert.equal(intake.event.safeDiagnostics.inventoryResolution, "derived_from_source_objects");
    assert.equal(intake.event.safeDiagnostics.inventoryFallbackReason, "zip_storage_key_missing");
    assert.equal(intake.task.packet.inventoryEntries[0].fileName, "承台开工资料包.zip");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("blocks formal checklist matching when preflight readiness is incomplete", async () => {
  const directory = await mkdtemp(join(tmpdir(), "oc-pilot-preflight-block-"));
  const storePath = join(directory, "tasks.json");

  try {
    await upsertOpeningConditionPilotTask(
      "task-1",
      {
        ...validTaskInput(),
        knowledgeBaseRef: undefined,
      },
      { storePath },
    );
    await intakeOpeningConditionPilotPacket(
      "task-1",
      {
        checklistObject: {
          objectId: "checklist-1",
          kind: "checklist",
          fileName: "开工条件核查表.xlsx",
        },
        sourceObjects: [
          {
            objectId: "source-1",
            kind: "source_archive",
            fileName: "专职安全员证书.pdf",
          },
        ],
      },
      { storePath },
    );

    const result = await runOpeningConditionPilotChecklistMatch(
      "task-1",
      {
        checklistItems: [
          {
            id: "item-person",
            name: "专职安全员证书",
            expectedEvidenceHints: ["专职安全员", "person-certificate"],
            masterDataIds: ["md-1"],
          },
        ],
      },
      { storePath },
    );

    assert.equal(result.ok, false);
    assert.equal(result.status, "preflight_blocked");
    assert.equal(result.preflightReadiness.status, "blocked");
    assert.equal(result.preflightReadiness.materialPacket, "ready");
    assert.deepEqual(result.preflightReadiness.blockingReasons, ["subcontract_knowledge_base_required"]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("matches checklist items against packet inventory and opens human review for gaps", async () => {
  const directory = await mkdtemp(join(tmpdir(), "oc-pilot-match-"));
  const storePath = join(directory, "tasks.json");

  try {
    await upsertOpeningConditionPilotTask("task-1", validTaskInput(), { storePath });
    await intakeOpeningConditionPilotPacket(
      "task-1",
      {
        checklistObject: {
          objectId: "checklist-1",
          kind: "checklist",
          fileName: "开工条件核查表.xlsx",
        },
        sourceObjects: [
          {
            objectId: "source-1",
            kind: "source_archive",
            fileName: "专职安全员证书.pdf",
          },
          {
            objectId: "source-2",
            kind: "source_archive",
            fileName: "汽车吊检验报告.pdf",
          },
          {
            objectId: "source-3",
            kind: "source_archive",
            fileName: "汽车吊备案资料.pdf",
          },
        ],
        inventoryEntries: [
          {
            id: "entry-1",
            sourceObjectId: "source-1",
            fileName: "人员/专职安全员证书.pdf",
            derivedObjectRef: {
              objectId: "derived-entry-1",
              kind: "evidence",
              fileName: "???/???????????pdf",
              storageKey: "derived/person-certificate.pdf",
            },
          },
          {
            id: "entry-2",
            sourceObjectId: "source-2",
            fileName: "设备/汽车吊检验报告.pdf",
          },
          {
            id: "entry-3",
            sourceObjectId: "source-3",
            fileName: "设备/汽车吊备案资料.pdf",
          },
        ],
        contentFacts: [
          {
            id: "fact-match-entry-1",
            packetEntryId: "entry-1",
            fileName: "???/???????????pdf",
            status: "ready",
            safeSummary: "person-certificate",
            confidence: "high",
          },
        ],
      },
      { storePath },
    );

    const result = await runOpeningConditionPilotChecklistMatch(
      "task-1",
      {
        checklistItems: [
          {
            id: "item-person",
            name: "专职安全员证书",
            expectedEvidenceHints: ["专职安全员", "证书", "person-certificate"],
            masterDataIds: ["md-1"],
          },
          {
            id: "item-equipment",
            name: "汽车吊检验报告",
            expectedEvidenceHints: ["汽车吊"],
          },
          {
            id: "item-stamp",
            name: "开工申请审批表签章",
            expectedEvidenceHints: ["签章", "审批表"],
          },
          {
            id: "item-missing-master",
            name: "试验人员资格",
            expectedEvidenceHints: ["试验人员"],
            masterDataIds: ["md-missing"],
          },
        ],
      },
      { storePath },
    );

    assert.equal(result.ok, true);
    assert.equal(result.task.state, "awaiting_human_review");
    assert.equal(result.checkItems.find((item) => item.id === "item-person").verdict, "pass");
    assert.equal(result.checkItems.find((item) => item.id === "item-equipment").verdict, "blocked");
    assert.equal(result.checkItems.find((item) => item.id === "item-equipment").finalDisposition, "blocked");
    assert.equal(result.checkItems.find((item) => item.id === "item-stamp").verdict, "needs_human_review");
    assert.equal(result.checkItems.find((item) => item.id === "item-stamp").visualAssertions[0].requiresHumanReview, true);
    assert.equal(result.humanReviewQueue.length, 3);
    assert.equal(result.evidence.some((item) => item.objectRef.fileName === "人员/专职安全员证书.pdf"), true);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("matches against packet inventory entries before coarse source object names", async () => {
  const directory = await mkdtemp(join(tmpdir(), "oc-pilot-packet-inventory-match-"));
  const storePath = join(directory, "tasks.json");

  try {
    await upsertOpeningConditionPilotTask("task-1", validTaskInput(), { storePath });
    await intakeOpeningConditionPilotPacket(
      "task-1",
      {
        checklistObject: {
          objectId: "checklist-1",
          kind: "checklist",
          fileName: "开工条件核查表.xlsx",
        },
        sourceObjects: [
          {
            objectId: "archive-1",
            kind: "source_archive",
            fileName: "承台施工资料包.zip",
          },
        ],
        inventoryEntries: [
          {
            id: "entry-person",
            sourceObjectId: "archive-1",
            fileName: "人员/专职安全员证书.pdf",
            relativePath: "人员/专职安全员证书.pdf",
            derivedObjectRef: {
              objectId: "derived-person",
              kind: "evidence",
              fileName: "???/???????????pdf",
              storageKey: "derived/person.pdf",
            },
          },
        ],
        contentFacts: [
          {
            id: "fact-person",
            packetEntryId: "entry-person",
            fileName: "???/???????????pdf",
            status: "ready",
            safeSummary: "person-certificate",
            confidence: "high",
          },
        ],
      },
      { storePath },
    );

    const result = await runOpeningConditionPilotChecklistMatch(
      "task-1",
      {
        checklistItems: [
          {
            id: "item-person",
            name: "专职安全员证书",
            expectedEvidenceHints: ["专职安全员", "证书", "person-certificate"],
            masterDataIds: ["md-1"],
          },
        ],
      },
      { storePath },
    );

    assert.equal(result.ok, true);
    assert.equal(result.checkItems[0].verdict, "pass");
    assert.equal(result.evidence[0].objectRef.fileName, "人员/专职安全员证书.pdf");
    assert.equal(result.evidence[0].locator, "人员/专职安全员证书.pdf");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("does not use basis or checklist uploads as material evidence candidates", async () => {
  const directory = await mkdtemp(join(tmpdir(), "oc-pilot-basis-not-evidence-"));
  const storePath = join(directory, "tasks.json");

  try {
    await upsertOpeningConditionPilotTask("task-basis-boundary", validTaskInput(), { storePath });
    await intakeOpeningConditionPilotPacket(
      "task-basis-boundary",
      {
        checklistObject: {
          objectId: "checklist-1",
          kind: "checklist",
          fileName: "开工条件核查表.docx",
        },
        sourceObjects: [
          {
            objectId: "basis-source",
            kind: "basis",
            fileName: "结构资质报审表及附件(1).pdf",
            summary: "施工单位营业执照、资质证书、安全生产许可证。",
          },
          {
            objectId: "checklist-source",
            kind: "checklist",
            fileName: "承台施工条件核查表.docx",
            summary: "施工单位营业执照、资质证书、安全生产许可证。",
          },
          {
            objectId: "packet-source",
            kind: "source_archive",
            fileName: "条件核查.zip",
          },
        ],
        inventoryEntries: [
          {
            id: "basis-entry",
            sourceObjectId: "basis-source",
            fileName: "结构资质报审表及附件(1).pdf",
            summary: "施工单位营业执照、资质证书、安全生产许可证。",
          },
          {
            id: "checklist-entry",
            sourceObjectId: "checklist-source",
            fileName: "承台施工条件核查表.docx",
            summary: "施工单位营业执照、资质证书、安全生产许可证。",
          },
          {
            id: "packet-entry",
            sourceObjectId: "packet-source",
            fileName: "资料包/安全协议.pdf",
            summary: "安全协议。",
          },
        ],
      },
      { storePath },
    );

    const result = await runOpeningConditionPilotChecklistMatch(
      "task-basis-boundary",
      {
        checklistItems: [
          {
            id: "item-license",
            name: "施工单位营业执照、资质证书、安全生产许可证齐全",
            expectedEvidenceHints: ["施工单位营业执照", "资质证书", "安全生产许可证"],
            masterDataIds: [],
          },
        ],
      },
      { storePath },
    );

    assert.equal(result.ok, true);
    assert.equal(result.evidence.some((item) => item.objectRef.kind === "basis"), false);
    assert.equal(result.evidence.some((item) => item.objectRef.kind === "checklist"), false);
    assert.equal(result.checkItems[0].evidenceIds.length, 0);
    assert.equal(result.checkItems[0].documentPresence, "missing");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("initializes packet content fact placeholders from packet inventory", async () => {
  const directory = await mkdtemp(join(tmpdir(), "oc-pilot-content-placeholder-"));
  const storePath = join(directory, "tasks.json");

  try {
    await upsertOpeningConditionPilotTask("task-content-placeholders", validTaskInput(), { storePath });
    const intake = await intakeOpeningConditionPilotPacket(
      "task-content-placeholders",
      {
        checklistObject: {
          objectId: "checklist-1",
          kind: "checklist",
          fileName: "opening-condition-checklist.xlsx",
        },
        sourceObjects: [
          {
            objectId: "source-1",
            kind: "evidence",
            fileName: "business-license.pdf",
            storageKey: "uploads/business-license.pdf",
          },
          {
            objectId: "archive-1",
            kind: "source_archive",
            fileName: "packet.zip",
          },
        ],
        inventoryEntries: [
          {
            id: "entry-ready",
            sourceObjectId: "source-1",
            fileName: "business-license.pdf",
            relativePath: "business-license.pdf",
            derivedObjectRef: {
              objectId: "derived-ready",
              kind: "evidence",
              fileName: "business-license.pdf",
              storageKey: "derived/business-license.pdf",
            },
          },
          {
            id: "entry-manifest",
            sourceObjectId: "archive-1",
            fileName: "manifest-only.pdf",
            relativePath: "manifest-only.pdf",
          },
        ],
      },
      { storePath },
    );

    assert.equal(intake.ok, true);
    assert.equal(intake.packet.contentFacts.length, 2);
    assert.equal(intake.packet.contentFacts.find((item) => item.packetEntryId === "entry-ready").status, "pending");
    assert.equal(intake.packet.contentFacts.find((item) => item.packetEntryId === "entry-manifest").status, "unsupported");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("merges provider packet content facts safely into existing placeholders", async () => {
  const directory = await mkdtemp(join(tmpdir(), "oc-pilot-content-provider-"));
  const storePath = join(directory, "tasks.json");

  try {
    await upsertOpeningConditionPilotTask("task-provider-content", validTaskInput(), { storePath });
    await intakeOpeningConditionPilotPacket(
      "task-provider-content",
      {
        checklistObject: {
          objectId: "checklist-1",
          kind: "checklist",
          fileName: "opening-condition-checklist.xlsx",
        },
        sourceObjects: [
          {
            objectId: "source-1",
            kind: "evidence",
            fileName: "business-license.pdf",
            storageKey: "uploads/business-license.pdf",
          },
        ],
      },
      { storePath },
    );

    const result = await ingestOpeningConditionPilotPacketContentFacts(
      "task-provider-content",
      {
        provider: "maxkb",
        providerJobId: "job-1",
        contentFacts: [
          {
            sourceObjectId: "source-1",
            fileName: "business-license.pdf",
            status: "ready",
            safeSummary: "business license content verified by provider",
            rawText: "must redact",
            privateUrl: "https://private.example/object",
            providerDocumentId: "doc-1",
            providerChunkId: "chunk-1",
            providerScore: 0.91,
          },
        ],
      },
      { storePath },
    );

    assert.equal(result.ok, true);
    assert.equal(result.contentFacts.length, 1);
    assert.equal(result.contentFacts[0].status, "ready");
    assert.equal(result.contentFacts[0].provider, "maxkb");
    assert.equal(result.contentFacts[0].safeSummary, "business license content verified by provider");
    assert.equal("rawText" in result.contentFacts[0], false);
    assert.equal("privateUrl" in result.contentFacts[0], false);
    assert.equal(result.event.type, "packet.content_facts.ingested");
    assert.equal(result.event.safeDiagnostics.updatedCount, 1);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("uses packet content facts to support semantic material matching", async () => {
  const directory = await mkdtemp(join(tmpdir(), "oc-pilot-content-supported-"));
  const storePath = join(directory, "tasks.json");

  try {
    await upsertOpeningConditionPilotTask("task-content", validTaskInput(), { storePath });
    await intakeOpeningConditionPilotPacket(
      "task-content",
      {
        checklistObject: {
          objectId: "checklist-1",
          kind: "checklist",
          fileName: "opening-condition-checklist.xlsx",
        },
        sourceObjects: [
          {
            objectId: "source-license",
            kind: "evidence",
            fileName: "business-license.pdf",
            storageKey: "uploads/business-license.pdf",
          },
        ],
        inventoryEntries: [
          {
            id: "entry-license",
            sourceObjectId: "source-license",
            fileName: "business-license.pdf",
            relativePath: "basis/business-license.pdf",
            derivedObjectRef: {
              objectId: "derived-license",
              kind: "evidence",
              fileName: "business-license.pdf",
              storageKey: "derived/business-license.pdf",
            },
          },
        ],
        contentFacts: [
          {
            id: "fact-license",
            packetEntryId: "entry-license",
            fileName: "business-license.pdf",
            status: "ready",
            safeSummary: "The submitted file contains a business license for the project contractor.",
            snippets: ["business license registration information"],
            confidence: "high",
          },
        ],
      },
      { storePath },
    );

    const result = await runOpeningConditionPilotChecklistMatch(
      "task-content",
      {
        checklistItems: [
          {
            id: "item-license",
            name: "Business license",
            expectedEvidenceHints: ["business license"],
          },
        ],
      },
      { storePath },
    );

    assert.equal(result.ok, true);
    assert.equal(result.task.state, "report_ready");
    assert.equal(result.checkItems[0].verdict, "pass");
    assert.equal(result.checkItems[0].semanticMatch.mode, "content_fact_semantic_match");
    assert.equal(result.checkItems[0].semanticMatch.contentSupported, true);
    assert.equal(result.humanReviewQueue.length, 0);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("routes filename-only packet matches to human review when content facts are missing", async () => {
  const directory = await mkdtemp(join(tmpdir(), "oc-pilot-filename-only-"));
  const storePath = join(directory, "tasks.json");

  try {
    await upsertOpeningConditionPilotTask("task-filename-only", validTaskInput(), { storePath });
    await intakeOpeningConditionPilotPacket(
      "task-filename-only",
      {
        checklistObject: {
          objectId: "checklist-1",
          kind: "checklist",
          fileName: "opening-condition-checklist.xlsx",
        },
        sourceObjects: [
          {
            objectId: "source-license",
            kind: "evidence",
            fileName: "business-license.pdf",
            storageKey: "uploads/business-license.pdf",
          },
        ],
        inventoryEntries: [
          {
            id: "entry-license",
            sourceObjectId: "source-license",
            fileName: "business-license.pdf",
            relativePath: "basis/business-license.pdf",
            derivedObjectRef: {
              objectId: "derived-license",
              kind: "evidence",
              fileName: "business-license.pdf",
              storageKey: "derived/business-license.pdf",
            },
          },
        ],
      },
      { storePath },
    );

    const result = await runOpeningConditionPilotChecklistMatch(
      "task-filename-only",
      {
        checklistItems: [
          {
            id: "item-license",
            name: "Business license",
            expectedEvidenceHints: ["business license"],
          },
        ],
      },
      { storePath },
    );

    assert.equal(result.ok, true);
    assert.equal(result.task.state, "awaiting_human_review");
    assert.equal(result.checkItems[0].verdict, "needs_human_review");
    assert.equal(result.checkItems[0].semanticMatch.mode, "content_fact_semantic_match");
    assert.equal(result.checkItems[0].semanticMatch.contentUnavailable, true);
    assert.match(result.checkItems[0].semanticNote, /OCR|内容抽取|内容事实/);
    assert.match(result.humanReviewQueue[0].reason, /\u4e0d\u80fd\u4ec5\u51ed\u6587\u4ef6\u540d/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("routes content-fact mismatches to human review and final markdown", async () => {
  const directory = await mkdtemp(join(tmpdir(), "oc-pilot-content-mismatch-report-"));
  const storePath = join(directory, "tasks.json");

  try {
    await upsertOpeningConditionPilotTask("task-content-mismatch", validTaskInput(), { storePath });
    await intakeOpeningConditionPilotPacket(
      "task-content-mismatch",
      {
        checklistObject: {
          objectId: "checklist-1",
          kind: "checklist",
          fileName: "开工条件核查表.xlsx",
        },
        sourceObjects: [
          {
            objectId: "source-license",
            kind: "evidence",
            fileName: "施工单位营业执照.pdf",
            storageKey: "uploads/license.pdf",
          },
        ],
        inventoryEntries: [
          {
            id: "entry-license",
            sourceObjectId: "source-license",
            fileName: "施工单位营业执照.pdf",
            relativePath: "人员/施工单位营业执照.pdf",
            derivedObjectRef: {
              objectId: "derived-license",
              kind: "evidence",
              fileName: "施工单位营业执照.pdf",
              storageKey: "derived/license.pdf",
            },
          },
        ],
        contentFacts: [
          {
            id: "fact-license",
            packetEntryId: "entry-license",
            fileName: "施工单位营业执照.pdf",
            status: "ready",
            safeSummary: "该文件内容摘要显示为项目会议纪要，不包含营业执照登记信息。",
            snippets: ["会议时间、会议地点、参会人员"],
            confidence: "high",
          },
        ],
      },
      { storePath },
    );

    const match = await runOpeningConditionPilotChecklistMatch(
      "task-content-mismatch",
      {
        checklistItems: [
          {
            id: "item-license",
            category: "资料核查",
            subCategory: "资质",
            name: "施工单位营业执照★",
            required: true,
            expectedEvidenceHints: ["营业执照", "登记信息"],
          },
        ],
      },
      { storePath },
    );

    assert.equal(match.ok, true);
    assert.equal(match.task.state, "awaiting_human_review");
    assert.equal(match.checkItems[0].semanticMatch.contentMismatch, true);
    assert.match(match.checkItems[0].semanticNote, /逐文件内容|内容摘要|没有支撑/);
    assert.match(match.humanReviewQueue[0].reason, /逐文件内容|内容摘要|没有证明/);

    const decision = await decideOpeningConditionPilotHumanReviewItem(
      "task-content-mismatch",
      "hr-item-license",
      {
        decision: "correct",
        actorId: "reviewer-1",
        safeNote: "文件名疑似错误，当前资料不能作为施工单位营业执照采信。",
      },
      { storePath },
    );
    assert.equal(decision.ok, true);

    await completeOpeningConditionPilotHumanReview("task-content-mismatch", { actorId: "reviewer-1" }, { storePath });
    const report = await generateOpeningConditionPilotReport("task-content-mismatch", {}, { storePath });

    assert.equal(report.ok, true);
    assert.equal(report.reportAsset.packageDiagnostics.findings.length, 1);
    assert.match(report.reportAsset.markdownContent, /施工单位营业执照/);
    assert.match(report.reportAsset.markdownContent, /文件名疑似错误/);
    assert.doesNotMatch(report.reportAsset.markdownContent, /\| - \| - \| 未发现不符合项/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("replays formal matching from stored task-bound checklist definition", async () => {
  const directory = await mkdtemp(join(tmpdir(), "oc-pilot-checklist-def-"));
  const storePath = join(directory, "tasks.json");

  try {
    await upsertOpeningConditionPilotBasisVersion(
      "ws-1",
      "basis-1",
      {
        title: "承台施工分包合同",
        status: "published",
      },
      { storePath },
    );
    await upsertOpeningConditionPilotMasterDataRecord(
      "ws-1",
      "md-1",
      {
        type: "personnel",
        label: "专职安全员",
        status: "published",
      },
      { storePath },
    );
    await upsertOpeningConditionPilotKnowledgeBase(
      "ws-1",
      "kb-1",
      {
        organizationId: "org-1",
        contractPackageId: "contract-1",
        subcontractTeamId: "team-1",
        label: "承台施工分包队伍知识库",
        status: "ready",
        summary: "ready",
      },
      { storePath },
    );

    await initializeOpeningConditionPilotTaskIntake(
      {
        taskId: "task-1",
        context: validTaskInput().context,
        basisVersionId: "basis-1",
        checklistItems: [
          {
            id: "item-person",
            name: "专职安全员证书",
            expectedEvidenceHints: ["专职安全员", "证书", "person-certificate"],
            masterDataIds: ["md-1"],
          },
        ],
        checklistObject: {
          objectId: "checklist-1",
          kind: "checklist",
          fileName: "开工条件核查表.docx",
        },
        sourceObjects: [
          {
            objectId: "source-1",
            kind: "source_archive",
            fileName: "专职安全员证书.pdf",
            storageKey: "uploads/person.pdf",
          },
        ],
        contentFacts: [
          {
            id: "fact-stored-person",
            sourceObjectId: "source-1",
            fileName: "???????????pdf",
            status: "ready",
            safeSummary: "person-certificate",
            confidence: "high",
          },
        ],
      },
      { storePath },
    );

    const result = await runOpeningConditionPilotChecklistMatch("task-1", {}, { storePath });

    assert.equal(result.ok, true);
    assert.equal(result.task.checklistDefinition.length, 1);
    assert.equal(result.task.checklistDefinition[0].id, "item-person");
    assert.equal(result.checkItems[0].verdict, "pass");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("keeps out-of-scope checklist items from missing-material failures", async () => {
  const directory = await mkdtemp(join(tmpdir(), "oc-pilot-scope-"));
  const storePath = join(directory, "tasks.json");

  try {
    await upsertOpeningConditionPilotTask("task-1", validTaskInput(), { storePath });
    await intakeOpeningConditionPilotPacket(
      "task-1",
      {
        checklistObject: {
          objectId: "checklist-1",
          kind: "checklist",
          fileName: "开工条件核查表.xlsx",
        },
        sourceObjects: [],
      },
      { storePath },
    );

    const result = await runOpeningConditionPilotChecklistMatch(
      "task-1",
      {
        checklistItems: [
          {
            id: "item-site",
            category: "现场核查",
            name: "现场临边防护和应急响应",
            expectedEvidenceHints: ["现场核查"],
          },
        ],
      },
      { storePath },
    );

    const item = result.checkItems[0];
    assert.equal(result.ok, true);
    assert.equal(result.task.state, "report_ready");
    assert.equal(item.scopeStatus, "out_of_scope");
    assert.equal(item.finalDisposition, "not_applicable");
    assert.equal(result.humanReviewQueue.length, 0);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("routes uncertain visual assertions to human review", async () => {
  const directory = await mkdtemp(join(tmpdir(), "oc-pilot-visual-"));
  const storePath = join(directory, "tasks.json");

  try {
    await upsertOpeningConditionPilotTask("task-1", validTaskInput(), { storePath });
    await intakeOpeningConditionPilotPacket(
      "task-1",
      {
        checklistObject: {
          objectId: "checklist-1",
          kind: "checklist",
          fileName: "开工条件核查表.xlsx",
        },
        sourceObjects: [
          {
            objectId: "source-1",
            kind: "source_archive",
            fileName: "开工申请审批表.pdf",
            storageKey: "uploads/opening-approval.pdf",
            summary: "审批表签章疑似完整，签字日期不清晰。",
          },
        ],
      },
      { storePath },
    );

    const result = await runOpeningConditionPilotChecklistMatch(
      "task-1",
      {
        checklistItems: [
          {
            id: "item-visual",
            name: "开工申请审批表签章和签字日期",
            expectedEvidenceHints: ["审批表", "签章", "日期"],
          },
        ],
      },
      { storePath },
    );

    const item = result.checkItems[0];
    assert.equal(result.ok, true);
    assert.equal(result.task.state, "awaiting_human_review");
    assert.equal(item.verdict, "needs_human_review");
    assert.equal(item.visualAssertions[0].status, "uncertain");
    assert.match(result.humanReviewQueue[0].reason, /\u89c6\u89c9|\u7b7e\u540d|\u76d6\u7ae0/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("records human-review decisions and gates report readiness", async () => {
  const directory = await mkdtemp(join(tmpdir(), "oc-pilot-human-"));
  const storePath = join(directory, "tasks.json");

  try {
    await upsertOpeningConditionPilotTask("task-1", validTaskInput(), { storePath });
    await intakeOpeningConditionPilotPacket(
      "task-1",
      {
        checklistObject: {
          objectId: "checklist-1",
          kind: "checklist",
          fileName: "开工条件核查表.xlsx",
        },
        sourceObjects: [
          {
            objectId: "source-1",
            kind: "source_archive",
            fileName: "施工方案.pdf",
            storageKey: "method/施工方案.pdf",
          },
        ],
        contentFacts: [
          {
            id: "fact-method",
            sourceObjectId: "source-1",
            fileName: "??????.pdf",
            status: "ready",
            safeSummary: "method-plan",
            confidence: "high",
          },
        ],
      },
      { storePath },
    );
    await runOpeningConditionPilotChecklistMatch(
      "task-1",
      {
        checklistItems: [
          {
            id: "item-a",
            name: "施工方案",
            expectedEvidenceHints: ["施工方案", "method-plan", "safety-certificate"],
          },
          {
            id: "item-b",
            name: "开工申请审批表",
            expectedEvidenceHints: ["审批表"],
          },
        ],
      },
      { storePath },
    );

    const listed = await listOpeningConditionPilotHumanReviewItems("task-1", { storePath });
    assert.equal(listed.ok, true);
    assert.equal(listed.blockingCount, 1);
    assert.equal(listed.humanReviewQueue[0].targetLabel, "开工申请审批表");
    assert.equal(listed.humanReviewQueue[0].category, "资料核查");
    assert.equal(listed.humanReviewQueue[0].expectedEvidenceHints[0], "审批表");

    const decision = await decideOpeningConditionPilotHumanReviewItem(
      "task-1",
      "hr-item-b",
      {
        decision: "confirm",
        actorId: "reviewer-1",
        safeNote: "确认资料后续补齐。",
        token: "must-redact",
      },
      { storePath },
    );

    assert.equal(decision.ok, true);
    assert.equal(decision.humanReviewItem.status, "confirmed");
    assert.equal(decision.blockingCount, 0);
    assert.equal(decision.task.state, "awaiting_human_review");
    assert.equal("token" in decision.event.safeDiagnostics, false);

    const completed = await completeOpeningConditionPilotHumanReview(
      "task-1",
      {
        actorId: "reviewer-1",
        safeNote: "人工复核列表已提交完成。",
      },
      { storePath },
    );

    assert.equal(completed.ok, true);
    assert.equal(completed.task.state, "report_ready");
    assert.equal(completed.event.type, "report.ready");

    const report = await generateOpeningConditionPilotReport("task-1", {}, { storePath });
    const ledgerItem = report.reportAsset.packageDiagnostics.decisionLedger[0];
    assert.equal(report.ok, true);
    assert.equal(ledgerItem.targetLabel, "开工申请审批表");
    assert.equal(ledgerItem.category, "资料核查");
    assert.equal(report.reportAsset.summary.total, 2);
    assert.equal(report.reportAsset.summary.passed, 2);
    assert.equal(report.reportAsset.summary.failed, 0);
    assert.equal(report.reportAsset.packageDiagnostics.findings.length, 0);
    assert.equal(report.reportAsset.markdownContent.includes("开工申请审批表"), false);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("keeps corrected human-review items in final markdown with operator notes", async () => {
  const directory = await mkdtemp(join(tmpdir(), "oc-pilot-human-corrected-report-"));
  const storePath = join(directory, "tasks.json");

  try {
    await upsertOpeningConditionPilotTask("task-corrected", validTaskInput(), { storePath });
    await intakeOpeningConditionPilotPacket(
      "task-corrected",
      {
        checklistObject: {
          objectId: "checklist-corrected",
          kind: "checklist",
          fileName: "开工条件核查表.xlsx",
        },
        sourceObjects: [
          {
            objectId: "source-corrected",
            kind: "source_archive",
            fileName: "资料包.zip",
          },
        ],
      },
      { storePath },
    );
    await runOpeningConditionPilotChecklistMatch(
      "task-corrected",
      {
        checklistItems: [
          {
            id: "item-approval-form",
            category: "资料核查",
            subCategory: "许可",
            name: "开工申请审批表★",
            required: true,
            expectedEvidenceHints: ["审批表"],
          },
        ],
      },
      { storePath },
    );

    const decision = await decideOpeningConditionPilotHumanReviewItem(
      "task-corrected",
      "hr-item-approval-form",
      {
        decision: "correct",
        actorId: "reviewer-1",
        safeNote: "审批表缺少监理签章，需补齐后再提交。",
      },
      { storePath },
    );
    assert.equal(decision.ok, true);
    assert.equal(decision.blockingCount, 0);

    const completed = await completeOpeningConditionPilotHumanReview(
      "task-corrected",
      {
        actorId: "reviewer-1",
        safeNote: "人工修正意见已确认。",
      },
      { storePath },
    );
    assert.equal(completed.ok, true);

    const report = await generateOpeningConditionPilotReport("task-corrected", {}, { storePath });
    assert.equal(report.ok, true);
    assert.equal(report.reportAsset.summary.total, 1);
    assert.equal(report.reportAsset.summary.passed, 0);
    assert.equal(report.reportAsset.summary.failed, 1);
    assert.equal(report.reportAsset.packageDiagnostics.findings.length, 1);
    assert.equal(report.reportAsset.packageDiagnostics.findings[0].disposition, "correct");
    assert.match(report.reportAsset.markdownContent, /开工申请审批表/);
    assert.match(report.reportAsset.markdownContent, /审批表缺少监理签章/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("generates and archives auxiliary report assets after human review is clear", async () => {
  const directory = await mkdtemp(join(tmpdir(), "oc-pilot-report-"));
  const storePath = join(directory, "tasks.json");

  try {
    await upsertOpeningConditionPilotTask("task-1", validTaskInput(), { storePath });
    await intakeOpeningConditionPilotPacket(
      "task-1",
      {
        checklistObject: {
          objectId: "checklist-1",
          kind: "checklist",
          fileName: "开工条件核查表.xlsx",
        },
        sourceObjects: [
          {
            objectId: "source-1",
            kind: "source_archive",
            fileName: "安全员证书.pdf",
            storageKey: "uploads/safety-certificate.pdf",
          },
        ],
        contentFacts: [
          {
            id: "fact-report-safety",
            sourceObjectId: "source-1",
            fileName: "????????pdf",
            status: "ready",
            safeSummary: "safety-certificate",
            confidence: "high",
          },
        ],
      },
      { storePath },
    );
    await runOpeningConditionPilotChecklistMatch(
      "task-1",
      {
        checklistItems: [
          {
            id: "item-a",
            name: "安全员证书",
            expectedEvidenceHints: ["安全员", "method-plan", "safety-certificate"],
            masterDataIds: ["md-1"],
          },
        ],
      },
      { storePath },
    );

    const report = await generateOpeningConditionPilotReport(
      "task-1",
      {
        objectRef: {
          objectId: "report-object-1",
          kind: "report",
          fileName: "辅助报告.md",
          privateUrl: "must-redact",
        },
      },
      { storePath },
    );

    assert.equal(report.ok, true);
    assert.equal(report.reportAsset.status, "ready");
    assert.equal(report.reportAsset.summary.passed, 1);
    assert.equal(report.reportAsset.packageDiagnostics.inputObjects.sourceCount, 1);
    assert.equal(report.reportAsset.packageDiagnostics.matching.total, 1);
    assert.equal(report.reportAsset.packageDiagnostics.humanReview.blockingCount, 0);
    assert.equal(report.reportAsset.packageDiagnostics.deliveryHandoff.status, "ready_for_archive");
    assert.equal(report.reportAsset.packageDiagnostics.deliveryHandoff.readOnly, false);
    assert.equal(report.reportAsset.packageDiagnostics.deliveryPackage.schemaVersion, "opening-condition-report-delivery-package.v1");
    assert.equal(report.reportAsset.packageDiagnostics.deliveryPackage.status, "empty");
    assert.equal(report.reportAsset.packageDiagnostics.deliveryPackage.readOnly, false);
    assert.equal(report.reportAsset.packageDiagnostics.mvpAcceptance.status, "ready_for_archive");
    assert.equal(report.reportAsset.packageDiagnostics.mvpAcceptance.completed, false);
    assert.equal(report.reportAsset.packageDiagnostics.mvpAcceptance.readOnly, false);
    assert.equal(
      report.reportAsset.packageDiagnostics.mvpAcceptance.steps.find((step) => step.key === "report").status,
      "complete",
    );
    assert.equal(
      report.reportAsset.packageDiagnostics.mvpAcceptance.steps.find((step) => step.key === "archive").status,
      "pending",
    );
    assert.equal("privateUrl" in report.reportAsset.objectRef, false);

    const exported = await recordOpeningConditionPilotReportDocumentExport(
      "task-1",
      {
        fileKey: "reports/task-1.docx",
        fileName: "task-1.docx",
        fileSize: 2048,
      },
      { storePath },
    );
    assert.equal(exported.ok, true);
    assert.equal(exported.reportAsset.packageDiagnostics.exportHandoff.status, "exported");
    assert.equal(exported.reportAsset.packageDiagnostics.deliveryPackage.adapterStatus, "exported");
    assert.equal(exported.reportAsset.packageDiagnostics.mvpAcceptance.status, "ready_for_archive");
    assert.equal(exported.reportAsset.packageDiagnostics.mvpAcceptance.steps.find((step) => step.key === "report").status, "complete");

    const archived = await archiveOpeningConditionPilotTask("task-1", { message: "归档完成。" }, { storePath });
    assert.equal(archived.ok, true);
    assert.equal(archived.task.state, "archived");
    assert.equal(archived.reportAsset.status, "archived");
    assert.equal(archived.task.trialPackage.status, "archived");
    assert.equal(archived.reportAsset.packageDiagnostics.archiveStatus, "archived");
    assert.equal(archived.reportAsset.packageDiagnostics.deliveryHandoff.status, "archived");
    assert.equal(archived.reportAsset.packageDiagnostics.deliveryHandoff.readOnly, true);
    assert.equal(archived.reportAsset.packageDiagnostics.deliveryPackage.status, "empty");
    assert.equal(archived.reportAsset.packageDiagnostics.deliveryPackage.readOnly, true);
    assert.equal(archived.reportAsset.packageDiagnostics.mvpAcceptance.status, "archived");
    assert.equal(archived.reportAsset.packageDiagnostics.mvpAcceptance.completed, true);
    assert.equal(archived.reportAsset.packageDiagnostics.mvpAcceptance.readOnly, true);
    assert.equal(
      archived.reportAsset.packageDiagnostics.mvpAcceptance.steps.find((step) => step.key === "archive").status,
      "complete",
    );

    const regenerated = await generateOpeningConditionPilotReport("task-1", {}, { storePath });
    assert.equal(regenerated.ok, false);
    assert.equal(regenerated.status, "invalid_state");
    assert.equal(regenerated.message, "Cannot generate report while task is archived.");

    const reinitialized = await initializeOpeningConditionPilotTaskIntake(
      {
        taskId: "task-1",
        context: validTaskInput().context,
        checklistObject: {
          objectId: "checklist-2",
          kind: "checklist",
          fileName: "寮€宸ユ潯浠舵牳鏌ヨ〃-new.xlsx",
        },
        sourceObjects: [
          {
            objectId: "source-2",
            kind: "source_archive",
            fileName: "鏂拌祫鏂欏寘.zip",
          },
        ],
      },
      { storePath },
    );
    assert.equal(reinitialized.ok, false);
    assert.equal(reinitialized.status, "invalid_state");
    assert.equal(reinitialized.message, "Cannot reinitialize opening-condition pilot task while task is archived.");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("acceptance smoke protects the opening-condition pilot delivery chain", async () => {
  const directory = await mkdtemp(join(tmpdir(), "oc-pilot-acceptance-smoke-"));
  const storePath = join(directory, "tasks.json");

  try {
    await upsertOpeningConditionPilotTask("task-smoke-run-1", validTaskInput(), { storePath });
    await intakeOpeningConditionPilotPacket(
      "task-smoke-run-1",
      {
        checklistObject: {
          objectId: "checklist-smoke-1",
          kind: "checklist",
          fileName: "opening-condition-checklist.docx",
        },
        sourceObjects: [
          {
            objectId: "source-smoke-1",
            kind: "source_archive",
            fileName: "method-statement.pdf",
            summary: "method statement for the current contractor package",
            storageKey: "method/method-statement.pdf",
          },
        ],
        contentFacts: [
          {
            id: "fact-smoke-method",
            sourceObjectId: "source-smoke-1",
            fileName: "method-statement.pdf",
            status: "ready",
            safeSummary: "method statement for the current contractor package",
            confidence: "high",
          },
        ],
      },
      { storePath },
    );

    const matched = await runOpeningConditionPilotChecklistMatch(
      "task-smoke-run-1",
      {
        checklistItems: [
          {
            id: "item-method-statement",
            name: "Method statement",
            expectedEvidenceHints: ["method statement"],
          },
          {
            id: "item-approval-form",
            name: "Stamped approval form",
            expectedEvidenceHints: ["approval form", "stamp"],
            masterDataIds: [],
          },
        ],
      },
      { storePath },
    );

    assert.equal(matched.ok, true);
    assert.equal(matched.task.state, "awaiting_human_review");
    assert.equal(matched.checkItems.length, 2);
    assert.equal(matched.checkItems[0].verdict, "pass");
    assert.equal(matched.checkItems[1].verdict, "fail");
    assert.deepEqual(matched.checkItems[1].humanReviewIds, ["hr-item-approval-form"]);
    assert.equal(matched.humanReviewQueue.length, 1);

    const blockedReport = await generateOpeningConditionPilotReport("task-smoke-run-1", {}, { storePath });
    assert.equal(blockedReport.ok, false);
    assert.equal(blockedReport.status, "human_review_blocking");

    const decision = await decideOpeningConditionPilotHumanReviewItem(
      "task-smoke-run-1",
      "hr-item-approval-form",
      {
        decision: "reject",
        actorId: "smoke-reviewer",
        safeNote: "The packet did not include a stable approval-form match.",
        privateUrl: "must-redact",
      },
      { storePath },
    );
    assert.equal(decision.ok, true);
    assert.equal(decision.blockingCount, 0);
    assert.equal(decision.task.state, "awaiting_human_review");
    assert.equal("privateUrl" in decision.event.safeDiagnostics, false);

    const completed = await completeOpeningConditionPilotHumanReview(
      "task-smoke-run-1",
      {
        actorId: "smoke-reviewer",
        safeNote: "All flagged items have been reviewed by the operator.",
      },
      { storePath },
    );
    assert.equal(completed.ok, true);
    assert.equal(completed.task.state, "report_ready");

    const report = await generateOpeningConditionPilotReport(
      "task-smoke-run-1",
      {
        objectRef: {
          objectId: "report-smoke-1",
          kind: "report",
          fileName: "opening-condition-internal-report.md",
          token: "must-redact",
        },
      },
      { storePath },
    );
    assert.equal(report.ok, true);
    assert.equal(report.reportAsset.status, "ready");
    assert.equal(report.reportAsset.packageDiagnostics.humanReview.blockingCount, 0);
    assert.equal(report.reportAsset.packageDiagnostics.decisionLedger.length, 1);
    assert.equal(report.reportAsset.packageDiagnostics.deliveryHandoff.status, "ready_for_archive");
    assert.equal(report.reportAsset.packageDiagnostics.deliveryHandoff.recommendedPage, "reports");
    assert.equal(report.reportAsset.packageDiagnostics.deliveryPackage.status, "ready_for_handoff");
    assert.equal(report.reportAsset.packageDiagnostics.deliveryPackage.rowCount, 1);
    assert.equal(report.reportAsset.packageDiagnostics.deliveryPackage.rows[0].checkItem, "Stamped approval form");
    assert.equal(report.reportAsset.packageDiagnostics.mvpAcceptance.status, "ready_for_archive");
    assert.equal(report.reportAsset.packageDiagnostics.mvpAcceptance.completed, false);
    assert.equal(report.reportAsset.packageDiagnostics.mvpAcceptance.steps.find((step) => step.key === "intake").status, "complete");
    assert.equal(report.reportAsset.packageDiagnostics.mvpAcceptance.steps.find((step) => step.key === "match").status, "complete");
    assert.equal(
      report.reportAsset.packageDiagnostics.mvpAcceptance.steps.find((step) => step.key === "human_review").status,
      "complete",
    );
    assert.equal(report.reportAsset.packageDiagnostics.mvpAcceptance.steps.find((step) => step.key === "report").status, "complete");
    assert.equal(report.reportAsset.packageDiagnostics.mvpAcceptance.steps.find((step) => step.key === "archive").status, "pending");
    const reportHtml = buildOpeningConditionPilotReportHtml(report.task);
    assert.match(reportHtml, /Stamped approval form/);
    assert.match(reportHtml, /人工驳回/);
    assert.match(reportHtml, /稳定匹配文件/);
    assert.match(reportHtml, /补齐资料.*重新提交复审/);
    assert.equal("token" in report.reportAsset.objectRef, false);

    const archived = await archiveOpeningConditionPilotTask(
      "task-smoke-run-1",
      { message: "Acceptance smoke archived the completed run." },
      { storePath },
    );
    assert.equal(archived.ok, true);
    assert.equal(archived.task.state, "archived");
    assert.equal(archived.reportAsset.status, "archived");
    assert.equal(archived.reportAsset.packageDiagnostics.archiveStatus, "archived");
    assert.equal(archived.reportAsset.packageDiagnostics.deliveryHandoff.status, "archived");
    assert.equal(archived.reportAsset.packageDiagnostics.deliveryHandoff.readOnly, true);
    assert.equal(archived.reportAsset.packageDiagnostics.deliveryPackage.status, "archived_ready");
    assert.equal(archived.reportAsset.packageDiagnostics.deliveryPackage.readOnly, true);
    assert.equal(archived.reportAsset.packageDiagnostics.mvpAcceptance.status, "archived");
    assert.equal(archived.reportAsset.packageDiagnostics.mvpAcceptance.completed, true);
    assert.equal(archived.reportAsset.packageDiagnostics.mvpAcceptance.readOnly, true);
    assert.equal(archived.reportAsset.packageDiagnostics.mvpAcceptance.steps.find((step) => step.key === "archive").status, "complete");
    const archivedEventCount = archived.task.events.length;

    const rematchArchived = await runOpeningConditionPilotChecklistMatch("task-smoke-run-1", {}, { storePath });
    assert.equal(rematchArchived.ok, false);
    assert.equal(rematchArchived.status, "invalid_state");

    const regenerateArchived = await generateOpeningConditionPilotReport("task-smoke-run-1", {}, { storePath });
    assert.equal(regenerateArchived.ok, false);
    assert.equal(regenerateArchived.status, "invalid_state");

    const reinitializeArchived = await initializeOpeningConditionPilotTaskIntake(
      {
        taskId: "task-smoke-run-1",
        context: validTaskInput().context,
        checklistObject: {
          objectId: "checklist-smoke-archived",
          kind: "checklist",
          fileName: "replacement-checklist.docx",
        },
        sourceObjects: [
          {
            objectId: "source-smoke-archived",
            kind: "source_archive",
            fileName: "replacement-packet.zip",
          },
        ],
      },
      { storePath },
    );
    assert.equal(reinitializeArchived.ok, false);
    assert.equal(reinitializeArchived.status, "invalid_state");

    await upsertOpeningConditionPilotBasisVersion(
      "ws-1",
      "basis-1",
      {
        title: "Acceptance smoke basis",
        status: "published",
      },
      { storePath },
    );
    await upsertOpeningConditionPilotMasterDataRecord(
      "ws-1",
      "md-1",
      {
        type: "personnel",
        label: "Safety officer",
        status: "published",
      },
      { storePath },
    );
    await upsertOpeningConditionPilotKnowledgeBase(
      "ws-1",
      "kb-1",
      {
        organizationId: "org-1",
        contractPackageId: "contract-1",
        subcontractTeamId: "team-1",
        label: "Acceptance smoke subcontract KB",
        status: "ready",
        summary: "Ready for acceptance smoke.",
      },
      { storePath },
    );

    const nextRun = await initializeOpeningConditionPilotTaskIntake(
      {
        taskId: "task-smoke-run-2",
        context: validTaskInput().context,
        basisVersionId: "basis-1",
        checklistItems: [
          {
            id: "item-next-run",
            name: "Rectification approval form",
            expectedEvidenceHints: ["rectification approval"],
            masterDataIds: [],
          },
        ],
        checklistObject: {
          objectId: "checklist-smoke-2",
          kind: "checklist",
          fileName: "rectification-checklist.docx",
        },
        sourceObjects: [
          {
            objectId: "source-smoke-2",
            kind: "source_archive",
            fileName: "rectification-approval.pdf",
          },
        ],
      },
      { storePath },
    );
    assert.equal(nextRun.ok, true);
    assert.equal(nextRun.task.id, "task-smoke-run-2");
    assert.equal(nextRun.task.state, "packet_uploaded");
    assert.equal(nextRun.preflightReadiness.status, "ready");

    const listed = await listOpeningConditionPilotTasks({ storePath });
    const archivedRun = listed.tasks.find((task) => task.id === "task-smoke-run-1");
    const activeRun = listed.tasks.find((task) => task.id === "task-smoke-run-2");
    assert.equal(archivedRun.state, "archived");
    assert.equal(archivedRun.events.length, archivedEventCount);
    assert.equal(activeRun.state, "packet_uploaded");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
