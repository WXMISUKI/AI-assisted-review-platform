import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { normalizeExtractedOpeningConditionChecklistItems } from "./openingConditionChecklistAdapter.mjs";
import {
  initializeOpeningConditionPilotTaskIntake,
  upsertOpeningConditionPilotBasisVersion,
  upsertOpeningConditionPilotKnowledgeBase,
  upsertOpeningConditionPilotMasterDataRecord,
} from "./openingConditionPilotStore.mjs";

function validContext() {
  return {
    workspaceId: "ws-1",
    tenantId: "tenant-1",
    projectId: "project-1",
    reviewObjectId: "review-object-1",
    contractPackageId: "contract-1",
    participatingOrganizationId: "org-1",
    participantEntityId: "participant-1",
  };
}

test("normalizes extracted checklist items to material-review scope only", () => {
  const normalized = normalizeExtractedOpeningConditionChecklistItems([
    {
      id: "1-1-1",
      category: "资料核查",
      subCategory: "人员",
      name: "施工单位营业执照、资质证书齐全。★",
      expectedEvidenceHints: ["施工单位营业执照", "资质证书", "施工单位营业执照"],
      rowIndex: 3,
    },
    {
      id: "1-1-1",
      category: "资料核查",
      subCategory: "人员",
      name: "施工单位营业执照、资质证书齐全。★",
      expectedEvidenceHints: ["施工单位营业执照"],
      rowIndex: 3,
    },
    {
      id: "2-1-1",
      category: "现场核查",
      subCategory: "现场",
      name: "现场核查：支架搭设完成。",
      expectedEvidenceHints: ["现场核查"],
      rowIndex: 20,
    },
  ]);

  assert.equal(normalized.length, 1);
  assert.equal(normalized[0].category, "资料核查");
  assert.deepEqual(normalized[0].expectedEvidenceHints, ["施工单位营业执照", "资质证书"]);
});

test("initial intake syncs uploaded checklist facts into trial package diagnostics", async () => {
  const directory = await mkdtemp(join(tmpdir(), "oc-dynamic-checklist-"));
  const storePath = join(directory, "tasks.json");

  try {
    await upsertOpeningConditionPilotBasisVersion(
      "ws-1",
      "basis-1",
      { title: "开工条件依据", status: "published" },
      { storePath },
    );
    await upsertOpeningConditionPilotMasterDataRecord(
      "ws-1",
      "md-1",
      { type: "personnel", label: "项目管理人员", status: "published" },
      { storePath },
    );
    await upsertOpeningConditionPilotKnowledgeBase(
      "ws-1",
      "kb-1",
      {
        organizationId: "org-1",
        contractPackageId: "contract-1",
        subcontractTeamId: "team-1",
        label: "开工条件资料库",
        status: "ready",
        summary: "试点资料库",
      },
      { storePath },
    );

    const initialized = await initializeOpeningConditionPilotTaskIntake(
      {
        taskId: "task-dynamic-facts",
        context: validContext(),
        basisVersionId: "basis-1",
        checklistObject: {
          objectId: "checklist-1",
          kind: "checklist",
          fileName: "开工条件核查表.docx",
          storageKey: "checklists/opening-condition.docx",
        },
        sourceObjects: [
          {
            objectId: "source-1",
            kind: "source_archive",
            fileName: "开工资料包.zip",
          },
        ],
      },
      {
        storePath,
        readObjectBuffer: async () => ({ buffer: Buffer.from("fake-docx") }),
        extractChecklistDefinitionFromBuffer: async () => [
          {
            id: "1-1-1",
            category: "资料核查",
            subCategory: "人员",
            name: "施工单位营业执照、资质证书齐全。★",
            required: true,
            expectedEvidenceHints: ["施工单位营业执照", "资质证书"],
            rowIndex: 3,
          },
          {
            id: "1-1-2",
            category: "资料核查",
            subCategory: "许可",
            name: "按需提供渣土处置证办理手续。",
            required: false,
            isAsNeeded: true,
            expectedEvidenceHints: ["渣土处置证"],
            rowIndex: 4,
          },
          {
            id: "2-1-1",
            category: "现场核查",
            subCategory: "现场",
            name: "现场核查：模板支撑到位。",
            required: false,
            expectedEvidenceHints: ["现场核查"],
            rowIndex: 20,
          },
        ],
      },
    );

    assert.equal(initialized.ok, true);
    assert.equal(initialized.intake.checklistDefinitionResolution, "derived_from_uploaded_checklist");
    assert.equal(initialized.task.checklistDefinition.length, 2);
    assert.equal(initialized.task.trialPackage?.diagnostics.checklistDefinitionCount, 2);
    assert.equal(initialized.task.trialPackage?.diagnostics.checklistRequiredCount, 1);
    assert.equal(initialized.task.trialPackage?.diagnostics.checklistAsNeededCount, 1);
    assert.deepEqual(initialized.task.trialPackage?.diagnostics.checklistCategories, ["资料核查"]);
    assert.deepEqual(initialized.task.trialPackage?.diagnostics.checklistSubCategories, ["人员", "许可"]);
    assert.equal(initialized.task.trialPackage?.diagnostics.checklistSampleNames?.length, 2);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
