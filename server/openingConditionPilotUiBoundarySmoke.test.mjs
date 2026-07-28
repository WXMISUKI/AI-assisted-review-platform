import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const portalStateSourcePath = new URL("../src/openingConditionPortalState.ts", import.meta.url);
const workspacePagesSourcePath = new URL("../src/productWorkspacePages.tsx", import.meta.url);
const runSnapshotSourcePath = new URL("../src/openingConditionRunSnapshot.ts", import.meta.url);
const appSourcePath = new URL("../src/App.tsx", import.meta.url);
const cleanReviewSourcePath = new URL("../src/domain/openingConditionReviewClean.ts", import.meta.url);
const pilotStoreSourcePath = new URL("./openingConditionPilotStore.mjs", import.meta.url);

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

test("UI smoke preserves workspace asset registry helpers outside the default home", async () => {
  const workspaceSource = await readFile(workspacePagesSourcePath, "utf8");
  const appSource = await readFile(appSourcePath, "utf8");

  assert.match(appSource, /fetchOpeningConditionWorkspaceAssetRegistry/);
  assert.match(appSource, /workspaceAssetRegistry=\{openingPilotWorkspaceAssetRegistry\}/);
  assert.match(workspaceSource, /findWorkspaceAssetRegistrySummary/);
  assert.match(workspaceSource, /selectedWorkspaceRegistry/);
  assert.match(workspaceSource, /formatWorkspaceAssetCompactSummary/);
  assert.match(workspaceSource, /formatWorkspaceLatestRun/);
  assert.match(workspaceSource, /data-governance-snapshot="current-run-binding"/);
  assert.doesNotMatch(workspaceSource, /Asset Registry/);
  assert.doesNotMatch(workspaceSource, /Current workspace assets/);
  assert.doesNotMatch(workspaceSource, /buildOpeningConditionWorkspaceAssetRegistry/);
  assert.doesNotMatch(workspaceSource, /findOpeningConditionWorkspaceAssetRegistryRecord/);
});

