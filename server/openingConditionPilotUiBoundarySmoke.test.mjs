import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const portalStateSourcePath = new URL("../src/openingConditionPortalState.ts", import.meta.url);
const workspacePagesSourcePath = new URL("../src/productWorkspacePages.tsx", import.meta.url);
const reviewDomainSourcePath = new URL("../src/domain/openingConditionReview.ts", import.meta.url);
const runSnapshotSourcePath = new URL("../src/openingConditionRunSnapshot.ts", import.meta.url);

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
  const snapshotSource = await readFile(runSnapshotSourcePath, "utf8");

  assert.match(source, /const runSnapshot = deriveOpeningConditionRunSnapshot\(/);
  assert.match(source, /const selectedTask = runSnapshot\.selectedTask;/);
  assert.match(source, /const isCurrentRun = runSnapshot\.isCurrentRun;/);
  assert.match(source, /selectedTask\?\.id === pilotTask\.id && pilotTask\.state === "report_ready"/);
  assert.match(source, /reportAsset\?\.status === "ready" && isCurrentRun/);
  assert.match(source, /runSnapshot\.canStartRectificationRerun/);
  assert.match(snapshotSource, /canStartRectificationRerun: Boolean\(isCurrentRun && selectedTask\?\.state === "archived" && currentRunArchived\)/);
  assert.match(source, /"历史轮次详情"|历史轮次详情|Historical Run Snapshot/);
});

test("UI smoke preserves report handoff semantics without pixel-level assertions", async () => {
  const source = await readFile(workspacePagesSourcePath, "utf8");
  const snapshotSource = await readFile(runSnapshotSourcePath, "utf8");

  assert.match(source, /function buildReportFindings/);
  assert.match(source, /function buildReportFindingGroups/);
  assert.match(source, /decisionLedger/);
  assert.match(source, /deliveryHandoff/);
  assert.match(source, /Delivery Handoff/);
  assert.match(source, /recommendedPage/);
  assert.match(snapshotSource, /buildRectificationClosureDiff/);
  assert.match(snapshotSource, /case "rejected":\s+return "reject";/);
  assert.match(snapshotSource, /case "open":\s+case "deferred":\s+return "needs_human_review";/);
  assert.match(source, /expectedEvidenceHints/);
  assert.match(source, /rectification/);
  assert.match(source, /opening-report-finding-detail-grid/);
  assert.match(source, /OpeningConditionMvpAcceptanceSnapshotPanel/);
  assert.match(source, /Basis Preview/);
  assert.match(source, /Extraction/);
  assert.match(source, /summarizeBasisPreviewProvenance/);
  assert.match(source, /onRefreshBasisPreview/);
});

test("UI smoke exposes workspace asset registry summaries on the overview", async () => {
  const workspaceSource = await readFile(workspacePagesSourcePath, "utf8");
  const reviewSource = await readFile(reviewDomainSourcePath, "utf8");

  assert.match(reviewSource, /buildOpeningConditionWorkspaceAssetRegistry/);
  assert.match(reviewSource, /findOpeningConditionWorkspaceAssetRegistryRecord/);
  assert.match(workspaceSource, /Asset Registry/);
  assert.match(workspaceSource, /Current workspace assets/);
  assert.match(workspaceSource, /formatWorkspaceAssetCompactSummary/);
  assert.match(workspaceSource, /formatWorkspaceLatestRun/);
});

test("UI smoke keeps the task ledger as primary opening-condition MVP routing surface", async () => {
  const source = await readFile(workspacePagesSourcePath, "utf8");

  assert.match(source, /openingWorkspaceNav/);
  assert.match(source, /核查任务台账/);
  assert.match(source, /openingPrimaryNavPageIds/);
  assert.match(source, /opening-secondary-route-card/);
  assert.match(source, /返回核查任务台账/);
  assert.match(source, /executionRouteLabel/);
  assert.match(source, /acceptanceSnapshot/);
  assert.match(source, /acceptanceLabel/);
});

test("UI smoke exposes selected-task issue and human-review summaries", async () => {
  const source = await readFile(workspacePagesSourcePath, "utf8");

  assert.match(source, /buildOpeningConditionTaskIssuePreviewRows/);
  assert.match(source, /buildOpeningConditionTaskPendingReviewRows/);
  assert.match(source, /issuePreviewRows/);
  assert.match(source, /pendingReviewRows/);
  assert.match(source, /deliverySummary/);
  assert.match(source, /AI 问题与整改摘要/);
  assert.match(source, /待人工判断/);
  assert.match(source, /证据命中/);
  assert.match(source, /进入报告归档/);
  assert.match(source, /opening-task-detail-summary-grid/);
});

test("UI smoke routes selected task rows to focused checklist and human-review details", async () => {
  const source = await readFile(workspacePagesSourcePath, "utf8");

  assert.match(source, /focusedCheckItemId/);
  assert.match(source, /focusedHumanReviewId/);
  assert.match(source, /focusOpeningChecklistItem/);
  assert.match(source, /focusOpeningHumanReviewItem/);
  assert.match(source, /onFocusCheckItem/);
  assert.match(source, /onFocusHumanReview/);
  assert.match(source, /定位核查项/);
  assert.match(source, /定位复核项/);
  assert.match(source, /opening-focused-context-banner/);
  assert.match(source, /opening-record-focused/);
  assert.match(source, /opening-review-focused/);
  assert.match(source, /取消聚焦/);
});

test("UI smoke routes report findings to focused checklist and unresolved human-review details", async () => {
  const source = await readFile(workspacePagesSourcePath, "utf8");

  assert.match(source, /OpeningConditionReportDeliveryWorkbench/);
  assert.match(source, /onFocusCheckItem=\{focusOpeningChecklistItem\}/);
  assert.match(source, /onFocusHumanReview=\{focusOpeningHumanReviewItem\}/);
  assert.match(source, /unresolvedReviewByTargetId/);
  assert.match(source, /\.filter\(\(item\) => item\.status === "open" \|\| item\.status === "deferred"\)/);
  assert.match(source, /onFocusCheckItem\(finding\.id\)/);
  assert.match(source, /onFocusHumanReview\(unresolvedReview\.id\)/);
});
