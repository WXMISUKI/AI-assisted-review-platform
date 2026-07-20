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
  canTransitionOpeningConditionPilotTask,
  decideOpeningConditionPilotHumanReviewItem,
  decideOpeningConditionPilotMasterDataRecord,
  deriveOpeningConditionPilotPreflightReadiness,
  generateOpeningConditionPilotReport,
  initializeOpeningConditionPilotTaskIntake,
  intakeOpeningConditionPilotPacket,
  getOpeningConditionPilotTaskReadiness,
  listOpeningConditionPilotKnowledgeBases,
  listOpeningConditionPilotHumanReviewItems,
  listOpeningConditionPilotBasisVersions,
  listOpeningConditionPilotTasks,
  listOpeningConditionPilotMasterData,
  publishOpeningConditionPilotBasisVersion,
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
    assert.equal(initialized.task.checklistDefinition.length, 5);
    assert.equal(initialized.task.packet.inventoryEntries.length, 1);
    assert.equal(initialized.task.checklistDefinition[0].name, "项目管理人员及专职安全员资格证书");
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
      },
      {
        storePath,
        readObjectBuffer: async () => ({
          buffer: zipFixtureBuffer,
        }),
      },
    );

    assert.equal(result.ok, true);
    assert.equal(result.task.id, "task-trial-1");
    assert.equal(result.task.state, "packet_uploaded");
    assert.equal(result.task.basisVersion.status, "published");
    assert.equal(result.task.requiredMasterData.length, 3);
    assert.equal(result.task.knowledgeBaseRef.providerRefs[0].provider, "maxkb");
    assert.equal(result.task.knowledgeBaseRef.providerSyncStatus, "ready");
    assert.equal(result.packet.inventoryEntries.length, 2);
    assert.equal(result.intake.inventoryResolution, "derived_from_zip_manifest");
    assert.equal(result.intake.checklistDefinitionResolution, "derived_from_template");
    assert.equal(result.preflightReadiness.status, "ready");
    assert.equal(result.task.trialPackage.status, "packet_uploaded");
    assert.equal(result.task.trialPackage.inputObjects.sourceCount, 1);
    assert.equal(result.task.trialPackage.diagnostics.inventoryResolution, "derived_from_zip_manifest");
    assert.equal(result.task.trialPackage.diagnostics.inventoryEntryCount, 2);
    assert.equal(result.task.trialPackage.diagnostics.checklistDefinitionResolution, "derived_from_template");
    assert.equal(result.task.trialPackage.providerReadiness.status, "ready");
    assert.equal("privateUrl" in result.task.basisVersion.sourceObject, false);
    assert.equal("token" in result.task.packet.sourceObjects[0], false);
    assert.equal("token" in result.task.trialPackage, false);
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
            expectedEvidenceHints: ["专职安全员", "证书"],
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
      },
    );

    assert.equal(initialized.ok, true);
    assert.equal(initialized.intake.inventoryResolution, "derived_from_zip_manifest");
    assert.equal(initialized.intake.inventoryEntryCount, 2);
    assert.equal(initialized.intake.inventoryFallbackReason, undefined);
    assert.equal(initialized.task.packet.inventoryEntries[0].relativePath, "人员/专职安全员证书.txt");

    const matchResult = await runOpeningConditionPilotChecklistMatch("task-init-zip", {}, { storePath });
    assert.equal(matchResult.ok, true);
    assert.equal(matchResult.checkItems[0].verdict, "pass");
    assert.equal(matchResult.evidence[0].locator, "人员/专职安全员证书.txt");
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
            expectedEvidenceHints: ["专职安全员", "证书"],
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

    assert.equal(intake.ok, true);
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
            expectedEvidenceHints: ["专职安全员"],
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
            expectedEvidenceHints: ["专职安全员", "证书"],
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
            expectedEvidenceHints: ["专职安全员", "证书"],
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
            expectedEvidenceHints: ["专职安全员", "证书"],
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
    assert.equal(result.humanReviewQueue[0].reason.includes("视觉要素"), true);
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
            fileName: "安全员证书.pdf",
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
            expectedEvidenceHints: ["安全员"],
            masterDataIds: ["md-1"],
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
    assert.equal(decision.task.state, "report_ready");
    assert.equal("token" in decision.event.safeDiagnostics, false);
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
            expectedEvidenceHints: ["安全员"],
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
    assert.equal("privateUrl" in report.reportAsset.objectRef, false);

    const archived = await archiveOpeningConditionPilotTask("task-1", { message: "归档完成。" }, { storePath });
    assert.equal(archived.ok, true);
    assert.equal(archived.task.state, "archived");
    assert.equal(archived.reportAsset.status, "archived");
    assert.equal(archived.task.trialPackage.status, "archived");
    assert.equal(archived.reportAsset.packageDiagnostics.archiveStatus, "archived");

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
