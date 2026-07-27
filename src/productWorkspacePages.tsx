import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import {
  ArrowLeft,
  Archive,
  BookOpen,
  EyeOff,
  ExternalLink,
  FileSearch,
  LogOut,
  RotateCcw,
  ShieldCheck,
  SunMoon,
  Trash2,
  Users,
} from "lucide-react";
import { ConnectivityStatus, formatFileSize, MetricBlock, NavButton } from "./appShellDisplay";
import { roleLabels } from "./appShellTypes";
import type { OpeningConditionPortalPage, Role, Session, ThemeMode } from "./appShellTypes";
import {
  bootstrapOpeningConditionPilotTrial,
  fetchMinioPresignedDocumentUrl,
  uploadMinioDocument,
  type OpeningConditionPilotBasisRecord,
  type OpeningConditionPilotIntakeInitResult,
  type OpeningConditionPilotMasterDataRecord,
  type OpeningConditionPilotReadinessResult,
  type OpeningConditionWorkspaceAssetRegistrySummary,
} from "./domain/backendConnectivity";
import type { ProductLauncherEntry, ProductPortalId } from "./domain/productPortal";
import {
  buildOpeningConditionWorkspaceCatalog,
  getOpeningConditionBasisPublicationStatusMeta,
  getOpeningConditionMasterDataPublicationStatusMeta,
  getOpeningConditionRiskSummary,
  getOpeningConditionVerdictSummary,
  openingConditionBasisComponentTypeLabels,
  openingConditionMasterDataTypeLabels,
  openingConditionRecordStatusLabels,
  openingConditionRiskLabels,
  openingConditionVerdictLabels,
  type OpeningConditionReviewPacket,
  type OpeningConditionReviewObjectType,
  type OpeningConditionWorkspace,
  type OpeningConditionWorkspaceProjectCatalog,
} from "./domain/openingConditionReviewClean";
import type {
  OpeningConditionObjectRef,
  OpeningConditionPilotChecklistDefinitionItem,
  OpeningConditionPilotEvidence,
  OpeningConditionPilotHumanReviewItem,
  OpeningConditionPilotKnowledgeBaseRef,
  OpeningConditionPilotLegalBasisReference,
  OpeningConditionPilotMvpAcceptanceSnapshot,
  OpeningConditionPilotReportDeliveryPackage,
  OpeningConditionPilotReportDeliveryPackageRow,
  OpeningConditionPilotReviewScope,
  OpeningConditionPilotTask,
} from "./domain/openingConditionPilot";
import { openingConditionPilotStateLabels } from "./domain/openingConditionPilot";

// Opening-condition product boundary: workspace, preflight, packet matching, human review,
// rectification runs, report delivery, and archive history.
import {
  deriveOpeningConditionRunActionOwnership,
  deriveOpeningConditionPortalViewState,
  type OpeningConditionRunActionOwnership,
  type OpeningConditionPortalViewState,
  type OpeningPilotIntakeMode,
} from "./openingConditionPortalState";
import {
  deriveOpeningConditionRerunAssetDiff,
  getOpeningConditionAssetReuseStatusMeta,
} from "./openingConditionRerunAssetReuse";
import {
  buildHumanReviewMap as buildRunSnapshotHumanReviewMap,
  buildLatestHumanReviewMap,
  buildRunRoundMap,
  compareTaskByUpdatedAtDesc,
  deriveOpeningConditionRunSnapshot,
  getCheckItemDisposition as getRunSnapshotCheckItemDisposition,
  isProblemCheckItem,
  type RectificationClosureCategory,
  type RectificationClosureDiff,
} from "./openingConditionRunSnapshot";

const openingWorkspaceNav: Array<{
  id: OpeningConditionPortalPage;
  label: string;
  icon: typeof BookOpen;
}> = [
  { id: "workspace-context", label: "新建审核", icon: BookOpen },
];

const openingWorkspacePageLabels: Record<OpeningConditionPortalPage, string> = {
  "workspace-context": "核查任务台账",
  "material-intake": "资料接入执行页",
  "basis-sets": "资产治理（后续）",
  "master-data": "主数据治理",
  "check-tasks": "资料核查详情",
  "human-review": "人工复核",
  reports: "报告归档",
};

const openingPrimaryNavPageIds = new Set<OpeningConditionPortalPage>(openingWorkspaceNav.map((item) => item.id));

const readinessLabels: Record<string, string> = {
  ready: "就绪",
  blocked: "阻塞",
  provisional: "待完善",
  missing: "缺失",
  stale: "需刷新",
  unreachable: "不可达",
};

const basisPreviewStatusLabels: Record<string, string> = {
  needs_confirmation: "Preview needs confirmation",
  confirmed: "Preview confirmed",
  rejected: "Preview rejected",
  published: "Preview published",
};

type OpeningConditionMvpClosureStep = {
  key: "intake" | "match" | "humanReview" | "report" | "archive" | "rerun";
  label: string;
  done: boolean;
};

function deriveOpeningConditionMvpClosureState(pilotTask?: OpeningConditionPilotTask | null): {
  title: string;
  description: string;
  nextPage: OpeningConditionPortalPage;
  nextPageLabel: string;
  steps: OpeningConditionMvpClosureStep[];
} {
  const hasTask = Boolean(pilotTask);
  const hasChecklistResult = Boolean((pilotTask?.checkItems ?? []).length > 0);
  const activeHumanReviewCount = (pilotTask?.humanReviewQueue ?? []).filter((item) => item.status === "open" || item.status === "deferred").length;
  const reportReady = pilotTask?.reportAsset?.status === "ready";
  const archived = pilotTask?.state === "archived";
  const hasReportStage = reportReady || pilotTask?.state === "report_ready" || archived;

  const steps: OpeningConditionMvpClosureStep[] = [
    { key: "intake", label: "资料接入", done: hasTask && !["draft", "ready_for_packet"].includes(pilotTask?.state ?? "") },
    { key: "match", label: "正式核查", done: hasChecklistResult || ["awaiting_human_review", "report_ready", "archived"].includes(pilotTask?.state ?? "") },
    { key: "humanReview", label: "人工复核", done: hasChecklistResult && activeHumanReviewCount === 0 && ["report_ready", "archived"].includes(pilotTask?.state ?? "") },
    { key: "report", label: "报告生成/导出", done: hasReportStage },
    { key: "archive", label: "归档留痕", done: archived },
    { key: "rerun", label: "下一轮复审", done: archived },
  ];

  if (!hasTask || ["draft", "ready_for_packet", "blocked_missing_basis", "blocked_missing_master_data", "packet_uploaded"].includes(pilotTask?.state ?? "")) {
    return {
      title: "当前还在 MVP 资料接入门禁阶段",
      description: "最小 MVP 不是先完成资产治理页，而是先让当前 run 进入正式核查。请优先回到资料接入，完成初始化、依据/主数据/知识库门禁和正式核查。",
      nextPage: "material-intake",
      nextPageLabel: "回到资料接入",
      steps,
    };
  }

  if (pilotTask?.state === "awaiting_human_review" || activeHumanReviewCount > 0) {
    return {
      title: "当前 MVP 已进入人工复核阶段",
      description: "正式核查已经产生结果，下一步要关闭 open/deferred 人工复核项，再生成报告。",
      nextPage: "human-review",
      nextPageLabel: "处理人工复核",
      steps,
    };
  }

  if (pilotTask?.state === "report_ready" && !reportReady) {
    return {
      title: "当前 MVP 已到报告生成阶段",
      description: "人工复核阻塞已收口，下一步生成报告资产，并按需导出 DOCX。",
      nextPage: "reports",
      nextPageLabel: "生成报告",
      steps,
    };
  }

  if (reportReady && !archived) {
    return {
      title: "当前 MVP 已生成报告，等待归档",
      description: "报告资产已经形成。下一步在报告归档页确认并归档本轮，形成历史留痕。",
      nextPage: "reports",
      nextPageLabel: "去报告归档",
      steps,
    };
  }

  if (archived) {
    return {
      title: "当前 MVP 单轮闭环已完成",
      description: "本轮已经归档。下一步如需验证多轮次能力，请从报告归档页发起下一轮整改复审。",
      nextPage: "reports",
      nextPageLabel: "查看归档/发起复审",
      steps,
    };
  }

  return {
    title: "当前 MVP 正在正式核查阶段",
    description: "请查看资料核查矩阵，确认缺失、匹配和待复核项是否符合预期。",
    nextPage: "check-tasks",
    nextPageLabel: "查看资料核查",
    steps,
  };
}

function getBasisPreviewTone(status?: string) {
  switch (status) {
    case "published":
    case "confirmed":
      return "success";
    case "rejected":
      return "danger";
    case "needs_confirmation":
      return "warning";
    default:
      return "muted";
  }
}

function summarizeBasisPreviewFacts(facts?: Record<string, string | undefined>) {
  if (!facts) {
    return "No structured preview facts recorded.";
  }

  return Object.entries(facts)
    .filter(([, value]) => typeof value === "string" && value.trim())
    .slice(0, 5)
    .map(([key, value]) => `${key}: ${value}`)
    .join(" / ") || "No structured preview facts recorded.";
}

function summarizeBasisPreviewProvenance(provenance?: NonNullable<OpeningConditionPilotBasisRecord["ingestionPreview"]>["provenance"]) {
  if (!provenance) {
    return "No extraction provenance recorded.";
  }

  const parts = [
    provenance.provider,
    provenance.extractor,
    provenance.source,
    provenance.providerJobId,
    provenance.providerDocumentId,
    provenance.sourceFileName,
    provenance.boundedTextLength ? `${provenance.boundedTextLength} chars` : "",
  ]
    .filter(Boolean)
    .join(" / ");
  return parts || "No extraction provenance recorded.";
}

function summarizeMasterDataPreviewFacts(preview?: OpeningConditionPilotMasterDataRecord["preview"]) {
  if (!preview || preview.facts.length === 0) {
    return "No structured master-data facts recorded.";
  }

  return preview.facts
    .slice(0, 6)
    .map((fact) => `${fact.label}: ${fact.value}`)
    .join(" / ");
}

function summarizeMasterDataPreviewSources(preview?: OpeningConditionPilotMasterDataRecord["preview"]) {
  if (!preview || preview.sourceEvidence.length === 0) {
    return "No source evidence label recorded.";
  }

  return preview.sourceEvidence.slice(0, 4).join(" / ");
}

function getOpeningActionGateTitle(gate: { enabled: boolean; disabledReason: string }, fallback = "") {
  return gate.enabled ? "" : gate.disabledReason || fallback;
}

type ReportFinding = {
  id: string;
  title: string;
  category: string;
  severity: "high" | "medium" | "low";
  severityLabel: string;
  severityTone: "danger" | "warning" | "info";
  disposition: string;
  dispositionLabel: string;
  dispositionTone: "danger" | "warning" | "success" | "info" | "muted";
  statusLabel: string;
  description: string;
  basis: string;
  rectification: string;
  evidence: string[];
  humanReview: string[];
};

function summarizeLegalBasisReferences(legalBasis: OpeningConditionPilotLegalBasisReference[] = []) {
  if (legalBasis.length === 0) {
    return "未记录依据";
  }

  return (
    legalBasis
      .map((item) => [item.title, item.clause].filter(Boolean).join(" "))
      .filter(Boolean)
      .join(" / ") || "未记录依据"
  );
}

type ReportFindingGroup = {
  id: "blocked" | "failed" | "pendingHuman" | "warning";
  title: string;
  description: string;
  tone: "danger" | "warning" | "info" | "muted";
  findings: ReportFinding[];
};

type ReportRectificationDeliveryRow = OpeningConditionPilotReportDeliveryPackageRow & {
  sequence: number;
  id: string;
  checkItem: string;
  category: string;
  issueDescription: string;
  riskLabel: string;
  riskTone: ReportFinding["severityTone"];
  dispositionLabel: string;
  dispositionTone: ReportFinding["dispositionTone"];
  basis: string;
  rectification: string;
  notes: string[];
};

type OpeningConditionIssueClosureSummary = {
  statusLabel: string;
  statusTone: ReportFinding["dispositionTone"];
  trackedIssueCount: number;
  openIssueCount: number;
  pendingHumanReviewCount: number;
  resolvedHumanReviewCount: number;
  rectificationDeliveryCount: number;
  nextAction: string;
};

type RectificationClosureSummary = RectificationClosureDiff["summary"];

const reportDeliveryDispositions = new Set(["blocked", "fail", "reject", "needs_human_review", "warning"]);

function buildReportRectificationDeliveryRows(findings: ReportFinding[]): ReportRectificationDeliveryRow[] {
  return findings
    .filter((finding) => reportDeliveryDispositions.has(finding.disposition))
    .map((finding, index) => ({
      sequence: index + 1,
      id: finding.id,
      checkItem: finding.title,
      category: finding.category,
      issueDescription: finding.description || finding.dispositionLabel,
      riskLabel: finding.severityLabel,
      riskTone: finding.severityTone,
      dispositionLabel: finding.dispositionLabel,
      dispositionTone: finding.dispositionTone,
      basis: finding.basis || "未记录明确依据",
      rectification: finding.rectification || "补齐对应资料后重新提交复审。",
      notes: [...finding.evidence, ...finding.humanReview].slice(0, 4),
    }));
}

function buildOpeningConditionIssueClosureSummary(input: {
  findings: ReportFinding[];
  humanReviewQueue?: OpeningConditionPilotHumanReviewItem[];
  rectificationDeliveryRows: ReportRectificationDeliveryRow[];
  taskState?: OpeningConditionPilotTask["state"];
  reportReady?: boolean;
}): OpeningConditionIssueClosureSummary {
  const openBlockingIssueCount = input.findings.filter((finding) =>
    finding.disposition === "blocked" || finding.disposition === "fail" || finding.disposition === "reject"
  ).length;
  const pendingHumanReviewCount = (input.humanReviewQueue ?? []).filter(
    (item) => item.status === "open" || item.status === "deferred",
  ).length;
  const resolvedHumanReviewCount = (input.humanReviewQueue ?? []).filter(
    (item) => item.status !== "open" && item.status !== "deferred",
  ).length;
  const openIssueCount = openBlockingIssueCount + pendingHumanReviewCount;

  if (input.taskState === "archived") {
    return {
      statusLabel: "已归档留痕",
      statusTone: "success",
      trackedIssueCount: input.findings.length,
      openIssueCount,
      pendingHumanReviewCount,
      resolvedHumanReviewCount,
      rectificationDeliveryCount: input.rectificationDeliveryRows.length,
      nextAction: "本轮已归档，可用于历史复盘或发起下一轮整改复审。",
    };
  }

  if (pendingHumanReviewCount > 0) {
    return {
      statusLabel: "待人工闭环",
      statusTone: "warning",
      trackedIssueCount: input.findings.length,
      openIssueCount,
      pendingHumanReviewCount,
      resolvedHumanReviewCount,
      rectificationDeliveryCount: input.rectificationDeliveryRows.length,
      nextAction: "先关闭 open/deferred 人工复核项，再进入报告生成或整改交付。",
    };
  }

  if (openBlockingIssueCount > 0) {
    return {
      statusLabel: "待整改交付",
      statusTone: "danger",
      trackedIssueCount: input.findings.length,
      openIssueCount,
      pendingHumanReviewCount,
      resolvedHumanReviewCount,
      rectificationDeliveryCount: input.rectificationDeliveryRows.length,
      nextAction: "将不通过和阻塞项纳入整改交付清单，生成报告后提交补件复审。",
    };
  }

  if (input.reportReady) {
    return {
      statusLabel: "报告已就绪",
      statusTone: "success",
      trackedIssueCount: input.findings.length,
      openIssueCount,
      pendingHumanReviewCount,
      resolvedHumanReviewCount,
      rectificationDeliveryCount: input.rectificationDeliveryRows.length,
      nextAction: "报告资产已形成，可归档留痕或导出交付。",
    };
  }

  return {
    statusLabel: "可进入报告",
    statusTone: "info",
    trackedIssueCount: input.findings.length,
    openIssueCount,
    pendingHumanReviewCount,
    resolvedHumanReviewCount,
    rectificationDeliveryCount: input.rectificationDeliveryRows.length,
    nextAction: "当前无阻塞人工复核，可生成报告或继续核对整改清单。",
  };
}

function formatRectificationClosureSummary(summary: RectificationClosureSummary) {
  return `已整改 ${summary.rectified} / 仍未整改 ${summary.carried_over} / 本轮新增 ${summary.newly_added} / 待人工判断 ${summary.pending_human_review}`;
}

function buildOpeningConditionReportDeliveryPackage(input: {
  task?: OpeningConditionPilotTask | null;
  rows: ReportRectificationDeliveryRow[];
  blockingCount: number;
  pendingHumanReviewCount: number;
  adapterStatus?: string;
  generatedAt?: string;
}): OpeningConditionPilotReportDeliveryPackage | null {
  const { task, rows, blockingCount, pendingHumanReviewCount, adapterStatus, generatedAt } = input;
  if (!task) {
    return null;
  }

  const archived = task.state === "archived";
  const status: OpeningConditionPilotReportDeliveryPackage["status"] =
    rows.length === 0
      ? "empty"
      : pendingHumanReviewCount > 0 || blockingCount > 0
        ? "blocked_by_review"
        : archived
          ? "archived_ready"
          : "ready_for_handoff";
  const statusLabel: Record<OpeningConditionPilotReportDeliveryPackage["status"], string> = {
    empty: "暂无整改交付项",
    blocked_by_review: "人工复核阻塞交付",
    ready_for_handoff: "可交付给导出/回填",
    archived_ready: "历史归档可复用",
  };
  const nextAction: Record<OpeningConditionPilotReportDeliveryPackage["status"], string> = {
    empty: "当前报告没有需要导出给整改闭环的行，保留报告摘要即可。",
    blocked_by_review: "先关闭人工复核或阻塞项，再把结构化行交付给 DOCX、原表回填或智能体。",
    ready_for_handoff: "可复用这些结构化行生成 DOCX、回填原核查表，或交给法规整改智能体继续处理。",
    archived_ready: "该历史轮次只读，可作为复盘、对比和再次导出的稳定输入。",
  };

  return {
    schemaVersion: "opening-condition-report-delivery-package.v1",
    packageId: `oc-report-delivery-${task.id}`,
    taskId: task.id,
    status,
    statusLabel: statusLabel[status],
    generatedAt: generatedAt ?? task.reportAsset?.createdAt ?? task.updatedAt,
    readOnly: archived,
    rowCount: rows.length,
    blockingCount,
    pendingHumanReviewCount,
    adapterStatus,
    nextAction: nextAction[status],
    rows,
    safeDiagnostics: [
      `rows=${rows.length}`,
      `blocking=${blockingCount}`,
      `pendingHumanReview=${pendingHumanReviewCount}`,
      `readOnly=${archived}`,
    ],
  };
}

