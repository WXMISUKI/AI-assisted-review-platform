import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const portalStateSourcePath = new URL("../src/openingConditionPortalState.ts", import.meta.url);
const workspacePagesSourcePath = new URL("../src/productWorkspacePages.tsx", import.meta.url);
const runSnapshotSourcePath = new URL("../src/openingConditionRunSnapshot.ts", import.meta.url);
const appSourcePath = new URL("../src/App.tsx", import.meta.url);

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
  const appSource = await readFile(appSourcePath, "utf8");

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
  assert.match(source, /const isRectificationRerun = portalState\.rerunUploadEnabled;/);
  assert.match(source, /opening-report-detail-card/);
  assert.match(source, /当前归档轮次默认只读/);
  assert.doesNotMatch(source, /function summarizePreviousRun\(/);
  assert.doesNotMatch(source, /function buildRectificationClosureDiff\(/);
  assert.match(appSource, /setOpeningPilotIntakeMode\("rectification_rerun"\);/);
  assert.match(appSource, /setOpeningPilotStatus\(".*整改复审.*"\);/);
});

test("UI smoke exposes workspace asset registry summaries on the overview", async () => {
  const workspaceSource = await readFile(workspacePagesSourcePath, "utf8");
  const appSource = await readFile(appSourcePath, "utf8");

  assert.match(appSource, /fetchOpeningConditionWorkspaceAssetRegistry/);
  assert.match(appSource, /workspaceAssetRegistry=\{openingPilotWorkspaceAssetRegistry\}/);
  assert.match(workspaceSource, /Asset Registry/);
  assert.match(workspaceSource, /Current workspace assets/);
  assert.match(workspaceSource, /findWorkspaceAssetRegistrySummary/);
  assert.match(workspaceSource, /currentRunBinding/);
  assert.match(workspaceSource, /formatWorkspaceAssetCompactSummary/);
  assert.match(workspaceSource, /formatWorkspaceLatestRun/);
  assert.doesNotMatch(workspaceSource, /buildOpeningConditionWorkspaceAssetRegistry/);
  assert.doesNotMatch(workspaceSource, /findOpeningConditionWorkspaceAssetRegistryRecord/);
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
  assert.match(source, /const taskRunSnapshot = deriveOpeningConditionRunSnapshot\(/);
  assert.match(source, /const closureDiff = taskRunSnapshot\.closureDiff;/);
  assert.doesNotMatch(source, /function summarizePreviousRun\(/);
  assert.doesNotMatch(source, /function buildRectificationClosureDiff\(/);
});

test("UI smoke exposes selected-task issue and human-review summaries", async () => {
  const source = await readFile(workspacePagesSourcePath, "utf8");

  assert.match(source, /buildOpeningConditionTaskTrialHandoffSummary/);
  assert.match(source, /trialHandoff/);
  assert.match(source, /Trial Handoff/);
  assert.match(source, /Blocking summary/);
  assert.match(source, /Recommended entry/);
  assert.match(source, /buildOpeningConditionTaskIssuePreviewRows/);
  assert.match(source, /buildOpeningConditionTaskPendingReviewRows/);
  assert.match(source, /rectificationClosureSummary/);
  assert.match(source, /rectificationClosureReferenceLabel/);
  assert.match(source, /issuePreviewRows/);
  assert.match(source, /pendingReviewRows/);
  assert.match(source, /deliverySummary/);
  assert.match(source, /AI 问题与整改摘要/);
  assert.match(source, /待人工判断/);
  assert.match(source, /证据命中/);
  assert.match(source, /进入报告归档/);
  assert.match(source, /formatRectificationClosureSummary/);
  assert.match(source, /opening-task-workbench-closure-summary/);
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
  assert.match(source, /onFocusCheckItem=\{\(checkItemId\) => focusOpeningChecklistItem\(checkItemId, "reports"\)\}/);
  assert.match(source, /onFocusHumanReview=\{\(reviewId\) => focusOpeningHumanReviewItem\(reviewId, "reports"\)\}/);
  assert.match(source, /unresolvedReviewByTargetId/);
  assert.match(source, /\.filter\(\(item\) => item\.status === "open" \|\| item\.status === "deferred"\)/);
  assert.match(source, /onFocusCheckItem\(finding\.id\)/);
  assert.match(source, /onFocusHumanReview\(unresolvedReview\.id\)/);
});

test("UI smoke lets focused detail routes return to their originating MVP page", async () => {
  const source = await readFile(workspacePagesSourcePath, "utf8");

  assert.match(source, /focusedRouteOrigin/);
  assert.match(source, /setFocusedRouteOrigin\(null\)/);
  assert.match(source, /function returnToFocusedRouteOrigin/);
  assert.match(source, /const returnPage = focusedRouteOrigin \?\? "workspace-context";/);
  assert.match(source, /focusOpeningChecklistItem\(checkItemId, "workspace-context"\)/);
  assert.match(source, /focusOpeningHumanReviewItem\(reviewId, "workspace-context"\)/);
  assert.match(source, /focusOpeningChecklistItem\(checkItemId, "reports"\)/);
  assert.match(source, /focusOpeningHumanReviewItem\(reviewId, "reports"\)/);
  assert.match(source, /focusedReturnLabel/);
  assert.match(source, /onReturnToFocusedOrigin/);
  assert.match(source, /返回\{focusedReturnLabel\}/);
});

test("UI smoke exposes issue closure summaries on task and report handoffs", async () => {
  const source = await readFile(workspacePagesSourcePath, "utf8");

  assert.match(source, /type OpeningConditionIssueClosureSummary/);
  assert.match(source, /function buildOpeningConditionIssueClosureSummary/);
  assert.match(source, /issueClosure: OpeningConditionIssueClosureSummary/);
  assert.match(source, /const issueClosure = buildOpeningConditionIssueClosureSummary/);
  assert.match(source, /const issueClosureSummary = buildOpeningConditionIssueClosureSummary/);
  assert.match(source, /问题闭环/);
  assert.match(source, /未闭合问题/);
  assert.match(source, /整改清单/);
  assert.match(source, /待人工闭环/);
  assert.match(source, /待整改交付/);
  assert.match(source, /可进入报告/);
});
