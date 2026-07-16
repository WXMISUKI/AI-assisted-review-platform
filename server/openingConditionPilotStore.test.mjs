import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  archiveOpeningConditionPilotTask,
  canTransitionOpeningConditionPilotTask,
  decideOpeningConditionPilotHumanReviewItem,
  decideOpeningConditionPilotMasterDataRecord,
  generateOpeningConditionPilotReport,
  intakeOpeningConditionPilotPacket,
  listOpeningConditionPilotHumanReviewItems,
  listOpeningConditionPilotBasisVersions,
  listOpeningConditionPilotMasterData,
  publishOpeningConditionPilotBasisVersion,
  runOpeningConditionPilotChecklistMatch,
  sanitizeOpeningConditionPilotValue,
  transitionOpeningConditionPilotTask,
  upsertOpeningConditionPilotBasisVersion,
  upsertOpeningConditionPilotMasterDataRecord,
  upsertOpeningConditionPilotTask,
  validateOpeningConditionPilotTaskInput,
} from "./openingConditionPilotStore.mjs";

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
      },
      { storePath },
    );

    assert.equal(intake.ok, true);
    assert.equal(intake.task.state, "packet_uploaded");
    assert.equal(intake.packet.sourceObjects.length, 2);
    assert.equal("privateUrl" in intake.packet.checklistObject, false);
    assert.equal("token" in intake.packet.sourceObjects[0], false);
    assert.deepEqual(intake.event.safeDiagnostics.sourceFileNames, ["人员证书.zip", "设备资料.zip"]);
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
    assert.equal(result.checkItems.find((item) => item.id === "item-equipment").verdict, "needs_human_review");
    assert.equal(result.checkItems.find((item) => item.id === "item-stamp").verdict, "fail");
    assert.equal(result.humanReviewQueue.length, 3);
    assert.equal(result.evidence.some((item) => item.objectRef.fileName === "专职安全员证书.pdf"), true);
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
    assert.equal("privateUrl" in report.reportAsset.objectRef, false);

    const archived = await archiveOpeningConditionPilotTask("task-1", { message: "归档完成。" }, { storePath });
    assert.equal(archived.ok, true);
    assert.equal(archived.task.state, "archived");
    assert.equal(archived.reportAsset.status, "archived");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