function OpeningConditionReportRectificationDeliveryList({ rows }: { rows: ReportRectificationDeliveryRow[] }) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="opening-report-rectification-list">
      <div className="opening-report-rectification-header">
        <div>
          <span className="eyebrow">Rectification Delivery List</span>
          <h3>整改交付清单</h3>
          <p>按报告交付口径列出本轮不符合、阻塞、待人工判断和提示关注项，后续 DOCX/原表回填也应复用这些字段。</p>
        </div>
        <span className="opening-report-chip tone-warning">{rows.length} 项</span>
      </div>
      <div className="opening-report-rectification-table" role="table" aria-label="整改交付清单">
        <div className="opening-report-rectification-table-head" role="row">
          <span>序号</span>
          <span>核查项目</span>
          <span>问题描述</span>
          <span>风险</span>
          <span>依据</span>
          <span>整改要求</span>
        </div>
        {rows.map((row) => (
          <div key={row.id} className="opening-report-rectification-row" role="row">
            <span className="opening-report-rectification-sequence">{row.sequence}</span>
            <div>
              <strong>{row.checkItem}</strong>
              <small>{row.category}</small>
              <span className={`opening-report-chip tone-${row.dispositionTone}`}>{row.dispositionLabel}</span>
            </div>
            <p>{row.issueDescription}</p>
            <span className={`opening-report-chip tone-${row.riskTone}`}>{row.riskLabel}</span>
            <small>{row.basis}</small>
            <div>
              <p>{row.rectification}</p>
              {row.notes.length > 0 && <small>证据/复核：{row.notes.join(" / ")}</small>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OpeningConditionReportDeliveryPackageSummary({
  deliveryPackage,
}: {
  deliveryPackage: OpeningConditionPilotReportDeliveryPackage | null;
}) {
  if (!deliveryPackage) {
    return null;
  }

  const statusTone: Record<OpeningConditionPilotReportDeliveryPackage["status"], "danger" | "warning" | "success" | "info" | "muted"> = {
    empty: "muted",
    blocked_by_review: "warning",
    ready_for_handoff: "success",
    archived_ready: "info",
  };

  return (
    <div className="opening-record-list opening-record-list-compact">
      <div>
        <div className="opening-report-finding-header">
          <div>
            <strong>报告交付包</strong>
            <p>面向 DOCX 导出、原表回填、十二类问题审查智能体和法规整改智能体的稳定结构化输入。</p>
          </div>
          <div className="opening-report-chip-row">
            <span className={`opening-report-chip tone-${statusTone[deliveryPackage.status]}`}>
              {deliveryPackage.statusLabel}
            </span>
            <span className="opening-report-chip tone-muted">{deliveryPackage.schemaVersion}</span>
          </div>
        </div>
        <div className="opening-report-summary-grid">
          <div className="opening-report-summary-card tone-info">
            <strong>交付行</strong>
            <span>{deliveryPackage.rowCount}</span>
            <p>可进入 DOCX/原表回填的整改行。</p>
          </div>
          <div className="opening-report-summary-card tone-warning">
            <strong>阻塞项</strong>
            <span>{deliveryPackage.blockingCount}</span>
            <p>仍会影响交付判断的阻塞数量。</p>
          </div>
          <div className="opening-report-summary-card tone-muted">
            <strong>待人工</strong>
            <span>{deliveryPackage.pendingHumanReviewCount}</span>
            <p>仍需监理判断的复核项。</p>
          </div>
          <div className="opening-report-summary-card tone-success">
            <strong>适配状态</strong>
            <span>{deliveryPackage.adapterStatus ?? "draft"}</span>
            <p>{deliveryPackage.readOnly ? "归档只读，可复用导出。" : "当前轮次可继续推进。"}</p>
          </div>
        </div>
        <div className="opening-report-detail-list">
          <small>
            <strong>package</strong>
            {deliveryPackage.packageId}
          </small>
          <small>
            <strong>下一动作</strong>
            {deliveryPackage.nextAction}
          </small>
          {deliveryPackage.safeDiagnostics.map((item) => (
            <small key={item}>
              <strong>diagnostic</strong>
              {item}
            </small>
          ))}
        </div>
      </div>
    </div>
  );
}

function getOpeningConditionMvpAcceptanceTone(status: OpeningConditionPilotMvpAcceptanceSnapshot["status"]) {
  if (status === "archived" || status === "ready_for_archive") {
    return "success";
  }
  if (status === "failed") {
    return "danger";
  }
  return "warning";
}

function getOpeningConditionMvpAcceptanceStepTone(status: OpeningConditionPilotMvpAcceptanceSnapshot["steps"][number]["status"]) {
  if (status === "complete") {
    return "success";
  }
  if (status === "blocked") {
    return "danger";
  }
  return "muted";
}

function OpeningConditionMvpAcceptanceSnapshotPanel({
  snapshot,
}: {
  snapshot?: OpeningConditionPilotMvpAcceptanceSnapshot;
}) {
  if (!snapshot) {
    return null;
  }

  return (
    <div className="opening-report-delivery-handoff">
      <div className="opening-report-finding-header">
        <div>
          <span className="eyebrow">MVP Acceptance</span>
          <strong>{snapshot.statusLabel}</strong>
        </div>
        <div className="opening-report-chip-row">
          <span className={`opening-report-chip tone-${getOpeningConditionMvpAcceptanceTone(snapshot.status)}`}>
            {snapshot.completed ? "闭环完成" : "闭环推进中"}
          </span>
          <span className="opening-report-chip tone-info">{snapshot.currentOwner}</span>
          {snapshot.readOnly && <span className="opening-report-chip tone-muted">只读留痕</span>}
        </div>
      </div>
      <div className="opening-report-context-grid">
        <div className="opening-action-summary-item">
          <strong>下一动作</strong>
          <small>{snapshot.nextAction}</small>
        </div>
        <div className="opening-action-summary-item">
          <strong>阻塞原因</strong>
          <small>{snapshot.blockingReasons.length > 0 ? snapshot.blockingReasons.join(" / ") : "无阻塞原因。"}</small>
        </div>
        <div className="opening-action-summary-item">
          <strong>生成时间</strong>
          <small>{snapshot.generatedAt}</small>
        </div>
      </div>
      <div className="opening-report-summary-grid">
        {snapshot.steps.map((step) => (
          <div key={step.key} className={`opening-report-summary-card tone-${getOpeningConditionMvpAcceptanceStepTone(step.status)}`}>
            <strong>{step.label}</strong>
            <span>{step.status === "complete" ? "完成" : step.status === "blocked" ? "阻塞" : "待推进"}</span>
            <p>{step.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

type OpeningConditionTaskWorkbenchRow = {
  taskId: string;
  roundLabel: string;
  targetLabel: string;
  participantLabel: string;
  stateLabel: string;
  stateTone: "danger" | "warning" | "success" | "info" | "muted";
  owner: string;
  nextAction: string;
  totalCheckItems: number;
  problemCount: number;
  openHumanReviewCount: number;
  evidenceCount: number;
  matchingComplete: boolean;
  reportActionAvailable: boolean;
  reportLabel: string;
  reportTone: "danger" | "warning" | "success" | "info" | "muted";
  updatedAt: string;
  readOnly: boolean;
  rectificationClosureSummary?: RectificationClosureSummary | null;
  rectificationClosureReferenceLabel?: string;
  recommendedPage: OpeningConditionPortalPage;
  actionLabel: string;
  executionRouteLabel: string;
  acceptanceSnapshot?: OpeningConditionPilotMvpAcceptanceSnapshot;
  acceptanceLabel: string;
  acceptanceTone: "danger" | "warning" | "success" | "info" | "muted";
  trialHandoff: {
    statusLabel: string;
    statusTone: "danger" | "warning" | "success" | "info" | "muted";
    currentOwner: string;
    nextAction: string;
    recommendedEntry: string;
    blockingSummary: string;
    inputSummary: string;
    executionSummary: string;
    historySummary: string;
  } | null;
  issuePreviewRows: OpeningConditionTaskIssuePreviewRow[];
  pendingReviewRows: OpeningConditionTaskPendingReviewRow[];
  deliverySummary: {
    findingCount: number;
    deliveryRowCount: number;
    evidenceCount: number;
    reportStatus: string;
    issueClosure: OpeningConditionIssueClosureSummary;
  };
};

type OpeningConditionTaskIssuePreviewRow = {
  id: string;
  title: string;
  category: string;
  dispositionLabel: string;
  dispositionTone: ReportFinding["dispositionTone"];
  severityLabel: string;
  severityTone: ReportFinding["severityTone"];
  evidenceLabel: string;
  reason: string;
};

type OpeningConditionTaskPendingReviewRow = {
  id: string;
  title: string;
  category: string;
  statusLabel: string;
  reason: string;
};

type OpeningConditionTaskHandoffStep = {
  key: "intake" | "match" | "humanReview" | "report" | "archive";
  label: string;
  done: boolean;
  description: string;
};

function deriveOpeningConditionTaskHandoffSteps(row: OpeningConditionTaskWorkbenchRow): OpeningConditionTaskHandoffStep[] {
  if (row.acceptanceSnapshot?.steps.length) {
    return row.acceptanceSnapshot.steps.map((step) => ({
      key: step.key === "human_review" ? "humanReview" : step.key,
      label: step.label,
      done: step.status === "complete",
      description: step.detail,
    }));
  }

  return [
    {
      key: "intake",
      label: "资料接入",
      done: true,
      description: "本轮任务已经创建并进入台账。",
    },
    {
      key: "match",
      label: "核查匹配",
      done: row.matchingComplete,
      description: row.matchingComplete ? "已形成核查项结果。" : "尚未形成核查项结果。",
    },
    {
      key: "humanReview",
      label: "人工复核",
      done: row.matchingComplete && row.openHumanReviewCount === 0,
      description:
        row.openHumanReviewCount > 0 ? `仍有 ${row.openHumanReviewCount} 项待复核。` : "暂无打开的人工复核项。",
    },
    {
      key: "report",
      label: "报告交付",
      done: row.reportActionAvailable,
      description: row.reportLabel,
    },
    {
      key: "archive",
      label: "归档留痕",
      done: row.readOnly,
      description: row.readOnly ? "该轮次已作为历史只读记录保留。" : "归档后将进入历史只读状态。",
    },
  ];
}

function getOpeningConditionTaskStateTone(
  state: OpeningConditionPilotTask["state"],
): OpeningConditionTaskWorkbenchRow["stateTone"] {
  switch (state) {
    case "archived":
    case "report_ready":
      return "success";
    case "awaiting_human_review":
    case "packet_uploaded":
    case "extracting":
    case "matching":
      return "info";
    case "blocked_missing_basis":
    case "blocked_missing_master_data":
      return "warning";
    case "failed":
    case "canceled":
      return "danger";
    default:
      return "muted";
  }
}

function getOpeningConditionTaskReportStatus(task: OpeningConditionPilotTask): {
  label: string;
  tone: OpeningConditionTaskWorkbenchRow["reportTone"];
} {
  if (task.state === "archived") {
    return { label: task.reportAsset?.status === "ready" ? "已归档，可查看报告" : "已归档，报告待补齐", tone: "success" };
  }

  if (task.reportAsset?.status === "ready") {
    return { label: "报告已生成", tone: "success" };
  }

  if (task.state === "report_ready") {
    return { label: "待生成报告", tone: "warning" };
  }

  if (task.state === "awaiting_human_review") {
    return { label: "复核后生成", tone: "info" };
  }

  return { label: "尚未到报告阶段", tone: "muted" };
}

function getOpeningConditionFallbackPage(task: OpeningConditionPilotTask): OpeningConditionPortalPage {
  if (task.state === "archived" || task.state === "report_ready" || task.reportAsset?.status === "ready") {
    return "reports";
  }
  if (task.state === "awaiting_human_review") {
    return "human-review";
  }
  if (task.checkItems.length > 0 || task.state === "extracting" || task.state === "matching") {
    return "check-tasks";
  }
  return "material-intake";
}

function getOpeningConditionFallbackActionLabel(page: OpeningConditionPortalPage) {
  switch (page) {
    case "reports":
      return "查看报告";
    case "human-review":
      return "处理复核";
    case "check-tasks":
      return "查看核查";
    case "material-intake":
      return "继续接入";
    default:
      return "进入详情";
  }
}

function getOpeningConditionExecutionRouteLabel(page: OpeningConditionPortalPage) {
  const label = openingWorkspacePageLabels[page] ?? "任务详情";
  return openingPrimaryNavPageIds.has(page) ? label : `${label}（二级执行页）`;
}

function buildOpeningConditionTaskTrialHandoffSummary(args: {
  task: OpeningConditionPilotTask;
  ownership?: OpeningConditionRunActionOwnership | null;
  recommendedPage: OpeningConditionPortalPage;
  readOnly: boolean;
}): OpeningConditionTaskWorkbenchRow["trialHandoff"] {
  const trialPackage = args.task.trialPackage;
  if (!trialPackage) {
    return null;
  }

  const deliveryHandoff = args.task.reportAsset?.packageDiagnostics?.deliveryHandoff;
  const blockingSummary =
    trialPackage.blockingReasons.length > 0
      ? trialPackage.blockingReasons.join(" / ")
      : trialPackage.providerReadiness?.summary ?? "No additional trial blockers recorded.";
  const inputSummary = `${trialPackage.inputObjects.basisFileName ?? "No basis file"} / ${trialPackage.inputObjects.checklistFileName ?? "No checklist file"}`;
  const executionSummary = `Sources ${trialPackage.inputObjects.sourceCount} / Manifest ${trialPackage.diagnostics.inventoryEntryCount} / Evidence ${trialPackage.matching.evidenceCount} / Pending review ${trialPackage.humanReview.blockingCount}`;
  const historySummary = args.readOnly
    ? "This run is historical read-only. Continue rectification from the current archived context."
    : "This run is still actionable. Clear blockers first, then continue from the recommended entry.";

  return {
    statusLabel: deliveryHandoff?.statusLabel ?? (args.readOnly ? "Historical delivery snapshot" : "Current trial delivery"),
    statusTone: args.readOnly ? "muted" : trialPackage.blockingReasons.length > 0 ? "warning" : "success",
    currentOwner: deliveryHandoff?.currentOwner ?? args.ownership?.currentOwner ?? "Material intake owner",
    nextAction:
      deliveryHandoff?.nextAction ??
      args.ownership?.nextAction ??
      "Review current blockers and continue from the recommended execution entry.",
    recommendedEntry: getOpeningConditionExecutionRouteLabel(args.recommendedPage),
    blockingSummary,
    inputSummary,
    executionSummary,
    historySummary,
  };
}

function buildOpeningConditionTaskIssuePreviewRows(findings: ReportFinding[]): OpeningConditionTaskIssuePreviewRow[] {
  const priority: Record<string, number> = {
    blocked: 0,
    reject: 1,
    fail: 2,
    needs_human_review: 3,
    warning: 4,
  };

  return [...findings]
    .filter((finding) => reportDeliveryDispositions.has(finding.disposition))
    .sort((left, right) => (priority[left.disposition] ?? 9) - (priority[right.disposition] ?? 9))
    .slice(0, 5)
    .map((finding) => ({
      id: finding.id,
      title: finding.title,
      category: finding.category,
      dispositionLabel: finding.dispositionLabel,
      dispositionTone: finding.dispositionTone,
      severityLabel: finding.severityLabel,
      severityTone: finding.severityTone,
      evidenceLabel: finding.evidence.length > 0 ? `${finding.evidence.length} 条证据` : "未命中稳定证据",
      reason: finding.description || finding.rectification || "未记录问题原因。",
    }));
}

function buildOpeningConditionTaskPendingReviewRows(
  task: OpeningConditionPilotTask,
): OpeningConditionTaskPendingReviewRow[] {
  return task.humanReviewQueue
    .filter((item) => item.status === "open" || item.status === "deferred")
    .slice(0, 5)
    .map((item) => ({
      id: item.id,
      title: item.targetLabel ?? item.targetId,
      category: [item.category, item.subCategory].filter(Boolean).join(" / ") || item.targetType,
      statusLabel: getHumanReviewStatusLabel(item.status),
      reason: item.reason,
    }));
}

function deriveOpeningConditionTaskWorkbenchRows({
  selectedWorkspaceId,
  currentWorkspace,
  pilotTask,
  allPilotTasks,
  pilotReadiness,
}: {
  selectedWorkspaceId: string;
  currentWorkspace: OpeningConditionWorkspace;
  pilotTask?: OpeningConditionPilotTask | null;
  allPilotTasks?: OpeningConditionPilotTask[];
  pilotReadiness?: OpeningConditionPilotReadinessResult | null;
}): OpeningConditionTaskWorkbenchRow[] {
  const byId = new Map<string, OpeningConditionPilotTask>();
  (allPilotTasks ?? [])
    .filter((task) => task.context.workspaceId === selectedWorkspaceId)
    .forEach((task) => byId.set(task.id, task));

  if (pilotTask && pilotTask.context.workspaceId === selectedWorkspaceId) {
    byId.set(pilotTask.id, pilotTask);
  }

  const tasks = [...byId.values()].sort(compareTaskByUpdatedAtDesc);
  const roundMap = buildRunRoundMap(tasks);

  return tasks.map((task) => {
    const ownership = deriveOpeningConditionRunActionOwnership({
      pilotTask: task,
      readiness: task.id === pilotTask?.id ? pilotReadiness : undefined,
    });
    const findings = buildReportFindings(task);
    const problemCount = findings.filter((item) =>
      item.disposition === "fail" || item.disposition === "reject" || item.disposition === "blocked"
    ).length;
    const openHumanReviewCount = task.humanReviewQueue.filter(
      (item) => item.status === "open" || item.status === "deferred",
    ).length;
    const reportStatus = getOpeningConditionTaskReportStatus(task);
    const recommendedPage = ownership?.recommendedPage ?? getOpeningConditionFallbackPage(task);
    const acceptanceSnapshot = task.reportAsset?.packageDiagnostics?.mvpAcceptance;
    const issuePreviewRows = buildOpeningConditionTaskIssuePreviewRows(findings);
    const pendingReviewRows = buildOpeningConditionTaskPendingReviewRows(task);
    const rectificationDeliveryRows = buildReportRectificationDeliveryRows(findings);
    const taskRunSnapshot = deriveOpeningConditionRunSnapshot({
      workspaceTasks: tasks,
      pilotTask: task,
    });
    const closureDiff = taskRunSnapshot.closureDiff;
    const issueClosure = buildOpeningConditionIssueClosureSummary({
      findings,
      humanReviewQueue: task.humanReviewQueue,
      rectificationDeliveryRows,
      taskState: task.state,
      reportReady: task.reportAsset?.status === "ready",
    });
    const rectificationClosureSummary = closureDiff?.summary ?? null;
    const rectificationClosureReferenceLabel = closureDiff
      ? `对比上一归档轮次 ${roundMap.get(closureDiff.previousTask.id) ?? "-"} 与当前查看轮次 ${roundMap.get(task.id) ?? "-"}`
      : undefined;
    const matchingComplete = task.checkItems.length > 0;
    const reportActionAvailable =
      task.state === "report_ready" || task.state === "archived" || task.reportAsset?.status === "ready";
    const readOnly = ownership?.readOnly ?? task.state === "archived";
    const trialHandoff = buildOpeningConditionTaskTrialHandoffSummary({
      task,
      ownership,
      recommendedPage,
      readOnly,
    });

    return {
      taskId: task.id,
      roundLabel: `第 ${roundMap.get(task.id) ?? "-"} 轮`,
      targetLabel: currentWorkspace.reviewObjectName,
      participantLabel: currentWorkspace.participantEntityName,
      stateLabel: openingConditionPilotStateLabels[task.state] ?? task.state,
      stateTone: getOpeningConditionTaskStateTone(task.state),
      owner: ownership?.currentOwner ?? "资料接入责任人",
      nextAction: ownership?.nextAction ?? "进入资料接入，创建或恢复本轮核查任务。",
      totalCheckItems: task.checkItems.length || task.checklistDefinition.length,
      problemCount,
      openHumanReviewCount,
      evidenceCount: task.evidence.length,
      matchingComplete,
      reportActionAvailable,
      reportLabel: reportStatus.label,
      reportTone: reportStatus.tone,
      updatedAt: task.updatedAt,
      readOnly,
      rectificationClosureSummary,
      rectificationClosureReferenceLabel,
      recommendedPage,
      actionLabel: ownership?.primaryActionLabel ?? getOpeningConditionFallbackActionLabel(recommendedPage),
      executionRouteLabel: getOpeningConditionExecutionRouteLabel(recommendedPage),
      acceptanceSnapshot,
      acceptanceLabel: acceptanceSnapshot?.statusLabel ?? "尚未形成 MVP 验收快照",
      acceptanceTone: acceptanceSnapshot ? getOpeningConditionMvpAcceptanceTone(acceptanceSnapshot.status) : "muted",
      trialHandoff,
      issuePreviewRows,
      pendingReviewRows,
      deliverySummary: {
        findingCount: findings.length,
        deliveryRowCount: rectificationDeliveryRows.length,
        evidenceCount: task.evidence.length,
        reportStatus: reportStatus.label,
        issueClosure,
      },
    };
  });
}

function getOpeningConditionAgentTaskTitle(task: OpeningConditionPilotTask) {
  return (
    task.packet?.checklistObject.fileName ??
    task.trialPackage?.inputObjects.checklistFileName ??
    task.context.reviewObjectId ??
    `开工条件核查任务 ${task.id}`
  );
}

function getOpeningConditionAgentTaskProgress(task?: OpeningConditionPilotTask | null) {
  if (!task) {
    return 0;
  }

  const latestEventProgress = [...task.events]
    .reverse()
    .find((event) => typeof event.progress === "number")?.progress;
  if (typeof latestEventProgress === "number") {
    return Math.max(0, Math.min(100, latestEventProgress));
  }

  switch (task.state) {
    case "archived":
      return 100;
    case "report_ready":
      return 90;
    case "awaiting_human_review":
      return 78;
    case "matching":
      return 62;
    case "extracting":
      return 42;
    case "packet_uploaded":
      return 28;
    case "ready_for_packet":
      return 18;
    case "failed":
    case "canceled":
      return 0;
    default:
      return 8;
  }
}

function buildOpeningConditionAgentMaterialFiles(task?: OpeningConditionPilotTask | null) {
  if (!task) {
    return [];
  }

  const packetSourceObjects = new Map((task.packet?.sourceObjects ?? []).map((item) => [item.objectId, item]));
  const files: Array<{
    id: string;
    label: string;
    fileName: string;
    summary: string;
    kind: string;
    storageKey?: string;
    contentType?: string;
    sizeBytes?: number;
    sourceObjectId?: string;
    sourceArchiveFileName?: string;
    sourceArchiveStorageKey?: string;
  }> = [];
  const basisObject = task.basisVersion?.sourceObject;
  if (basisObject) {
    files.push({
      id: basisObject.objectId,
      label: "合同/资质依据",
      fileName: basisObject.fileName,
      summary: basisObject.summary ?? "平台已绑定的审查依据",
      kind: basisObject.kind,
      storageKey: basisObject.storageKey,
      contentType: basisObject.contentType,
      sizeBytes: basisObject.sizeBytes,
    });
  }
  if (task.packet?.checklistObject) {
    files.push({
      id: task.packet.checklistObject.objectId,
      label: "资料核查表",
      fileName: task.packet.checklistObject.fileName,
      summary: task.packet.checklistObject.summary ?? "用于整理核查项目",
      kind: task.packet.checklistObject.kind,
      storageKey: task.packet.checklistObject.storageKey,
      contentType: task.packet.checklistObject.contentType,
      sizeBytes: task.packet.checklistObject.sizeBytes,
    });
  }
  for (const sourceObject of task.packet?.sourceObjects ?? []) {
    files.push({
      id: sourceObject.objectId,
      label: "核查资料包",
      fileName: sourceObject.fileName,
      summary: sourceObject.summary ?? "平台已接入的资料包",
      kind: sourceObject.kind,
      storageKey: sourceObject.storageKey,
      contentType: sourceObject.contentType,
      sizeBytes: sourceObject.sizeBytes,
    });
  }
  for (const entry of task.packet?.inventoryEntries ?? []) {
    const sourceArchive = entry.sourceObjectId ? packetSourceObjects.get(entry.sourceObjectId) : undefined;
    const derivedObject = entry.derivedObjectRef;
    files.push({
      id: entry.id,
      label: "资料包文件",
      fileName: entry.fileName,
      summary: entry.summary ?? "资料包拆分清单文件",
      kind: "inventory",
      storageKey: derivedObject?.storageKey,
      contentType: entry.contentType ?? derivedObject?.contentType,
      sizeBytes: entry.sizeBytes ?? derivedObject?.sizeBytes,
      sourceObjectId: entry.sourceObjectId,
      sourceArchiveFileName: sourceArchive?.fileName,
      sourceArchiveStorageKey: sourceArchive?.storageKey,
    });
  }
  return files;
}

type OpeningConditionAgentMaterialFile = ReturnType<typeof buildOpeningConditionAgentMaterialFiles>[number];
type OpeningConditionAgentReviewItem = ReturnType<typeof buildOpeningConditionAgentReviewItems>[number];
type OpeningConditionAgentWorkbenchMode =
  | { kind: "list" }
  | { kind: "preview"; fileId: string }
  | { kind: "review"; checkItemId: string };

function isDocxAgentMaterialFile(file: OpeningConditionAgentMaterialFile) {
  const fileName = file.fileName.toLowerCase();
  const contentType = (file.contentType ?? "").toLowerCase();
  return fileName.endsWith(".docx") || contentType.includes("wordprocessingml.document");
}

function isPdfAgentMaterialFile(file: OpeningConditionAgentMaterialFile) {
  const fileName = file.fileName.toLowerCase();
  const contentType = (file.contentType ?? "").toLowerCase();
  return fileName.endsWith(".pdf") || contentType.includes("application/pdf");
}

function isImageAgentMaterialFile(file: OpeningConditionAgentMaterialFile) {
  const fileName = file.fileName.toLowerCase();
  const contentType = (file.contentType ?? "").toLowerCase();
  return (
    contentType.startsWith("image/") ||
    [".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"].some((extension) => fileName.endsWith(extension))
  );
}

function renderOpeningMarkdownInline(text: string) {
  const nodes: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\(([^)]+)\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      nodes.push(<strong key={`strong-${match.index}`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*") && token.endsWith("*")) {
      nodes.push(<em key={`em-${match.index}`}>{token.slice(1, -1)}</em>);
    } else {
      const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        nodes.push(
          <a key={`link-${match.index}`} href={linkMatch[2]} target="_blank" rel="noreferrer">
            {linkMatch[1]}
          </a>,
        );
      } else {
        nodes.push(token);
      }
    }
    lastIndex = match.index + token.length;
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes.length > 0 ? nodes : text;
}

function parseOpeningMarkdownTableRow(line: string) {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isOpeningMarkdownTableDivider(line: string) {
  return /^\|\s*[-:| ]+\|\s*$/.test(line.trim());
}

function OpeningConditionMarkdownReport({ markdown }: { markdown: string }) {
  const lines = markdown.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith("### ")) {
      blocks.push(<h4 key={`h4-${index}`}>{renderOpeningMarkdownInline(trimmed.slice(4))}</h4>);
      index += 1;
      continue;
    }

    if (trimmed.startsWith("## ")) {
      blocks.push(<h3 key={`h3-${index}`}>{renderOpeningMarkdownInline(trimmed.slice(3))}</h3>);
      index += 1;
      continue;
    }

    if (trimmed.startsWith("|")) {
      const tableLines: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        tableLines.push(lines[index].trim());
        index += 1;
      }
      const [headerLine, ...rest] = tableLines;
      const bodyLines = rest.filter((entry) => !isOpeningMarkdownTableDivider(entry));
      const headers = parseOpeningMarkdownTableRow(headerLine);
      blocks.push(
        <div key={`table-${index}`} className="opening-agent-markdown-table-wrap">
          <table className="opening-agent-markdown-table">
            <thead>
              <tr>
                {headers.map((cell, cellIndex) => (
                  <th key={`th-${cellIndex}`}>{renderOpeningMarkdownInline(cell)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyLines.map((row, rowIndex) => (
                <tr key={`row-${rowIndex}`}>
                  {parseOpeningMarkdownTableRow(row).map((cell, cellIndex) => (
                    <td key={`td-${rowIndex}-${cellIndex}`}>{renderOpeningMarkdownInline(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    if (trimmed.startsWith("- ")) {
      const items: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith("- ")) {
        items.push(lines[index].trim().slice(2).trim());
        index += 1;
      }
      blocks.push(
        <ul key={`list-${index}`} className="opening-agent-markdown-list">
          {items.map((item, itemIndex) => (
            <li key={`li-${itemIndex}`}>{renderOpeningMarkdownInline(item)}</li>
          ))}
        </ul>,
      );
      continue;
    }

    const paragraphLines: string[] = [];
    while (index < lines.length) {
      const current = lines[index].trim();
      if (!current || current.startsWith("## ") || current.startsWith("### ") || current.startsWith("- ") || current.startsWith("|")) {
        break;
      }
      paragraphLines.push(current);
      index += 1;
    }
    const paragraph = paragraphLines.join(" ");
    const isEmphasisLine = /^\*[^*].*[^*]\*$/.test(paragraph);
    if (isEmphasisLine) {
      blocks.push(
        <p key={`emphasis-${index}`} className="opening-agent-markdown-emphasis">
          <em>{paragraph.slice(1, -1)}</em>
        </p>,
      );
    } else {
      blocks.push(
        <p key={`p-${index}`} className="opening-agent-markdown-paragraph">
          {renderOpeningMarkdownInline(paragraph)}
        </p>,
      );
    }
  }

  return <div className="opening-agent-markdown-report">{blocks}</div>;
}

function OpeningConditionAgentDocumentPreview({ file }: { file: OpeningConditionAgentMaterialFile | null }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const renderTokenRef = useRef(0);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "fallback" | "error">("idle");
  const [message, setMessage] = useState("请选择资料文档库中的文件进行预览。");
  const [openUrl, setOpenUrl] = useState("");

  useEffect(() => {
    renderTokenRef.current += 1;
    const token = renderTokenRef.current;
    const container = containerRef.current;
    if (!container) {
      return;
    }

    container.innerHTML = "";
    setOpenUrl("");
    if (!file) {
      setStatus("fallback");
      setMessage("请选择资料文档库中的文件进行预览。");
      return;
    }

    const previewFile = file;
    const previewContainer = container;
    let cancelled = false;
    async function loadPreview() {
      try {
        setStatus("loading");
        if (!previewFile.storageKey) {
          if (previewFile.sourceArchiveStorageKey) {
            setMessage("该资料包条目来自历史资料包清单，正在生成原始资料包访问链接...");
            const archivePresigned = await fetchMinioPresignedDocumentUrl(previewFile.sourceArchiveStorageKey, 900);
            if (cancelled || token !== renderTokenRef.current) {
              return;
            }
            setOpenUrl(archivePresigned.presigned?.url ?? "");
            setStatus("fallback");
            setMessage(
              `当前文件“${previewFile.fileName}”属于旧资料包清单条目，平台没有为它保留独立预览对象。可先打开原始资料包${
                previewFile.sourceArchiveFileName ? `（${previewFile.sourceArchiveFileName}）` : ""
              }，或重新上传新资料包以获得逐文件预览。`,
            );
            return;
          }
          setStatus("fallback");
          setMessage("当前文件来自历史资料包清单，平台没有可用于内联预览的独立对象。这通常是旧数据限制，建议重新上传新资料包后再逐文件预览。");
          return;
        }

        setMessage("正在生成临时预览链接...");
        const presigned = await fetchMinioPresignedDocumentUrl(previewFile.storageKey, 900);
        if (cancelled || token !== renderTokenRef.current) {
          return;
        }
        const previewUrl = presigned.presigned?.url ?? "";
        if (!presigned.ok || !previewUrl) {
          throw new Error(presigned.message || "无法生成临时预览链接。");
        }
        setOpenUrl(previewUrl);

        if (isPdfAgentMaterialFile(previewFile)) {
          previewContainer.innerHTML = "";
          const frame = document.createElement("iframe");
          frame.className = "opening-agent-inline-frame";
          frame.src = previewUrl;
          frame.title = previewFile.fileName;
          previewContainer.appendChild(frame);
          setStatus("ready");
          setMessage("PDF 预览已加载。");
          return;
        }

        if (isImageAgentMaterialFile(previewFile)) {
          previewContainer.innerHTML = "";
          const image = document.createElement("img");
          image.className = "opening-agent-inline-image";
          image.src = previewUrl;
          image.alt = previewFile.fileName;
          previewContainer.appendChild(image);
          setStatus("ready");
          setMessage("图片预览已加载。");
          return;
        }

        if (!isDocxAgentMaterialFile(previewFile)) {
          setStatus("fallback");
          setMessage("当前内联预览已支持 DOCX、PDF 和图片。该文件类型请直接打开原文件查看。");
          return;
        }

        setMessage("正在加载 DOCX 预览...");
        const response = await fetch(previewUrl);
        if (!response.ok) {
          throw new Error(`文件下载失败：${response.status}`);
        }
        const blob = await response.blob();
        if (cancelled || token !== renderTokenRef.current) {
          return;
        }
        const docxPreview = await import("docx-preview");
        previewContainer.innerHTML = "";
        await docxPreview.renderAsync(blob, previewContainer, undefined, {
          breakPages: true,
          className: "docx-preview-root",
          inWrapper: true,
          ignoreLastRenderedPageBreak: false,
        });
        if (cancelled || token !== renderTokenRef.current) {
          return;
        }
        setStatus("ready");
        setMessage("预览已加载。");
      } catch (error) {
        if (cancelled || token !== renderTokenRef.current) {
          return;
        }
        previewContainer.innerHTML = "";
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "文件预览失败。");
      }
    }

    void loadPreview();
    return () => {
      cancelled = true;
    };
  }, [file]);

  return (
    <div className="opening-agent-file-preview">
      {file ? (
        <>
          <div className="opening-agent-preview-header">
            <div>
              <span className="eyebrow">{file.kind}</span>
              <h3>{file.fileName}</h3>
              <p>{file.summary}</p>
            </div>
            {openUrl && (
              <a className="secondary opening-agent-preview-link" href={openUrl} target="_blank" rel="noreferrer">
                <ExternalLink size={14} />
                打开原文件
              </a>
            )}
          </div>
          <p className={`source-faithful-preview-status ${status}`}>{message}</p>
          {status === "loading" ? (
            <div className="opening-agent-preview-loading" aria-live="polite">
              <span className="opening-agent-preview-spinner" aria-hidden="true" />
              <span>正在加载文件预览…</span>
            </div>
          ) : null}
          <div ref={containerRef} className="docx-preview-shell opening-agent-docx-preview" />
        </>
      ) : (
        <p>请选择资料文档库中的文件进行预览。</p>
      )}
    </div>
  );
}

function buildOpeningConditionAgentReviewItems(task?: OpeningConditionPilotTask | null) {
  if (!task) {
    return [];
  }

  const evidenceById = new Map(task.evidence.map((item) => [item.id, item]));
  const latestHumanReviewByTargetId = buildLatestHumanReviewMap(
    task.humanReviewQueue.filter((item) => item.targetType === "check_item"),
  );
  const checkItems =
    task.checkItems.length > 0
      ? task.checkItems
      : task.checklistDefinition.map((item) => ({
          ...item,
          taskId: task.id,
          verdict: "needs_human_review" as const,
          ruleExplanation: "待平台匹配后生成核查结论。",
          evidenceIds: [],
          masterDataIds: item.masterDataIds,
          humanReviewIds: [],
        }));

  return checkItems.map((item) => {
    const latestReview = latestHumanReviewByTargetId.get(item.id);
    const matchedEvidence = item.evidenceIds.map((evidenceId) => evidenceById.get(evidenceId)).filter(Boolean);
    const status = latestReview && (latestReview.status === "open" || latestReview.status === "deferred")
      ? "待人工复核"
      : latestReview
        ? "已核查"
      : matchedEvidence.length > 0 || item.verdict === "pass"
        ? "已匹配"
        : "未匹配";
    const tone = status === "已匹配" || status === "已核查" ? "success" : status === "待人工复核" ? "warning" : "danger";

    return {
      id: item.id,
      label: `${item.category}${item.subCategory ? `-${item.subCategory}` : ""}${item.required ? "★" : ""}`,
      content: item.name,
      status,
      tone,
      evidenceText:
        matchedEvidence.length > 0
          ? matchedEvidence.map((evidence) => evidence?.objectRef.fileName).filter(Boolean).join(" / ")
          : item.ruleExplanation,
      humanReviewId: latestReview?.id ?? item.humanReviewIds[0],
      evidenceIds: item.evidenceIds,
    };
  });
}

function findOpeningConditionAgentPreviewFile(
  files: OpeningConditionAgentMaterialFile[],
  reviewItem: OpeningConditionAgentReviewItem | null,
  task?: OpeningConditionPilotTask | null,
) {
  if (!reviewItem || !task) {
    return null;
  }
  const evidenceById = new Map(task.evidence.map((item) => [item.id, item]));
  for (const evidenceId of reviewItem.evidenceIds ?? []) {
    const evidence = evidenceById.get(evidenceId);
    if (!evidence) {
      continue;
    }
    const matchedFile = files.find((file) => file.fileName === evidence.objectRef.fileName);
    if (matchedFile) {
      return matchedFile;
    }
  }
  return files[0] ?? null;
}

function buildOpeningConditionAgentProgressSteps(task?: OpeningConditionPilotTask | null) {
  if (!task) {
    return [
      {
        key: "waiting-upload",
        label: "Waiting for upload",
        detail: "Upload the basis document, checklist, and material packet first.",
        progress: 0,
        done: false,
        active: true,
        operatorRequired: false,
        occurredAt: undefined,
      },
    ];
  }

  const events = [...(task.events ?? [])].sort((left, right) => (left.sequence ?? 0) - (right.sequence ?? 0));
  const eventLabelByType: Record<string, string> = {
    "task.created": "Create audit task",
    "task.intake_initialized": "Initialize intake",
    "packet.uploaded": "Receive packet",
    "extraction.started": "Extract checklist",
    "extraction.completed": "Prepare checklist items",
    "matching.started": "Run material matching",
    "matching.completed": "Complete automatic review",
    "human_review.waiting": "Wait for human review",
    "report.ready": "Generate final report",
    "report.exported": "Export report asset",
    "task.archived": "Archive history",
    "task.failed": "Task failed",
    "task.canceled": "Task canceled",
  };
  const latestSequence = events[events.length - 1]?.sequence ?? 0;
  const eventSteps = events.map((event) => {
    const operatorRequired = event.type === "human_review.waiting" && task.state === "awaiting_human_review";
    return {
      key: event.id,
      label: eventLabelByType[event.type] ?? event.type,
      detail: event.message,
      progress: typeof event.progress === "number" ? event.progress : 0,
      done: !operatorRequired,
      active: operatorRequired || event.sequence === latestSequence,
      operatorRequired,
      occurredAt: event.occurredAt,
    };
  });

  if (task.state === "awaiting_human_review" && !eventSteps.some((step) => step.operatorRequired)) {
    eventSteps.push({
      key: "human-review-pause",
      label: "进入人工复核",
      detail: "AI 已完成自动核查，当前正在等待人工确认有争议或需补充判断的资料项。",
      progress: getOpeningConditionAgentTaskProgress(task),
      done: false,
      active: true,
      operatorRequired: true,
      occurredAt: task.updatedAt,
    });
  }

  if (eventSteps.length > 0) {
    return eventSteps;
  }

  return [
    {
      key: "state-fallback",
      label: openingConditionPilotStateLabels[task.state] ?? task.state,
      detail: "?????????????????",
      progress: getOpeningConditionAgentTaskProgress(task),
      done: task.state === "report_ready" || task.state === "archived",
      active: task.state !== "report_ready" && task.state !== "archived",
      operatorRequired: task.state === "awaiting_human_review",
      occurredAt: task.updatedAt,
    },
  ];
}

function OpeningConditionReviewTaskWorkbench({
  rows,
  onGoToIntake,
  onGoToPage,
  onFocusCheckItem,
  onFocusHumanReview,
}: {
  rows: OpeningConditionTaskWorkbenchRow[];
  onGoToIntake: () => void;
  onGoToPage: (page: OpeningConditionPortalPage) => void;
  onFocusCheckItem?: (checkItemId: string) => void;
  onFocusHumanReview?: (reviewId: string) => void;
}) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(rows[0]?.taskId ?? null);
  const selectedRow = rows.find((row) => row.taskId === selectedTaskId) ?? rows[0] ?? null;
  const selectedSteps = selectedRow ? deriveOpeningConditionTaskHandoffSteps(selectedRow) : [];

  useEffect(() => {
    if (rows.length === 0) {
      setSelectedTaskId(null);
      return;
    }
    if (!rows.some((row) => row.taskId === selectedTaskId)) {
      setSelectedTaskId(rows[0].taskId);
    }
  }, [rows, selectedTaskId]);

  return (
    <section className="opening-panel opening-panel-wide opening-task-workbench-panel">
      <div className="opening-report-workbench-header">
        <div>
          <span className="eyebrow">Review Task Workbench</span>
          <h2>开工条件核查任务台账</h2>
          <p>按轮次查看资料接入、智能核查、人工复核、报告生成和归档状态。先看任务行，再进入详情处理。</p>
        </div>
        <div className="dialog-actions compact">
          <button type="button" className="primary" onClick={onGoToIntake}>
            新建/上传资料
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="opening-task-workbench-empty">
          <strong>当前工作区还没有核查任务</strong>
          <p>先进入资料接入页，上传合同/资质依据、资料核查表和条件核查资料包，系统会生成第一条试点任务。</p>
          <button type="button" className="primary" onClick={onGoToIntake}>
            进入资料接入
          </button>
        </div>
      ) : (
        <>
        <div className="opening-task-workbench-list">
          {rows.map((row) => (
            <article
              key={row.taskId}
              className={
                selectedRow?.taskId === row.taskId
                  ? "opening-task-workbench-row opening-task-workbench-row-selected"
                  : "opening-task-workbench-row"
              }
            >
              <div className="opening-task-workbench-main">
                <div className="opening-task-workbench-title">
                  <strong>{row.roundLabel}</strong>
                  <span>{row.targetLabel}</span>
                  <small>{row.participantLabel}</small>
                </div>
                <div className="opening-report-chip-row">
                  <span className={`opening-report-chip tone-${row.stateTone}`}>{row.stateLabel}</span>
                  {row.readOnly && <span className="opening-report-chip tone-muted">历史只读</span>}
                  <span className={`opening-report-chip tone-${row.reportTone}`}>{row.reportLabel}</span>
                </div>
                <p>{row.nextAction}</p>
                {row.rectificationClosureSummary && (
                  <small className="opening-task-workbench-closure-summary">
                    {formatRectificationClosureSummary(row.rectificationClosureSummary)}
                  </small>
                )}
                <small className="opening-task-workbench-id">
                  {row.taskId} · 下一入口：{row.executionRouteLabel}
                </small>
              </div>

              <div className="opening-task-workbench-stats">
                <span>
                  <strong>{row.totalCheckItems}</strong>
                  核查项
                </span>
                <span className={row.problemCount > 0 ? "tone-danger" : "tone-success"}>
                  <strong>{row.problemCount}</strong>
                  问题
                </span>
                <span className={row.openHumanReviewCount > 0 ? "tone-warning" : "tone-success"}>
                  <strong>{row.openHumanReviewCount}</strong>
                  待复核
                </span>
                <span>
                  <strong>{row.evidenceCount}</strong>
                  证据
                </span>
              </div>

              <div className="opening-task-workbench-action">
                <small>处理人：{row.owner}</small>
                <small>更新：{row.updatedAt}</small>
                <small>验收：{row.acceptanceLabel}</small>
                <button type="button" className="secondary" onClick={() => setSelectedTaskId(row.taskId)}>
                  查看本轮详情
                </button>
                <button type="button" className="secondary" onClick={() => onGoToPage(row.recommendedPage)}>
                  {row.actionLabel}
                </button>
              </div>
            </article>
          ))}
        </div>
        {selectedRow && (
          <div className="opening-task-handoff-panel">
            <div className="opening-task-handoff-header">
              <div>
                <span className="eyebrow">Selected Review Task</span>
                <h3>{selectedRow.roundLabel} · {selectedRow.targetLabel}</h3>
                <p>{selectedRow.nextAction}</p>
              </div>
              <div className="opening-report-chip-row">
                <span className={`opening-report-chip tone-${selectedRow.stateTone}`}>{selectedRow.stateLabel}</span>
                {selectedRow.readOnly && <span className="opening-report-chip tone-muted">历史只读</span>}
                <span className={`opening-report-chip tone-${selectedRow.reportTone}`}>{selectedRow.reportLabel}</span>
                <span className={`opening-report-chip tone-${selectedRow.acceptanceTone}`}>{selectedRow.acceptanceLabel}</span>
              </div>
            </div>

            <div className="opening-report-context-grid">
              <div className="opening-action-summary-item">
                <strong>推荐入口</strong>
                <small>{selectedRow.executionRouteLabel}</small>
              </div>
              <div className="opening-action-summary-item">
                <strong>MVP 验收</strong>
                <small>{selectedRow.acceptanceLabel}</small>
              </div>
              <div className="opening-action-summary-item">
                <strong>历史属性</strong>
                <small>{selectedRow.readOnly ? "该轮次只读，用于留痕和复盘。" : "该轮次仍是当前可推进任务。"}</small>
              </div>
            </div>

            {selectedRow.trialHandoff && (
              <div className="opening-report-delivery-handoff">
                <div className="opening-report-finding-header">
                  <div>
                    <span className="eyebrow">Trial Handoff</span>
                    <strong>{selectedRow.trialHandoff.statusLabel}</strong>
                  </div>
                  <div className="opening-report-chip-row">
                    <span className={`opening-report-chip tone-${selectedRow.trialHandoff.statusTone}`}>
                      {selectedRow.trialHandoff.statusLabel}
                    </span>
                    <span className="opening-report-chip tone-info">{selectedRow.trialHandoff.currentOwner}</span>
                    {selectedRow.readOnly && <span className="opening-report-chip tone-muted">Historical read-only</span>}
                  </div>
                </div>
                <div className="opening-report-context-grid">
                  <div className="opening-action-summary-item">
                    <strong>Next action</strong>
                    <small>{selectedRow.trialHandoff.nextAction}</small>
                  </div>
                  <div className="opening-action-summary-item">
                    <strong>Recommended entry</strong>
                    <small>{selectedRow.trialHandoff.recommendedEntry}</small>
                  </div>
                  <div className="opening-action-summary-item">
                    <strong>Blocking summary</strong>
                    <small>{selectedRow.trialHandoff.blockingSummary}</small>
                  </div>
                </div>
                <div className="opening-record-list opening-record-list-compact">
                  <div>
                    <strong>Input package</strong>
                    <span>{selectedRow.trialHandoff.inputSummary}</span>
                    <p>{selectedRow.trialHandoff.executionSummary}</p>
                  </div>
                  <div>
                    <strong>Run semantics</strong>
                    <span>{selectedRow.reportLabel}</span>
                    <p>{selectedRow.trialHandoff.historySummary}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="opening-task-handoff-stage-list">
              {selectedSteps.map((step) => (
                <div key={step.key} className={step.done ? "opening-task-handoff-stage done" : "opening-task-handoff-stage"}>
                  <strong>{step.label}</strong>
                  <span>{step.done ? "已完成" : "待推进"}</span>
                  <small>{step.description}</small>
                </div>
              ))}
            </div>

            {selectedRow.rectificationClosureSummary && (
              <div className="opening-report-summary-grid">
                <div className="opening-report-summary-card tone-success">
                  <strong>已整改</strong>
                  <span>{selectedRow.rectificationClosureSummary.rectified}</span>
                  <p>{selectedRow.rectificationClosureReferenceLabel ?? "基于上一归档轮次对比"}</p>
                </div>
                <div className="opening-report-summary-card tone-danger">
                  <strong>仍未整改</strong>
                  <span>{selectedRow.rectificationClosureSummary.carried_over}</span>
                  <p>上一轮问题延续到当前轮次。</p>
                </div>
                <div className="opening-report-summary-card tone-warning">
                  <strong>本轮新增</strong>
                  <span>{selectedRow.rectificationClosureSummary.newly_added}</span>
                  <p>当前轮次暴露的新问题。</p>
                </div>
                <div className="opening-report-summary-card tone-info">
                  <strong>待人工判断</strong>
                  <span>{selectedRow.rectificationClosureSummary.pending_human_review}</span>
                  <p>需要监理确认处理结论。</p>
                </div>
              </div>
            )}

            <div className="opening-task-handoff-summary-grid">
              <div>
                <strong>当前处理人</strong>
                <small>{selectedRow.owner}</small>
              </div>
              <div>
                <strong>问题与复核</strong>
                <small>{selectedRow.problemCount} 项问题 / {selectedRow.openHumanReviewCount} 项待复核</small>
              </div>
              <div>
                <strong>核查与证据</strong>
                <small>{selectedRow.totalCheckItems} 项核查 / {selectedRow.evidenceCount} 条证据</small>
              </div>
              <div>
                <strong>任务编号</strong>
                <small>{selectedRow.taskId}</small>
              </div>
            </div>

            <div className="opening-report-summary-grid">
              <div className={`opening-report-summary-card tone-${selectedRow.deliverySummary.issueClosure.statusTone}`}>
                <strong>问题闭环</strong>
                <span>{selectedRow.deliverySummary.issueClosure.statusLabel}</span>
                <p>{selectedRow.deliverySummary.issueClosure.nextAction}</p>
              </div>
              <div className="opening-report-summary-card tone-warning">
                <strong>未闭合问题</strong>
                <span>{selectedRow.deliverySummary.issueClosure.openIssueCount} 项</span>
                <p>包含不通过、阻塞和未关闭人工复核。</p>
              </div>
              <div className="opening-report-summary-card tone-info">
                <strong>人工处理</strong>
                <span>{selectedRow.deliverySummary.issueClosure.pendingHumanReviewCount} / {selectedRow.deliverySummary.issueClosure.resolvedHumanReviewCount}</span>
                <p>待处理 / 已留痕。</p>
              </div>
              <div className="opening-report-summary-card tone-muted">
                <strong>整改清单</strong>
                <span>{selectedRow.deliverySummary.issueClosure.rectificationDeliveryCount} 项</span>
                <p>可进入报告交付的整改条目。</p>
              </div>
            </div>

            <div className="opening-task-detail-summary-grid">
              <div className="opening-task-detail-summary-card">
                <div className="opening-task-detail-summary-header">
                  <div>
                    <strong>AI 问题与整改摘要</strong>
                    <small>{selectedRow.deliverySummary.findingCount} 项问题候选 / {selectedRow.deliverySummary.deliveryRowCount} 项可进整改清单</small>
                  </div>
                  <button type="button" className="secondary" onClick={() => onGoToPage("check-tasks")}>
                    查看核查详情
                  </button>
                </div>
                {selectedRow.issuePreviewRows.length > 0 ? (
                  <div className="opening-task-issue-preview-list">
                    {selectedRow.issuePreviewRows.map((item) => (
                      <article key={item.id} className="opening-task-issue-preview-row">
                        <div>
                          <strong>{item.title}</strong>
                          <small>{item.category}</small>
                        </div>
                        <div className="opening-report-chip-row">
                          <span className={`opening-report-chip tone-${item.dispositionTone}`}>{item.dispositionLabel}</span>
                          <span className={`opening-report-chip tone-${item.severityTone}`}>{item.severityLabel}</span>
                          <span className="opening-report-chip tone-muted">{item.evidenceLabel}</span>
                        </div>
                        <p>{item.reason}</p>
                        {onFocusCheckItem && (
                          <div className="dialog-actions compact">
                            <button type="button" className="secondary" onClick={() => onFocusCheckItem(item.id)}>
                              定位核查项
                            </button>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="opening-task-detail-empty">当前选中轮次暂无需要在台账中优先提示的问题项。</p>
                )}
              </div>

              <div className="opening-task-detail-summary-card">
                <div className="opening-task-detail-summary-header">
                  <div>
                    <strong>待人工判断</strong>
                    <small>{selectedRow.openHumanReviewCount} 项 open/deferred 复核项</small>
                  </div>
                  <button type="button" className="secondary" onClick={() => onGoToPage("human-review")}>
                    处理人工复核
                  </button>
                </div>
                {selectedRow.pendingReviewRows.length > 0 ? (
                  <div className="opening-task-issue-preview-list">
                    {selectedRow.pendingReviewRows.map((item) => (
                      <article key={item.id} className="opening-task-issue-preview-row">
                        <div>
                          <strong>{item.title}</strong>
                          <small>{item.category}</small>
                        </div>
                        <span className="opening-report-chip tone-warning">{item.statusLabel}</span>
                        <p>{item.reason}</p>
                        {onFocusHumanReview && (
                          <div className="dialog-actions compact">
                            <button type="button" className="secondary" onClick={() => onFocusHumanReview(item.id)}>
                              定位复核项
                            </button>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="opening-task-detail-empty">当前没有阻塞报告生成的人工复核项。</p>
                )}
              </div>
            </div>

            <div className="opening-task-detail-delivery-strip">
              <div>
                <strong>证据命中</strong>
                <small>{selectedRow.deliverySummary.evidenceCount} 条证据记录</small>
              </div>
              <div>
                <strong>报告状态</strong>
                <small>{selectedRow.deliverySummary.reportStatus}</small>
              </div>
              <div>
                <strong>MVP 验收</strong>
                <small>{selectedRow.acceptanceLabel}</small>
              </div>
              {selectedRow.reportActionAvailable && (
                <button type="button" className="secondary" onClick={() => onGoToPage("reports")}>
                  进入报告归档
                </button>
              )}
            </div>

            <div className="dialog-actions compact">
              <button type="button" className="primary" onClick={() => onGoToPage(selectedRow.recommendedPage)}>
                {selectedRow.actionLabel}
              </button>
              {selectedRow.reportActionAvailable && (
                <button type="button" className="secondary" onClick={() => onGoToPage("reports")}>
                  查看报告/归档
                </button>
              )}
            </div>
          </div>
        )}
        </>
      )}
    </section>
  );
}

type RectificationClosureItem = {
  id: string;
  title: string;
  category: string;
  closureCategory: RectificationClosureCategory;
  previousStatus: string;
  currentStatus: string;
  nextAction: string;
};

function getActionOwnershipTone(dueState: OpeningConditionRunActionOwnership["dueState"]) {
  switch (dueState) {
    case "overdue":
      return "danger";
    case "due_soon":
      return "warning";
    case "readonly":
      return "muted";
    default:
      return "success";
  }
}

function OpeningConditionActionOwnershipSummary({
  summary,
  eyebrow = "Action Ownership",
  title = "责任人与下一动作",
  description,
}: {
  summary?: OpeningConditionRunActionOwnership | null;
  eyebrow?: string;
  title?: string;
  description?: string;
}) {
  if (!summary) {
    return null;
  }

  return (
    <div className="opening-action-summary">
      <div className="opening-action-summary-header">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h3>{title}</h3>
        </div>
        <div className="opening-report-chip-row">
          <span className="opening-report-chip tone-info">{summary.stageLabel}</span>
          <span className={`opening-report-chip tone-${getActionOwnershipTone(summary.dueState)}`}>
            {summary.dueStateLabel}
          </span>
          <span className="opening-report-chip tone-muted">{summary.dueWindowLabel}</span>
          {summary.readOnly && <span className="opening-report-chip tone-muted">只读</span>}
        </div>
      </div>
      {description ? <p>{description}</p> : null}
      <div className="opening-action-summary-grid">
        <div className="opening-action-summary-item">
          <strong>当前责任人</strong>
          <p>{summary.currentOwner}</p>
        </div>
        <div className="opening-action-summary-item">
          <strong>下一动作</strong>
          <p>{summary.nextAction}</p>
        </div>
        <div className="opening-action-summary-item">
          <strong>卡点原因</strong>
          <p>{summary.actionReason}</p>
          {summary.activeReviewCount > 0 && <small>仍有 {summary.activeReviewCount} 项人工复核阻塞报告交付。</small>}
        </div>
        <div className="opening-action-summary-item">
          <strong>推荐入口</strong>
          <p>{summary.recommendedPageLabel}</p>
          <small>
            {summary.primaryActionLabel}
            {summary.blockingCount > 0 ? ` / 阻塞 ${summary.blockingCount} 项` : ""}
          </small>
        </div>
      </div>
    </div>
  );
}

function OpeningConditionResponsibilityBoard({
  summary,
  onNavigate,
}: {
  summary?: OpeningConditionRunActionOwnership | null;
  onNavigate?: (page: OpeningConditionPortalPage) => void;
}) {
  if (!summary) {
    return null;
  }

  return (
    <article className="opening-panel opening-panel-wide opening-responsibility-board">
      <span className="eyebrow">Responsibility Workqueue</span>
      <h2>责任人与时效工作台</h2>
      <p>围绕当前 run 展示谁负责、卡在哪里、是否临近超时，以及下一步应该进入哪个页面继续处理。</p>
      <div className="opening-report-summary-grid">
        <MetricBlock label="当前责任人" value={summary.currentOwner} />
        <MetricBlock
          label="时效状态"
          value={summary.dueStateLabel}
          tone={summary.dueState === "overdue" ? "danger" : summary.dueState === "on_track" ? "success" : "neutral"}
        />
        <MetricBlock label="阻塞项" value={summary.blockingCount} tone={summary.blockingCount > 0 ? "danger" : "success"} />
        <MetricBlock label="推荐入口" value={summary.recommendedPageLabel} />
      </div>
      <div className="opening-responsibility-handoff">
        <strong>{summary.stageLabel}</strong>
        <p>{summary.nextAction}</p>
        <small>{summary.actionReason}</small>
      </div>
      {onNavigate ? (
        <div className="dialog-actions">
          <button type="button" className="primary" onClick={() => onNavigate(summary.recommendedPage)}>
            {summary.primaryActionLabel}
          </button>
        </div>
      ) : null}
    </article>
  );
}

function OpeningConditionRerunAssetDiffPanel({
  diff,
  eyebrow = "Rerun Asset Reuse",
  title = "上一轮复用与本轮变化",
  description,
  emptyDescription = "当前工作区还没有上一归档轮次，因此本页先按首轮接入展示。",
}: {
  diff: ReturnType<typeof deriveOpeningConditionRerunAssetDiff>;
  eyebrow?: string;
  title?: string;
  description?: string;
  emptyDescription?: string;
}) {
  if (!diff) {
    return null;
  }

  if (!diff.previousTask) {
    return (
      <section className="opening-report-detail-card">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <strong>{title}</strong>
        </div>
        <small>{emptyDescription}</small>
      </section>
    );
  }

  const groups = {
    reused: diff.entries.filter((entry) => entry.reuseStatus === "reused"),
    needs_reconfirmation: diff.entries.filter((entry) => entry.reuseStatus === "needs_reconfirmation"),
    new_for_current_run: diff.entries.filter((entry) => entry.reuseStatus === "new_for_current_run"),
    dropped_from_current_run: diff.entries.filter((entry) => entry.reuseStatus === "dropped_from_current_run"),
  };

  const orderedStatuses: Array<keyof typeof groups> = [
    "reused",
    "needs_reconfirmation",
    "new_for_current_run",
    "dropped_from_current_run",
  ];

  return (
    <section className="opening-panel opening-panel-wide">
      <div className="section-title row">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
      </div>
      <p>
        {description ??
          `对比上一归档轮次 ${diff.previousTask.id} 与当前 run ${diff.currentTask.id}，只前置展示操作者真正需要关心的复用与变化。`}
      </p>
      <div className="opening-report-summary-grid">
        {orderedStatuses.map((status) => {
          const meta = getOpeningConditionAssetReuseStatusMeta(status);
          return (
            <div key={status} className={`opening-report-summary-card tone-${meta.tone}`}>
              <strong>{meta.label}</strong>
              <span>{diff.summary[status]} 项</span>
              <p>{meta.description}</p>
            </div>
          );
        })}
      </div>
      <div className="opening-rerun-asset-groups">
        {orderedStatuses.map((status) => {
          const items = groups[status];
          if (items.length === 0) {
            return null;
          }
          const meta = getOpeningConditionAssetReuseStatusMeta(status);
          return (
            <article key={status} className="opening-rerun-asset-group">
              <div className="opening-report-finding-header">
                <strong>{meta.label}</strong>
                <span className={`opening-report-chip tone-${meta.tone}`}>{items.length} 项</span>
              </div>
              <div className="opening-rerun-asset-list">
                {items.slice(0, 6).map((item) => (
                  <div key={`${status}-${item.assetType}-${item.id}`} className="opening-rerun-asset-item">
                    <div className="opening-report-finding-header">
                      <strong>{item.title}</strong>
                      <div className="opening-report-chip-row">
                        <span className="opening-report-chip tone-muted">{item.assetType === "basis" ? "依据" : "主数据"}</span>
                        <span className={`opening-report-chip tone-${meta.tone}`}>{meta.label}</span>
                      </div>
                    </div>
                    <span>{item.category}</span>
                    <p>{item.note}</p>
                    <div className="opening-rerun-asset-status-grid">
                      {item.previousStatusLabel && (
                        <small>
                          <strong>上一轮</strong>
                          {item.previousStatusLabel}
                        </small>
                      )}
                      {item.currentStatusLabel && (
                        <small>
                          <strong>当前 run</strong>
                          {item.currentStatusLabel}
                        </small>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function getReviewObjectTypeLabel(type: OpeningConditionReviewObjectType) {
  switch (type) {
    case "dangerous-subproject":
      return "危大工程对象";
    case "material-review-topic":
      return "资料核查对象";
    case "permit-review-topic":
      return "许可审查对象";
    default:
      return type;
  }
}

function findWorkspaceProjectCatalog(
  catalog: OpeningConditionWorkspaceProjectCatalog[],
  workspaceId: string,
) {
  return catalog.find((project) => project.workspaces.some((workspace) => workspace.id === workspaceId)) ?? null;
}

function findWorkspaceAssetRegistrySummary(
  registry: OpeningConditionWorkspaceAssetRegistrySummary[],
  workspaceId: string,
) {
  return registry.find((record) => record.workspaceId === workspaceId) ?? null;
}

function formatWorkspaceAssetCompactSummary(record: OpeningConditionWorkspaceAssetRegistrySummary) {
  return [
    `Basis ${record.basis.published}/${record.basis.total}`,
    `Master data ${record.masterData.published + record.masterData.currentRunConfirmed}/${record.masterData.total}`,
    `KB ${readinessLabels[record.knowledgeBase.status] ?? record.knowledgeBase.status}`,
    record.runHistory.hasHistory ? `History ${record.runHistory.total}` : "No history",
  ].join(" / ");
}

function formatWorkspaceLatestRun(record: OpeningConditionWorkspaceAssetRegistrySummary) {
  if (!record.runHistory.hasHistory) {
    return "No run history recorded for this workspace yet.";
  }

  const latestState = record.runHistory.latestTaskState ?? "draft";
  const latestId = record.runHistory.latestTaskId ?? "unknown-task";
  return `Latest run ${latestId} / ${latestState}`;
}

export function LoginPage({
  onSignIn,
  themeMode,
  onToggleTheme,
}: {
  onSignIn: (session: Session) => void;
  themeMode: ThemeMode;
  onToggleTheme: () => void;
}) {
  const [username, setUsername] = useState("li.gong");
  const [password, setPassword] = useState("123456");
  const [role, setRole] = useState<Role>("supervisor");

  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="login-hero">
          <span className="eyebrow">AI document review platform</span>
          <h1>AI资料审查平台</h1>
          <p>统一登录后进入业务选择门户。开工条件核查和施工方案审查共享底层能力，但各自保留独立工作台。</p>
        </div>

        <div className="login-form">
          <div className="login-form-topline">
            <button type="button" className="theme-toggle subtle" onClick={onToggleTheme}>
              <SunMoon size={16} />
              {themeMode === "light" ? "深色主题" : "浅色主题"}
            </button>
          </div>

          <label>
            <span>账号</span>
            <input value={username} onChange={(event) => setUsername(event.target.value)} />
          </label>

          <label>
            <span>密码</span>
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>

          <div className="role-switch">
            {(["super_admin", "supervisor", "contractor"] as Role[]).map((item) => (
              <button
                key={item}
                type="button"
                className={role === item ? "role-button active" : "role-button"}
                onClick={() => setRole(item)}
              >
                {roleLabels[item]}
              </button>
            ))}
          </div>

          <button type="button" className="login-submit" onClick={() => onSignIn({ username, role })}>
            <ShieldCheck size={16} />
            登录进入平台
          </button>
        </div>
      </section>
    </main>
  );
}

export function ProductLauncherPage({
  entries,
  roleLabel,
  username,
  themeMode,
  onToggleTheme,
  onSelectProduct,
  onLogout,
}: {
  entries: ProductLauncherEntry[];
  roleLabel: string;
  username: string;
  themeMode: ThemeMode;
  onToggleTheme: () => void;
  onSelectProduct: (productId: ProductPortalId) => void;
  onLogout: () => void;
}) {
  return (
    <main className="product-launcher-shell">
      <header className="product-launcher-topbar">
        <div>
          <span className="eyebrow">统一身份入口</span>
          <h1>选择业务门户</h1>
          <p>两个业务产品各自进入独立工作台，共享对象存储、OCR、知识库支撑和报告资产能力。</p>
        </div>
        <div className="shell-topbar-actions">
          <button type="button" className="theme-toggle" onClick={onToggleTheme}>
            <SunMoon size={16} />
            {themeMode === "light" ? "深色主题" : "浅色主题"}
          </button>
          <span className="shell-role-pill">
            <Users size={14} />
            {roleLabel}
          </span>
          <button type="button" className="shell-logout light" onClick={onLogout}>
            <LogOut size={16} />
            退出
          </button>
        </div>
      </header>

      <section className="product-launcher-grid">
        {entries.map((entry) => (
          <article key={entry.id} className="product-launcher-card">
            <span className="eyebrow">{entry.eyebrow}</span>
            <h2>{entry.name}</h2>
            <p>{entry.summary}</p>
            <div className="product-route-pill">{entry.routeNamespace}</div>
            <div className="product-service-list">
              {entry.sharedServices.map((service) => (
                <span key={service}>{service}</span>
              ))}
            </div>
            <button type="button" className="primary" onClick={() => onSelectProduct(entry.id)}>
              {entry.primaryActionLabel}
            </button>
          </article>
        ))}
      </section>

      <footer className="product-launcher-footer">
        <strong>{username}</strong>
        <span>当前身份：{roleLabel}</span>
      </footer>
    </main>
  );
}

export function OpeningConditionWorkspaceShell({
  roleLabel,
  themeMode,
  activePage,
  intakeMode,
  workspaces,
  selectedWorkspaceId,
  packet,
  pilotTask,
  pilotWorkspaceTasks,
  allPilotTasks,
  workspaceAssetRegistry,
  pilotBasisRecords,
  pilotMasterDataRecords,
  pilotKnowledgeBases,
  pilotReadiness,
  pilotStatus,
  reportExportStatus,
  reportDownloadUrl,
  pilotBusy,
  onToggleTheme,
  onBack,
  onSelectPage,
  onSelectWorkspace,
  onRefreshPilotTask,
  onInitializePilotTask,
  onPublishPilotBasis,
  onPublishPilotBasisDecision,
  onRefreshPilotBasisPreview,
  onIngestPilotBasisProviderPreview,
  onIngestPilotMasterDataProviderPreview,
  onConfirmPilotMasterData,
  onDecidePilotMasterDataCandidate,
  onRunPilotMatch,
  onEnsureKnowledgeBase,
  onReviewDecision,
  onCompleteHumanReview,
  onGenerateReport,
  onExportReport,
  onArchivePilotTask,
  onDeletePilotTask,
  onStartRectificationRerun,
  onTrialBootstrapComplete,
  getNextOpeningPilotRunTaskId,
}: {
  roleLabel: string;
  themeMode: ThemeMode;
  activePage: OpeningConditionPortalPage;
  intakeMode: "default" | "rectification_rerun";
  workspaces: OpeningConditionWorkspace[];
  selectedWorkspaceId: string;
  packet: OpeningConditionReviewPacket;
  pilotTask?: OpeningConditionPilotTask | null;
  pilotWorkspaceTasks?: OpeningConditionPilotTask[];
  allPilotTasks?: OpeningConditionPilotTask[];
  workspaceAssetRegistry?: OpeningConditionWorkspaceAssetRegistrySummary[];
  pilotBasisRecords?: OpeningConditionPilotBasisRecord[];
  pilotMasterDataRecords?: OpeningConditionPilotMasterDataRecord[];
  pilotKnowledgeBases?: OpeningConditionPilotKnowledgeBaseRef[];
  pilotReadiness?: OpeningConditionPilotReadinessResult | null;
  pilotStatus: string;
  reportExportStatus?: string;
  reportDownloadUrl?: string;
  pilotBusy?: boolean;
  onToggleTheme: () => void;
  onBack: () => void;
  onSelectPage: (page: OpeningConditionPortalPage) => void;
  onSelectWorkspace: (workspaceId: string) => void;
  onRefreshPilotTask?: () => void;
  onInitializePilotTask?: () => void;
  onPublishPilotBasis?: () => void;
  onPublishPilotBasisDecision?: (basisId: string, safeNote?: string) => void;
  onRefreshPilotBasisPreview?: (basisId: string) => void;
  onIngestPilotBasisProviderPreview?: (basisId: string) => void;
  onIngestPilotMasterDataProviderPreview?: (recordId: string) => void;
  onConfirmPilotMasterData?: () => void;
  onDecidePilotMasterDataCandidate?: (
    recordId: string,
    decision: "approve" | "reject" | "publish",
    safeNote?: string,
  ) => void;
  onRunPilotMatch?: () => void;
  onEnsureKnowledgeBase?: () => void;
  onReviewDecision?: (reviewId: string, decision: "confirm" | "correct" | "reject" | "defer", safeNote?: string) => void;
  onCompleteHumanReview?: (safeNote?: string) => void;
  onGenerateReport?: () => void;
  onExportReport?: (taskId: string) => void;
  onArchivePilotTask?: () => void;
  onDeletePilotTask?: (taskId: string) => void;
  onStartRectificationRerun?: () => void;
  onTrialBootstrapComplete?: (result: OpeningConditionPilotIntakeInitResult) => void;
  getNextOpeningPilotRunTaskId?: () => string;
}) {
  const activeNavLabel = openingWorkspacePageLabels[activePage] ?? openingWorkspacePageLabels["workspace-context"];
  const activePageIsPrimary = openingPrimaryNavPageIds.has(activePage);
  const [focusedCheckItemId, setFocusedCheckItemId] = useState<string | null>(null);
  const [focusedHumanReviewId, setFocusedHumanReviewId] = useState<string | null>(null);
  const [focusedRouteOrigin, setFocusedRouteOrigin] = useState<OpeningConditionPortalPage | null>(null);
  const [selectedAgentTaskId, setSelectedAgentTaskId] = useState<string | null>(null);
  const focusedRouteOriginLabel = focusedRouteOrigin ? openingWorkspacePageLabels[focusedRouteOrigin] : null;
  const projectTasks = (allPilotTasks ?? pilotWorkspaceTasks ?? [])
    .filter((task) => task.context.workspaceId === selectedWorkspaceId)
    .sort(compareTaskByUpdatedAtDesc);

  function clearOpeningFocus() {
    setFocusedCheckItemId(null);
    setFocusedHumanReviewId(null);
    setFocusedRouteOrigin(null);
  }

  function goToOpeningPage(page: OpeningConditionPortalPage) {
    clearOpeningFocus();
    if (page === "workspace-context") {
      setSelectedAgentTaskId(null);
    }
    onSelectPage(page);
  }

  function selectAgentTask(taskId: string) {
    clearOpeningFocus();
    setSelectedAgentTaskId(taskId);
    onSelectPage("workspace-context");
  }

  function focusOpeningChecklistItem(
    checkItemId: string,
    originPage: OpeningConditionPortalPage = "workspace-context",
  ) {
    setFocusedCheckItemId(checkItemId);
    setFocusedHumanReviewId(null);
    setFocusedRouteOrigin(originPage);
    onSelectPage("check-tasks");
  }

  function focusOpeningHumanReviewItem(
    reviewId: string,
    originPage: OpeningConditionPortalPage = "workspace-context",
  ) {
    setFocusedHumanReviewId(reviewId);
    setFocusedCheckItemId(null);
    setFocusedRouteOrigin(originPage);
    onSelectPage("human-review");
  }

  function returnToFocusedRouteOrigin() {
    const returnPage = focusedRouteOrigin ?? "workspace-context";
    clearOpeningFocus();
    onSelectPage(returnPage);
  }

  return (
    <main className="platform-shell opening-portal-shell">
      <aside className="shell-sidebar">
        <div className="shell-brand">
          <div className="shell-brand-mark">开</div>
          <div>
            <strong>开工条件核查</strong>
            <span>Opening condition workspace</span>
          </div>
        </div>

        <nav className="shell-nav" aria-label="开工条件核查导航">
          {openingWorkspaceNav.map((item) => (
            <NavButton
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activePage === item.id}
              onClick={() => goToOpeningPage(item.id)}
            />
          ))}
          <div className="opening-sidebar-history">
            <span className="opening-sidebar-section-label">历史审核记录</span>
            {projectTasks.length === 0 ? (
              <small>当前项目暂无历史审核</small>
            ) : (
              projectTasks.map((task) => (
                <div
                  key={task.id}
                  className={task.id === selectedAgentTaskId ? "opening-sidebar-task active" : "opening-sidebar-task"}
                >
                  <button type="button" className="opening-sidebar-task-main" onClick={() => selectAgentTask(task.id)}>
                    <span>{getOpeningConditionAgentTaskTitle(task)}</span>
                    <small>{getOpeningConditionAgentTaskProgress(task)}%</small>
                  </button>
                  {onDeletePilotTask && (
                    <button
                      type="button"
                      className="opening-sidebar-task-delete"
                      onClick={(event) => {
                        event.stopPropagation();
                        if (selectedAgentTaskId === task.id) {
                          setSelectedAgentTaskId(null);
                        }
                        onDeletePilotTask(task.id);
                      }}
                      disabled={pilotBusy}
                      aria-label={`删除历史审核记录 ${getOpeningConditionAgentTaskTitle(task)}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
          {!activePageIsPrimary && (
            <div className="opening-secondary-route-card">
              <span>二级执行页</span>
              <strong>{activeNavLabel}</strong>
              <p>当前页面从任务台账进入，用于完成选中 run 的具体操作。</p>
              <button type="button" className="theme-toggle" onClick={() => goToOpeningPage("workspace-context")}>
                <ArrowLeft size={16} />
                返回核查任务台账
              </button>
            </div>
          )}
        </nav>

        <div className="shell-sidebar-foot">
          <div className="shell-role-card">
            <span>{roleLabel}</span>
            <strong>当前施工项目</strong>
            <select
              aria-label="切换当前施工项目"
              value={selectedWorkspaceId}
              onChange={(event) => {
                setSelectedAgentTaskId(null);
                onSelectWorkspace(event.target.value);
              }}
            >
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.projectName}
                </option>
              ))}
            </select>
          </div>
          <button type="button" className="theme-toggle" onClick={onBack}>
            <ArrowLeft size={16} />
            返回业务门户
          </button>
          <button type="button" className="theme-toggle" onClick={onToggleTheme}>
            <SunMoon size={16} />
            {themeMode === "light" ? "深色主题" : "浅色主题"}
          </button>
        </div>
      </aside>

      <section className="shell-main">
        {activePage !== "workspace-context" && (
          <header className="shell-topbar">
            <div>
              <span className="eyebrow">AI资料审查平台 / 开工条件核查</span>
              <h1>{activeNavLabel}</h1>
              <div className="opening-shell-context-meta">
                <span>{packet.workspaceContext.projectCode}</span>
                <span>{packet.workspaceContext.reviewObjectName}</span>
                <span>{packet.workspaceContext.participantEntityName}</span>
              </div>
            </div>
            <div className="shell-topbar-actions">
              <span className="shell-role-pill">
                <Users size={14} />
                {roleLabel}
              </span>
            </div>
          </header>
        )}

        <div className="opening-workspace-content">
          {activePage === "workspace-context" && (
            <OpeningConditionObjectOverviewProductizedPage
              packet={packet}
              workspaces={workspaces}
              selectedWorkspaceId={selectedWorkspaceId}
              pilotTask={pilotTask}
              allPilotTasks={allPilotTasks}
              workspaceAssetRegistry={workspaceAssetRegistry}
              pilotReadiness={pilotReadiness}
              pilotBusy={pilotBusy}
              onSelectWorkspace={onSelectWorkspace}
              onGoToIntake={() => goToOpeningPage("material-intake")}
              onGoToPage={goToOpeningPage}
              onTrialBootstrapComplete={onTrialBootstrapComplete}
              getNextOpeningPilotRunTaskId={getNextOpeningPilotRunTaskId}
              selectedAgentTaskId={selectedAgentTaskId}
              onSelectAgentTask={(taskId) => {
                setSelectedAgentTaskId(taskId);
                onSelectPage("workspace-context");
              }}
              onCloseAgentTask={() => setSelectedAgentTaskId(null)}
              onFocusCheckItem={(checkItemId) => focusOpeningChecklistItem(checkItemId, "workspace-context")}
              onFocusHumanReview={(reviewId) => focusOpeningHumanReviewItem(reviewId, "workspace-context")}
              onReviewDecision={onReviewDecision}
              onCompleteHumanReview={onCompleteHumanReview}
            />
          )}
          {activePage === "material-intake" && (
            <OpeningConditionMaterialIntakePage
              packet={packet}
              roleLabel={roleLabel}
              intakeMode={intakeMode}
              pilotTask={pilotTask}
              workspaceTasks={pilotWorkspaceTasks}
              pilotBasisRecords={pilotBasisRecords}
              pilotMasterDataRecords={pilotMasterDataRecords}
              pilotKnowledgeBases={pilotKnowledgeBases}
              pilotReadiness={pilotReadiness}
              pilotStatus={pilotStatus}
              pilotBusy={pilotBusy}
              onRefreshPilotTask={onRefreshPilotTask}
              onInitializePilotTask={onInitializePilotTask}
              onPublishPilotBasis={onPublishPilotBasis}
              onPublishPilotBasisDecision={onPublishPilotBasisDecision}
              onRefreshPilotBasisPreview={onRefreshPilotBasisPreview}
              onIngestPilotBasisProviderPreview={onIngestPilotBasisProviderPreview}
              onIngestPilotMasterDataProviderPreview={onIngestPilotMasterDataProviderPreview}
              onConfirmPilotMasterData={onConfirmPilotMasterData}
              onDecidePilotMasterDataCandidate={onDecidePilotMasterDataCandidate}
              onRunPilotMatch={onRunPilotMatch}
              onEnsureKnowledgeBase={onEnsureKnowledgeBase}
              onTrialBootstrapComplete={onTrialBootstrapComplete}
              getNextOpeningPilotRunTaskId={getNextOpeningPilotRunTaskId}
              onGoToReports={() => goToOpeningPage("reports")}
            />
          )}
          {activePage === "basis-sets" && (
            <OpeningConditionPublicationGovernancePage
              packet={packet}
              pilotTask={pilotTask}
              workspaceTasks={pilotWorkspaceTasks}
              basisRecords={pilotBasisRecords}
              masterDataRecords={pilotMasterDataRecords}
              knowledgeBases={pilotKnowledgeBases}
              pilotReadiness={pilotReadiness}
              pilotBusy={pilotBusy}
              onRefreshBasisPreview={onRefreshPilotBasisPreview}
              onIngestProviderPreview={onIngestPilotBasisProviderPreview}
              onIngestMasterDataProviderPreview={onIngestPilotMasterDataProviderPreview}
              onGoToPage={goToOpeningPage}
            />
          )}
          {activePage === "check-tasks" && (
            <OpeningConditionCheckTasksPage
              packet={packet}
              pilotTask={pilotTask}
              focusedCheckItemId={focusedCheckItemId}
              onClearFocusedCheckItem={clearOpeningFocus}
              focusedReturnLabel={focusedRouteOriginLabel}
              onReturnToFocusedOrigin={focusedRouteOrigin ? returnToFocusedRouteOrigin : undefined}
            />
          )}
          {activePage === "human-review" && (
            <OpeningConditionHumanReviewQueuePage
              packet={packet}
              pilotTask={pilotTask}
              pilotBusy={pilotBusy}
              onReviewDecision={onReviewDecision}
              onCompleteHumanReview={onCompleteHumanReview}
              onGoToPage={goToOpeningPage}
              focusedHumanReviewId={focusedHumanReviewId}
              onClearFocusedHumanReview={clearOpeningFocus}
              focusedReturnLabel={focusedRouteOriginLabel}
              onReturnToFocusedOrigin={focusedRouteOrigin ? returnToFocusedRouteOrigin : undefined}
            />
          )}
          {activePage === "reports" && (
            <OpeningConditionReportDeliveryWorkbench
              packet={packet}
              pilotTask={pilotTask}
              workspaceTasks={pilotWorkspaceTasks}
              pilotBusy={pilotBusy}
              reportExportStatus={reportExportStatus}
              reportDownloadUrl={reportDownloadUrl}
              onGenerateReport={onGenerateReport}
              onExportReport={onExportReport}
              onArchive={onArchivePilotTask}
              onStartRectificationRerun={onStartRectificationRerun}
              onFocusCheckItem={(checkItemId) => focusOpeningChecklistItem(checkItemId, "reports")}
              onFocusHumanReview={(reviewId) => focusOpeningHumanReviewItem(reviewId, "reports")}
            />
          )}
        </div>
      </section>
    </main>
  );
}

function OpeningConditionOverviewPage({
  packet,
  workspaces,
  selectedWorkspaceId,
  pilotTask,
  pilotReadiness,
  onSelectWorkspace,
  onGoToIntake,
}: {
  packet: OpeningConditionReviewPacket;
  workspaces: OpeningConditionWorkspace[];
  selectedWorkspaceId: string;
  pilotTask?: OpeningConditionPilotTask | null;
  pilotReadiness?: OpeningConditionPilotReadinessResult | null;
  onSelectWorkspace: (workspaceId: string) => void;
  onGoToIntake: () => void;
}) {
  const verdictSummary = getOpeningConditionVerdictSummary(packet);
  const riskSummary = getOpeningConditionRiskSummary(packet);
  const readiness = pilotReadiness?.preflightReadiness ?? packet.preflightReadiness;

  return (
    <div className="opening-condition-page">
      <section className="opening-condition-hero opening-workspace-hero">
        <div>
          <span className="eyebrow">真实试点闭环</span>
          <h2>{packet.projectName}</h2>
          <p>从资料接入、正式核查、人工复核，到报告归档和整改复审，都在同一个工作区内完成。</p>
          <div className="opening-condition-meta">
            <span>{packet.reviewTarget}</span>
            <span>{packet.workspaceContext.contractPackage}</span>
            <span>{packet.workspaceContext.participatingOrganization}</span>
          </div>
        </div>
        <div className="opening-condition-verdict">
          <strong>{pilotTask?.state ?? packet.stage}</strong>
          <span>当前任务状态</span>
        </div>
      </section>

      <section className="opening-metric-grid">
        <MetricBlock label="核查项" value={verdictSummary.total} />
        <MetricBlock label="待人工复核" value={verdictSummary.needsHumanReview} />
        <MetricBlock label="高风险" value={riskSummary.critical + riskSummary.high} tone="danger" />
        <MetricBlock label="门禁" value={readinessLabels[readiness.status] ?? readiness.status} tone={readiness.status === "ready" ? "success" : "neutral"} />
      </section>

      <section className="opening-condition-grid">
        <article className="opening-panel">
          <span className="eyebrow">工作区选择</span>
          <h2>当前项目与参与机构</h2>
          <div className="opening-record-list">
            {workspaces.map((workspace) => (
              <div key={workspace.id}>
                <strong>{workspace.projectName}</strong>
                <span>{workspace.contractPackage} | {workspace.participatingOrganization}</span>
                <p>{workspace.purpose}</p>
                <div className="dialog-actions compact">
                  <button
                    type="button"
                    className={selectedWorkspaceId === workspace.id ? "primary" : "secondary"}
                    onClick={() => onSelectWorkspace(workspace.id)}
                  >
                    {selectedWorkspaceId === workspace.id ? "当前工作区" : "切换工作区"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="opening-panel">
          <span className="eyebrow">当前运行</span>
          <h2>进入资料接入继续推进</h2>
          <div className="opening-record-list">
            <div>
              <strong>{pilotTask?.id ?? "尚未初始化 run"}</strong>
              <span>{pilotTask?.state ?? "draft"} | {readiness.nextAction}</span>
              <p>{pilotTask ? "已存在 task-owned 试点任务，可继续接入或执行正式核查。" : "先通过资料接入创建真实试点 run。"}</p>
            </div>
          </div>
          <div className="dialog-actions">
            <button type="button" className="primary" onClick={onGoToIntake}>
              进入资料接入
            </button>
          </div>
        </article>
      </section>
    </div>
  );
}

function getReadableReviewObjectTypeLabel(type: OpeningConditionReviewObjectType) {
  switch (type) {
    case "dangerous-subproject":
      return "危大工程对象";
    case "material-review-topic":
      return "资料核查对象";
    case "permit-review-topic":
      return "许可审查对象";
    default:
      return type;
  }
}

function OpeningConditionObjectOverviewProductizedPage({
  packet,
  workspaces,
  selectedWorkspaceId,
  pilotTask,
  allPilotTasks,
  workspaceAssetRegistry,
  pilotReadiness,
  pilotBusy,
  onSelectWorkspace,
  onGoToIntake,
  onGoToPage,
  onTrialBootstrapComplete,
  getNextOpeningPilotRunTaskId,
  selectedAgentTaskId,
  onSelectAgentTask,
  onCloseAgentTask,
  onFocusCheckItem,
  onFocusHumanReview,
  onReviewDecision,
  onCompleteHumanReview,
}: {
  packet: OpeningConditionReviewPacket;
  workspaces: OpeningConditionWorkspace[];
  selectedWorkspaceId: string;
  pilotTask?: OpeningConditionPilotTask | null;
  allPilotTasks?: OpeningConditionPilotTask[];
  workspaceAssetRegistry?: OpeningConditionWorkspaceAssetRegistrySummary[];
  pilotReadiness?: OpeningConditionPilotReadinessResult | null;
  pilotBusy?: boolean;
  onSelectWorkspace: (workspaceId: string) => void;
  onGoToIntake: () => void;
  onGoToPage: (page: OpeningConditionPortalPage) => void;
  onTrialBootstrapComplete?: (result: OpeningConditionPilotIntakeInitResult) => void;
  getNextOpeningPilotRunTaskId?: () => string;
  selectedAgentTaskId?: string | null;
  onSelectAgentTask?: (taskId: string) => void;
  onCloseAgentTask?: () => void;
  onFocusCheckItem?: (checkItemId: string) => void;
  onFocusHumanReview?: (reviewId: string) => void;
  onReviewDecision?: (reviewId: string, decision: "confirm" | "correct" | "reject" | "defer", safeNote?: string) => void;
  onCompleteHumanReview?: (safeNote?: string) => void;
}) {
  const verdictSummary = getOpeningConditionVerdictSummary(packet);
  const riskSummary = getOpeningConditionRiskSummary(packet);
  const readiness = pilotReadiness?.preflightReadiness ?? packet.preflightReadiness;
  const workspaceCatalog = useMemo(() => buildOpeningConditionWorkspaceCatalog(workspaces), [workspaces]);
  const currentWorkspace = workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ?? packet.workspaceContext;
  const selectedProject = findWorkspaceProjectCatalog(workspaceCatalog, selectedWorkspaceId);
  const selectedReviewObject =
    selectedProject?.reviewObjects.find((item) => item.reviewObjectId === currentWorkspace.reviewObjectId) ?? null;
  const selectedWorkspaceRegistry = findWorkspaceAssetRegistrySummary(workspaceAssetRegistry ?? [], selectedWorkspaceId);
  const actionOwnership = deriveOpeningConditionRunActionOwnership({
    pilotTask,
    readiness: pilotReadiness,
  });
  const taskWorkbenchRows = useMemo(
    () =>
      deriveOpeningConditionTaskWorkbenchRows({
        selectedWorkspaceId,
        currentWorkspace,
        pilotTask,
        allPilotTasks,
        pilotReadiness,
      }),
    [allPilotTasks, currentWorkspace, pilotReadiness, pilotTask, selectedWorkspaceId],
  );
  const activeCheckItems = pilotTask?.checkItems.length ?? verdictSummary.total;
  const evidenceCount = pilotTask?.evidence.length ?? packet.evidence.length;
  const activeHumanReviews =
    pilotTask?.humanReviewQueue.filter((item) => item.status === "open" || item.status === "deferred").length ??
    verdictSummary.needsHumanReview;
  const [complianceReviewRequested, setComplianceReviewRequested] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const agentTasks = useMemo(
    () =>
      [...(allPilotTasks ?? []), ...(pilotTask ? [pilotTask] : [])]
        .filter((task) => task.context.workspaceId === selectedWorkspaceId)
        .filter((task, index, tasks) => tasks.findIndex((candidate) => candidate.id === task.id) === index)
        .sort(compareTaskByUpdatedAtDesc),
    [allPilotTasks, pilotTask, selectedWorkspaceId],
  );
  const selectedAgentTask =
    (selectedAgentTaskId ? agentTasks.find((task) => task.id === selectedAgentTaskId) : null) ?? null;
  const agentMaterialFiles = useMemo(
    () => buildOpeningConditionAgentMaterialFiles(selectedAgentTask),
    [selectedAgentTask],
  );
  const agentReviewItems = useMemo(
    () => buildOpeningConditionAgentReviewItems(selectedAgentTask),
    [selectedAgentTask],
  );
  const [workbenchMode, setWorkbenchMode] = useState<OpeningConditionAgentWorkbenchMode>({ kind: "list" });
  const [agentReviewNote, setAgentReviewNote] = useState("");

  useEffect(() => {
    setWorkbenchMode({ kind: "list" });
    setAgentReviewNote("");
  }, [selectedAgentTaskId]);

  useEffect(() => {
    if (workbenchMode.kind === "preview" && !agentMaterialFiles.some((file) => file.id === workbenchMode.fileId)) {
      setWorkbenchMode({ kind: "list" });
    }
  }, [agentMaterialFiles, workbenchMode]);

  useEffect(() => {
    if (workbenchMode.kind === "review" && !agentReviewItems.some((item) => item.id === workbenchMode.checkItemId)) {
      setWorkbenchMode({ kind: "list" });
      setAgentReviewNote("");
    }
  }, [agentReviewItems, workbenchMode]);

  const agentProgress = getOpeningConditionAgentTaskProgress(selectedAgentTask);
  const agentSteps = buildOpeningConditionAgentProgressSteps(selectedAgentTask);
  const selectedAgentTaskTitle = selectedAgentTask ? getOpeningConditionAgentTaskTitle(selectedAgentTask) : "尚未创建审核任务";
  const selectedReviewScope = selectedAgentTask?.reviewScope ?? "completeness";
  const activeReviewItem =
    workbenchMode.kind === "review"
      ? agentReviewItems.find((item) => item.id === workbenchMode.checkItemId) ?? null
      : null;
  const activePreviewFile =
    workbenchMode.kind === "preview"
      ? agentMaterialFiles.find((file) => file.id === workbenchMode.fileId) ?? null
      : workbenchMode.kind === "review"
        ? findOpeningConditionAgentPreviewFile(agentMaterialFiles, activeReviewItem, selectedAgentTask)
        : null;
  const latestReviewByTargetId = useMemo(
    () =>
      buildLatestHumanReviewMap(
        (selectedAgentTask?.humanReviewQueue ?? []).filter((item) => item.targetType === "check_item"),
      ),
    [selectedAgentTask],
  );
  const activeReviewQueueItem =
    activeReviewItem && activeReviewItem.humanReviewId
      ? (selectedAgentTask?.humanReviewQueue ?? []).find((item) => item.id === activeReviewItem.humanReviewId) ??
        latestReviewByTargetId.get(activeReviewItem.id) ??
        null
      : activeReviewItem
        ? latestReviewByTargetId.get(activeReviewItem.id) ?? null
        : null;
  const blockingReviewCount =
    selectedAgentTask?.humanReviewQueue.filter((item) => item.status === "open" || item.status === "deferred").length ?? 0;
  const canCompleteHumanReview = Boolean(
    selectedAgentTask &&
      selectedAgentTask.humanReviewQueue.length > 0 &&
      blockingReviewCount === 0 &&
      !pilotBusy,
  );

  function resetToListMode() {
    setWorkbenchMode({ kind: "list" });
    setAgentReviewNote("");
  }

  function openFilePreview(fileId: string) {
    setWorkbenchMode({ kind: "preview", fileId });
  }

  function openReviewDetail(checkItemId: string) {
    setWorkbenchMode({ kind: "review", checkItemId });
  }

  function submitWorkbenchReviewDecision(decision: "confirm" | "correct" | "reject" | "defer") {
    if (!activeReviewQueueItem || !onReviewDecision) {
      return;
    }
    onReviewDecision(activeReviewQueueItem.id, decision, agentReviewNote.trim() || undefined);
    resetToListMode();
  }

  function completeWorkbenchHumanReview() {
    if (!onCompleteHumanReview) {
      return;
    }
    onCompleteHumanReview(agentReviewNote.trim() || undefined);
    resetToListMode();
  }

  if (!selectedAgentTask) {
    return (
      <div className="opening-condition-page opening-agent-console opening-agent-chat-page">
        <section className="opening-agent-chat-stage">
          <div className="opening-agent-chat-brand" aria-hidden="true">
            <span>开</span>
          </div>
          <span className="eyebrow">AI资料审查平台 / 开工条件核查</span>
          <h2>开工条件核查智能体</h2>
          <p className="opening-agent-chat-intro">
            上传开工材料，智能体将根据你选择的审查内容完成资料核查。
          </p>

          <div className="opening-agent-chat-scope" aria-label="审查内容">
            <strong>审查内容：</strong>
            <label>
              <input type="checkbox" checked readOnly />
              <span>资料完整性（必选）</span>
            </label>
            <label>
              <input
                type="checkbox"
                checked={complianceReviewRequested}
                onChange={(event) => setComplianceReviewRequested(event.target.checked)}
              />
              <span>资料合规性（可选）</span>
            </label>
          </div>

          <button
            type="button"
            className="opening-agent-chat-input"
            onClick={() => setUploadModalOpen(true)}
            aria-label="上传审核资料"
          >
            <span className="opening-agent-chat-placeholder">请上传审核资料，开始一次开工条件核查</span>
            <span className="opening-agent-chat-hint">上传待核查文件</span>
            <span className="opening-agent-chat-send" aria-hidden="true">↑</span>
          </button>
        </section>

        {uploadModalOpen && (
          <div className="opening-agent-modal-backdrop" role="presentation" onMouseDown={() => setUploadModalOpen(false)}>
            <div
              className="opening-agent-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="opening-agent-upload-title"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="opening-agent-modal-header">
                <div>
                  <span className="eyebrow">上传审核资料</span>
                  <h2 id="opening-agent-upload-title">提交三类资料后开始解析</h2>
                </div>
                <button type="button" className="theme-toggle" onClick={() => setUploadModalOpen(false)}>
                  关闭
                </button>
              </div>
              <p>
                资料完整性为必选；资料合规性{complianceReviewRequested ? "已选择" : "未选择"}，不会改变三类资料的必传要求。
              </p>
              <OpeningConditionRealTrialIntakePanel
                packet={packet}
                pilotTask={pilotTask}
                portalState={deriveOpeningConditionPortalViewState({
                  pilotTask,
                  intakeMode: "default",
                  readiness: pilotReadiness,
                })}
                busy={false}
                submittedBy="opening-condition-agent-console"
                onComplete={(result) => {
                  setUploadModalOpen(false);
                  if (result.task?.id) {
                    onSelectAgentTask?.(result.task.id);
                  }
                  onTrialBootstrapComplete?.(result);
                }}
                reviewScope={complianceReviewRequested ? "completeness_and_compliance" : "completeness"}
                getNextOpeningPilotRunTaskId={getNextOpeningPilotRunTaskId}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="opening-condition-page opening-agent-console">
      <section className="opening-agent-detail">
        <div className="opening-agent-file-pane">
          <div className="opening-agent-pane-header">
            <div>
              <span className="eyebrow">核查任务详情</span>
              <h2>{selectedAgentTaskTitle}</h2>
            </div>
            <div className="opening-agent-pane-actions">
              <span className="opening-report-chip tone-info">{agentMaterialFiles.length} 个文件</span>
              <button type="button" className="secondary" onClick={onCloseAgentTask}>
                返回新建审核
              </button>
            </div>
          </div>
          {workbenchMode.kind === "list" ? (
            <div className="opening-agent-workbench-stack">
              <details className="opening-agent-file-group">
                <summary>资料文档库</summary>
                <div className="opening-agent-file-list">
                  {agentMaterialFiles.length === 0 ? (
                    <p className="opening-task-detail-empty">暂无已上传或已拆分的资料文件。</p>
                  ) : (
                    agentMaterialFiles.map((file) => (
                      <button
                        key={file.id}
                        type="button"
                        className="opening-agent-file-row"
                        onClick={() => openFilePreview(file.id)}
                      >
                        <strong>{file.label}</strong>
                        <span>{file.fileName}</span>
                      </button>
                    ))
                  )}
                </div>
              </details>
              <details className="opening-agent-file-group">
                <summary>待核查资料项</summary>
                <div className="opening-agent-review-item-list">
                  {agentReviewItems.length === 0 ? (
                    <p className="opening-task-detail-empty">暂无待核查资料项，需先上传可识别的资料核查表。</p>
                  ) : (
                    agentReviewItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className="opening-agent-review-item-row"
                        onClick={() => openReviewDetail(item.id)}
                      >
                        <span>
                          <strong>{item.label}</strong>
                          <small>{item.content}</small>
                        </span>
                        <em className={`opening-review-status tone-${item.tone}`}>{item.status}</em>
                      </button>
                    ))
                  )}
                </div>
              </details>
              <div className="opening-agent-inline-actions">
                <div>
                  <strong>人工复核闭环</strong>
                  <p>
                    {blockingReviewCount > 0
                      ? `仍有 ${blockingReviewCount} 项待人工复核，处理完成后才能进入最终报告生成。`
                      : "所有阻塞复核项已关闭，可以继续完成人工复核并生成最终报告。"}
                  </p>
                </div>
                <button type="button" className="primary" disabled={!canCompleteHumanReview} onClick={completeWorkbenchHumanReview}>
                  完成人工复核并生成报告
                </button>
              </div>
            </div>
          ) : workbenchMode.kind === "preview" ? (
            <div className="opening-agent-mode-layout">
              <div className="opening-agent-mode-header">
                <div>
                  <span className="eyebrow">资料预览</span>
                  <h3>{activePreviewFile?.fileName ?? "未找到预览文件"}</h3>
                </div>
                <button type="button" className="secondary" onClick={resetToListMode}>
                  返回任务列表
                </button>
              </div>
              <OpeningConditionAgentDocumentPreview file={activePreviewFile} />
            </div>
          ) : (
            <div className="opening-agent-review-layout">
              <div className="opening-agent-review-detail-header">
                <div>
                  <span className="eyebrow">人工复核详情</span>
                  <h3>{activeReviewItem?.label ?? "未找到核查项"}</h3>
                  <p>{activeReviewItem?.content ?? "当前核查项上下文不可用。"}</p>
                </div>
                <button type="button" className="secondary" onClick={resetToListMode}>
                  返回任务列表
                </button>
              </div>
              <div className="opening-agent-review-layout-grid">
                <div className="opening-agent-review-preview-pane">
                  <OpeningConditionAgentDocumentPreview file={activePreviewFile} />
                </div>
                <div className="opening-agent-review-decision-pane">
                  <div className="opening-agent-review-summary-card">
                    <span className={`opening-review-status tone-${activeReviewItem?.tone ?? "warning"}`}>
                      {activeReviewItem?.status ?? "待处理"}
                    </span>
                    <p>{activeReviewItem?.evidenceText ?? "当前暂无关联证据，需人工结合资料判断。"}</p>
                    {activeReviewQueueItem?.ruleExplanation ? <small>核查规则：{activeReviewQueueItem.ruleExplanation}</small> : null}
                    {activeReviewQueueItem?.expectedEvidenceHints?.length ? (
                      <small>期望资料：{activeReviewQueueItem.expectedEvidenceHints.join(" / ")}</small>
                    ) : null}
                    {activeReviewQueueItem?.safeNote ? <small>当前记录：{activeReviewQueueItem.safeNote}</small> : null}
                  </div>
                  <label className="opening-agent-review-note">
                    <span>人工补充说明</span>
                    <textarea
                      value={agentReviewNote}
                      onChange={(event) => setAgentReviewNote(event.target.value)}
                      placeholder="可补充接受/拒绝原因、修正意见或需要继续跟进的说明。"
                    />
                  </label>
                  <div className="opening-agent-review-action-grid">
                    <button type="button" className="primary" onClick={() => submitWorkbenchReviewDecision("confirm")} disabled={!activeReviewQueueItem || pilotBusy}>
                      接受
                    </button>
                    <button type="button" className="secondary" onClick={() => submitWorkbenchReviewDecision("correct")} disabled={!activeReviewQueueItem || pilotBusy}>
                      修正后接受
                    </button>
                    <button type="button" className="secondary" onClick={() => submitWorkbenchReviewDecision("defer")} disabled={!activeReviewQueueItem || pilotBusy}>
                      延后处理
                    </button>
                    <button type="button" className="danger subtle" onClick={() => submitWorkbenchReviewDecision("reject")} disabled={!activeReviewQueueItem || pilotBusy}>
                      拒绝
                    </button>
                  </div>
                  {!activeReviewQueueItem ? (
                    <div className="opening-agent-review-summary-card muted">
                      <strong>当前项无需新的人工决策</strong>
                      <p>该核查项已经有结论，或当前没有待处理的人审阻塞项。你仍可以返回列表继续查看其他项。</p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="opening-agent-progress-pane">
          <div className="opening-agent-pane-header">
            <div>
              <span className="eyebrow">智能体处理进度</span>
              <h2>{selectedAgentTask ? `${agentProgress}% · ${openingConditionPilotStateLabels[selectedAgentTask.state] ?? selectedAgentTask.state}` : "等待上传"}</h2>
            </div>
            {selectedAgentTask && (
              <button type="button" className="secondary" onClick={() => onGoToPage("reports")}>
                查看报告
              </button>
            )}
          </div>
          <div className="opening-agent-progress-bar">
            <span style={{ width: `${agentProgress}%` }} />
          </div>
          <div className="opening-agent-step-list">
            {agentSteps.map((step) => (
              <div
                key={step.key}
                className={[
                  "opening-agent-step",
                  step.done ? "done" : "",
                  step.active ? "active" : "",
                  step.operatorRequired ? "needs-operator" : "",
                ].filter(Boolean).join(" ")}
              >
                <strong>{step.label}</strong>
                <span>{step.operatorRequired ? "待人工处理" : step.done ? "已完成" : "进行中"}</span>
                <small>{step.detail}</small>
                {step.occurredAt && <small>{step.occurredAt}</small>}
              </div>
            ))}
          </div>
          <div className="opening-agent-report-handoff">
            <strong>{selectedAgentTask?.reportAsset ? selectedAgentTask.reportAsset.title : "最终报告将在核查完成后生成"}</strong>
            <p>
              {selectedReviewScope === "completeness_and_compliance"
                ? "当前任务包含资料完整性和合规性核查，报告将基于平台核查事实、人工复核结论和报告资产生成。"
                : "当前以资料完整性核查为主，待人工复核项处理完成后即可生成报告。"}
            </p>
            {selectedAgentTask?.reportAsset?.markdownContent ? (
              <OpeningConditionMarkdownReport markdown={selectedAgentTask.reportAsset.markdownContent} />
            ) : null}
          </div>
        </div>
      </section>

      <details className="opening-agent-advanced">
        <summary>高级任务台账</summary>
        <div className="opening-agent-advanced-body">
          <OpeningConditionReviewTaskWorkbench
            rows={taskWorkbenchRows}
            onGoToIntake={onGoToIntake}
            onGoToPage={onGoToPage}
            onFocusCheckItem={onFocusCheckItem}
            onFocusHumanReview={onFocusHumanReview}
          />
          {actionOwnership ? (
            <OpeningConditionResponsibilityBoard summary={actionOwnership} onNavigate={onGoToPage} />
          ) : null}
        </div>
      </details>

      {uploadModalOpen && (
        <div className="opening-agent-modal-backdrop" role="presentation" onMouseDown={() => setUploadModalOpen(false)}>
          <div className="opening-agent-modal" role="dialog" aria-modal="true" aria-labelledby="opening-agent-upload-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="opening-agent-modal-header">
              <div>
                <span className="eyebrow">上传审核资料</span>
                <h2 id="opening-agent-upload-title">提交三类资料后开始解析</h2>
              </div>
              <button type="button" className="theme-toggle" onClick={() => setUploadModalOpen(false)}>
                关闭
              </button>
            </div>
            <p>资料完整性为必选；资料合规性{complianceReviewRequested ? "已选择" : "未选择"}，不会改变三类资料的必传要求。</p>
            <OpeningConditionRealTrialIntakePanel
              packet={packet}
              pilotTask={pilotTask}
              portalState={deriveOpeningConditionPortalViewState({
                pilotTask,
                intakeMode: "default",
                readiness: pilotReadiness,
              })}
              busy={false}
              submittedBy="opening-condition-agent-console"
              onComplete={(result) => {
                setUploadModalOpen(false);
                if (result.task?.id) {
                  onSelectAgentTask?.(result.task.id);
                }
                onTrialBootstrapComplete?.(result);
              }}
              reviewScope={complianceReviewRequested ? "completeness_and_compliance" : "completeness"}
              getNextOpeningPilotRunTaskId={getNextOpeningPilotRunTaskId}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function OpeningConditionObjectOverviewPage({
  packet,
  workspaces,
  selectedWorkspaceId,
  pilotTask,
  pilotReadiness,
  onSelectWorkspace,
  onGoToIntake,
  onGoToPage,
}: {
  packet: OpeningConditionReviewPacket;
  workspaces: OpeningConditionWorkspace[];
  selectedWorkspaceId: string;
  pilotTask?: OpeningConditionPilotTask | null;
  pilotReadiness?: OpeningConditionPilotReadinessResult | null;
  onSelectWorkspace: (workspaceId: string) => void;
  onGoToIntake: () => void;
  onGoToPage: (page: OpeningConditionPortalPage) => void;
}) {
  const verdictSummary = getOpeningConditionVerdictSummary(packet);
  const riskSummary = getOpeningConditionRiskSummary(packet);
  const readiness = pilotReadiness?.preflightReadiness ?? packet.preflightReadiness;
  const workspaceCatalog = useMemo(() => buildOpeningConditionWorkspaceCatalog(workspaces), [workspaces]);
  const currentWorkspace = workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ?? packet.workspaceContext;
  const selectedProject = findWorkspaceProjectCatalog(workspaceCatalog, selectedWorkspaceId);
  const selectedReviewObject =
    selectedProject?.reviewObjects.find((item) => item.reviewObjectId === currentWorkspace.reviewObjectId) ?? null;
  const actionOwnership = deriveOpeningConditionRunActionOwnership({
    pilotTask,
    readiness: pilotReadiness,
  });

  return (
    <div className="opening-condition-page">
      <section className="opening-condition-hero opening-workspace-hero">
        <div>
          <span className="eyebrow">??????</span>
          <h2>{currentWorkspace.projectName}</h2>
          <p>????????????????????????????????????????????</p>
          <div className="opening-condition-meta">
            <span>{currentWorkspace.projectCode}</span>
            <span>{currentWorkspace.reviewObjectName}</span>
            <span>{currentWorkspace.participantEntityName}</span>
          </div>
        </div>
        <div className="opening-condition-verdict">
          <strong>{pilotTask?.state ?? packet.stage}</strong>
          <span>??????</span>
        </div>
      </section>

      <section className="opening-metric-grid">
        <MetricBlock label="???" value={verdictSummary.total} />
        <MetricBlock label="?????" value={verdictSummary.needsHumanReview} />
        <MetricBlock label="???" value={riskSummary.critical + riskSummary.high} tone="danger" />
        <MetricBlock
          label="??"
          value={readinessLabels[readiness.status] ?? readiness.status}
          tone={readiness.status === "ready" ? "success" : "neutral"}
        />
      </section>

      <OpeningConditionResponsibilityBoard summary={actionOwnership} onNavigate={onGoToPage} />

      <section className="opening-object-summary-grid">
        <article className="opening-panel">
          <span className="eyebrow">????</span>
          <h2>{currentWorkspace.projectName}</h2>
          <div className="opening-record-list opening-record-list-compact">
            <div>
              <strong>{currentWorkspace.projectCode}</strong>
              <span>{selectedProject?.reviewObjects.length ?? 0} ?????</span>
              <p>?????????????????? run?????????????????????</p>
            </div>
          </div>
        </article>

        <article className="opening-panel">
          <span className="eyebrow">??????</span>
          <h2>{currentWorkspace.reviewObjectName}</h2>
          <div className="opening-record-list opening-record-list-compact">
            <div>
              <strong>{getReviewObjectTypeLabel(currentWorkspace.reviewObjectType)}</strong>
              <span>{currentWorkspace.contractPackage}</span>
              <p>{packet.reviewTarget}</p>
            </div>
          </div>
        </article>

        <article className="opening-panel">
          <span className="eyebrow">??????</span>
          <h2>{currentWorkspace.participantEntityName}</h2>
          <div className="opening-record-list opening-record-list-compact">
            <div>
              <strong>{currentWorkspace.participatingOrganization}</strong>
              <span>{currentWorkspace.organizationRole}</span>
              <p>????????????????????????????</p>
            </div>
          </div>
        </article>
      </section>

      <section className="opening-condition-grid">
        <article className="opening-panel">
          <span className="eyebrow">?????</span>
          <h2>?????????????</h2>
          <div className="opening-record-list">
            {workspaceCatalog.map((project) => (
              <div key={project.projectId} className="opening-object-switcher-group">
                <strong>{project.projectName}</strong>
                <span>{project.projectCode} | {project.reviewObjects.length} ?????</span>
                <p>?????????????????????????????????</p>
                <div className="opening-object-switcher-list">
                  {project.reviewObjects.map((reviewObject) => (
                    <div key={reviewObject.reviewObjectId} className="opening-object-switcher-item">
                      <div className="opening-report-finding-header">
                        <strong>{reviewObject.reviewObjectName}</strong>
                        <span className="opening-report-chip tone-info">
                          {getReviewObjectTypeLabel(reviewObject.reviewObjectType)}
                        </span>
                      </div>
                      <span>{reviewObject.participants.length} ?????</span>
                      <div className="opening-object-participant-list">
                        {reviewObject.participants.flatMap((participant) =>
                          participant.workspaces.map((workspace) => (
                            <button
                              key={workspace.id}
                              type="button"
                              className={
                                selectedWorkspaceId === workspace.id
                                  ? "opening-object-select-button active"
                                  : "opening-object-select-button"
                              }
                              onClick={() => onSelectWorkspace(workspace.id)}
                            >
                              <strong>{participant.participantEntityName}</strong>
                              <span>{workspace.purpose}</span>
                              <small>{workspace.contractPackage}</small>
                            </button>
                          )),
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="opening-panel">
          <span className="eyebrow">????</span>
          <h2>??????????</h2>
          <div className="opening-record-list">
            <div>
              <strong>{pilotTask?.id ?? "????? run"}</strong>
              <span>{pilotTask?.state ?? "draft"} | {readiness.nextAction}</span>
              <p>
                {pilotTask
                  ? `?? run ?? ${currentWorkspace.reviewObjectName} / ${currentWorkspace.participantEntityName}??????????????`
                  : "?????????????????????? run?"}
              </p>
              {selectedReviewObject && (
                <small>???????????? {selectedReviewObject.participants.length} ?????????</small>
              )}
            </div>
          </div>
          <div className="dialog-actions">
            <button type="button" className="primary" onClick={onGoToIntake}>
              ??????
            </button>
          </div>
        </article>
      </section>
    </div>
  );
}

function OpeningConditionMaterialIntakePage({
  packet,
  roleLabel,
  intakeMode,
  pilotTask,
  workspaceTasks,
  pilotBasisRecords,
  pilotMasterDataRecords,
  pilotKnowledgeBases,
  pilotReadiness,
  pilotStatus,
  pilotBusy,
  onRefreshPilotTask,
  onInitializePilotTask,
  onPublishPilotBasis,
  onPublishPilotBasisDecision,
  onRefreshPilotBasisPreview,
  onIngestPilotBasisProviderPreview,
  onIngestPilotMasterDataProviderPreview,
  onConfirmPilotMasterData,
  onDecidePilotMasterDataCandidate,
  onRunPilotMatch,
  onEnsureKnowledgeBase,
  onTrialBootstrapComplete,
  getNextOpeningPilotRunTaskId,
  onGoToReports,
}: {
  packet: OpeningConditionReviewPacket;
  roleLabel: string;
  intakeMode: "default" | "rectification_rerun";
  pilotTask?: OpeningConditionPilotTask | null;
  workspaceTasks?: OpeningConditionPilotTask[];
  pilotBasisRecords?: OpeningConditionPilotBasisRecord[];
  pilotMasterDataRecords?: OpeningConditionPilotMasterDataRecord[];
  pilotKnowledgeBases?: OpeningConditionPilotKnowledgeBaseRef[];
  pilotReadiness?: OpeningConditionPilotReadinessResult | null;
  pilotStatus: string;
  pilotBusy?: boolean;
  onRefreshPilotTask?: () => void;
  onInitializePilotTask?: () => void;
  onPublishPilotBasis?: () => void;
  onPublishPilotBasisDecision?: (basisId: string, safeNote?: string) => void;
  onRefreshPilotBasisPreview?: (basisId: string) => void;
  onIngestPilotBasisProviderPreview?: (basisId: string) => void;
  onIngestPilotMasterDataProviderPreview?: (recordId: string) => void;
  onConfirmPilotMasterData?: () => void;
  onDecidePilotMasterDataCandidate?: (
    recordId: string,
    decision: "approve" | "reject" | "publish",
    safeNote?: string,
  ) => void;
  onRunPilotMatch?: () => void;
  onEnsureKnowledgeBase?: () => void;
  onTrialBootstrapComplete?: (result: OpeningConditionPilotIntakeInitResult) => void;
  getNextOpeningPilotRunTaskId?: () => string;
  onGoToReports?: () => void;
}) {
  const portalState = deriveOpeningConditionPortalViewState({
    pilotTask,
    intakeMode,
    readiness: pilotReadiness,
  });

  return (
    <div className="opening-condition-page">
      {portalState.intakeReadOnly && (
        <section className="opening-panel opening-panel-wide opening-intake-guidance-card">
          <div className="section-title row">
            <div>
              <span className="eyebrow">整改复审入口已收口</span>
              <h2>当前归档轮次在这里默认只读</h2>
            </div>
            {onGoToReports && (
              <button type="button" className="primary" onClick={onGoToReports}>
                前往报告归档发起下一轮
              </button>
            )}
          </div>
          <p>为避免“重新上传”和“发起下一轮整改复审”并列造成误操作，新的复审 run 统一从报告归档页进入。</p>
          <ul className="opening-intake-guidance-list">
            <li>当前任务仍可在本页查看资料接入事实、门禁状态和历史输入。</li>
            <li>如果要开始补件后的新一轮复审，请回到报告归档页点击“发起下一轮整改复审”。</li>
            <li>进入复审模式后，本页会自动切换为可上传的新 run 接入页。</li>
          </ul>
        </section>
      )}
      <OpeningConditionRealTrialIntakePanel
        packet={packet}
        pilotTask={pilotTask}
        portalState={portalState}
        busy={pilotBusy}
        submittedBy={roleLabel}
        onComplete={onTrialBootstrapComplete}
        getNextOpeningPilotRunTaskId={getNextOpeningPilotRunTaskId}
      />
      <OpeningConditionPilotExecutionPanel
        pilotTask={pilotTask}
        portalState={portalState}
        readiness={pilotReadiness}
        statusMessage={pilotStatus}
        busy={pilotBusy}
        onRefresh={onRefreshPilotTask}
        onInitialize={onInitializePilotTask}
        onPublishBasis={onPublishPilotBasis}
        onConfirmMasterData={onConfirmPilotMasterData}
        onRunMatch={onRunPilotMatch}
        onEnsureKnowledgeBase={onEnsureKnowledgeBase}
      />
      <OpeningConditionIntakeCandidatePreviewPanel
        packet={packet}
        pilotTask={pilotTask}
        workspaceTasks={workspaceTasks}
        portalState={portalState}
        readiness={pilotReadiness}
        basisRecords={pilotBasisRecords}
        masterDataRecords={pilotMasterDataRecords}
        pilotBusy={pilotBusy}
        onPublishBasis={onPublishPilotBasis}
        onPublishBasisDecision={onPublishPilotBasisDecision}
        onRefreshBasisPreview={onRefreshPilotBasisPreview}
        onIngestProviderPreview={onIngestPilotBasisProviderPreview}
        onConfirmMasterData={onConfirmPilotMasterData}
        onDecideMasterDataCandidate={onDecidePilotMasterDataCandidate}
      />
      <OpeningConditionTrialIntakeOverviewPanel
        pilotTask={pilotTask}
        workspaceTasks={workspaceTasks}
        portalState={portalState}
        readiness={pilotReadiness}
        basisRecords={pilotBasisRecords}
        masterDataRecords={pilotMasterDataRecords}
        knowledgeBases={pilotKnowledgeBases}
        onPublishBasis={onPublishPilotBasis}
        onConfirmMasterData={onConfirmPilotMasterData}
        pilotBusy={pilotBusy}
      />
      <OpeningConditionTrialPackageDiagnostics pilotTask={pilotTask} />
    </div>
  );
}

function OpeningConditionTrialIntakeOverviewPanel({
  pilotTask,
  workspaceTasks,
  portalState,
  readiness,
  basisRecords,
  masterDataRecords,
  knowledgeBases,
  onPublishBasis,
  onConfirmMasterData,
  pilotBusy,
}: {
  pilotTask?: OpeningConditionPilotTask | null;
  workspaceTasks?: OpeningConditionPilotTask[];
  portalState: OpeningConditionPortalViewState;
  readiness?: OpeningConditionPilotReadinessResult | null;
  basisRecords?: OpeningConditionPilotBasisRecord[];
  masterDataRecords?: OpeningConditionPilotMasterDataRecord[];
  knowledgeBases?: OpeningConditionPilotKnowledgeBaseRef[];
  onPublishBasis?: () => void;
  onConfirmMasterData?: () => void;
  pilotBusy?: boolean;
}) {
  if (!pilotTask) {
    return null;
  }

  const rerunAssetDiff = deriveOpeningConditionRerunAssetDiff({
    currentTask: pilotTask,
    workspaceTasks,
    basisRecords,
    masterDataRecords,
  });
  const actionOwnership = portalState.actionOwnership;
  const boundBasis = basisRecords?.find((item) => item.id === pilotTask.basisVersion?.id);
  const requiredMasterData = (masterDataRecords ?? []).filter((item) =>
    (pilotTask.requiredMasterData ?? []).some((required) => required.id === item.id),
  );
  const boundKnowledgeBase = knowledgeBases?.find((item) => item.id === pilotTask.knowledgeBaseRef?.id);
  const diagnostics = pilotTask.trialPackage?.diagnostics;
  const blockingReasons = readiness?.preflightReadiness?.blockingReasons ?? pilotTask.trialPackage?.blockingReasons ?? [];
  const knowledgeBaseReadiness = readiness?.preflightReadiness?.knowledgeBase ?? "provisional";
  const actionGates = portalState.actions;
  const basisNeedsPublish = Boolean(boundBasis && boundBasis.status !== "published");
  const pendingMasterDataCount = requiredMasterData.filter(
    (item) => item.status !== "published" && item.status !== "human_approved",
  ).length;
  const gateReady = readiness?.preflightReadiness?.status === "ready";

  return (
    <section className="opening-panel opening-panel-wide">
      <span className="eyebrow">Trial Intake Overview</span>
      <h2>Review current run facts before formal matching</h2>
      <div className="opening-condition-meta">
        <span>Task {pilotTask.id}</span>
        <span>State {pilotTask.state}</span>
        <span>Basis {boundBasis?.version ?? pilotTask.basisVersion?.id ?? "unbound"}</span>
        <span>Master data {requiredMasterData.length || pilotTask.requiredMasterData.length}</span>
        <span>KB {boundKnowledgeBase?.label ?? pilotTask.knowledgeBaseRef?.label ?? "unbound"}</span>
      </div>
      <OpeningConditionActionOwnershipSummary
        summary={actionOwnership}
        title="当前 run 的责任归属"
        description="把状态枚举翻译成操作者可执行的责任、动作和时限提示。"
      />
      <OpeningConditionRerunAssetDiffPanel
        diff={rerunAssetDiff}
        eyebrow="Rerun Asset Snapshot"
        title="上一轮复用与本轮变化"
        description="正式匹配前先看清楚：哪些依据和主数据沿用了上一轮，哪些是本轮新增，哪些仍需要重新确认。"
      />
      <div className="opening-record-list">
        <div>
          <strong>Publish Gate</strong>
          <span>{gateReady ? "ready_for_formal_match" : "pending_confirmation"}</span>
          <p>
            Basis {basisNeedsPublish ? "pending publish" : "ready"} / Master data{" "}
            {pendingMasterDataCount > 0 ? `${pendingMasterDataCount} pending confirm` : "ready"} / Knowledge base {knowledgeBaseReadiness}
          </p>
          <div className="dialog-actions compact">
            {onPublishBasis && (
              <button
                type="button"
                className="secondary"
                onClick={onPublishBasis}
                disabled={pilotBusy || !actionGates.publishBasis.enabled || !basisNeedsPublish}
                title={
                  !actionGates.publishBasis.enabled
                    ? getOpeningActionGateTitle(actionGates.publishBasis)
                    : !basisNeedsPublish
                      ? "当前 run 依据已发布或没有待发布依据。"
                      : ""
                }
              >
                发布当前 run 依据
              </button>
            )}
            {onConfirmMasterData && (
              <button
                type="button"
                className="secondary"
                onClick={onConfirmMasterData}
                disabled={pilotBusy || !actionGates.confirmMasterData.enabled || pendingMasterDataCount === 0}
                title={
                  !actionGates.confirmMasterData.enabled
                    ? getOpeningActionGateTitle(actionGates.confirmMasterData)
                    : pendingMasterDataCount === 0
                      ? "当前 run 主数据已确认或没有待确认记录。"
                      : ""
                }
              >
                确认当前 run 主数据
              </button>
            )}
          </div>
        </div>
        <div>
          <strong>Basis</strong>
          <span>{boundBasis?.title ?? pilotTask.basisVersion?.id ?? "No backend basis record"}</span>
          <p>{boundBasis?.applicability ?? "Current run keeps the bound basis version."}</p>
          {boundBasis?.ingestionPreview && (
            <div className="opening-report-detail-list">
              <small>
                <strong>Basis Preview</strong>
                {basisPreviewStatusLabels[boundBasis.ingestionPreview.status] ?? boundBasis.ingestionPreview.status}
              </small>
              <small>
                <strong>Extraction</strong>
                {summarizeBasisPreviewProvenance(boundBasis.ingestionPreview.provenance)}
              </small>
              <small>
                <strong>Facts</strong>
                {summarizeBasisPreviewFacts(boundBasis.ingestionPreview.facts)}
              </small>
              <small>
                <strong>Missing</strong>
                {boundBasis.ingestionPreview.missingFields.length > 0
                  ? boundBasis.ingestionPreview.missingFields.join(" / ")
                  : "None"}
              </small>
              <small>
                <strong>Next</strong>
                {boundBasis.ingestionPreview.nextAction}
              </small>
            </div>
          )}
        </div>
        <div>
          <strong>Master Data</strong>
          <span>{requiredMasterData.length || pilotTask.requiredMasterData.length} records in scope</span>
          <p>
            {(requiredMasterData.length > 0
              ? requiredMasterData.map((item) => `${item.label} (${item.status})`)
              : pilotTask.requiredMasterData.map((item) => `${item.label} (${item.status})`)
            ).join(" / ") || "No backend master-data record found for this run."}
          </p>
        </div>
        <div>
          <strong>Knowledge Base</strong>
          <span>
            {boundKnowledgeBase?.status ?? pilotTask.knowledgeBaseRef?.status ?? "draft"} /{" "}
            {boundKnowledgeBase?.providerSyncStatus ?? pilotTask.knowledgeBaseRef?.providerSyncStatus ?? "unknown"}
          </span>
          <p>
            {knowledgeBaseReadiness !== "ready"
              ? `Bound KB exists but is not formal-review ready yet (${knowledgeBaseReadiness}).`
              : diagnostics
                ? `Checklist ${diagnostics.checklistDefinitionResolution ?? "unknown"} / Manifest ${diagnostics.inventoryEntryCount}`
                : "No trial diagnostics recorded yet."}
          </p>
        </div>
      </div>
      <small>
        {blockingReasons.length > 0
          ? blockingReasons.join(" / ")
          : readiness?.preflightReadiness?.nextAction ?? "Current run has the baseline context required for formal matching."}
      </small>
    </section>
  );
}

function OpeningConditionIntakeCandidatePreviewPanel({
  packet,
  pilotTask,
  workspaceTasks,
  portalState,
  readiness,
  basisRecords,
  masterDataRecords,
  pilotBusy,
  onPublishBasis,
  onPublishBasisDecision,
  onRefreshBasisPreview,
  onIngestProviderPreview,
  onConfirmMasterData,
  onDecideMasterDataCandidate,
}: {
  packet: OpeningConditionReviewPacket;
  pilotTask?: OpeningConditionPilotTask | null;
  workspaceTasks?: OpeningConditionPilotTask[];
  portalState: OpeningConditionPortalViewState;
  readiness?: OpeningConditionPilotReadinessResult | null;
  basisRecords?: OpeningConditionPilotBasisRecord[];
  masterDataRecords?: OpeningConditionPilotMasterDataRecord[];
  pilotBusy?: boolean;
  onPublishBasis?: () => void;
  onPublishBasisDecision?: (basisId: string, safeNote?: string) => void;
  onRefreshBasisPreview?: (basisId: string) => void;
  onIngestProviderPreview?: (basisId: string) => void;
  onConfirmMasterData?: () => void;
  onDecideMasterDataCandidate?: (
    recordId: string,
    decision: "approve" | "reject" | "publish",
    safeNote?: string,
  ) => void;
}) {
  if (!pilotTask) {
    return null;
  }

  const [basisSafeNote, setBasisSafeNote] = useState("");
  const [masterDataNotes, setMasterDataNotes] = useState<Record<string, string>>({});
  const rerunAssetDiff = deriveOpeningConditionRerunAssetDiff({
    currentTask: pilotTask,
    workspaceTasks,
    basisRecords,
    masterDataRecords,
  });

  const boundBasis = basisRecords?.find((item) => item.id === pilotTask.basisVersion?.id);
  const requiredMasterData = (masterDataRecords ?? []).filter((item) =>
    (pilotTask.requiredMasterData ?? []).some((required) => required.id === item.id),
  );
  const unresolvedMasterData = requiredMasterData.filter(
    (item) => item.status !== "published" && item.status !== "human_approved",
  );
  const basisMeta = getOpeningConditionBasisPublicationStatusMeta(boundBasis?.status);
  const blockingReasons = readiness?.preflightReadiness?.blockingReasons ?? [];
  const reviewObjectLabel = getReviewObjectTypeLabel(packet.workspaceContext.reviewObjectType);

  const masterPreviewEntries = (requiredMasterData.length > 0 ? requiredMasterData : pilotTask.requiredMasterData).map((record) => {
    const meta = getOpeningConditionMasterDataPublicationStatusMeta(record.status);
    return {
      id: record.id,
      title: record.label,
      category: openingConditionMasterDataTypeLabels[record.type] ?? record.type,
      statusLabel:
        openingConditionRecordStatusLabels[record.status as keyof typeof openingConditionRecordStatusLabels] ?? record.status,
      meta,
      note: "validity" in record ? record.validity : "当前主数据未记录额外有效性说明。",
      safeNote:
        ("safeNote" in record && typeof record.safeNote === "string" ? record.safeNote : undefined) ??
        ("rejectionReason" in record && typeof record.rejectionReason === "string" ? record.rejectionReason : undefined),
      masterPreview: "preview" in record ? record.preview : undefined,
      nextAction: "nextAction" in record && typeof record.nextAction === "string" ? record.nextAction : undefined,
    };
  });

  function updateMasterDataNote(recordId: string, note: string) {
    setMasterDataNotes((current) => ({
      ...current,
      [recordId]: note,
    }));
  }

  return (
    <section className="opening-panel opening-panel-wide">
      <div className="section-title row">
        <div>
          <span className="eyebrow">Intake Candidate Preview</span>
          <h2>识别预览确认工作台</h2>
        </div>
      </div>
      <p>这里先看系统本次识别成了什么，再决定是否将这些识别结果正式确认并纳入平台可用资产。</p>
      <OpeningConditionRerunAssetDiffPanel
        diff={rerunAssetDiff}
        eyebrow="Rerun Reuse"
        title="复审 run 复用与待确认资产"
        description="这一栏只服务一件事：减少重复确认，让你先看到哪些资产能直接沿用，哪些变化项要在本轮处理。"
      />
      <div className="opening-candidate-preview-grid">
        <article className="opening-candidate-preview-card">
          <strong>当前对象</strong>
          <div className="opening-report-chip-row">
            <span className="opening-report-chip tone-info">{packet.workspaceContext.projectCode}</span>
            <span className="opening-report-chip tone-muted">{reviewObjectLabel}</span>
          </div>
          <p>{packet.workspaceContext.reviewObjectName}</p>
          <small>{packet.workspaceContext.participantEntityName}</small>
        </article>

        <article className="opening-candidate-preview-card">
          <strong>依据候选</strong>
          <div className="opening-report-chip-row">
            <span className={`opening-report-chip tone-${basisMeta.tone}`}>{basisMeta.label}</span>
            {boundBasis && (
              <span className="opening-report-chip tone-info">
                {openingConditionBasisComponentTypeLabels[boundBasis.componentType] ?? boundBasis.componentType}
              </span>
            )}
          </div>
          <p>{boundBasis?.title ?? pilotTask.basisVersion?.id ?? "当前 run 尚未识别到明确依据候选"}</p>
          <small>
            {boundBasis
              ? `${boundBasis.version} · ${boundBasis.applicability ?? "当前依据未记录附加适用说明。"}`
              : "发布当前 run 依据，意味着将该识别结果正式纳入平台依据资产。"}
          </small>
        </article>

        <article className="opening-candidate-preview-card">
          <strong>主数据候选</strong>
          <p>{masterPreviewEntries.length} 项与当前 run 相关</p>
          <small>
            {masterPreviewEntries.length > 0
              ? masterPreviewEntries.map((item) => `${item.category}：${item.title}`).join(" / ")
              : "当前还没有可供确认的主数据候选。"}
          </small>
        </article>

        <article className="opening-candidate-preview-card">
          <strong>确认动作含义</strong>
          <p>确认主数据 / 发布依据</p>
          <small>
            这一步不是单纯点亮门禁，而是在把当前识别结果从预览候选转成平台正式可用资产，供后续正式核查引用。
          </small>
        </article>
      </div>

      <div className="opening-candidate-preview-lists">
        <article className="opening-panel opening-panel-emphasis">
          <span className="eyebrow">Basis Candidate</span>
          <h3>当前 run 的依据识别预览</h3>
          <div className="opening-governance-list">
            <div className="opening-governance-item">
              <div className="opening-report-finding-header">
                <strong>{boundBasis?.title ?? pilotTask.basisVersion?.id ?? "未绑定依据候选"}</strong>
                <div className="opening-report-chip-row">
                  <span className={`opening-report-chip tone-${basisMeta.tone}`}>{basisMeta.label}</span>
                  <span className="opening-report-chip tone-info">正式入库前预览</span>
                </div>
              </div>
              <span>
                {boundBasis
                  ? openingConditionBasisComponentTypeLabels[boundBasis.componentType] ?? boundBasis.componentType
                  : "当前 run 依据候选"}
              </span>
              <p>{boundBasis?.applicability ?? basisMeta.description}</p>
              {boundBasis?.ingestionPreview && (
                <div className="opening-report-detail-list">
                  <small>
                    <strong>Extraction</strong>
                    {summarizeBasisPreviewProvenance(boundBasis.ingestionPreview.provenance)}
                  </small>
                  <small>
                    <strong>Facts</strong>
                    {summarizeBasisPreviewFacts(boundBasis.ingestionPreview.facts)}
                  </small>
                  <small>
                    <strong>Missing</strong>
                    {boundBasis.ingestionPreview.missingFields.length > 0
                      ? boundBasis.ingestionPreview.missingFields.join(" / ")
                      : "None"}
                  </small>
                  <small>
                    <strong>Next</strong>
                    {boundBasis.ingestionPreview.nextAction}
                  </small>
                </div>
              )}
              <small>
                {boundBasis
                  ? `版本 ${boundBasis.version} · 后端状态：${boundBasis.status}`
                  : "发布当前 run 依据后，当前识别结果才会进入正式依据目录。"}
              </small>
              {boundBasis && onPublishBasisDecision && (
                <label className="opening-candidate-note-field">
                  <span>入库备注</span>
                  <textarea
                    value={basisSafeNote}
                    onChange={(event) => setBasisSafeNote(event.target.value)}
                    placeholder="例如：页码、签章核验结论、人工确认边界。"
                    disabled={pilotBusy || !portalState.actions.publishBasis.enabled || boundBasis.status === "published"}
                    title={
                      !portalState.actions.publishBasis.enabled
                        ? getOpeningActionGateTitle(portalState.actions.publishBasis)
                        : boundBasis.status === "published"
                          ? "当前依据已发布。"
                          : ""
                    }
                  />
                </label>
              )}
              {boundBasis && onPublishBasisDecision && (
                <div className="dialog-actions compact">
                  {onRefreshBasisPreview && (
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => onRefreshBasisPreview(boundBasis.id)}
                      disabled={pilotBusy || !portalState.actions.publishBasis.enabled || boundBasis.status === "published"}
                      title={
                        !portalState.actions.publishBasis.enabled
                          ? getOpeningActionGateTitle(portalState.actions.publishBasis)
                          : boundBasis.status === "published"
                            ? "当前依据已发布。"
                            : ""
                      }
                    >
                      刷新预览抽取
                    </button>
                  )}
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => onPublishBasisDecision(boundBasis.id, basisSafeNote)}
                    disabled={pilotBusy || !portalState.actions.publishBasis.enabled || boundBasis.status === "published"}
                    title={
                      !portalState.actions.publishBasis.enabled
                        ? getOpeningActionGateTitle(portalState.actions.publishBasis)
                        : boundBasis.status === "published"
                          ? "当前依据已发布。"
                          : ""
                    }
                  >
                    备注后发布当前依据
                  </button>
                </div>
              )}
            </div>
          </div>
        </article>

        <article className="opening-panel opening-panel-emphasis">
          <span className="eyebrow">Master Data Candidates</span>
          <h3>当前 run 的主数据识别预览</h3>
          {masterPreviewEntries.length > 0 ? (
            <div className="opening-governance-list">
              {masterPreviewEntries.map((item) => (
                <div key={item.id} className="opening-governance-item">
                  <div className="opening-report-finding-header">
                    <strong>{item.title}</strong>
                    <div className="opening-report-chip-row">
                      <span className={`opening-report-chip tone-${item.meta.tone}`}>{item.meta.label}</span>
                      <span className="opening-report-chip tone-info">当前 run 候选</span>
                    </div>
                  </div>
                  <span>{item.category}</span>
                  <p>{item.note}</p>
                  {item.safeNote && <small>{item.safeNote}</small>}
                  {item.masterPreview && (
                    <div className="opening-report-detail-list">
                      <small>
                        <strong>Lifecycle</strong>
                        {item.masterPreview.lifecycleLabel}
                      </small>
                      <small>
                        <strong>Source</strong>
                        {summarizeMasterDataPreviewSources(item.masterPreview)}
                      </small>
                      <small>
                        <strong>Facts</strong>
                        {summarizeMasterDataPreviewFacts(item.masterPreview)}
                      </small>
                      <small>
                        <strong>Missing</strong>
                        {item.masterPreview.missingFields.length > 0 ? item.masterPreview.missingFields.join(" / ") : "None"}
                      </small>
                      <small>
                        <strong>Next</strong>
                        {item.nextAction ?? item.masterPreview.nextAction}
                      </small>
                    </div>
                  )}
                  <small>后端状态：{item.statusLabel}</small>
                  {onDecideMasterDataCandidate && item.meta.group !== "published" && item.meta.group !== "exception" && (
                    <>
                      <label className="opening-candidate-note-field">
                        <span>确认备注</span>
                        <textarea
                          value={masterDataNotes[item.id] ?? ""}
                          onChange={(event) => updateMasterDataNote(item.id, event.target.value)}
                          placeholder="例如：人工核验来源文件、发现问题、暂时放行原因。"
                          disabled={pilotBusy || !portalState.actions.confirmMasterData.enabled}
                          title={getOpeningActionGateTitle(portalState.actions.confirmMasterData)}
                        />
                      </label>
                      <div className="dialog-actions compact">
                        {item.meta.group === "pending_confirmation" && (
                          <button
                            type="button"
                            className="secondary"
                            onClick={() => onDecideMasterDataCandidate(item.id, "approve", masterDataNotes[item.id])}
                            disabled={pilotBusy || !portalState.actions.confirmMasterData.enabled}
                            title={getOpeningActionGateTitle(portalState.actions.confirmMasterData)}
                          >
                            逐条确认
                          </button>
                        )}
                        {(item.meta.group === "current_run_confirmed" || item.meta.group === "ready_to_publish") && (
                          <button
                            type="button"
                            className="secondary"
                            onClick={() => onDecideMasterDataCandidate(item.id, "publish", masterDataNotes[item.id])}
                            disabled={pilotBusy || !portalState.actions.confirmMasterData.enabled}
                            title={getOpeningActionGateTitle(portalState.actions.confirmMasterData)}
                          >
                            发布为目录事实
                          </button>
                        )}
                        <button
                          type="button"
                          className="secondary danger"
                          onClick={() => onDecideMasterDataCandidate(item.id, "reject", masterDataNotes[item.id])}
                          disabled={pilotBusy || !portalState.actions.confirmMasterData.enabled}
                          title={getOpeningActionGateTitle(portalState.actions.confirmMasterData)}
                        >
                          驳回该候选
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="opening-governance-empty">
              <strong>当前没有主数据候选预览。</strong>
              <small>待后端识别出与本次 run 相关的人员、设备、制度或证照事实后，这里会出现预览列表。</small>
            </div>
          )}
        </article>
      </div>

      <div className="dialog-actions">
        {onPublishBasis && (
          <button
            type="button"
            className="secondary"
            onClick={onPublishBasis}
            disabled={pilotBusy || !portalState.actions.publishBasis.enabled || !boundBasis || boundBasis.status === "published"}
            title={
              !portalState.actions.publishBasis.enabled
                ? getOpeningActionGateTitle(portalState.actions.publishBasis)
                : !boundBasis
                  ? "当前 run 没有可发布的依据记录。"
                  : boundBasis.status === "published"
                    ? "当前依据已发布。"
                    : ""
            }
          >
            确认并发布当前依据
          </button>
        )}
        {onConfirmMasterData && (
          <button
            type="button"
            className="secondary"
            onClick={onConfirmMasterData}
            disabled={pilotBusy || !portalState.actions.confirmMasterData.enabled || unresolvedMasterData.length === 0}
            title={
              !portalState.actions.confirmMasterData.enabled
                ? getOpeningActionGateTitle(portalState.actions.confirmMasterData)
                : unresolvedMasterData.length === 0
                  ? "当前没有待确认的主数据候选。"
                  : ""
            }
          >
            确认当前主数据候选
          </button>
        )}
      </div>
      <small>
        {blockingReasons.length > 0
          ? blockingReasons.join(" / ")
          : "先在这里确认系统识别结果，再让这些记录进入正式入库与后续核查链路。"}
      </small>
    </section>
  );
}

function OpeningConditionBasisAndMasterDataPage({
  packet,
  pilotTask,
  basisRecords,
  masterDataRecords,
  knowledgeBases,
  pilotReadiness,
}: {
  packet: OpeningConditionReviewPacket;
  pilotTask?: OpeningConditionPilotTask | null;
  basisRecords?: OpeningConditionPilotBasisRecord[];
  masterDataRecords?: OpeningConditionPilotMasterDataRecord[];
  knowledgeBases?: OpeningConditionPilotKnowledgeBaseRef[];
  pilotReadiness?: OpeningConditionPilotReadinessResult | null;
}) {
  const displayedBasisRecords = basisRecords && basisRecords.length > 0 ? basisRecords : packet.basisVersions;
  const displayedMasterDataRecords = masterDataRecords && masterDataRecords.length > 0 ? masterDataRecords : packet.masterData;
  const boundBasisId = pilotTask?.basisVersion?.id;
  const requiredMasterDataIds = new Set((pilotTask?.requiredMasterData ?? []).map((record) => record.id));
  const boundKnowledgeBaseId = pilotTask?.knowledgeBaseRef?.id;
  const displayedKnowledgeBases = knowledgeBases ?? [];
  const basisReady = pilotReadiness?.preflightReadiness?.basis === "ready";
  const masterDataReady = pilotReadiness?.preflightReadiness?.masterData === "ready";
  const knowledgeBaseReady = pilotReadiness?.preflightReadiness?.knowledgeBase === "ready";
  const formatRecordStatus = (status?: string) =>
    (status && openingConditionRecordStatusLabels[status as keyof typeof openingConditionRecordStatusLabels]) || status || "unknown";

  return (
    <div className="opening-condition-page">
      <section className="opening-panel opening-panel-wide">
        <span className="eyebrow">Intake Preview Gate</span>
        <h2>Current run publish and confirmation status</h2>
        <div className="opening-condition-meta">
          <span>Basis {basisReady ? "ready" : "pending_publish"}</span>
          <span>Master data {masterDataReady ? "ready" : "pending_confirmation"}</span>
          <span>Knowledge base {knowledgeBaseReady ? "ready" : "not_ready"}</span>
          <span>Run {pilotTask?.id ?? "unbound"}</span>
        </div>
        <small>
          `current_run` 表示本次试点 run 正在使用的记录；`human_approved` 表示已人工确认，可进入正式核查门禁。
        </small>
      </section>

      <section className="opening-condition-grid">
        <article className="opening-panel">
          <span className="eyebrow">Basis</span>
          <h2>Current run basis and published records</h2>
          <div className="opening-record-list">
            {displayedBasisRecords.map((basis) => (
              <div key={basis.id}>
                <strong>{basis.title}</strong>
                <span>
                  {formatRecordStatus(basis.status)} | {basis.componentType}
                  {basis.id === boundBasisId ? " | current_run" : ""}
                </span>
                <p>{"applicability" in basis ? basis.applicability : "Current workspace basis has no extra note."}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="opening-panel">
          <span className="eyebrow">Master Data</span>
          <h2>Backend facts used by this run</h2>
          <div className="opening-record-list">
            {displayedMasterDataRecords.map((record) => (
              <div key={record.id}>
                <strong>{record.label}</strong>
                <span>
                  {record.type} | {formatRecordStatus(record.status)}
                  {requiredMasterDataIds.has(record.id) ? " | current_run" : ""}
                </span>
                <p>{"validity" in record ? record.validity : "Current master-data record has no extra note."}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="opening-panel">
          <span className="eyebrow">Knowledge Base</span>
          <h2>Current run binding and readiness</h2>
          <div className="opening-record-list">
            {displayedKnowledgeBases.length > 0 ? (
              displayedKnowledgeBases.map((knowledgeBase) => (
                <div key={knowledgeBase.id}>
                  <strong>{knowledgeBase.label}</strong>
                  <span>
                    {knowledgeBase.status} | {knowledgeBase.providerSyncStatus ?? "unknown"}
                    {knowledgeBase.id === boundKnowledgeBaseId ? " | current_run" : ""}
                  </span>
                  <p>{knowledgeBase.summary || "No workspace knowledge base summary."}</p>
                </div>
              ))
            ) : (
              <div>
                <strong>No backend knowledge-base record</strong>
                <p>No workspace knowledge base has been synchronized for this run yet.</p>
              </div>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

function OpeningConditionPublicationGovernancePage({
  packet,
  pilotTask,
  workspaceTasks,
  basisRecords,
  masterDataRecords,
  knowledgeBases,
  pilotReadiness,
  pilotBusy,
  onRefreshBasisPreview,
  onIngestProviderPreview,
  onIngestMasterDataProviderPreview,
  onGoToPage,
}: {
  packet: OpeningConditionReviewPacket;
  pilotTask?: OpeningConditionPilotTask | null;
  workspaceTasks?: OpeningConditionPilotTask[];
  basisRecords?: OpeningConditionPilotBasisRecord[];
  masterDataRecords?: OpeningConditionPilotMasterDataRecord[];
  knowledgeBases?: OpeningConditionPilotKnowledgeBaseRef[];
  pilotReadiness?: OpeningConditionPilotReadinessResult | null;
  pilotBusy?: boolean;
  onRefreshBasisPreview?: (basisId: string) => void;
  onIngestProviderPreview?: (basisId: string) => void;
  onIngestMasterDataProviderPreview?: (recordId: string) => void;
  onGoToPage?: (page: OpeningConditionPortalPage) => void;
}) {
  const displayedBasisRecords = basisRecords && basisRecords.length > 0 ? basisRecords : packet.basisVersions;
  const displayedMasterDataRecords = masterDataRecords && masterDataRecords.length > 0 ? masterDataRecords : packet.masterData;
  const rerunAssetDiff = deriveOpeningConditionRerunAssetDiff({
    currentTask: pilotTask,
    workspaceTasks,
    basisRecords,
    masterDataRecords,
  });
  const displayedKnowledgeBases = knowledgeBases ?? [];
  const boundBasisId = pilotTask?.basisVersion?.id;
  const requiredMasterDataIds = new Set((pilotTask?.requiredMasterData ?? []).map((record) => record.id));
  const boundKnowledgeBaseId = pilotTask?.knowledgeBaseRef?.id;
  const readiness = pilotReadiness?.preflightReadiness;
  const basisReady = readiness?.basis === "ready";
  const masterDataReady = readiness?.masterData === "ready";
  const knowledgeBaseReady = readiness?.knowledgeBase === "ready";
  const blockingReasons = readiness?.blockingReasons ?? [];
  const reviewObjectLabel = getReviewObjectTypeLabel(packet.workspaceContext.reviewObjectType);
  const mvpClosure = deriveOpeningConditionMvpClosureState(pilotTask);

  const basisEntries = displayedBasisRecords.map((basis) => {
    const meta = getOpeningConditionBasisPublicationStatusMeta(basis.status);
    return {
      id: basis.id,
      title: basis.title,
      category: openingConditionBasisComponentTypeLabels[basis.componentType] ?? basis.componentType,
      assetType: "basis" as const,
      statusLabel:
        openingConditionRecordStatusLabels[basis.status as keyof typeof openingConditionRecordStatusLabels] ?? basis.status,
      meta,
      note: "applicability" in basis ? basis.applicability : "当前依据未记录附加适用说明。",
      secondary:
        basis.publishedAt || basis.confirmedAt
          ? `版本 ${basis.version} · ${basis.publishedAt ? `发布于 ${basis.publishedAt}` : `确认于 ${basis.confirmedAt}`}`
          : `版本 ${basis.version}`,
      isBound: basis.id === boundBasisId,
      preview: basis.ingestionPreview,
    };
  });

  const masterEntries = displayedMasterDataRecords.map((record) => {
    const meta = getOpeningConditionMasterDataPublicationStatusMeta(record.status);
    return {
      id: record.id,
      title: record.label,
      category: openingConditionMasterDataTypeLabels[record.type] ?? record.type,
      assetType: "master_data" as const,
      statusLabel:
        openingConditionRecordStatusLabels[record.status as keyof typeof openingConditionRecordStatusLabels] ?? record.status,
      meta,
      note: "validity" in record ? record.validity : "当前主数据未记录有效性说明。",
      secondary:
        record.publishedAt || record.confirmedAt
          ? `${openingConditionMasterDataTypeLabels[record.type] ?? record.type} · ${
              record.publishedAt ? `发布于 ${record.publishedAt}` : `确认于 ${record.confirmedAt}`
            }`
          : openingConditionMasterDataTypeLabels[record.type] ?? record.type,
      safeNote:
        ("safeNote" in record && typeof record.safeNote === "string" ? record.safeNote : undefined) ??
        ("rejectionReason" in record && typeof record.rejectionReason === "string" ? record.rejectionReason : undefined),
      isCurrentRun: requiredMasterDataIds.has(record.id),
      masterPreview: "preview" in record ? record.preview : undefined,
      nextAction: "nextAction" in record && typeof record.nextAction === "string" ? record.nextAction : undefined,
    };
  });

  const basisSnapshot = basisEntries.find((entry) => entry.isBound) ?? null;
  const currentRunFacts = masterEntries.filter((entry) => entry.isCurrentRun);
  const missingCurrentRunMasterData = (pilotTask?.requiredMasterData ?? []).filter(
    (required) => !currentRunFacts.some((entry) => entry.id === required.id),
  );
  const missingBoundBasis = Boolean(pilotTask?.basisVersion?.id && !basisSnapshot);
  const boundKnowledgeBase =
    displayedKnowledgeBases.find((knowledgeBase) => knowledgeBase.id === boundKnowledgeBaseId) ?? pilotTask?.knowledgeBaseRef ?? null;

  const basisPending = basisEntries.filter((entry) => entry.meta.group === "pending_confirmation");
  const basisReadyToPublish = basisEntries.filter((entry) => entry.meta.group === "ready_to_publish");
  const basisPublished = basisEntries.filter((entry) => entry.meta.group === "published");
  const basisExceptions = basisEntries.filter((entry) => entry.meta.group === "exception");

  const masterPending = masterEntries.filter((entry) => entry.meta.group === "pending_confirmation");
  const masterReadyToPublish = masterEntries.filter(
    (entry) => entry.meta.group === "ready_to_publish" || entry.meta.group === "current_run_confirmed",
  );
  const masterPublished = masterEntries.filter((entry) => entry.meta.group === "published");
  const masterExceptions = masterEntries.filter((entry) => entry.meta.group === "exception");

  function renderGovernanceList(
    items: Array<{
      id: string;
      title: string;
      category: string;
      statusLabel: string;
      meta: { label: string; description: string; tone: string; group?: string };
      assetType?: "basis" | "master_data";
      secondary?: string;
      note?: string;
      safeNote?: string;
      isBound?: boolean;
      isCurrentRun?: boolean;
      masterPreview?: OpeningConditionPilotMasterDataRecord["preview"];
      nextAction?: string;
      preview?: OpeningConditionPilotBasisRecord["ingestionPreview"];
    }>,
    emptyTitle: string,
    emptyDescription: string,
  ) {
    if (items.length === 0) {
      return (
        <div className="opening-governance-empty">
          <strong>{emptyTitle}</strong>
          <small>{emptyDescription}</small>
        </div>
      );
    }

    return (
      <div className="opening-governance-list">
        {items.map((item) => (
          <div key={item.id} className="opening-governance-item">
            <div className="opening-report-finding-header">
              <strong>{item.title}</strong>
              <div className="opening-report-chip-row">
                <span className={`opening-report-chip tone-${item.meta.tone}`}>{item.meta.label}</span>
                {item.isBound && <span className="opening-report-chip tone-info">当前 run 绑定</span>}
                {item.isCurrentRun && <span className="opening-report-chip tone-info">当前 run 事实</span>}
              </div>
            </div>
            <span>{item.category}</span>
            {item.secondary && <small>{item.secondary}</small>}
            <p>{item.note ?? item.meta.description}</p>
            {item.safeNote && <small>{item.safeNote}</small>}
            {item.masterPreview && (
              <div className="opening-report-detail-list">
                <small>
                  <strong>Lifecycle</strong>
                  {item.masterPreview.lifecycleLabel}
                </small>
                <small>
                  <strong>Source</strong>
                  {summarizeMasterDataPreviewSources(item.masterPreview)}
                </small>
                <small>
                  <strong>Facts</strong>
                  {summarizeMasterDataPreviewFacts(item.masterPreview)}
                </small>
                <small>
                  <strong>Missing</strong>
                  {item.masterPreview.missingFields.length > 0 ? item.masterPreview.missingFields.join(" / ") : "None"}
                </small>
                <small>
                  <strong>Next</strong>
                  {item.nextAction ?? item.masterPreview.nextAction}
                </small>
              </div>
            )}
            {item.preview && (
              <div className="opening-report-detail-list">
                <small>
                  <strong>Basis Preview</strong>
                  {basisPreviewStatusLabels[item.preview.status] ?? item.preview.status}
                </small>
                <small>
                  <strong>Confidence</strong>
                  {item.preview.confidence}
                </small>
                <small>
                  <strong>Extraction</strong>
                  {summarizeBasisPreviewProvenance(item.preview.provenance)}
                </small>
                <small>
                  <strong>Facts</strong>
                  {summarizeBasisPreviewFacts(item.preview.facts)}
                </small>
                <small>
                  <strong>Missing</strong>
                  {item.preview.missingFields.length > 0 ? item.preview.missingFields.join(" / ") : "None"}
                </small>
                <small>
                  <strong>Next</strong>
                  {item.preview.nextAction}
                </small>
              </div>
            )}
            {item.assetType === "basis" && onRefreshBasisPreview && item.meta.group !== "published" && (
              <div className="dialog-actions compact">
                <button type="button" className="secondary" onClick={() => onRefreshBasisPreview(item.id)} disabled={pilotBusy}>
                  刷新预览抽取
                </button>
              </div>
            )}
            {item.assetType === "basis" && onIngestProviderPreview && item.meta.group !== "published" && (
              <div className="dialog-actions compact">
                <button type="button" className="secondary" onClick={() => onIngestProviderPreview(item.id)} disabled={pilotBusy}>
                  导入 provider 预览
                </button>
              </div>
            )}
            {item.assetType === "master_data" &&
              onIngestMasterDataProviderPreview &&
              item.meta.group !== "published" && (
                <div className="dialog-actions compact">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => onIngestMasterDataProviderPreview(item.id)}
                    disabled={pilotBusy}
                  >
                    导入 provider 候选预览
                  </button>
                </div>
              )}
            <small>后端状态：{item.statusLabel}</small>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="opening-condition-page">
      <section className="opening-panel opening-panel-wide opening-intake-guidance-card">
        <div className="section-title row">
          <div>
            <span className="eyebrow">MVP Closure Path</span>
            <h2>{mvpClosure.title}</h2>
          </div>
          {onGoToPage && (
            <button type="button" className="primary" onClick={() => onGoToPage(mvpClosure.nextPage)}>
              {mvpClosure.nextPageLabel}
            </button>
          )}
        </div>
        <p>{mvpClosure.description}</p>
        <div className="opening-report-chip-row">
          {mvpClosure.steps.map((step: OpeningConditionMvpClosureStep) => (
            <span key={step.key} className={`opening-report-chip tone-${step.done ? "success" : "muted"}`}>
              {step.done ? "已到达" : "未完成"} · {step.label}
            </span>
          ))}
        </div>
        <small>
          当前页是依据、主数据和知识库资产治理工作台，属于 MVP 跑通后的治理能力；最小 MVP 验收请优先按资料接入、资料核查、人工复核、报告归档推进。
        </small>
      </section>

      <section className="opening-panel opening-panel-wide">
        <span className="eyebrow">Publication Governance</span>
        <h2>依据与主数据发布治理面</h2>
        <p>把当前 run 正在消费的资产、待确认候选、待发布记录和异常留痕放在同一个治理面里看清楚。</p>
        <div className="opening-governance-summary-grid">
          <div className="opening-governance-summary-card">
            <strong>{basisReady ? "依据已就绪" : "依据待发布"}</strong>
            <span>{basisSnapshot ? basisSnapshot.title : "当前 run 暂未绑定正式依据版本"}</span>
            <small>{basisReady ? "当前 run 已绑定可用依据版本。" : "先完成依据确认与发布，再进入稳定复核。"}</small>
          </div>
          <div className="opening-governance-summary-card">
            <strong>{masterDataReady ? "主数据已就绪" : "主数据待确认"}</strong>
            <span>{currentRunFacts.length} 项当前 run 事实</span>
            <small>{masterDataReady ? "当前 run 所需主数据已具备可用状态。" : "仍有主数据候选需要人工确认或发布。"}</small>
          </div>
          <div className="opening-governance-summary-card">
            <strong>{knowledgeBaseReady ? "知识库已就绪" : "知识库待完善"}</strong>
            <span>{boundKnowledgeBase?.label ?? "当前 run 未绑定知识库"}</span>
            <small>
              {knowledgeBaseReady
                ? "当前知识库已具备正式核查支撑条件。"
                : readiness?.nextAction ?? "需要先完成知识库绑定或同步。"}
            </small>
          </div>
          <div className="opening-governance-summary-card">
            <strong>当前 run</strong>
            <span>{pilotTask?.id ?? "unbound"}</span>
            <small>{blockingReasons.length > 0 ? blockingReasons.join(" / ") : "当前无额外门禁阻塞说明。"}</small>
          </div>
        </div>
      </section>

      <section className="opening-panel opening-panel-wide">
        <div className="section-title row">
          <div>
            <span className="eyebrow" data-governance-snapshot="current-run-binding">Current Run Snapshot</span>
            <h2>当前 run 绑定快照</h2>
          </div>
        </div>
        <small data-governance-semantics="preview-is-not-published">
          Preview 仅表示候选事实；只有人工确认并完成发布/批准后，资产才可用于正式核查。
        </small>
        <div className="opening-governance-section-grid">
          <article className="opening-governance-card">
            <strong>对象上下文</strong>
            <div className="opening-report-chip-row">
              <span className="opening-report-chip tone-info">{packet.workspaceContext.projectCode}</span>
              <span className="opening-report-chip tone-muted">{reviewObjectLabel}</span>
            </div>
            <p>{packet.workspaceContext.projectName}</p>
            <small>{packet.workspaceContext.reviewObjectName}</small>
            <small>{packet.workspaceContext.participantEntityName}</small>
          </article>

          <article className="opening-governance-card">
            <strong>依据快照</strong>
            {basisSnapshot ? (
              <>
                <div className="opening-report-chip-row">
                  <span className={`opening-report-chip tone-${basisSnapshot.meta.tone}`}>{basisSnapshot.meta.label}</span>
                  <span className="opening-report-chip tone-info">{basisSnapshot.category}</span>
                </div>
                <p>{basisSnapshot.title}</p>
                <small>{basisSnapshot.secondary}</small>
                <small>{basisSnapshot.note}</small>
              </>
            ) : (
              <>
                <p>当前 run 暂未绑定正式依据版本。</p>
                <small>请先完成依据确认与发布，再让正式核查稳定引用。</small>
              </>
            )}
          </article>

          <article className="opening-governance-card">
            <strong>主数据快照</strong>
            <p>{currentRunFacts.length} 项事实已进入当前 run</p>
            <small>
              {currentRunFacts.length > 0
                ? currentRunFacts.map((item) => `${item.category}：${item.title}`).join(" / ")
                : "当前 run 未记录明确的主数据事实，请先确认资料识别结果。"}
            </small>
          </article>

          <article className="opening-governance-card">
            <strong>知识库快照</strong>
            <div className="opening-report-chip-row">
              <span className={`opening-report-chip tone-${knowledgeBaseReady ? "success" : "warning"}`}>
                {knowledgeBaseReady ? "已就绪" : "待完善"}
              </span>
              <span className="opening-report-chip tone-muted">{boundKnowledgeBase?.providerSyncStatus ?? "unknown"}</span>
            </div>
            <p>{boundKnowledgeBase?.label ?? "未绑定知识库"}</p>
            <small>{boundKnowledgeBase?.summary ?? "当前 run 还没有稳定知识库摘要。"}</small>
          </article>
        </div>
        <div className="opening-governance-list" data-governance-detail="bound-asset-status">
          <div className="opening-governance-item" data-governance-asset="basis">
            <div className="opening-report-finding-header">
              <strong>Current-run basis binding</strong>
              <span className={`opening-report-chip tone-${basisSnapshot?.meta.tone ?? "warning"}`}>
                {basisSnapshot?.meta.label ?? "Binding record missing"}
              </span>
            </div>
            <p>{basisSnapshot?.title ?? pilotTask?.basisVersion?.id ?? "No basis binding recorded"}</p>
            <small>
              Formal match usability:{" "}
              {basisSnapshot?.meta.group === "published" ? "usable (published)" : "blocked until published"}
            </small>
            {basisSnapshot?.preview && (
              <small>
                Preview status: {basisPreviewStatusLabels[basisSnapshot.preview.status] ?? basisSnapshot.preview.status} /{" "}
                Confidence: {basisSnapshot.preview.confidence} / Missing:{" "}
                {basisSnapshot.preview.missingFields.length > 0 ? basisSnapshot.preview.missingFields.join(", ") : "none"} / Next:{" "}
                {basisSnapshot.preview.nextAction}
              </small>
            )}
            {missingBoundBasis && <small>Next action: restore the bound basis record or reinitialize this run.</small>}
          </div>

          <div className="opening-governance-item" data-governance-asset="master-data">
            <div className="opening-report-finding-header">
              <strong>Current-run master-data bindings</strong>
              <span className="opening-report-chip tone-info">{currentRunFacts.length} resolved</span>
            </div>
            {currentRunFacts.map((item) => (
              <div key={item.id} className="opening-report-detail-list">
                <small>
                  <strong>{item.title}</strong>
                  {item.category} / {item.meta.label} /{" "}
                  {item.meta.group === "published" || item.meta.group === "current_run_confirmed"
                    ? "usable for formal match"
                    : "not usable for formal match"}
                </small>
                <small>
                  Evidence:{" "}
                  {item.masterPreview
                    ? summarizeMasterDataPreviewSources(item.masterPreview)
                    : item.safeNote ?? item.note ?? "No safe evidence summary"}
                </small>
                <small>
                  Next: {item.nextAction ?? item.masterPreview?.nextAction ?? item.meta.description}
                </small>
              </div>
            ))}
            {missingCurrentRunMasterData.length > 0 && (
              <small data-governance-missing="master-data">
                Missing bound records: {missingCurrentRunMasterData.map((item) => item.label).join(", ")}. Formal matching remains blocked.
              </small>
            )}
            {currentRunFacts.length === 0 && missingCurrentRunMasterData.length === 0 && (
              <small>No task-bound master-data facts recorded for this run.</small>
            )}
          </div>

          <div className="opening-governance-item" data-governance-asset="knowledge-base">
            <div className="opening-report-finding-header">
              <strong>Current-run knowledge-base binding</strong>
              <span className={`opening-report-chip tone-${knowledgeBaseReady ? "success" : "warning"}`}>
                {knowledgeBaseReady ? "usable for formal match" : "not ready"}
              </span>
            </div>
            <p>{boundKnowledgeBase?.label ?? boundKnowledgeBaseId ?? "No knowledge-base binding recorded"}</p>
            <small>
              Provider sync: {boundKnowledgeBase?.providerSyncStatus ?? "unknown"} /{" "}
              {boundKnowledgeBase?.summary ?? readiness?.nextAction ?? "Resolve the knowledge-base binding before formal matching."}
            </small>
          </div>
        </div>
      </section>

      <OpeningConditionRerunAssetDiffPanel
        diff={rerunAssetDiff}
        eyebrow="Governance Diff"
        title="当前 run 复用快照"
        description="治理页从目录视角说明：当前 run 实际消费了哪些复用资产，哪些变化项还需要你处理。"
      />
      <section className="opening-condition-grid">
        <article className="opening-panel">
          <span className="eyebrow">Basis Queue</span>
          <h2>依据待人工确认</h2>
          {renderGovernanceList(
            basisPending,
            "当前没有待人工确认的依据候选。",
            "继续上传新依据后，新的候选会进入这里等待确认。",
          )}
        </article>

        <article className="opening-panel">
          <span className="eyebrow">Basis Queue</span>
          <h2>依据待发布</h2>
          {renderGovernanceList(
            basisReadyToPublish,
            "当前没有待发布的依据版本。",
            "人工确认后的依据版本会进入这里，发布后才能稳定供 run 使用。",
          )}
        </article>

        <article className="opening-panel">
          <span className="eyebrow">Master Data Queue</span>
          <h2>主数据待人工确认</h2>
          {renderGovernanceList(
            masterPending,
            "当前没有待人工确认的主数据候选。",
            "识别出的人员、设备、证照和制度资料候选会先进入这里。",
          )}
        </article>

        <article className="opening-panel">
          <span className="eyebrow">Master Data Queue</span>
          <h2>主数据待发布 / 已人工确认</h2>
          {renderGovernanceList(
            masterReadyToPublish,
            "当前没有待发布的主数据事实。",
            "人工确认后的主数据会进入这里，后续可发布为正式目录。",
          )}
        </article>
      </section>

      <section className="opening-condition-grid">
        <article className="opening-panel">
          <span className="eyebrow">Published Catalog</span>
          <h2>已发布依据目录</h2>
          {renderGovernanceList(
            basisPublished,
            "当前工作区还没有已发布依据版本。",
            "完成依据确认并发布后，这里会成为当前对象可复用的依据目录。",
          )}
        </article>

        <article className="opening-panel">
          <span className="eyebrow">Published Catalog</span>
          <h2>已发布主数据目录</h2>
          {renderGovernanceList(
            masterPublished,
            "当前工作区还没有已发布主数据。",
            "完成主数据确认与发布后，这里会沉淀可复用的正式事实目录。",
          )}
        </article>
      </section>

      <section className="opening-condition-grid">
        <article className="opening-panel">
          <span className="eyebrow">Exception Records</span>
          <h2>依据异常记录</h2>
          {renderGovernanceList(
            basisExceptions,
            "当前没有依据异常记录。",
            "被替代或驳回的依据版本会保留在这里，方便后续追溯。",
          )}
        </article>

        <article className="opening-panel">
          <span className="eyebrow">Exception Records</span>
          <h2>主数据异常记录</h2>
          {renderGovernanceList(
            masterExceptions,
            "当前没有主数据异常记录。",
            "被驳回或已过期的主数据会保留在这里，避免混入正式目录。",
          )}
        </article>
      </section>
    </div>
  );
}

function buildChecklistRows(packet: OpeningConditionReviewPacket, pilotTask?: OpeningConditionPilotTask | null) {
  if (pilotTask?.checkItems.length) {
    const evidenceById = new Map(pilotTask.evidence.map((item) => [item.id, item]));
    const humanReviewByTargetId = new Map<string, OpeningConditionPilotHumanReviewItem[]>();
    pilotTask.humanReviewQueue.forEach((item) => {
      const current = humanReviewByTargetId.get(item.targetId) ?? [];
      current.push(item);
      humanReviewByTargetId.set(item.targetId, current);
    });

    return pilotTask.checkItems.map((item) => ({
      id: item.id,
      title: item.name,
      category: item.subCategory ? `${item.category} / ${item.subCategory}` : item.category,
      required: item.required ? "required" : "optional",
      scope: item.scopeStatus ?? "in_scope",
      status: item.documentPresence ?? "unknown",
      verdict: item.finalDisposition ?? item.verdict,
      evidence: item.evidenceIds
        .map((evidenceId) => {
          const evidence = evidenceById.get(evidenceId);
          return evidence ? `${evidence.objectRef.fileName}${evidence.locator ? ` @ ${evidence.locator}` : ""}` : evidenceId;
        })
        .join(" / "),
      reason: item.semanticNote ?? item.ruleExplanation,
      humanReview: (humanReviewByTargetId.get(item.id) ?? []).map((review) => `${review.status}: ${review.reason}`).join(" / "),
    }));
  }

  const checklistDefinition: OpeningConditionPilotChecklistDefinitionItem[] = pilotTask?.checklistDefinition ?? [];
  if (checklistDefinition.length) {
    return checklistDefinition.map((item) => ({
      id: item.id,
      title: item.name,
      category: item.subCategory ? `${item.category} / ${item.subCategory}` : item.category,
      required: item.required ? "required" : "optional",
      scope: item.scopeStatus ?? "in_scope",
      status: "pending_formal_match",
      verdict: "pending_formal_match",
      evidence: item.expectedEvidenceHints.join(" / "),
      reason: "待正式核查",
      humanReview: "",
    }));
  }

  return packet.checkItems.map((item) => ({
    id: item.id,
    title: item.content,
    category: item.subCategory ? `${item.category} / ${item.subCategory}` : item.category,
    required: item.mandatory ? "required" : "optional",
    scope: item.scopeStatus ?? "in-scope",
    status: item.documentPresence ?? "unknown",
    verdict: item.finalDisposition ?? item.verdict,
    evidence: item.evidenceIds.join(" / "),
    reason: item.semanticNote ?? item.ruleExplanation,
    humanReview: item.humanReviewIds.join(" / "),
  }));
}

function OpeningConditionCheckTasksPage({
  packet,
  pilotTask,
  focusedCheckItemId,
  onClearFocusedCheckItem,
  focusedReturnLabel,
  onReturnToFocusedOrigin,
}: {
  packet: OpeningConditionReviewPacket;
  pilotTask?: OpeningConditionPilotTask | null;
  focusedCheckItemId?: string | null;
  onClearFocusedCheckItem?: () => void;
  focusedReturnLabel?: string | null;
  onReturnToFocusedOrigin?: () => void;
}) {
  const rows = buildChecklistRows(packet, pilotTask);
  const focusedRow = focusedCheckItemId ? rows.find((row) => row.id === focusedCheckItemId) ?? null : null;

  return (
    <section className="opening-panel opening-panel-wide">
      <span className="eyebrow">Checklist Matrix</span>
      <h2>Checklist-driven match status for the current run</h2>
      <div className="opening-condition-meta">
        <span>Manifest {pilotTask?.trialPackage?.diagnostics.inventoryEntryCount ?? 0}</span>
        <span>Evidence {pilotTask?.trialPackage?.matching.evidenceCount ?? 0}</span>
        <span>Human review {pilotTask?.trialPackage?.humanReview.blockingCount ?? 0}</span>
      </div>
      {focusedCheckItemId && (
        <div className="opening-focused-context-banner">
          <div>
            <strong>{focusedRow ? `当前聚焦核查项：${focusedRow.title}` : "当前聚焦核查项未在本轮找到"}</strong>
            <span>{focusedRow ? `${focusedRow.category} | ${focusedRow.id}` : focusedCheckItemId}</span>
          </div>
          <div className="dialog-actions compact">
            {onReturnToFocusedOrigin && focusedReturnLabel && (
              <button type="button" className="secondary" onClick={onReturnToFocusedOrigin}>
                返回{focusedReturnLabel}
              </button>
            )}
            {onClearFocusedCheckItem && (
              <button type="button" className="secondary" onClick={onClearFocusedCheckItem}>
                取消聚焦
              </button>
            )}
          </div>
        </div>
      )}
      <div className="opening-record-list">
        {rows.map((row) => (
          <div key={row.id} className={row.id === focusedCheckItemId ? "opening-record-focused" : undefined}>
            <strong>{row.title}</strong>
            <span>{row.category} | {row.id}</span>
            <p>
              {row.required} | {row.scope} | {row.status} | {row.verdict}
            </p>
            <small>{row.reason}</small>
            {row.evidence && <small>Matched / Expected: {row.evidence}</small>}
            <small>{row.humanReview || "No human review item linked for this row."}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

function OpeningConditionHumanReviewQueuePage({
  packet,
  pilotTask,
  pilotBusy,
  onReviewDecision,
  onCompleteHumanReview,
  onGoToPage,
  focusedHumanReviewId,
  onClearFocusedHumanReview,
  focusedReturnLabel,
  onReturnToFocusedOrigin,
}: {
  packet: OpeningConditionReviewPacket;
  pilotTask?: OpeningConditionPilotTask | null;
  pilotBusy?: boolean;
  onReviewDecision?: (reviewId: string, decision: "confirm" | "correct" | "reject" | "defer", safeNote?: string) => void;
  onCompleteHumanReview?: (safeNote?: string) => void;
  onGoToPage?: (page: OpeningConditionPortalPage) => void;
  focusedHumanReviewId?: string | null;
  onClearFocusedHumanReview?: () => void;
  focusedReturnLabel?: string | null;
  onReturnToFocusedOrigin?: () => void;
}) {
  const queue = pilotTask?.humanReviewQueue ?? [];
  const evidenceById = new Map((pilotTask?.evidence ?? []).map((item) => [item.id, item]));
  const checkItemsById = new Map((pilotTask?.checkItems ?? []).map((item) => [item.id, item]));
  const definitionsById = new Map((pilotTask?.checklistDefinition ?? []).map((item) => [item.id, item]));
  const actionOwnership = deriveOpeningConditionRunActionOwnership({ pilotTask });
  const pendingQueue = queue.filter((item) => item.status === "open");
  const deferredQueue = queue.filter((item) => item.status === "deferred");
  const resolvedQueue = queue.filter((item) => item.status !== "open" && item.status !== "deferred");
  const blockingReviewCount = pendingQueue.length + deferredQueue.length;
  const canCompleteHumanReview = Boolean(pilotTask && queue.length > 0 && blockingReviewCount === 0 && !pilotBusy);
  const focusedReviewItem = focusedHumanReviewId ? queue.find((item) => item.id === focusedHumanReviewId) ?? null : null;

  function renderQueueItem(item: OpeningConditionPilotHumanReviewItem) {
    const fallbackContext = checkItemsById.get(item.targetId) ?? definitionsById.get(item.targetId);
    const evidenceSummary = item.evidenceIds
      .map((evidenceId) => {
        const evidence = evidenceById.get(evidenceId);
        return evidence ? `${evidence.objectRef.fileName}${evidence.locator ? ` @ ${evidence.locator}` : ""}` : evidenceId;
      })
      .join(" / ");

    return (
      <div
        key={item.id}
        className={
          item.id === focusedHumanReviewId
            ? "opening-human-review-item opening-review-focused"
            : "opening-human-review-item"
        }
      >
        <strong>{item.targetLabel ?? fallbackContext?.name ?? item.targetId}</strong>
        <span>
          {(item.category ?? fallbackContext?.category ?? "未分类")}
          {(item.subCategory ?? fallbackContext?.subCategory) ? ` / ${item.subCategory ?? fallbackContext?.subCategory}` : ""} | {item.status}
        </span>
        <p>{item.reason}</p>
        {item.ruleExplanation && <small>核查规则：{item.ruleExplanation}</small>}
        {item.expectedEvidenceHints && item.expectedEvidenceHints.length > 0 && (
          <small>期望资料：{item.expectedEvidenceHints.join(" / ")}</small>
        )}
        {evidenceSummary && <small>关联证据：{evidenceSummary}</small>}
        {item.safeNote && <small>{item.safeNote}</small>}
        {onReviewDecision && (item.status === "open" || item.status === "deferred") && (
          <div className="dialog-actions">
            <button type="button" className="primary" onClick={() => onReviewDecision(item.id, "confirm")} disabled={pilotBusy}>
              确认通过
            </button>
            <button type="button" className="secondary" onClick={() => onReviewDecision(item.id, "correct")} disabled={pilotBusy}>
              修正结论
            </button>
            <button type="button" className="secondary" onClick={() => onReviewDecision(item.id, "defer")} disabled={pilotBusy}>
              延期处理
            </button>
            <button type="button" className="danger subtle" onClick={() => onReviewDecision(item.id, "reject")} disabled={pilotBusy}>
              驳回整改
            </button>
          </div>
        )}
      </div>
    );
  }

  const groups = [
    {
      key: "pending",
      title: "待处理复核",
      description: "这些事项仍阻塞报告生成，需要监理给出确认、修正、延期或驳回结论。",
      items: pendingQueue,
    },
    {
      key: "deferred",
      title: "延期但仍阻塞",
      description: "这些事项暂缓处理，但在关闭前仍应视为报告交付阻塞项。",
      items: deferredQueue,
    },
    {
      key: "resolved",
      title: "已处理留痕",
      description: "这些事项已经形成处理结论，作为本轮人工复核证据留存。",
      items: resolvedQueue,
    },
  ];

  return (
    <section className="opening-panel opening-panel-wide">
      <span className="eyebrow">Human Review</span>
      <h2>人工复核工作台</h2>
      <div className="opening-condition-meta">
        <span>待处理 {pendingQueue.length}</span>
        <span>延期阻塞 {deferredQueue.length}</span>
        <span>已处理 {resolvedQueue.length}</span>
        <span>报告 {pilotTask?.trialPackage?.reportStatus ?? "missing"}</span>
      </div>
      {focusedHumanReviewId && (
        <div className="opening-focused-context-banner">
          <div>
            <strong>
              {focusedReviewItem
                ? `当前聚焦复核项：${focusedReviewItem.targetLabel ?? focusedReviewItem.targetId}`
                : "当前聚焦复核项未在本轮找到"}
            </strong>
            <span>{focusedReviewItem ? `${focusedReviewItem.category ?? "未分类"} | ${focusedReviewItem.id}` : focusedHumanReviewId}</span>
          </div>
          <div className="dialog-actions compact">
            {onReturnToFocusedOrigin && focusedReturnLabel && (
              <button type="button" className="secondary" onClick={onReturnToFocusedOrigin}>
                返回{focusedReturnLabel}
              </button>
            )}
            {onClearFocusedHumanReview && (
              <button type="button" className="secondary" onClick={onClearFocusedHumanReview}>
                取消聚焦
              </button>
            )}
          </div>
        </div>
      )}
      <OpeningConditionResponsibilityBoard summary={actionOwnership} onNavigate={onGoToPage} />
      <OpeningConditionActionOwnershipSummary
        summary={actionOwnership}
        eyebrow="Human Review Ownership"
        title="人工复核责任"
        description="先关闭待处理和延期复核项，再进入报告生成、归档和下一轮整改复审。"
      />
      {queue.length > 0 ? (
        <>
          {groups.map((group) => (
            <div key={group.key} className="opening-record-list opening-human-review-group">
              <div>
                <strong>{group.title}</strong>
                <span>{group.items.length} 项</span>
                <p>{group.description}</p>
              </div>
              {group.items.length > 0 ? group.items.map(renderQueueItem) : <div><small>当前分组暂无复核项。</small></div>}
            </div>
          ))}
          <div className="opening-human-review-complete">
            <div>
              <strong>完成人工复核</strong>
              <p>
                {blockingReviewCount > 0
                  ? `仍有 ${blockingReviewCount} 项待处理或延期复核项，暂不能进入最终报告生成。`
                  : "所有问题项已完成人工判断，可以继续进入最终报告生成节点。"}
              </p>
            </div>
            <button
              type="button"
              className="primary"
              disabled={!canCompleteHumanReview}
              onClick={() => onCompleteHumanReview?.()}
            >
              完成人工复核并生成报告
            </button>
          </div>
        </>
      ) : (
        <div className="opening-record-list">
          {packet.humanReviewQueue.map((item) => (
            <div key={item.id}>
              <strong>{item.targetId}</strong>
              <span>{item.trigger}</span>
              <p>{item.reason}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function buildReportFindings(pilotTask?: OpeningConditionPilotTask | null): ReportFinding[] {
  if (!pilotTask) {
    return [];
  }

  const packagedFindings = pilotTask.reportAsset?.packageDiagnostics?.findings ?? [];
  if (packagedFindings.length > 0) {
    return packagedFindings.map((finding) => ({
      id: finding.id,
      title: finding.title,
      category: finding.subCategory ? `${finding.category} / ${finding.subCategory}` : finding.category,
      severity: finding.riskLevel,
      severityLabel: finding.riskLevel === "high" ? "高风险" : finding.riskLevel === "medium" ? "中风险" : "提示项",
      severityTone: finding.riskLevel === "high" ? "danger" : finding.riskLevel === "medium" ? "warning" : "info",
      disposition: finding.disposition,
      dispositionLabel: getFindingDispositionLabel(finding.disposition),
      dispositionTone: getFindingDispositionTone(finding.disposition),
      statusLabel: finding.required ? "必查项" : "补充关注项",
      description: finding.description,
      basis: summarizeLegalBasisReferences(finding.legalBasis),
      rectification: finding.rectificationRequirement,
      evidence: finding.evidenceLabels ?? [],
      humanReview: finding.humanReviewLabels ?? [],
    }));
  }

  const evidenceById = new Map<string, OpeningConditionPilotEvidence>(pilotTask.evidence.map((item) => [item.id, item]));
  const reviewByTargetId = buildRunSnapshotHumanReviewMap(pilotTask.humanReviewQueue);
  const latestReviewByTargetId = buildLatestHumanReviewMap(pilotTask.humanReviewQueue);

  return pilotTask.checkItems
    .filter((item) => isProblemCheckItem(item, latestReviewByTargetId.get(item.id)))
    .map((item) => {
      const latestReview = latestReviewByTargetId.get(item.id);
      const disposition = getRunSnapshotCheckItemDisposition(item, latestReview);
      const severity =
        disposition === "blocked" || (item.required && (disposition === "fail" || disposition === "reject"))
          ? "high"
          : disposition === "fail" || disposition === "reject" || disposition === "needs_human_review"
            ? "medium"
            : "low";

      return {
        id: item.id,
        title: item.name,
        category: item.subCategory ? `${item.category} / ${item.subCategory}` : item.category,
        severity,
        severityLabel:
          severity === "high" ? "高风险" : severity === "medium" ? "中风险" : "提示项",
        severityTone: severity === "high" ? "danger" : severity === "medium" ? "warning" : "info",
        disposition,
        dispositionLabel: getFindingDispositionLabel(disposition),
        dispositionTone: getFindingDispositionTone(disposition),
        statusLabel: item.required ? "必查项" : "补充关注项",
        description: item.semanticNote ?? item.ruleExplanation,
        basis: item.basisVersionId,
        rectification:
          disposition === "reject" || item.documentPresence === "missing"
            ? "补齐对应资料后重新提交复审。"
            : disposition === "blocked"
              ? "先解决前置依据或授权边界阻塞，再重新发起复审。"
              : disposition === "needs_human_review"
                ? "由监理完成人工判断后，再决定是否补件或放行。"
              : "按核查依据补正资料内容后重新提交。",
        evidence: item.evidenceIds
          .map((evidenceId) => {
            const evidence = evidenceById.get(evidenceId);
            return evidence ? `${evidence.objectRef.fileName}${evidence.locator ? ` @ ${evidence.locator}` : ""}` : evidenceId;
          })
          .slice(0, 3),
        humanReview: (reviewByTargetId.get(item.id) ?? []).map((review) => `${getHumanReviewStatusLabel(review.status)}：${review.reason}`),
      };
    });
}

function buildReportFindingGroups(findings: ReportFinding[]): ReportFindingGroup[] {
  const blocked = findings.filter((item) => item.disposition === "blocked");
  const failed = findings.filter((item) => item.disposition === "fail" || item.disposition === "reject");
  const pendingHuman = findings.filter((item) => item.disposition === "needs_human_review");
  const warning = findings.filter((item) => item.disposition === "warning");

  const groups: ReportFindingGroup[] = [
    {
      id: "blocked",
      title: "Blocking issues",
      description: "Resolve gate or scope blockers before the next formal review.",
      tone: "danger",
      findings: blocked,
    },
    {
      id: "failed",
      title: "Failed and rectification required",
      description: "These items still need supplementary files or corrected evidence.",
      tone: "warning",
      findings: failed,
    },
    {
      id: "pendingHuman",
      title: "Pending human judgement",
      description: "A supervisor still needs to confirm whether the evidence is acceptable.",
      tone: "info",
      findings: pendingHuman,
    },
    {
      id: "warning",
      title: "Warnings and follow-up",
      description: "These items are not blocking now, but should be tracked in the next round.",
      tone: "muted",
      findings: warning,
    },
  ];
  return groups.filter((group) => group.findings.length > 0);
}

function getClosureCategoryLabel(category: RectificationClosureCategory) {
  switch (category) {
    case "rectified":
      return "已整改";
    case "carried_over":
      return "仍未整改";
    case "newly_added":
      return "本轮新增";
    case "pending_human_review":
      return "待人工判断";
  }
}

function getClosureCategoryTone(category: RectificationClosureCategory): ReportFinding["dispositionTone"] {
  switch (category) {
    case "rectified":
      return "success";
    case "carried_over":
      return "danger";
    case "newly_added":
      return "warning";
    case "pending_human_review":
      return "info";
  }
}

function getFindingDispositionLabel(disposition: string) {
  switch (disposition) {
    case "blocked":
      return "阻塞，暂不能放行";
    case "fail":
      return "不通过，需补件整改";
    case "needs_human_review":
      return "待人工判断";
    case "warning":
      return "提示关注";
    case "pass":
      return "通过";
    case "not_applicable":
      return "本轮不适用";
    case "missing_in_current_run":
      return "本轮未再列为问题";
    case "confirm":
      return "人工确认";
    case "correct":
      return "人工修正";
    case "reject":
      return "人工驳回";
    case "defer":
      return "延期处理";
    default:
      return disposition;
  }
}

function getFindingDispositionTone(disposition: string): ReportFinding["dispositionTone"] {
  switch (disposition) {
    case "blocked":
    case "fail":
    case "reject":
      return "danger";
    case "needs_human_review":
    case "warning":
    case "defer":
      return "warning";
    case "pass":
    case "confirm":
    case "correct":
      return "success";
    default:
      return "muted";
  }
}

function getHumanReviewStatusLabel(status: string) {
  switch (status) {
    case "confirmed":
      return "人工确认";
    case "corrected":
      return "人工修正";
    case "rejected":
      return "人工驳回";
    case "deferred":
      return "延期处理";
    case "open":
      return "待处理";
    default:
      return status;
  }
}

function getTaskConclusionLabel(task?: OpeningConditionPilotTask | null) {
  if (!task) {
    return "暂无任务";
  }
  if (task.reportAsset?.status === "ready") {
    return "已形成报告";
  }
  if (task.state === "archived") {
    return "已归档";
  }
  if (task.state === "awaiting_human_review") {
    return "待人工复核";
  }
  if (task.state === "report_ready") {
    return "可生成报告";
  }
  return task.state;
}

type HiddenPilotRunAudit = {
  taskId: string;
  hiddenAt: string;
  reason: string;
};

function getHiddenRunStorageKey(workspaceId: string) {
  return `opening-condition.hidden-runs.${workspaceId}`;
}

function readHiddenPilotRunAudits(workspaceId: string): HiddenPilotRunAudit[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const rawValue = window.localStorage.getItem(getHiddenRunStorageKey(workspaceId));
    const parsed = rawValue ? JSON.parse(rawValue) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item?.taskId === "string") : [];
  } catch {
    return [];
  }
}

function writeHiddenPilotRunAudits(workspaceId: string, audits: HiddenPilotRunAudit[]) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(getHiddenRunStorageKey(workspaceId), JSON.stringify(audits));
}

function OpeningConditionReportDeliveryWorkbench({
  packet,
  pilotTask,
  workspaceTasks,
  pilotBusy,
  reportExportStatus,
  reportDownloadUrl,
  onGenerateReport,
  onExportReport,
  onArchive,
  onStartRectificationRerun,
  onFocusCheckItem,
  onFocusHumanReview,
}: {
  packet: OpeningConditionReviewPacket;
  pilotTask?: OpeningConditionPilotTask | null;
  workspaceTasks?: OpeningConditionPilotTask[];
  pilotBusy?: boolean;
  reportExportStatus?: string;
  reportDownloadUrl?: string;
  onGenerateReport?: () => void;
  onExportReport?: (taskId: string) => void;
  onArchive?: () => void;
  onStartRectificationRerun?: () => void;
  onFocusCheckItem?: (checkItemId: string) => void;
  onFocusHumanReview?: (reviewId: string) => void;
}) {
  const [hiddenRunAudits, setHiddenRunAudits] = useState<HiddenPilotRunAudit[]>(() =>
    readHiddenPilotRunAudits(packet.workspaceId),
  );
  const hiddenRunIds = new Set(hiddenRunAudits.map((item) => item.taskId));
  const [selectedHistoryTaskId, setSelectedHistoryTaskId] = useState<string | null>(null);
  const runSnapshot = deriveOpeningConditionRunSnapshot({
    workspaceTasks,
    pilotTask,
    selectedHistoryTaskId,
    hiddenRunIds,
  });
  const blockingReviewCount = Number(runSnapshot.blockingReviewCount ?? 0);
  const historyTasks = runSnapshot.historyTasks;
  const selectedTask = runSnapshot.selectedTask;
  const reportAsset = selectedTask?.reportAsset;
  const packageDiagnostics = reportAsset?.packageDiagnostics;
  const runRoundMap = runSnapshot.runRoundMap;
  const currentRound = runSnapshot.currentRound;
  const findings = buildReportFindings(selectedTask);
  const findingGroups = buildReportFindingGroups(findings);
  const unresolvedReviewByTargetId = new Map(
    (selectedTask?.humanReviewQueue ?? [])
      .filter((item) => item.status === "open" || item.status === "deferred")
      .map((item) => [item.targetId, item]),
  );
  const rectificationDeliveryRows = buildReportRectificationDeliveryRows(findings);
  const issueClosureSummary = buildOpeningConditionIssueClosureSummary({
    findings,
    humanReviewQueue: selectedTask?.humanReviewQueue,
    rectificationDeliveryRows,
    taskState: selectedTask?.state,
    reportReady: reportAsset?.status === "ready",
  });
  const closureDiff = runSnapshot.closureDiff;
  const previousRun = runSnapshot.previousRun;
  const decisionLedger = packageDiagnostics?.decisionLedger ?? [];
  const issueTypeSummary = packageDiagnostics?.summaryByIssueType ?? [];
  const nextRectificationAdvice = packageDiagnostics?.nextRectificationAdvice;
  const deliveryHandoff = packageDiagnostics?.deliveryHandoff;
  const exportHandoff = packageDiagnostics?.exportHandoff;
  const isCurrentRun = runSnapshot.isCurrentRun;
  const selectedActionOwnership = deriveOpeningConditionRunActionOwnership({ pilotTask: selectedTask });
  const findingSummary = {
    blocked: findings.filter((item) => item.disposition === "blocked").length,
    failed: findings.filter((item) => item.disposition === "fail" || item.disposition === "reject").length,
    pendingHuman: findings.filter((item) => item.disposition === "needs_human_review").length,
    warning: findings.filter((item) => item.disposition === "warning").length,
  };
  const deliveryPackage =
    packageDiagnostics?.deliveryPackage ??
    buildOpeningConditionReportDeliveryPackage({
      task: selectedTask,
      rows: rectificationDeliveryRows,
      blockingCount: blockingReviewCount,
      pendingHumanReviewCount: findingSummary.pendingHuman,
      adapterStatus: exportHandoff?.status,
      generatedAt: packageDiagnostics?.generatedAt,
    });
  const canGenerateReport = Boolean(
    pilotTask && selectedTask?.id === pilotTask.id && pilotTask.state === "report_ready" && blockingReviewCount === 0 && !reportAsset,
  );
  const canStartRectificationRerun = Boolean(onStartRectificationRerun && runSnapshot.canStartRectificationRerun);

  function hideHistoryRun(taskId: string) {
    const nextAudits = [
      ...hiddenRunAudits.filter((item) => item.taskId !== taskId),
      {
        taskId,
        hiddenAt: new Date().toISOString(),
        reason: "operator_hidden_test_or_mistaken_run",
      },
    ];
    setHiddenRunAudits(nextAudits);
    writeHiddenPilotRunAudits(packet.workspaceId, nextAudits);
    if (selectedHistoryTaskId === taskId) {
      setSelectedHistoryTaskId(null);
    }
  }

  return (
    <section className="opening-panel opening-panel-report opening-panel-wide">
      <span className="eyebrow">报告交付工作台</span>
      <h2>{reportAsset?.title ?? packet.reportSummary.title}</h2>
      <p>
        {reportAsset
          ? `平台报告资产已生成：共 ${reportAsset.summary.total} 项，符合 ${reportAsset.summary.passed} 项，不符合 ${reportAsset.summary.failed} 项，待复核 ${reportAsset.summary.humanReview} 项。`
          : packet.reportSummary.conclusion}
      </p>
      <div className="opening-condition-meta">
        <span>{packet.workspaceContext.contractPackage}</span>
        <span>{packet.boundBasisSetVersionId ?? "未绑定依据版本"}</span>
        <span>{reportAsset?.status ?? "待生成报告"}</span>
      </div>
      <strong>{reportAsset ? "报告资产来自平台后端试点任务记录。" : packet.reportSummary.nextAction}</strong>
      <small>{reportAsset?.disclaimer ?? packet.reportSummary.disclaimer}</small>
      {reportAsset?.markdownContent ? <OpeningConditionMarkdownReport markdown={reportAsset.markdownContent} /> : null}

      {selectedTask && (
        <div className="opening-report-workbench">
          <div className="opening-report-workbench-header">
            <div>
              <span className="eyebrow">Selected Run</span>
              <h3>{isCurrentRun ? "当前查看轮次" : "历史轮次详情"}</h3>
              <p>
                {isCurrentRun
                  ? "以当前 run 为中心查看结论、问题项和唯一整改复审入口。"
                  : "这是历史只读快照，用来对比上一轮与本轮的整改变化。"}
              </p>
            </div>
            <div className="opening-report-chip-row">
              <span className={`opening-report-chip tone-${isCurrentRun ? "info" : "muted"}`}>
                {isCurrentRun ? "当前 run" : "历史只读"}
              </span>
              {currentRound ? <span className="opening-report-chip tone-muted">第 {currentRound} 轮</span> : null}
              <span className={`opening-report-chip tone-${selectedTask.state === "archived" ? "success" : "warning"}`}>
                {getTaskConclusionLabel(selectedTask)}
              </span>
              <span className="opening-report-chip tone-muted">任务 {selectedTask.id}</span>
            </div>
          </div>

          <OpeningConditionActionOwnershipSummary
            summary={selectedActionOwnership}
            eyebrow={isCurrentRun ? "Current Run Ownership" : "Historical Run Snapshot"}
            title={isCurrentRun ? "当前轮次责任与下一动作" : "历史轮次责任快照"}
            description={
              isCurrentRun
                ? "报告页是试点交付工作台。这里要回答当前轮次的结论、还差什么、以及下一步从哪里唯一发起。"
                : "历史轮次只保留当时的责任边界与处理语义，便于复盘和对比，不再提供直接变更入口。"
            }
          />

          <OpeningConditionMvpAcceptanceSnapshotPanel snapshot={packageDiagnostics?.mvpAcceptance} />

          {deliveryHandoff && (
            <div className="opening-report-delivery-handoff">
              <div className="opening-report-finding-header">
                <div>
                  <span className="eyebrow">Delivery Handoff</span>
                  <strong>{deliveryHandoff.statusLabel}</strong>
                </div>
                <div className="opening-report-chip-row">
                  <span className={`opening-report-chip tone-${deliveryHandoff.readOnly ? "muted" : deliveryHandoff.blockingCount > 0 ? "warning" : "success"}`}>
                    {deliveryHandoff.readOnly ? "只读历史" : "当前交付"}
                  </span>
                  <span className="opening-report-chip tone-info">{deliveryHandoff.currentOwner}</span>
                  {deliveryHandoff.blockingCount > 0 && (
                    <span className="opening-report-chip tone-warning">阻塞 {deliveryHandoff.blockingCount} 项</span>
                  )}
                </div>
              </div>
              <div className="opening-report-context-grid">
                <div className="opening-action-summary-item">
                  <strong>下一动作</strong>
                  <small>{deliveryHandoff.nextAction}</small>
                </div>
                <div className="opening-action-summary-item">
                  <strong>推荐入口</strong>
                  <small>{deliveryHandoff.recommendedPage}</small>
                </div>
                <div className="opening-action-summary-item">
                  <strong>交付依据</strong>
                  <small>{deliveryHandoff.actionReason}</small>
                </div>
              </div>
            </div>
          )}

          <div className="opening-report-summary-grid">
            <div className={`opening-report-summary-card tone-${issueClosureSummary.statusTone}`}>
              <strong>问题闭环</strong>
              <span>{issueClosureSummary.statusLabel}</span>
              <p>{issueClosureSummary.nextAction}</p>
            </div>
            <div className="opening-report-summary-card tone-danger">
              <strong>阻塞项</strong>
              <span>{findingSummary.blocked}</span>
              <p>前置门禁或范围阻塞项。</p>
            </div>
            <div className="opening-report-summary-card tone-warning">
              <strong>不通过项</strong>
              <span>{findingSummary.failed}</span>
              <p>仍需补件或整改后重审。</p>
            </div>
            <div className="opening-report-summary-card tone-info">
              <strong>待人工判断</strong>
              <span>{findingSummary.pendingHuman}</span>
              <p>需要监理继续人工判断。</p>
            </div>
            <div className="opening-report-summary-card tone-muted">
              <strong>整改清单</strong>
              <span>{issueClosureSummary.rectificationDeliveryCount}</span>
              <p>可进入报告交付的整改条目。</p>
            </div>
          </div>

          <div className="opening-report-context-grid">
            <div className="opening-action-summary-item">
              <strong>轮次上下文</strong>
              <small>创建 {selectedTask.createdAt}</small>
              <small>更新 {selectedTask.updatedAt}</small>
            </div>
            <div className="opening-action-summary-item">
              <strong>人工复核队列</strong>
              <small>{blockingReviewCount} 项仍待处理或延期。</small>
            </div>
            <div className="opening-action-summary-item">
              <strong>下一动作</strong>
              <small>{selectedActionOwnership?.nextAction ?? "暂无下一动作。"}</small>
            </div>
          </div>

          {canStartRectificationRerun && (
            <div className="dialog-actions compact">
              <button type="button" className="primary" onClick={onStartRectificationRerun} disabled={pilotBusy}>
                <RotateCcw size={16} />
                发起下一轮整改复审
              </button>
            </div>
          )}
        </div>
      )}

      {currentRound ? <small>{isCurrentRun ? "当前" : "所选"}为同工作区第 {currentRound} 轮资料核查 / 整改复审。</small> : null}

      {previousRun && (
        <div className="opening-record-list">
          <div>
            <strong>整改复审对比</strong>
            <span>上一轮不通过 {previousRun.previousFailed} 项 / 当前不通过 {previousRun.currentFailed} 项</span>
            <p>仍延续到本轮的待整改项 {previousRun.carried} 项，可据此判断补件是否真正解决问题。</p>
          </div>
        </div>
      )}

      {closureDiff && (
        <div className="opening-record-list">
          <div>
            <strong>整改闭环对照</strong>
            <span>对比上一归档轮次 {runRoundMap.get(closureDiff.previousTask.id) ?? "-"} 与当前查看轮次 {currentRound ?? "-"}</span>
            <p>用于判断本轮补件是否真正解决上一轮问题，并识别本轮新增风险。</p>
          </div>
          <div className="opening-report-summary-grid">
            <div className="opening-report-summary-card tone-success">
              <strong>已整改</strong>
              <span>{closureDiff.summary.rectified}</span>
              <p>上一轮问题在本轮未再构成阻塞。</p>
            </div>
            <div className="opening-report-summary-card tone-danger">
              <strong>仍未整改</strong>
              <span>{closureDiff.summary.carried_over}</span>
              <p>上一轮问题延续到本轮。</p>
            </div>
            <div className="opening-report-summary-card tone-warning">
              <strong>本轮新增</strong>
              <span>{closureDiff.summary.newly_added}</span>
              <p>本轮资料暴露的新问题。</p>
            </div>
            <div className="opening-report-summary-card tone-info">
              <strong>待人工判断</strong>
              <span>{closureDiff.summary.pending_human_review}</span>
              <p>需要监理确认处理结论。</p>
            </div>
          </div>
          {closureDiff.items.slice(0, 8).map((item) => (
            <div key={item.id} className="opening-closure-diff-item">
              <div className="opening-report-finding-header">
                <strong>{item.title}</strong>
                <span className={`opening-report-chip tone-${getClosureCategoryTone(item.closureCategory)}`}>
                  {getClosureCategoryLabel(item.closureCategory)}
                </span>
              </div>
              <span>{item.category}</span>
              <div className="opening-closure-status-grid">
                <small>
                  <strong>上一轮</strong>
                  {item.previousStatus}
                </small>
                <small>
                  <strong>本轮</strong>
                  {item.currentStatus}
                </small>
              </div>
              <p>{item.nextAction}</p>
            </div>
          ))}
        </div>
      )}

      {packageDiagnostics && (
        <div className="opening-record-list">
          <div>
            <strong>试点输入</strong>
            <span>
              {packageDiagnostics.inputObjects.basisFileName ?? "未记录依据"} /{" "}
              {packageDiagnostics.inputObjects.checklistFileName ?? "未记录核查表"}
            </span>
            <p>{packageDiagnostics.inputObjects.sourceFileNames.slice(0, 6).join(" / ") || "未记录资料包文件"}</p>
          </div>
          <div>
            <strong>核查与复核</strong>
            <span>
              核查 {packageDiagnostics.matching.total} 项 / 证据 {packageDiagnostics.matching.evidenceCount} 条 / 阻塞{" "}
              {packageDiagnostics.humanReview.blockingCount} 项
            </span>
            <p>
              人工确认 {packageDiagnostics.humanReview.confirmed} 项，修正 {packageDiagnostics.humanReview.corrected} 项，驳回{" "}
              {packageDiagnostics.humanReview.rejected} 项，延期 {packageDiagnostics.humanReview.deferred} 项。
            </p>
          </div>
          <div>
            <strong>交付状态</strong>
            <span>Provider {packageDiagnostics.providerReadiness?.status ?? "unrecorded"} / 归档 {packageDiagnostics.archiveStatus}</span>
            <p>{packageDiagnostics.blockingReasons.length > 0 ? packageDiagnostics.blockingReasons.join(" / ") : "未记录阻塞原因。"}</p>
          </div>
        </div>
      )}

      {(issueTypeSummary.length > 0 || nextRectificationAdvice) && (
        <div className="opening-record-list">
          <div>
            <strong>问题分类与整改建议</strong>
            <span>{issueTypeSummary.length > 0 ? `${issueTypeSummary.length} 类问题已归并` : "待补充问题分类汇总"}</span>
            <p>这部分来自平台生成的结构化问题交付包，可继续用于后续导出、复审和智能资产复用。</p>
          </div>
          {issueTypeSummary.length > 0 && (
            <div className="opening-report-summary-grid">
              {issueTypeSummary.map((item) => (
                <div key={item.issueTypeId} className={`opening-report-summary-card tone-${item.riskLevel === "high" ? "danger" : item.riskLevel === "medium" ? "warning" : "info"}`}>
                  <strong>{item.issueTypeLabel}</strong>
                  <span>{item.count}</span>
                  <p>{item.issueTypeGroup ?? item.issueTypeId}</p>
                </div>
              ))}
            </div>
          )}
          {nextRectificationAdvice && (
            <div className="opening-report-finding">
              <div className="opening-report-finding-header">
                <strong>{nextRectificationAdvice.headline}</strong>
                <span className="opening-report-chip tone-info">下一动作</span>
              </div>
              <div className="opening-report-detail-list">
                {nextRectificationAdvice.actions.map((action, index) => (
                  <small key={`${index}-${action}`}>
                    <strong>{index + 1}.</strong>
                    {action}
                  </small>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {exportHandoff && (
        <div className="opening-record-list">
          <div>
            <strong>原表回填与导出挂点</strong>
            <span>{exportHandoff.adapterLabel} / {exportHandoff.status}</span>
            <p>这一层是给后续 `docxToHtml`、`htmlToDocx` 或其他外部回填适配器消费的稳定交付 contract。</p>
          </div>
          <div className="opening-report-summary-grid">
            <div className="opening-report-summary-card tone-info">
              <strong>交付类型</strong>
              <span>{exportHandoff.deliveryKind}</span>
              <p>{exportHandoff.templateLabel ?? exportHandoff.templateId ?? "未绑定模板"}</p>
            </div>
            <div className="opening-report-summary-card tone-muted">
              <strong>输入对象</strong>
              <span>{exportHandoff.inputSummary.findingCount}</span>
              <p>
                {exportHandoff.inputSummary.basisFileName ?? "未记录依据"} /{" "}
                {exportHandoff.inputSummary.checklistFileName ?? "未记录核查表"}
              </p>
            </div>
            <div className="opening-report-summary-card tone-warning">
              <strong>资料包文件</strong>
              <span>{exportHandoff.inputSummary.sourceCount}</span>
              <p>{exportHandoff.nextAction}</p>
            </div>
          </div>
          {exportHandoff.safeDiagnostics.length > 0 && (
            <div className="opening-report-detail-list">
              {exportHandoff.safeDiagnostics.map((item) => (
                <small key={item}>
                  <strong>handoff</strong>
                  {item}
                </small>
              ))}
            </div>
          )}
        </div>
      )}

      <OpeningConditionReportDeliveryPackageSummary deliveryPackage={deliveryPackage} />

      <OpeningConditionReportRectificationDeliveryList rows={rectificationDeliveryRows} />

      {findings.length > 0 && (
        <div className="opening-record-list">
          <div>
            <strong>不符合与待整改项</strong>
            <span>{findings.length} 项需要持续跟踪</span>
            <p>按交付优先级分组展示，便于监理先看阻塞、再看补件、最后看提示项。</p>
          </div>
          {findingGroups.map((group) => (
            <div key={group.id} className={`opening-finding-group tone-${group.tone}`}>
              <div className="opening-finding-group-header">
                <div>
                  <strong>{group.title}</strong>
                  <p>{group.description}</p>
                </div>
                <span className={`opening-report-chip tone-${group.tone}`}>{group.findings.length} 项</span>
              </div>
              <div className="opening-finding-group-list">
                {group.findings.map((finding) => (
                  (() => {
                    const unresolvedReview = unresolvedReviewByTargetId.get(finding.id);

                    return (
                      <div key={finding.id} className="opening-report-finding">
                        <div className="opening-report-finding-header">
                          <strong>{finding.title}</strong>
                          <div className="opening-report-chip-row">
                            <span className={`opening-report-chip tone-${finding.dispositionTone}`}>{finding.dispositionLabel}</span>
                            <span className={`opening-report-chip tone-${finding.severityTone}`}>{finding.severityLabel}</span>
                            <span className="opening-report-chip tone-muted">{finding.statusLabel}</span>
                          </div>
                        </div>
                        <span>{finding.category}</span>
                        <p>{finding.description}</p>
                        <div className="opening-report-detail-list opening-report-finding-detail-grid">
                          <small>
                            <strong>结论</strong>
                            {finding.dispositionLabel}
                          </small>
                          <small>
                            <strong>风险</strong>
                            {finding.severityLabel}
                          </small>
                          <small>
                            <strong>范围</strong>
                            {finding.statusLabel}
                          </small>
                          <small>
                            <strong>依据</strong>
                            {finding.basis}
                          </small>
                          <small>
                            <strong>整改建议</strong>
                            {finding.rectification}
                          </small>
                          {finding.evidence.length > 0 && (
                            <small>
                              <strong>证据</strong>
                              {finding.evidence.join(" / ")}
                            </small>
                          )}
                          {finding.humanReview.length > 0 && (
                            <small>
                              <strong>人工复核</strong>
                              {finding.humanReview.join(" / ")}
                            </small>
                          )}
                        </div>
                        <div className="dialog-actions compact">
                          {onFocusCheckItem && (
                            <button type="button" className="secondary" onClick={() => onFocusCheckItem(finding.id)}>
                              定位核查项
                            </button>
                          )}
                          {onFocusHumanReview && unresolvedReview && (
                            <button type="button" className="secondary" onClick={() => onFocusHumanReview(unresolvedReview.id)}>
                              定位复核项
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })()
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {decisionLedger.length > 0 && (
        <div className="opening-record-list">
          <div>
            <strong>人工复核决策留痕</strong>
            <span>{decisionLedger.length} 条决策</span>
            <p>归档后保留本轮人工确认、修正、驳回与延期记录。</p>
          </div>
          {decisionLedger.map((item) => (
            <div key={item.reviewId}>
              <strong>{item.targetLabel ?? item.targetId}</strong>
              <span>
                {item.category ?? "未分类"} | {item.status} | {item.reviewerId ?? "unknown"}
              </span>
              <p>{item.reason}</p>
              {item.safeNote && <small>{item.safeNote}</small>}
            </div>
          ))}
        </div>
      )}

      {historyTasks.length > 0 && (
        <div className="opening-record-list">
          <div>
            <strong>历史核查轮次</strong>
            <span>{historyTasks.length} 轮记录</span>
            <p>新的整改复审会生成新的 run。历史 run 保留为只读记录，已隐藏测试轮次 {hiddenRunAudits.length} 条。</p>
          </div>
          {historyTasks.map((task) => {
            const taskFindings = buildReportFindings(task);
            const taskBlockingCount = taskFindings.filter(
              (item) => item.disposition === "fail" || item.disposition === "reject" || item.disposition === "blocked",
            ).length;
            const taskOpenReviewCount = task.humanReviewQueue.filter(
              (item) => item.status === "open" || item.status === "deferred",
            ).length;
            const isSelected = selectedTask?.id === task.id;

            return (
              <div key={task.id} className={isSelected ? "opening-history-item opening-selected-record" : "opening-history-item"}>
                <div className="opening-history-item-header">
                  <strong>
                    第 {runRoundMap.get(task.id) ?? "-"} 轮 / {task.id}
                  </strong>
                  <div className="opening-report-chip-row">
                    {isSelected && <span className="opening-report-chip tone-success">正在查看</span>}
                    <span className={`opening-report-chip tone-${pilotTask?.id === task.id ? "info" : "muted"}`}>
                      {pilotTask?.id === task.id ? "当前 run" : "历史轮次"}
                    </span>
                    <span className={`opening-report-chip tone-${task.state === "archived" ? "success" : "warning"}`}>
                      {getTaskConclusionLabel(task)}
                    </span>
                  </div>
                </div>
                <p>
                  创建 {task.createdAt} / 更新 {task.updatedAt} / 不通过 {taskBlockingCount} 项 / 待人工处理 {taskOpenReviewCount} 项
                </p>
                <div className="opening-history-item-summary">
                  <small>
                    <strong>轮次状态</strong>
                    {getTaskConclusionLabel(task)}
                  </small>
                  <small>
                    <strong>人工待处理</strong>
                    {taskOpenReviewCount}
                  </small>
                </div>
                <div className="dialog-actions compact">
                  <button
                    type="button"
                    className={isSelected ? "primary" : "secondary"}
                    onClick={() => setSelectedHistoryTaskId(task.id)}
                  >
                    {isSelected ? "当前查看中" : "查看该轮详情"}
                  </button>
                  {pilotTask?.id !== task.id && (
                    <button type="button" className="secondary" onClick={() => hideHistoryRun(task.id)} disabled={pilotBusy}>
                      <EyeOff size={16} />
                      隐藏测试轮次
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(onGenerateReport || onExportReport || onArchive) && (
        <div className="dialog-actions">
          {onGenerateReport && (
            <button type="button" className="primary" onClick={onGenerateReport} disabled={pilotBusy || !canGenerateReport}>
              生成报告摘要
            </button>
          )}
          {onExportReport && reportAsset && (
            <button type="button" className="secondary" onClick={() => onExportReport(selectedTask?.id ?? pilotTask?.id ?? "")} disabled={pilotBusy}>
              导出 DOCX
            </button>
          )}
          {onArchive && reportAsset?.status === "ready" && isCurrentRun && (
            <button type="button" className="secondary" onClick={onArchive} disabled={pilotBusy}>
              归档任务
            </button>
          )}
        </div>
      )}

      {(reportExportStatus || reportDownloadUrl) && (
        <div className="opening-record-list">
          <div>
            <strong>DOCX 导出状态</strong>
            <p>{reportExportStatus || "DOCX 报告已生成。"}</p>
            {reportDownloadUrl && (
              <a href={reportDownloadUrl} target="_blank" rel="noreferrer">
                打开 DOCX 下载
              </a>
            )}
          </div>
        </div>
      )}

      {selectedTask && blockingReviewCount > 0 && <small>仍有 {blockingReviewCount} 项人工复核阻塞，处理后才能生成报告。</small>}
    </section>
  );
}

function OpeningConditionReportArchivePage({
  packet,
  pilotTask,
  workspaceTasks,
  pilotBusy,
  onGenerateReport,
  onArchive,
  onStartRectificationRerun,
}: {
  packet: OpeningConditionReviewPacket;
  pilotTask?: OpeningConditionPilotTask | null;
  workspaceTasks?: OpeningConditionPilotTask[];
  pilotBusy?: boolean;
  onGenerateReport?: () => void;
  onArchive?: () => void;
  onStartRectificationRerun?: () => void;
}) {
  const [hiddenRunAudits, setHiddenRunAudits] = useState<HiddenPilotRunAudit[]>(() =>
    readHiddenPilotRunAudits(packet.workspaceId),
  );
  const hiddenRunIds = new Set(hiddenRunAudits.map((item) => item.taskId));
  const [selectedHistoryTaskId, setSelectedHistoryTaskId] = useState<string | null>(null);
  const runSnapshot = deriveOpeningConditionRunSnapshot({
    workspaceTasks,
    pilotTask,
    selectedHistoryTaskId,
    hiddenRunIds,
  });
  const historyTasks = runSnapshot.historyTasks;
  const selectedTask = runSnapshot.selectedTask;
  const reportAsset = selectedTask?.reportAsset;
  const packageDiagnostics = reportAsset?.packageDiagnostics;
  const blockingReviewCount = runSnapshot.blockingReviewCount;
  const canGenerateReport = Boolean(
    pilotTask && selectedTask?.id === pilotTask.id && pilotTask.state === "report_ready" && blockingReviewCount === 0 && !reportAsset,
  );
  const findings = buildReportFindings(selectedTask);
  const runRoundMap = runSnapshot.runRoundMap;
  const currentRound = runSnapshot.currentRound;
  const previousRun = runSnapshot.previousRun;
  const closureDiff = runSnapshot.closureDiff;
  const decisionLedger = packageDiagnostics?.decisionLedger ?? [];
  const isCurrentRun = runSnapshot.isCurrentRun;
  const selectedActionOwnership = deriveOpeningConditionRunActionOwnership({ pilotTask: selectedTask });
  const findingSummary = {
    blocked: findings.filter((item) => item.disposition === "blocked").length,
    failed: findings.filter((item) => item.disposition === "fail" || item.disposition === "reject").length,
    pendingHuman: findings.filter((item) => item.disposition === "needs_human_review").length,
    warning: findings.filter((item) => item.disposition === "warning").length,
  };

  function hideHistoryRun(taskId: string) {
    const nextAudits = [
      ...hiddenRunAudits.filter((item) => item.taskId !== taskId),
      {
        taskId,
        hiddenAt: new Date().toISOString(),
        reason: "operator_hidden_test_or_mistaken_run",
      },
    ];
    setHiddenRunAudits(nextAudits);
    writeHiddenPilotRunAudits(packet.workspaceId, nextAudits);
    if (selectedHistoryTaskId === taskId) {
      setSelectedHistoryTaskId(null);
    }
  }

  return (
    <section className="opening-panel opening-panel-report opening-panel-wide">
      <span className="eyebrow">报告归档</span>
      <h2>{reportAsset?.title ?? packet.reportSummary.title}</h2>
      <p>
        {reportAsset
          ? `平台报告资产已生成：共 ${reportAsset.summary.total} 项，符合 ${reportAsset.summary.passed} 项，不符合 ${reportAsset.summary.failed} 项，待复核 ${reportAsset.summary.humanReview} 项。`
          : packet.reportSummary.conclusion}
      </p>
      <div className="opening-condition-meta">
        <span>{packet.workspaceContext.contractPackage}</span>
        <span>{packet.boundBasisSetVersionId ?? "未绑定依据版本"}</span>
        <span>{reportAsset?.status ?? "待生成"}</span>
      </div>
      <strong>{reportAsset ? "报告资产来自平台后端试点任务记录。" : packet.reportSummary.nextAction}</strong>
      <small>{reportAsset?.disclaimer ?? packet.reportSummary.disclaimer}</small>
      <OpeningConditionActionOwnershipSummary
        summary={selectedActionOwnership}
        eyebrow={isCurrentRun ? "Current Run Ownership" : "Historical Run Snapshot"}
        title={isCurrentRun ? "本轮责任人与交付动作" : "历史轮次责任快照"}
        description={
          isCurrentRun
            ? "报告页同时承担整改移交口径，帮助操作者明确本轮是否该归档、补件还是发起下一轮。"
            : "历史轮次保留当时的责任边界与下一动作语义，用于复盘，不再允许直接变更。"
        }
      />
      {currentRound ? <small>{isCurrentRun ? "当前" : "所选"}为同工作区第 {currentRound} 轮核查/整改复审。</small> : null}

      {selectedTask && (
        <div className="opening-report-detail-card">
          <div>
            <span className="eyebrow">当前查看</span>
            <h3>{isCurrentRun ? "本轮运行详情" : "历史轮次详情"}</h3>
          </div>
          <div className="opening-report-chip-row">
            <span className={`opening-report-chip tone-${isCurrentRun ? "info" : "muted"}`}>{isCurrentRun ? "当前运行" : "历史只读"}</span>
            <span className={`opening-report-chip tone-${selectedTask.state === "archived" ? "success" : "warning"}`}>{getTaskConclusionLabel(selectedTask)}</span>
            <span className="opening-report-chip tone-muted">任务 {selectedTask.id}</span>
          </div>
          <p>
            创建 {selectedTask.createdAt}，最近更新 {selectedTask.updatedAt}。
            {selectedTask.state === "archived" ? " 该轮已归档，只用于复盘和对比。" : " 该轮仍可继续推进后续处理。"}
          </p>
          {!isCurrentRun && (
            <OpeningConditionActionOwnershipSummary
              summary={selectedActionOwnership}
              eyebrow="Readonly Snapshot"
              title="历史责任边界"
              description="这块只保留当时那一轮的责任语义，方便和当前轮区分，不提供变更入口。"
            />
          )}
          {selectedTask.state === "archived" && (
            <div className="dialog-actions compact">
              {onStartRectificationRerun && runSnapshot.canStartRectificationRerun && (
                <button type="button" className="primary" onClick={onStartRectificationRerun} disabled={pilotBusy}>
                  <RotateCcw size={16} />
                  发起下一轮整改复审
                </button>
              )}
              {!isCurrentRun && (
                <button type="button" className="secondary" onClick={() => hideHistoryRun(selectedTask.id)} disabled={pilotBusy}>
                  <EyeOff size={16} />
                  隐藏测试轮次
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {previousRun && (
        <div className="opening-record-list">
          <div>
            <strong>整改复审对比</strong>
            <span>上一轮不通过 {previousRun.previousFailed} 项 · 当前不通过 {previousRun.currentFailed} 项</span>
            <p>仍延续到本轮的待整改项 {previousRun.carried} 项，可据此判断补件效果。</p>
          </div>
        </div>
      )}

      {closureDiff && (
        <div className="opening-record-list">
          <div>
            <strong>整改闭环对照</strong>
            <span>对比上一归档轮次 {runRoundMap.get(closureDiff.previousTask.id) ?? "-"} 与当前查看轮次 {currentRound ?? "-"}</span>
            <p>用于判断本轮补件是否真正解决上一轮问题，并识别本轮新增风险。</p>
          </div>
          <div className="opening-report-summary-grid">
            <div className="opening-report-summary-card tone-success">
              <strong>已整改</strong>
              <span>{closureDiff.summary.rectified} 项</span>
              <p>上一轮问题在本轮未再构成阻塞。</p>
            </div>
            <div className="opening-report-summary-card tone-danger">
              <strong>仍未整改</strong>
              <span>{closureDiff.summary.carried_over} 项</span>
              <p>上一轮问题延续到本轮。</p>
            </div>
            <div className="opening-report-summary-card tone-warning">
              <strong>本轮新增</strong>
              <span>{closureDiff.summary.newly_added} 项</span>
              <p>本轮资料暴露的新问题。</p>
            </div>
            <div className="opening-report-summary-card tone-info">
              <strong>待人工判断</strong>
              <span>{closureDiff.summary.pending_human_review} 项</span>
              <p>需要监理确认处理结论。</p>
            </div>
          </div>
          {closureDiff.items.slice(0, 8).map((item) => (
            <div key={item.id} className="opening-closure-diff-item">
              <div className="opening-report-finding-header">
                <strong>{item.title}</strong>
                <span className={`opening-report-chip tone-${getClosureCategoryTone(item.closureCategory)}`}>
                  {getClosureCategoryLabel(item.closureCategory)}
                </span>
              </div>
              <span>{item.category}</span>
              <div className="opening-closure-status-grid">
                <small>
                  <strong>上一轮</strong>
                  {item.previousStatus}
                </small>
                <small>
                  <strong>本轮</strong>
                  {item.currentStatus}
                </small>
              </div>
              <p>{item.nextAction}</p>
            </div>
          ))}
        </div>
      )}

      {findings.length > 0 && (
        <div className="opening-report-summary-grid">
          <div className="opening-report-summary-card tone-danger">
            <strong>阻塞项</strong>
            <span>{findingSummary.blocked} 项</span>
            <p>需要先解除前置依据或边界阻塞。</p>
          </div>
          <div className="opening-report-summary-card tone-warning">
            <strong>不通过项</strong>
            <span>{findingSummary.failed} 项</span>
            <p>需补件或整改后重新提交。</p>
          </div>
          <div className="opening-report-summary-card tone-info">
            <strong>待人工判断</strong>
            <span>{findingSummary.pendingHuman} 项</span>
            <p>需要监理进一步确认是否放行。</p>
          </div>
          <div className="opening-report-summary-card tone-muted">
            <strong>提示关注</strong>
            <span>{findingSummary.warning} 项</span>
            <p>不直接阻塞，但建议在下轮同步补齐。</p>
          </div>
        </div>
      )}

      {packageDiagnostics && (
        <div className="opening-record-list">
          <div>
            <strong>试点输入</strong>
            <span>{packageDiagnostics.inputObjects.basisFileName ?? "未记录依据"} · {packageDiagnostics.inputObjects.checklistFileName ?? "未记录核查表"}</span>
            <p>{packageDiagnostics.inputObjects.sourceFileNames.slice(0, 6).join(" / ") || "未记录资料包文件"}</p>
          </div>
          <div>
            <strong>核查与复核</strong>
            <span>核查 {packageDiagnostics.matching.total} 项 · 证据 {packageDiagnostics.matching.evidenceCount} 条 · 阻塞 {packageDiagnostics.humanReview.blockingCount} 项</span>
            <p>人工确认 {packageDiagnostics.humanReview.confirmed} 项，修正 {packageDiagnostics.humanReview.corrected} 项，驳回 {packageDiagnostics.humanReview.rejected} 项，延期 {packageDiagnostics.humanReview.deferred} 项。</p>
          </div>
          <div>
            <strong>交付状态</strong>
            <span>Provider {packageDiagnostics.providerReadiness?.status ?? "未记录"} · 归档 {packageDiagnostics.archiveStatus}</span>
            <p>{packageDiagnostics.blockingReasons.length > 0 ? packageDiagnostics.blockingReasons.join(" / ") : "未记录阻塞原因。"}</p>
          </div>
        </div>
      )}

      {findings.length > 0 && (
        <div className="opening-record-list">
          <div>
            <strong>不符合与待整改项</strong>
            <span>{findings.length} 项需要持续跟踪</span>
            <p>以下内容用于本轮内部辅助意见和下一轮整改复审交接。</p>
          </div>
          {findings.map((finding) => (
            <div key={finding.id} className="opening-report-finding">
              <div className="opening-report-finding-header">
                <strong>{finding.title}</strong>
                <div className="opening-report-chip-row">
                  <span className={`opening-report-chip tone-${finding.dispositionTone}`}>{finding.dispositionLabel}</span>
                  <span className={`opening-report-chip tone-${finding.severityTone}`}>{finding.severityLabel}</span>
                  <span className="opening-report-chip tone-muted">{finding.statusLabel}</span>
                </div>
              </div>
              <span>{finding.category}</span>
              <p>{finding.description}</p>
              <div className="opening-report-detail-list">
                <small>
                  <strong>依据</strong>
                  {finding.basis}
                </small>
                <small>
                  <strong>整改建议</strong>
                  {finding.rectification}
                </small>
                {finding.evidence.length > 0 && (
                  <small>
                    <strong>证据</strong>
                    {finding.evidence.join(" / ")}
                  </small>
                )}
                {finding.humanReview.length > 0 && (
                  <small>
                    <strong>人工复核</strong>
                    {finding.humanReview.join(" / ")}
                  </small>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {decisionLedger.length > 0 && (
        <div className="opening-record-list">
          <div>
            <strong>人工复核决策留痕</strong>
            <span>{decisionLedger.length} 条决策</span>
            <p>归档后保留本轮人工确认、修正、驳回与延期记录。</p>
          </div>
          {decisionLedger.map((item) => (
            <div key={item.reviewId}>
              <strong>{item.targetLabel ?? item.targetId}</strong>
              <span>{item.category ?? "未分类"} | {item.status} | {item.reviewerId ?? "unknown"}</span>
              <p>{item.reason}</p>
              {item.safeNote && <small>{item.safeNote}</small>}
            </div>
          ))}
        </div>
      )}

      {historyTasks.length > 0 && (
        <div className="opening-record-list">
          <div>
            <strong>历史核查轮次</strong>
            <span>{historyTasks.length} 轮记录</span>
            <p>新一轮整改复审会生成新 run，历史 run 默认保留为只读记录。已隐藏测试轮次 {hiddenRunAudits.length} 条。</p>
          </div>
          {historyTasks.map((task) => (
            <div
              key={task.id}
              className={
                selectedTask?.id === task.id ? "opening-history-item opening-selected-record" : "opening-history-item"
              }
            >
              <div className="opening-history-item-header">
                <strong>第 {runRoundMap.get(task.id) ?? "-"} 轮 · {task.id}</strong>
                <div className="opening-report-chip-row">
                  <span className={`opening-report-chip tone-${pilotTask?.id === task.id ? "info" : "muted"}`}>
                    {pilotTask?.id === task.id ? "当前运行" : "历史轮次"}
                  </span>
                  <span className={`opening-report-chip tone-${task.state === "archived" ? "success" : "warning"}`}>
                    {getTaskConclusionLabel(task)}
                  </span>
                </div>
              </div>
              <p>
                创建 {task.createdAt} / 更新 {task.updatedAt} / 不通过{" "}
                {buildReportFindings(task).filter((item) => item.disposition === "fail" || item.disposition === "reject" || item.disposition === "blocked").length} 项 / 待复核{" "}
                {task.humanReviewQueue.filter((item) => item.status === "open" || item.status === "deferred").length} 项
              </p>
              <div className="dialog-actions compact">
                <button type="button" className="secondary" onClick={() => setSelectedHistoryTaskId(task.id)}>
                  {selectedTask?.id === task.id ? "当前查看中" : "查看该轮详情"}
                </button>
                {pilotTask?.id !== task.id && (
                  <button type="button" className="secondary" onClick={() => hideHistoryRun(task.id)} disabled={pilotBusy}>
                    <EyeOff size={16} />
                    隐藏测试轮次
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {(onGenerateReport || onArchive) && (
        <div className="dialog-actions">
          {onGenerateReport && (
            <button type="button" className="primary" onClick={onGenerateReport} disabled={pilotBusy || !canGenerateReport}>
              生成报告摘要
            </button>
          )}
          {onArchive && reportAsset?.status === "ready" && (
            <button type="button" className="secondary" onClick={onArchive} disabled={pilotBusy}>
              归档任务
            </button>
          )}
          {onStartRectificationRerun && runSnapshot.canStartRectificationRerun && (
            <button type="button" className="primary" onClick={onStartRectificationRerun} disabled={pilotBusy}>
              <RotateCcw size={16} />
              发起下一轮整改复审
            </button>
          )}
        </div>
      )}

      {pilotTask && blockingReviewCount > 0 && <small>仍有 {blockingReviewCount} 项人工复核阻塞，处理后才能生成报告。</small>}
    </section>
  );
}

function OpeningConditionTrialPackageDiagnostics({ pilotTask }: { pilotTask?: OpeningConditionPilotTask | null }) {
  const trialPackage = pilotTask?.trialPackage;
  if (!trialPackage) {
    return null;
  }

  return (
    <section className="opening-panel opening-panel-wide">
      <div className="section-title row">
        <div>
          <span className="eyebrow">真实试点诊断</span>
          <h2>本次样本运行摘要</h2>
        </div>
        <span className={`status-pill ${trialPackage.archiveStatus === "archived" ? "success" : "info"}`}>
          {trialPackage.status}
        </span>
      </div>
      <div className="opening-condition-meta">
        <span>资料 {trialPackage.inputObjects.sourceCount} 个</span>
        <span>Manifest {trialPackage.diagnostics.inventoryEntryCount} 项</span>
        <span>核查表 {trialPackage.diagnostics.checklistDefinitionResolution ?? "未解析"}</span>
        <span>Provider {trialPackage.providerReadiness?.status ?? "未记录"}</span>
        <span>报告 {trialPackage.reportStatus}</span>
      </div>
      <div className="opening-record-list">
        <div>
          <strong>输入文件</strong>
          <span>{trialPackage.inputObjects.basisFileName ?? "未记录依据"} · {trialPackage.inputObjects.checklistFileName ?? "未记录核查表"}</span>
          <p>{trialPackage.inputObjects.sourceFileNames.slice(0, 8).join(" / ") || "未记录资料包对象。"}</p>
        </div>
        <div>
          <strong>清单与适配</strong>
          <span>{trialPackage.diagnostics.inventoryResolution ?? "未记录 manifest 来源"} · {trialPackage.diagnostics.checklistDefinitionCount} 个核查定义</span>
          <p>{trialPackage.diagnostics.manifestSampleNames.slice(0, 8).join(" / ") || trialPackage.diagnostics.inventoryFallbackReason || "暂无 manifest 样例。"}</p>
        </div>
        <div>
          <strong>执行结果</strong>
          <span>通过 {trialPackage.matching.passed} · 不通过 {trialPackage.matching.failed} · 待复核 {trialPackage.humanReview.blockingCount}</span>
          <p>{trialPackage.blockingReasons.length > 0 ? trialPackage.blockingReasons.join(" / ") : trialPackage.providerReadiness?.summary ?? "当前未记录阻塞原因。"}</p>
        </div>
      </div>
    </section>
  );
}

function OpeningConditionPilotExecutionPanel({
  pilotTask,
  portalState,
  readiness,
  statusMessage,
  busy,
  onRefresh,
  onInitialize,
  onPublishBasis,
  onConfirmMasterData,
  onRunMatch,
  onEnsureKnowledgeBase,
}: {
  pilotTask?: OpeningConditionPilotTask | null;
  portalState: OpeningConditionPortalViewState;
  readiness?: OpeningConditionPilotReadinessResult | null;
  statusMessage: string;
  busy?: boolean;
  onRefresh?: () => void;
  onInitialize?: () => void;
  onPublishBasis?: () => void;
  onConfirmMasterData?: () => void;
  onRunMatch?: () => void;
  onEnsureKnowledgeBase?: () => void;
}) {
  const readinessStatus = readiness?.preflightReadiness?.status ?? "provisional";
  const blockingReasons = readiness?.preflightReadiness?.blockingReasons ?? [];
  const actionGates = portalState.actions;
  const matchDisabled = busy || !actionGates.runFormalMatch.enabled;
  const actionOwnership = portalState.actionOwnership;

  return (
    <section className="opening-panel opening-panel-wide">
      <div className="section-title row">
        <div>
          <span className="eyebrow">试点执行台</span>
          <h2>任务初始化、知识库绑定与正式匹配</h2>
        </div>
        {onRefresh && (
          <button type="button" className="secondary" onClick={onRefresh} disabled={busy}>
            {busy ? "同步中..." : "刷新任务状态"}
          </button>
        )}
      </div>
      <p>这里是资料接入页的操作台。工作区概览不再承载这些按钮，避免业务首页变成接口测试面板。</p>
      <div className="opening-condition-meta">
        <span>任务 {pilotTask?.id ?? "未初始化"}</span>
        <span>状态 {pilotTask?.state ?? "draft"}</span>
        <span>门禁 {readinessLabels[readinessStatus] ?? readinessStatus}</span>
        <span>知识库 {pilotTask?.knowledgeBaseRef?.label ?? "未绑定"}</span>
      </div>
      {readiness?.preflightReadiness && (
        <div className="opening-condition-meta">
          <span>依据 {readinessLabels[readiness.preflightReadiness.basis] ?? readiness.preflightReadiness.basis}</span>
          <span>主数据 {readinessLabels[readiness.preflightReadiness.masterData] ?? readiness.preflightReadiness.masterData}</span>
          <span>资料包 {readinessLabels[readiness.preflightReadiness.materialPacket] ?? readiness.preflightReadiness.materialPacket}</span>
          <span>支撑库 {readinessLabels[readiness.preflightReadiness.knowledgeBase] ?? readiness.preflightReadiness.knowledgeBase}</span>
        </div>
      )}
      <OpeningConditionActionOwnershipSummary
        summary={actionOwnership}
        eyebrow="Execution Ownership"
        title="试点执行台责任归属"
        description="执行台不只显示状态，还明确下一步由谁推进。"
      />
      <div className="dialog-actions">
        {onInitialize && (
          <button type="button" className="primary" onClick={onInitialize} disabled={busy || !actionGates.initializeCurrentRun.enabled} title={getOpeningActionGateTitle(actionGates.initializeCurrentRun)}>
            {pilotTask ? "重新初始化资料包接入" : "初始化资料包接入"}
          </button>
        )}
        {onPublishBasis && (
          <button type="button" className="secondary" onClick={onPublishBasis} disabled={busy || !actionGates.publishBasis.enabled} title={getOpeningActionGateTitle(actionGates.publishBasis)}>
            发布当前 run 依据
          </button>
        )}
        {onConfirmMasterData && (
          <button type="button" className="secondary" onClick={onConfirmMasterData} disabled={busy || !actionGates.confirmMasterData.enabled} title={getOpeningActionGateTitle(actionGates.confirmMasterData)}>
            确认当前 run 主数据
          </button>
        )}
        {onRunMatch && (
          <button type="button" className="primary" onClick={onRunMatch} disabled={matchDisabled} title={getOpeningActionGateTitle(actionGates.runFormalMatch)}>
            执行正式核查
          </button>
        )}
        {onEnsureKnowledgeBase && (
          <button type="button" className="secondary" onClick={onEnsureKnowledgeBase} disabled={busy || !actionGates.bindKnowledgeBase.enabled} title={getOpeningActionGateTitle(actionGates.bindKnowledgeBase)}>
            生成并绑定试点知识库
          </button>
        )}
      </div>
      <strong>{statusMessage}</strong>
      <small>
        {portalState.currentRunMutationLocked
          ? "当前归档轮次只用于查看历史接入事实。请从报告归档页发起下一轮整改复审后，再回到本页上传新资料。"
          : matchDisabled && pilotTask?.state !== "archived" && readinessStatus !== "ready"
          ? (actionGates.runFormalMatch.disabledReason || (readiness?.preflightReadiness?.nextAction ?? "请先完成接入预览确认、依据发布、主数据确认和知识库门禁。"))
          : blockingReasons.length > 0
            ? blockingReasons.join(" / ")
            : readiness?.preflightReadiness?.nextAction ?? "先完成资料包接入，再进入正式匹配。"}
      </small>
    </section>
  );
}

function buildOpeningConditionObjectRefFromUpload(
  result: Awaited<ReturnType<typeof uploadMinioDocument>>,
  kind: "basis" | "checklist" | "source_archive",
  fallbackId: string,
) {
  const object = result.object;
  if (!result.ok || !object) {
    return null;
  }

  return {
    objectId: object.key || fallbackId,
    kind,
    fileName: object.originalFilename || fallbackId,
    storageKey: object.key,
    contentType: object.contentType,
    sizeBytes: object.size,
    summary:
      kind === "basis"
        ? "单项目试点合同与资质依据"
        : kind === "checklist"
          ? "单项目试点资料核查表"
          : "单项目试点资料包压缩文件",
  } satisfies OpeningConditionObjectRef;
}

function OpeningConditionRealTrialIntakePanel({
  packet,
  pilotTask,
  portalState,
  busy,
  submittedBy,
  onComplete,
  reviewScope = "completeness",
  getNextOpeningPilotRunTaskId,
}: {
  packet: OpeningConditionReviewPacket;
  pilotTask?: OpeningConditionPilotTask | null;
  portalState: OpeningConditionPortalViewState;
  busy?: boolean;
  submittedBy: string;
  onComplete?: (result: OpeningConditionPilotIntakeInitResult) => void;
  reviewScope?: OpeningConditionPilotReviewScope;
  getNextOpeningPilotRunTaskId?: () => string;
}) {
  const [basisFile, setBasisFile] = useState<File | null>(null);
  const [checklistFile, setChecklistFile] = useState<File | null>(null);
  const [packetFile, setPacketFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("选择合同依据、核查表和资料包后，可创建一条真实试点任务。");
  const isRectificationRerun = portalState.rerunUploadEnabled;

  async function handleBootstrap() {
    if (portalState.intakeReadOnly) {
      setMessage("当前归档轮次默认只读，请从报告归档页发起下一轮整改复审后再上传。");
      return;
    }
    if (!basisFile || !checklistFile || !packetFile) {
      setMessage("请先选择合同依据、核查表和资料包 ZIP。");
      return;
    }

    setSubmitting(true);
    setMessage(isRectificationRerun ? "正在上传整改复审资料并创建新一轮 run..." : "正在上传试点资料...");

    try {
      const [basisUpload, checklistUpload, packetUpload] = await Promise.all([
        uploadMinioDocument(basisFile),
        uploadMinioDocument(checklistFile),
        uploadMinioDocument(packetFile),
      ]);
      const basisObject = buildOpeningConditionObjectRefFromUpload(basisUpload, "basis", "trial-basis");
      const checklistObject = buildOpeningConditionObjectRefFromUpload(checklistUpload, "checklist", "trial-checklist");
      const sourceObject = buildOpeningConditionObjectRefFromUpload(packetUpload, "source_archive", "trial-material-zip");
      if (!basisObject || !checklistObject || !sourceObject) {
        setMessage(basisUpload.message || checklistUpload.message || packetUpload.message || "试点资料上传失败，无法初始化任务。");
        return;
      }

      const workspace = packet.workspaceContext;
      const taskId =
        portalState.archivedTask
          ? (getNextOpeningPilotRunTaskId?.() ?? `oc-pilot-${packet.workspaceId}-run-${Date.now()}`)
          : (pilotTask?.id ?? `oc-pilot-${packet.workspaceId}`);

      const result = await bootstrapOpeningConditionPilotTrial({
        taskId,
        context: {
          workspaceId: packet.workspaceId,
          tenantId: workspace.tenantName || "tenant-opening-condition",
          projectId: workspace.projectId || workspace.projectName || packet.projectName,
          reviewObjectId: workspace.reviewObjectId,
          contractPackageId: workspace.contractPackage || "contract-package",
          participatingOrganizationId: workspace.participatingOrganization || "organization",
          participantEntityId: workspace.participantEntityId,
        },
        basisObject,
        checklistObject,
        sourceObjects: [sourceObject],
        subcontractTeamId: workspace.participantEntityId,
        submittedBy,
        reviewScope,
      });

      if (!result.ok || !result.task) {
        setMessage(result.message ?? "单项目试点初始化失败。");
        return;
      }

      setMessage(
        `${isRectificationRerun ? "整改复审新一轮" : "真实试点任务"}已初始化，任务 ${result.task.id}，资料包清单 ${
          result.packet?.inventoryEntries.length ?? 0
        } 项，当前状态 ${result.task.state}。`,
      );
      onComplete?.(result);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "单项目试点初始化失败。");
    } finally {
      setSubmitting(false);
    }
  }

  const missingRequiredFiles = !basisFile || !checklistFile || !packetFile;
  const uploadDisabled = busy || submitting || !portalState.canUploadNewRun;
  const submitDisabled = uploadDisabled || missingRequiredFiles;

  return (
    <section className="opening-panel opening-panel-wide">
      <div className="section-title row">
        <div>
          <span className="eyebrow">{isRectificationRerun ? "整改复审资料接入" : "真实试点资料接入"}</span>
          <h2>{isRectificationRerun ? "上传补正后的依据、核查表和资料包" : "合同依据、核查表和资料包"}</h2>
        </div>
        <button type="button" className="primary" onClick={handleBootstrap} disabled={submitDisabled}>
          {submitting ? "解析中..." : isRectificationRerun ? "上传并创建复审 run" : "开始解析"}
        </button>
      </div>
      {portalState.intakeReadOnly && (
        <div className="opening-report-detail-card">
          <strong>当前展示的是已归档轮次的资料接入记录。</strong>
          <small>新的补件上传入口已收口到报告归档页，避免在多个页面重复创建新 run。</small>
        </div>
      )}
      {isRectificationRerun && (
        <div className="opening-report-detail-card">
          <strong>上一轮已归档，本次上传将创建新的整改复审 run。</strong>
          <small>历史 run 保持只读留存，新 run 会继承当前工作区、合同段和参建单位上下文。</small>
        </div>
      )}
      <div className="opening-trial-upload-grid">
        <label>
          <span>合同/资质依据</span>
          <input type="file" accept=".pdf,.doc,.docx" disabled={uploadDisabled} onChange={(event) => setBasisFile(event.target.files?.[0] ?? null)} />
          <small>{basisFile ? `${basisFile.name} · ${formatFileSize(basisFile.size)}` : "例如：结构资质报审表及附件"}</small>
        </label>
        <label>
          <span>资料核查表</span>
          <input type="file" accept=".doc,.docx,.pdf" disabled={uploadDisabled} onChange={(event) => setChecklistFile(event.target.files?.[0] ?? null)} />
          <small>{checklistFile ? `${checklistFile.name} · ${formatFileSize(checklistFile.size)}` : "例如：承台施工条件核查表"}</small>
        </label>
        <label>
          <span>核查资料包</span>
          <input type="file" accept=".zip" disabled={uploadDisabled} onChange={(event) => setPacketFile(event.target.files?.[0] ?? null)} />
          <small>{packetFile ? `${packetFile.name} · ${formatFileSize(packetFile.size)}` : "上传 ZIP 后由后端提取 manifest"}</small>
        </label>
      </div>
      <small>
        {missingRequiredFiles ? "请先完成三类资料上传后再开始解析。" : message}
      </small>
    </section>
  );
}
