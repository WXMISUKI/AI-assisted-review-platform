import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const portalStateSourcePath = new URL("../src/openingConditionPortalState.ts", import.meta.url);
const workspacePagesSourcePath = new URL("../src/productWorkspacePages.tsx", import.meta.url);

test("UI smoke keeps archived opening-condition runs read-only in the shared portal state", async () => {
  const source = await readFile(portalStateSourcePath, "utf8");

  assert.match(source, /const archivedTask = args\.pilotTask\?\.state === "archived";/);
  assert.match(source, /const currentRunMutationLocked = archivedTask;/);
  assert.match(source, /const actions: OpeningConditionRunActionGates = \{/);
  assert.match(source, /initializeCurrentRun: buildOpeningConditionRunActionGate\(/);
  assert.match(source, /runFormalMatch: buildOpeningConditionRunActionGate\(/);
  assert.match(source, /startRectificationRerun: buildOpeningConditionRunActionGate\(/);
  assert.match(source, /const canInitializeCurrentRun = !currentRunMutationLocked;/);
  assert.match(source, /const canMutateCurrentRun = Boolean\(args\.pilotTask\) && !currentRunMutationLocked;/);
  assert.match(source, /const canUploadNewRun = !archivedTask \|\| rerunUploadEnabled;/);
});

test("UI smoke keeps report and history actions scoped to current mutable runs", async () => {
  const source = await readFile(workspacePagesSourcePath, "utf8");

  assert.match(source, /const selectedTask = historyTasks\.find\(\(task\) => task\.id === selectedHistoryTaskId\) \?\? pilotTask/);
  assert.match(source, /const isCurrentRun = Boolean\(selectedTask && pilotTask && selectedTask\.id === pilotTask\.id\);/);
  assert.match(source, /selectedTask\?\.id === pilotTask\.id && pilotTask\.state === "report_ready"/);
  assert.match(source, /reportAsset\?\.status === "ready" && isCurrentRun/);
  assert.match(source, /onStartRectificationRerun && isCurrentRun && selectedTask\?\.state === "archived"/);
  assert.match(source, /"历史轮次详情"|历史轮次详情|Historical Run Snapshot/);
});

test("UI smoke preserves report handoff semantics without pixel-level assertions", async () => {
  const source = await readFile(workspacePagesSourcePath, "utf8");

  assert.match(source, /function buildReportFindings/);
  assert.match(source, /function buildReportFindingGroups/);
  assert.match(source, /decisionLedger/);
  assert.match(source, /buildRectificationClosureDiff/);
  assert.match(source, /expectedEvidenceHints/);
  assert.match(source, /rectification/);
  assert.match(source, /opening-report-finding-detail-grid/);
  assert.match(source, /Basis Preview/);
  assert.match(source, /Extraction/);
  assert.match(source, /summarizeBasisPreviewProvenance/);
  assert.match(source, /onRefreshBasisPreview/);
});