test("UI smoke keeps current-run governance bindings separate from preview and catalog semantics", async () => {
  const source = await readFile(workspacePagesSourcePath, "utf8");

  assert.match(source, /data-governance-snapshot="current-run-binding"/);
  assert.match(source, /data-governance-semantics="preview-is-not-published"/);
  assert.match(source, /data-governance-detail="bound-asset-status"/);
  assert.match(source, /data-governance-asset="basis"/);
  assert.match(source, /data-governance-asset="master-data"/);
  assert.match(source, /data-governance-asset="knowledge-base"/);
  assert.match(source, /const basisSnapshot = basisEntries\.find\(\(entry\) => entry\.isBound\) \?\? null;/);
  assert.match(source, /const missingBoundBasis = Boolean\(pilotTask\?\.[\s\S]*basisVersion\?\.[\s\S]*id && !basisSnapshot\)/);
  assert.match(source, /const missingCurrentRunMasterData = \(pilotTask\?\.[\s\S]*requiredMasterData \?\? \[\]\)\.filter/);
  assert.match(source, /basisSnapshot\?\.meta\.group === "published"/);
  assert.match(source, /item\.meta\.group === "published" \|\| item\.meta\.group === "current_run_confirmed"/);
  assert.match(source, /Formal match usability/);
  assert.match(source, /Missing bound records/);
  assert.match(source, /Preview 仅表示候选事实；只有人工确认并完成发布\/批准后/);
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

test("UI smoke exposes the low-noise agent review console and source-bound compliance guardrail", async () => {
  const source = await readFile(workspacePagesSourcePath, "utf8");
  const guidance = await readFile(new URL("../docs/opening-condition-agent-review-console-guidance.md", import.meta.url), "utf8");

  assert.match(source, /开工条件核查智能体/);
  assert.match(source, /资料完整性（必选）/);
  assert.match(source, /资料合规性（可选）/);
  assert.match(source, /上传审核资料/);
  assert.match(source, /上传待核查文件/);
  assert.match(source, /开始解析/);
  assert.match(source, /opening-agent-progress-bar/);
  assert.match(source, /opening-agent-file-pane/);
  assert.match(source, /opening-agent-progress-pane/);
  assert.match(source, /OpeningConditionRealTrialIntakePanel/);
  assert.match(source, /bootstrapOpeningConditionPilotTrial/);
  assert.match(source, /selectedReviewScope === "completeness_and_compliance"/);
  assert.match(source, /当前以资料完整性核查为主/);
  assert.match(guidance, /前端不得自行编造审查结论/);
  assert.match(guidance, /资料完整性.*必选/);
  assert.match(guidance, /资料合规性.*可选/);
});

test("UI smoke keeps packet inventory document rows keyed by UI-safe identity", async () => {
  const source = await readFile(workspacePagesSourcePath, "utf8");

  assert.match(source, /function buildOpeningConditionAgentInventoryFileId/);
  assert.match(source, /entry\.relativePath \?\? entry\.fileName/);
  assert.match(source, /derivedObject\?\.storageKey/);
  assert.match(source, /for \(const \[entryIndex, entry\] of \(task\.packet\?\.inventoryEntries \?\? \[\]\)\.entries\(\)\)/);
  assert.match(source, /id: buildOpeningConditionAgentInventoryFileId\(entry, derivedObject, entryIndex\)/);
  assert.match(source, /relativePath: entry\.relativePath/);
  assert.doesNotMatch(source, /id: entry\.id,/);
});

test("UI smoke keeps packet child preview selection on derived assets instead of source ZIP archives", async () => {
  const source = await readFile(workspacePagesSourcePath, "utf8");

  assert.match(source, /const derivedObject = entry\.derivedObjectRef;/);
  assert.match(source, /storageKey: derivedObject\?\.storageKey/);
  assert.match(source, /sourceArchiveStorageKey: sourceArchive\?\.storageKey/);
  assert.match(source, /hasDerivedAsset: Boolean\(derivedObject\?\.storageKey\)/);
  assert.match(source, /file\.storageKey === evidence\.objectRef\.storageKey/);
  assert.match(source, /file\.fileName === evidence\.objectRef\.fileName && file\.hasDerivedAsset/);
  assert.match(source, /const fallbackFile = files\.find\(\(file\) => file\.fileName === evidence\.objectRef\.fileName\);/);
  assert.match(source, /平台没有为它保留独立预览对象/);
  assert.match(source, /重新上传新资料包以获得逐文件预览/);
  assert.match(source, /sourceArchiveStorageKey/);
});

test("UI smoke keeps history delete, old inventory preview fallback, and markdown report rendering in the agent console", async () => {
  const source = await readFile(workspacePagesSourcePath, "utf8");
  const appSource = await readFile(appSourcePath, "utf8");
  const styles = await readFile(new URL("../src/styles/opening-condition.css", import.meta.url), "utf8");

  assert.match(source, /opening-sidebar-task-delete/);
  assert.match(source, /删除历史记录/);
  assert.match(source, /生成最终报告/);
  assert.doesNotMatch(source, /隐藏测试轮次/);
  assert.doesNotMatch(source, /生成报告摘要/);
  assert.match(appSource, /deleteOpeningConditionPilotTask\(taskId\)/);
  assert.doesNotMatch(source, /!isOpeningConditionBasePilotTask\(task\.id, selectedWorkspaceId\)/);
  assert.match(source, /sourceArchiveStorageKey/);
  assert.match(source, /sourceArchiveFileName/);
  assert.match(source, /旧资料包清单条目/);
  assert.match(source, /重新上传新资料包以获得逐文件预览/);
  assert.match(source, /OpeningConditionMarkdownReport/);
  assert.match(source, /opening-agent-markdown-report/);
  assert.match(source, /selectedAgentTask\.reportAsset\.markdownContent/);
  assert.match(source, /opening-agent-timeline-section/);
  assert.match(source, /opening-agent-section-heading/);
  assert.match(source, /opening-agent-secondary-diagnostics/);
  assert.match(styles, /\.opening-agent-markdown-report/);
  assert.match(styles, /\.opening-agent-markdown-table/);
  assert.match(styles, /\.opening-agent-report-placeholder/);
  assert.match(styles, /\.opening-agent-secondary-diagnostics-body/);
});

test("UI smoke keeps opening-condition task creation and deletion aligned with current-run refresh", async () => {
  const appSource = await readFile(appSourcePath, "utf8");
  const source = await readFile(workspacePagesSourcePath, "utf8");

  assert.match(appSource, /function handleOpeningTrialBootstrapComplete/);
  assert.match(appSource, /if \(workspaceTasks\.length === 0\) \{\s+return null;\s+\}/);
  assert.match(appSource, /const fallbackTaskId = getOpeningPilotTaskId\(openingPacket\);/);
  assert.match(appSource, /resolvedTaskId === fallbackTaskId && !workspaceTasks\.some\(\(task\) => task\.id === resolvedTaskId\)/);
  assert.match(source, /const taskId = getNextOpeningPilotRunTaskId\?\.\(\) \?\? `oc-pilot-\$\{packet\.workspaceId\}-run-\$\{Date\.now\(\)\}`;/);
  assert.doesNotMatch(source, /pilotTask\?\.id \?\? `oc-pilot-\$\{packet\.workspaceId\}`/);
  assert.match(appSource, /setOpeningPage\("workspace-context"\);/);
  assert.match(appSource, /setOpeningPilotTask\(createdTask\);/);
  assert.match(appSource, /setOpeningPilotAllTasks\(\(tasks\) => upsertOpeningPilotTaskList\(tasks, createdTask\)\);/);
  assert.match(appSource, /setOpeningPilotWorkspaceTasks\(\(tasks\) => upsertOpeningPilotTaskList\(tasks, createdTask\)\);/);
  assert.match(appSource, /void refreshOpeningPilotTask\(createdTask\.id, \{ preserveStatus: true \}\);/);
  assert.match(appSource, /async function deleteOpeningPilotHistoryTask/);
  assert.match(appSource, /await refreshOpeningPilotTask\(undefined, \{ resolveCurrentRun: true, preserveStatus: true \}\);/);
});

test("UI smoke keeps duplicate checklist ids from becoming review row identity", async () => {
  const source = await readFile(workspacePagesSourcePath, "utf8");

  assert.match(source, /const actionableCheckItems = checkItems\.filter/);
  assert.match(source, /!\("scopeStatus" in item\) \|\| item\.scopeStatus !== "out_of_scope"/);
  assert.match(source, /!\("finalDisposition" in item\) \|\| item\.finalDisposition !== "not_applicable"/);
  assert.match(source, /return actionableCheckItems\.map\(\(item, index\) => \{/);
  assert.match(source, /\[task\.id, item\.id, item\.category, item\.subCategory, item\.name, index\]/);
  assert.match(source, /targetId: item\.id/);
  assert.match(source, /openReviewByTargetId\.get\(activeReviewItem\.targetId\)/);
  assert.match(source, /latestReviewByTargetId\.get\(activeReviewItem\.targetId\)/);
});

test("UI smoke keeps the opening-condition agent detail workbench usable", async () => {
  const source = await readFile(workspacePagesSourcePath, "utf8");
  const styles = await readFile(new URL("../src/styles/opening-condition.css", import.meta.url), "utf8");

  assert.match(source, /opening-sidebar-progress-ring/);
  assert.match(source, /style=\{\{ "--progress": `\$\{getOpeningConditionAgentTaskProgress\(task\)\}%` \} as CSSProperties\}/);
  assert.match(styles, /\.opening-sidebar-progress-ring[\s\S]*conic-gradient/);
  assert.match(source, /"task\.created": "创建审核任务"/);
  assert.match(source, /"matching\.started": "执行资料匹配"/);
  assert.match(source, /"human_review\.waiting": "等待人工复核"/);
  assert.match(source, /待人工处理/);
  assert.match(source, /已完成/);
  assert.match(source, /进行中/);
  assert.match(source, /const \[progressPaneCollapsed, setProgressPaneCollapsed\] = useState\(false\);/);
  assert.match(source, /is-focused-mode/);
  assert.match(source, /is-progress-collapsed/);
  assert.match(source, /收起进度/);
  assert.match(source, /展开进度/);
  assert.match(styles, /\.opening-agent-detail\.is-focused-mode/);
  assert.match(styles, /\.opening-agent-detail\.is-progress-collapsed/);
  assert.match(styles, /\.opening-agent-detail\.is-focused-mode \.opening-agent-progress-pane[\s\S]*display: none/);
  assert.match(source, /function buildOpeningConditionAgentReviewReasonLines/);
  assert.match(source, /当前核查模式：资料完整性/);
  assert.match(source, /需要人工审核原因/);
  assert.match(source, /opening-agent-review-reason-list/);
  assert.match(styles, /\.opening-agent-review-reason-list/);
  assert.match(source, /内容核验依据/);
  assert.match(source, /buildOpeningConditionAgentContentFactDiagnostics/);
  assert.match(source, /openingContentFactStatusMeta/);
  assert.match(source, /当前核查项暂无可关联的逐文件内容事实/);
  assert.match(source, /opening-agent-content-facts-card/);
  assert.match(styles, /\.opening-agent-content-facts-card/);
  assert.match(styles, /\.opening-agent-content-fact-row/);
  assert.match(source, /平台正在准备最终 Markdown 报告/);
  assert.match(source, /辅助诊断/);
});

test("UI smoke keeps basis as context and packet files as evidence candidates", async () => {
  const storeSource = await readFile(pilotStoreSourcePath, "utf8");

  assert.match(storeSource, /const basisObject = normalizeObjectRef\(input\.basisObject\);/);
  assert.match(storeSource, /const sourceObjects = Array\.isArray\(input\.sourceObjects\)/);
  assert.match(storeSource, /sourceObject: basisObject/);
  assert.match(storeSource, /sourceObjects,/);
  assert.doesNotMatch(storeSource, /sourceObjects:\s*\[basisObject/);
});

test("UI smoke keeps the cloud-case shell clean when no backend task exists", async () => {
  const source = await readFile(workspacePagesSourcePath, "utf8");
  const cleanReviewSource = await readFile(cleanReviewSourcePath, "utf8");
  const appSource = await readFile(appSourcePath, "utf8");

  assert.match(source, /label: "新建审核"/);
  assert.match(source, /opening-sidebar-history/);
  assert.match(source, /当前项目暂无历史审核/);
  assert.match(source, /selectedAgentTaskId/);
  assert.match(source, /onCloseAgentTask/);
  assert.match(source, /onCloseAgentTask/);
  assert.match(source, /reviewScope=\{complianceReviewRequested \? "completeness_and_compliance" : "completeness"\}/);
  assert.match(source, /reviewScope,/);
  assert.match(cleanReviewSource, /const cleanOpeningWorkspace/);
  assert.match(cleanReviewSource, /basisVersions: \[\]/);
  assert.match(cleanReviewSource, /checkItems: \[\]/);
  assert.doesNotMatch(cleanReviewSource, /G15|g15|汽车吊检验报告|basis-contract-g15-08|oc-check-001/);
  assert.match(appSource, /from "\.\/domain\/openingConditionReviewClean"/);
});

test("UI smoke keeps the default opening-condition home as one centered chat entry", async () => {
  const source = await readFile(workspacePagesSourcePath, "utf8");
  const styles = await readFile(new URL("../src/styles/opening-condition.css", import.meta.url), "utf8");

  assert.match(source, /activePage !== "workspace-context" && \(/);
  assert.match(source, /if \(!selectedAgentTask\) \{/);
  assert.match(source, /opening-agent-chat-home|opening-agent-chat-page/);
  assert.match(source, /opening-agent-chat-input/);
  assert.match(source, /请上传审核资料，开始一次开工条件核查/);
  assert.match(source, /上传待核查文件/);
  assert.match(source, /资料完整性（必选）/);
  assert.match(source, /资料合规性（可选）/);
  assert.match(source, /const uploadDisabled = busy \|\| submitting \|\| !portalState\.canUploadNewRun;/);
  assert.match(source, /const submitDisabled = uploadDisabled \|\| missingRequiredFiles;/);
  assert.match(source, /disabled=\{uploadDisabled\}/);
  assert.match(source, /disabled=\{submitDisabled\}/);
  assert.match(source, /selectedAgentTask && \(/);
  assert.match(source, /opening-agent-chat-stage/);
  assert.match(styles, /\.opening-agent-chat-stage/);
  assert.match(styles, /\.opening-agent-chat-input/);
  assert.match(styles, /\.opening-agent-chat-scope/);
  assert.match(styles, /\.opening-agent-modal \.opening-trial-upload-grid input::file-selector-button/);
  assert.doesNotMatch(source, /<div className="opening-agent-chat-context">/);
  assert.doesNotMatch(styles, /\.opening-agent-chat-context/);
});

test("UI smoke protects centered agent home, derived preview preference, and active human-review refresh", async () => {
  const source = await readFile(workspacePagesSourcePath, "utf8");
  const appSource = await readFile(appSourcePath, "utf8");
  const styles = await readFile(new URL("../src/styles/opening-condition.css", import.meta.url), "utf8");

  assert.match(styles, /\.opening-workspace-content[\s\S]*justify-content: center/);
  assert.match(styles, /\.opening-condition-page[\s\S]*margin: 0 auto/);
  assert.match(source, /\[\.\.\.\(pilotTask \? \[pilotTask\] : \[\]\), \.\.\.\(allPilotTasks \?\? \[\]\)\]/);
  assert.match(source, /const openReviewByTargetId = useMemo/);
  assert.match(source, /assetizationStatus/);
  assert.match(source, /hasDerivedAsset/);
  assert.match(source, /sourceArchiveStorageKey/);
  assert.match(source, /sourceArchiveFileName/);
  assert.match(appSource, /setOpeningPilotAllTasks\(\(tasks\) => upsertOpeningPilotTaskList\(tasks, nextTask\)\);/);
  assert.match(appSource, /setOpeningPilotWorkspaceTasks\(\(tasks\) => upsertOpeningPilotTaskList\(tasks, nextTask\)\);/);
});
