import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Archive,
  BookOpen,
  ClipboardCheck,
  EyeOff,
  FileSearch,
  LogOut,
  RotateCcw,
  ShieldCheck,
  SunMoon,
  Upload,
  Users,
} from "lucide-react";
import { ConnectivityStatus, formatFileSize, MetricBlock, NavButton } from "./appShellDisplay";
import { roleLabels } from "./appShellTypes";
import type { OpeningConditionPortalPage, Role, Session, ThemeMode } from "./appShellTypes";
import {
  bootstrapOpeningConditionPilotTrial,
  uploadMinioDocument,
  type OpeningConditionPilotBasisRecord,
  type OpeningConditionPilotIntakeInitResult,
  type OpeningConditionPilotMasterDataRecord,
  type OpeningConditionPilotReadinessResult,
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
} from "./domain/openingConditionReview";
import type {
  OpeningConditionObjectRef,
  OpeningConditionPilotChecklistDefinitionItem,
  OpeningConditionPilotEvidence,
  OpeningConditionPilotHumanReviewItem,
  OpeningConditionPilotKnowledgeBaseRef,
  OpeningConditionPilotTask,
} from "./domain/openingConditionPilot";
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

const openingWorkspaceNav: Array<{
  id: OpeningConditionPortalPage;
  label: string;
}> = [
  { id: "workspace-context", label: "工作台概览" },
  { id: "material-intake", label: "资料接入" },
  { id: "basis-sets", label: "依据与主数据" },
  { id: "check-tasks", label: "资料核查" },
  { id: "human-review", label: "人工复核" },
  { id: "reports", label: "报告归档" },
];

const readinessLabels: Record<string, string> = {
  ready: "就绪",
  blocked: "阻塞",
  provisional: "待完善",
  missing: "缺失",
  stale: "需刷新",
  unreachable: "不可达",
};

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

type ReportFindingGroup = {
  id: "blocked" | "failed" | "pendingHuman" | "warning";
  title: string;
  description: string;
  tone: "danger" | "warning" | "info" | "muted";
  findings: ReportFinding[];
};

type FinalReviewDisposition =
  | "blocked"
  | "fail"
  | "warning"
  | "needs_human_review"
  | "pass"
  | "not_applicable"
  | "missing_in_current_run"
  | "confirm"
  | "correct"
  | "reject";

type RectificationClosureCategory = "rectified" | "carried_over" | "newly_added" | "pending_human_review";

type RectificationClosureItem = {
  id: string;
  title: string;
  category: string;
  closureCategory: RectificationClosureCategory;
  previousStatus: string;
  currentStatus: string;
  nextAction: string;
};

type RectificationClosureDiff = {
  previousTask: OpeningConditionPilotTask;
  selectedTask: OpeningConditionPilotTask;
  items: RectificationClosureItem[];
  summary: Record<RectificationClosureCategory, number>;
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
  title = "??????",
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
          {summary.readOnly && <span className="opening-report-chip tone-muted">????</span>}
        </div>
      </div>
      {description ? <p>{description}</p> : null}
      <div className="opening-action-summary-grid">
        <div className="opening-action-summary-item">
          <strong>?????</strong>
          <p>{summary.currentOwner}</p>
        </div>
        <div className="opening-action-summary-item">
          <strong>????</strong>
          <p>{summary.nextAction}</p>
        </div>
        <div className="opening-action-summary-item">
          <strong>????</strong>
          <p>{summary.actionReason}</p>
          {summary.activeReviewCount > 0 && <small>???? {summary.activeReviewCount} ?????????</small>}
        </div>
        <div className="opening-action-summary-item">
          <strong>????</strong>
          <p>{summary.recommendedPageLabel}</p>
          <small>
            {summary.primaryActionLabel}
            {summary.blockingCount > 0 ? ` ? ?? ${summary.blockingCount} ?` : ""}
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
    <article className="opening-panel opening-panel-wide">
      <span className="eyebrow">Responsibility Workqueue</span>
      <h2>???????????</h2>
      <p>??? run ????????????????????????????????????</p>
      <div className="opening-report-summary-grid">
        <MetricBlock label="????" value={summary.currentOwner} />
        <MetricBlock label="????" value={summary.dueStateLabel} tone={summary.dueState === "overdue" ? "danger" : summary.dueState === "on_track" ? "success" : "neutral"} />
        <MetricBlock label="???" value={summary.blockingCount} tone={summary.blockingCount > 0 ? "danger" : "success"} />
        <MetricBlock label="????" value={summary.recommendedPageLabel} />
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
  pilotBasisRecords,
  pilotMasterDataRecords,
  pilotKnowledgeBases,
  pilotReadiness,
  pilotStatus,
  pilotBusy,
  onToggleTheme,
  onBack,
  onSelectPage,
  onSelectWorkspace,
  onRefreshPilotTask,
  onInitializePilotTask,
  onPublishPilotBasis,
  onPublishPilotBasisDecision,
  onConfirmPilotMasterData,
  onDecidePilotMasterDataCandidate,
  onRunPilotMatch,
  onEnsureKnowledgeBase,
  onReviewDecision,
  onGenerateReport,
  onArchivePilotTask,
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
  pilotBasisRecords?: OpeningConditionPilotBasisRecord[];
  pilotMasterDataRecords?: OpeningConditionPilotMasterDataRecord[];
  pilotKnowledgeBases?: OpeningConditionPilotKnowledgeBaseRef[];
  pilotReadiness?: OpeningConditionPilotReadinessResult | null;
  pilotStatus: string;
  pilotBusy?: boolean;
  onToggleTheme: () => void;
  onBack: () => void;
  onSelectPage: (page: OpeningConditionPortalPage) => void;
  onSelectWorkspace: (workspaceId: string) => void;
  onRefreshPilotTask?: () => void;
  onInitializePilotTask?: () => void;
  onPublishPilotBasis?: () => void;
  onPublishPilotBasisDecision?: (basisId: string, safeNote?: string) => void;
  onConfirmPilotMasterData?: () => void;
  onDecidePilotMasterDataCandidate?: (
    recordId: string,
    decision: "approve" | "reject" | "publish",
    safeNote?: string,
  ) => void;
  onRunPilotMatch?: () => void;
  onEnsureKnowledgeBase?: () => void;
  onReviewDecision?: (reviewId: string, decision: "confirm" | "correct" | "reject" | "defer") => void;
  onGenerateReport?: () => void;
  onArchivePilotTask?: () => void;
  onStartRectificationRerun?: () => void;
  onTrialBootstrapComplete?: (result: OpeningConditionPilotIntakeInitResult) => void;
  getNextOpeningPilotRunTaskId?: () => string;
}) {
  const activeNav = openingWorkspaceNav.find((item) => item.id === activePage) ?? openingWorkspaceNav[0];

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
              icon={
                item.id === "workspace-context"
                  ? BookOpen
                  : item.id === "material-intake"
                    ? Upload
                    : item.id === "basis-sets"
                      ? BookOpen
                      : item.id === "check-tasks"
                        ? ClipboardCheck
                        : item.id === "human-review"
                          ? FileSearch
                          : Archive
              }
              label={item.label}
              active={activePage === item.id}
              onClick={() => onSelectPage(item.id)}
            />
          ))}
        </nav>

        <div className="shell-sidebar-foot">
          <div className="shell-role-card">
            <span>{roleLabel}</span>
            <strong>{packet.workspaceContext.participatingOrganization}</strong>
            <p>{packet.workspaceContext.contractPackage}</p>
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
        <header className="shell-topbar">
          <div>
            <span className="eyebrow">AI资料审查平台 / 开工条件核查</span>
            <h1>{activeNav.label}</h1>
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

        <div className="opening-workspace-content">
          {activePage === "workspace-context" && (
            <OpeningConditionObjectOverviewPage
              packet={packet}
              workspaces={workspaces}
              selectedWorkspaceId={selectedWorkspaceId}
              pilotTask={pilotTask}
              pilotReadiness={pilotReadiness}
              onSelectWorkspace={onSelectWorkspace}
              onGoToIntake={() => onSelectPage("material-intake")}
              onGoToPage={onSelectPage}
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
              onConfirmPilotMasterData={onConfirmPilotMasterData}
              onDecidePilotMasterDataCandidate={onDecidePilotMasterDataCandidate}
              onRunPilotMatch={onRunPilotMatch}
              onEnsureKnowledgeBase={onEnsureKnowledgeBase}
              onTrialBootstrapComplete={onTrialBootstrapComplete}
              getNextOpeningPilotRunTaskId={getNextOpeningPilotRunTaskId}
              onGoToReports={() => onSelectPage("reports")}
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
            />
          )}
          {activePage === "check-tasks" && <OpeningConditionCheckTasksPage packet={packet} pilotTask={pilotTask} />}
          {activePage === "human-review" && (
            <OpeningConditionHumanReviewQueuePage
              packet={packet}
              pilotTask={pilotTask}
              pilotBusy={pilotBusy}
              onReviewDecision={onReviewDecision}
              onGoToPage={onSelectPage}
            />
          )}
          {activePage === "reports" && (
            <OpeningConditionReportDeliveryWorkbench
              packet={packet}
              pilotTask={pilotTask}
              workspaceTasks={pilotWorkspaceTasks}
              pilotBusy={pilotBusy}
              onGenerateReport={onGenerateReport}
              onArchive={onArchivePilotTask}
              onStartRectificationRerun={onStartRectificationRerun}
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
                disabled={pilotBusy || portalState.currentRunMutationLocked || !basisNeedsPublish}
              >
                发布当前 run 依据
              </button>
            )}
            {onConfirmMasterData && (
              <button
                type="button"
                className="secondary"
                onClick={onConfirmMasterData}
                disabled={pilotBusy || portalState.currentRunMutationLocked || pendingMasterDataCount === 0}
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
                    disabled={pilotBusy || portalState.currentRunMutationLocked || boundBasis.status === "published"}
                  />
                </label>
              )}
              {boundBasis && onPublishBasisDecision && (
                <div className="dialog-actions compact">
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => onPublishBasisDecision(boundBasis.id, basisSafeNote)}
                    disabled={pilotBusy || portalState.currentRunMutationLocked || boundBasis.status === "published"}
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
                  <small>后端状态：{item.statusLabel}</small>
                  {onDecideMasterDataCandidate && item.meta.group !== "published" && item.meta.group !== "exception" && (
                    <>
                      <label className="opening-candidate-note-field">
                        <span>确认备注</span>
                        <textarea
                          value={masterDataNotes[item.id] ?? ""}
                          onChange={(event) => updateMasterDataNote(item.id, event.target.value)}
                          placeholder="例如：人工核验来源文件、发现问题、暂时放行原因。"
                          disabled={pilotBusy || portalState.currentRunMutationLocked}
                        />
                      </label>
                      <div className="dialog-actions compact">
                        <button
                          type="button"
                          className="secondary"
                          onClick={() => onDecideMasterDataCandidate(item.id, "approve", masterDataNotes[item.id])}
                          disabled={pilotBusy || portalState.currentRunMutationLocked}
                        >
                          逐条确认
                        </button>
                        <button
                          type="button"
                          className="secondary danger"
                          onClick={() => onDecideMasterDataCandidate(item.id, "reject", masterDataNotes[item.id])}
                          disabled={pilotBusy || portalState.currentRunMutationLocked}
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
            disabled={pilotBusy || portalState.currentRunMutationLocked || !boundBasis || boundBasis.status === "published"}
          >
            确认并发布当前依据
          </button>
        )}
        {onConfirmMasterData && (
          <button
            type="button"
            className="secondary"
            onClick={onConfirmMasterData}
            disabled={pilotBusy || portalState.currentRunMutationLocked || unresolvedMasterData.length === 0}
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
}: {
  packet: OpeningConditionReviewPacket;
  pilotTask?: OpeningConditionPilotTask | null;
  workspaceTasks?: OpeningConditionPilotTask[];
  basisRecords?: OpeningConditionPilotBasisRecord[];
  masterDataRecords?: OpeningConditionPilotMasterDataRecord[];
  knowledgeBases?: OpeningConditionPilotKnowledgeBaseRef[];
  pilotReadiness?: OpeningConditionPilotReadinessResult | null;
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

  const basisEntries = displayedBasisRecords.map((basis) => {
    const meta = getOpeningConditionBasisPublicationStatusMeta(basis.status);
    return {
      id: basis.id,
      title: basis.title,
      category: openingConditionBasisComponentTypeLabels[basis.componentType] ?? basis.componentType,
      statusLabel:
        openingConditionRecordStatusLabels[basis.status as keyof typeof openingConditionRecordStatusLabels] ?? basis.status,
      meta,
      note: "applicability" in basis ? basis.applicability : "当前依据未记录附加适用说明。",
      secondary:
        basis.publishedAt || basis.confirmedAt
          ? `版本 ${basis.version} · ${basis.publishedAt ? `发布于 ${basis.publishedAt}` : `确认于 ${basis.confirmedAt}`}`
          : `版本 ${basis.version}`,
      isBound: basis.id === boundBasisId,
    };
  });

  const masterEntries = displayedMasterDataRecords.map((record) => {
    const meta = getOpeningConditionMasterDataPublicationStatusMeta(record.status);
    return {
      id: record.id,
      title: record.label,
      category: openingConditionMasterDataTypeLabels[record.type] ?? record.type,
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
    };
  });

  const basisSnapshot = basisEntries.find((entry) => entry.isBound) ?? null;
  const currentRunFacts = masterEntries.filter((entry) => entry.isCurrentRun);
  const boundKnowledgeBase =
    displayedKnowledgeBases.find((knowledgeBase) => knowledgeBase.id === boundKnowledgeBaseId) ?? pilotTask?.knowledgeBaseRef ?? null;

  const basisPending = basisEntries.filter((entry) => entry.meta.group === "pending_confirmation");
  const basisReadyToPublish = basisEntries.filter((entry) => entry.meta.group === "ready_to_publish");
  const basisPublished = basisEntries.filter((entry) => entry.meta.group === "published");
  const basisExceptions = basisEntries.filter((entry) => entry.meta.group === "exception");

  const masterPending = masterEntries.filter((entry) => entry.meta.group === "pending_confirmation");
  const masterReadyToPublish = masterEntries.filter((entry) => entry.meta.group === "ready_to_publish");
  const masterPublished = masterEntries.filter((entry) => entry.meta.group === "published");
  const masterExceptions = masterEntries.filter((entry) => entry.meta.group === "exception");

  function renderGovernanceList(
    items: Array<{
      id: string;
      title: string;
      category: string;
      statusLabel: string;
      meta: { label: string; description: string; tone: string };
      secondary?: string;
      note?: string;
      safeNote?: string;
      isBound?: boolean;
      isCurrentRun?: boolean;
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
            <small>后端状态：{item.statusLabel}</small>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="opening-condition-page">
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
            <span className="eyebrow">Current Run Snapshot</span>
            <h2>当前 run 绑定快照</h2>
          </div>
        </div>
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
}: {
  packet: OpeningConditionReviewPacket;
  pilotTask?: OpeningConditionPilotTask | null;
}) {
  const rows = buildChecklistRows(packet, pilotTask);

  return (
    <section className="opening-panel opening-panel-wide">
      <span className="eyebrow">Checklist Matrix</span>
      <h2>Checklist-driven match status for the current run</h2>
      <div className="opening-condition-meta">
        <span>Manifest {pilotTask?.trialPackage?.diagnostics.inventoryEntryCount ?? 0}</span>
        <span>Evidence {pilotTask?.trialPackage?.matching.evidenceCount ?? 0}</span>
        <span>Human review {pilotTask?.trialPackage?.humanReview.blockingCount ?? 0}</span>
      </div>
      <div className="opening-record-list">
        {rows.map((row) => (
          <div key={row.id}>
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
  onGoToPage,
}: {
  packet: OpeningConditionReviewPacket;
  pilotTask?: OpeningConditionPilotTask | null;
  pilotBusy?: boolean;
  onReviewDecision?: (reviewId: string, decision: "confirm" | "correct" | "reject" | "defer") => void;
  onGoToPage?: (page: OpeningConditionPortalPage) => void;
}) {
  const queue = pilotTask?.humanReviewQueue ?? [];
  const evidenceById = new Map((pilotTask?.evidence ?? []).map((item) => [item.id, item]));
  const checkItemsById = new Map((pilotTask?.checkItems ?? []).map((item) => [item.id, item]));
  const definitionsById = new Map((pilotTask?.checklistDefinition ?? []).map((item) => [item.id, item]));
  const actionOwnership = deriveOpeningConditionRunActionOwnership({ pilotTask });
  const pendingQueue = queue.filter((item) => item.status === "open");
  const deferredQueue = queue.filter((item) => item.status === "deferred");
  const resolvedQueue = queue.filter((item) => item.status !== "open" && item.status !== "deferred");

  function renderQueueItem(item: OpeningConditionPilotHumanReviewItem) {
    const fallbackContext = checkItemsById.get(item.targetId) ?? definitionsById.get(item.targetId);
    const evidenceSummary = item.evidenceIds
      .map((evidenceId) => {
        const evidence = evidenceById.get(evidenceId);
        return evidence ? `${evidence.objectRef.fileName}${evidence.locator ? ` @ ${evidence.locator}` : ""}` : evidenceId;
      })
      .join(" / ");

    return (
      <div key={item.id}>
        <strong>{item.targetLabel ?? fallbackContext?.name ?? item.targetId}</strong>
        <span>
          {(item.category ?? fallbackContext?.category ?? "?????")}
          {(item.subCategory ?? fallbackContext?.subCategory) ? ` / ${item.subCategory ?? fallbackContext?.subCategory}` : ""} | {item.status}
        </span>
        <p>{item.reason}</p>
        {item.ruleExplanation && <small>?????{item.ruleExplanation}</small>}
        {item.expectedEvidenceHints && item.expectedEvidenceHints.length > 0 && (
          <small>?????{item.expectedEvidenceHints.join(" / ")}</small>
        )}
        {evidenceSummary && <small>???{evidenceSummary}</small>}
        {item.safeNote && <small>{item.safeNote}</small>}
        {onReviewDecision && (item.status === "open" || item.status === "deferred") && (
          <div className="dialog-actions">
            <button type="button" className="primary" onClick={() => onReviewDecision(item.id, "confirm")} disabled={pilotBusy}>
              ??
            </button>
            <button type="button" className="secondary" onClick={() => onReviewDecision(item.id, "correct")} disabled={pilotBusy}>
              ??
            </button>
            <button type="button" className="secondary" onClick={() => onReviewDecision(item.id, "defer")} disabled={pilotBusy}>
              ??
            </button>
            <button type="button" className="danger subtle" onClick={() => onReviewDecision(item.id, "reject")} disabled={pilotBusy}>
              ??
            </button>
          </div>
        )}
      </div>
    );
  }

  const groups = [
    {
      key: "pending",
      title: "???",
      description: "???????????????????????????",
      items: pendingQueue,
    },
    {
      key: "deferred",
      title: "???",
      description: "?????????????????????",
      items: deferredQueue,
    },
    {
      key: "resolved",
      title: "???",
      description: "????????????????????????????",
      items: resolvedQueue,
    },
  ];

  return (
    <section className="opening-panel opening-panel-wide">
      <span className="eyebrow">????</span>
      <h2>??????????</h2>
      <div className="opening-condition-meta">
        <span>??? {pendingQueue.length}</span>
        <span>??? {deferredQueue.length}</span>
        <span>??? {resolvedQueue.length}</span>
        <span>?? {pilotTask?.trialPackage?.reportStatus ?? "missing"}</span>
      </div>
      <OpeningConditionResponsibilityBoard summary={actionOwnership} onNavigate={onGoToPage} />
      <OpeningConditionActionOwnershipSummary
        summary={actionOwnership}
        eyebrow="Human Review Ownership"
        title="????????"
        description="????????????????????????????????????????"
      />
      {queue.length > 0 ? (
        groups.map((group) => (
          <div key={group.key} className="opening-record-list">
            <div>
              <strong>{group.title}</strong>
              <span>{group.items.length} ?</span>
              <p>{group.description}</p>
            </div>
            {group.items.length > 0 ? group.items.map(renderQueueItem) : <div><small>?????????</small></div>}
          </div>
        ))
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

  const evidenceById = new Map<string, OpeningConditionPilotEvidence>(pilotTask.evidence.map((item) => [item.id, item]));
  const reviewByTargetId = buildHumanReviewMap(pilotTask.humanReviewQueue);
  const latestReviewByTargetId = buildLatestHumanReviewMap(pilotTask.humanReviewQueue);

  return pilotTask.checkItems
    .filter((item) => isProblemCheckItem(item, latestReviewByTargetId.get(item.id)))
    .map((item) => {
      const latestReview = latestReviewByTargetId.get(item.id);
      const disposition = getCheckItemDisposition(item, latestReview);
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

function compareTaskByUpdatedAtDesc(left: OpeningConditionPilotTask, right: OpeningConditionPilotTask) {
  return Date.parse(right.updatedAt || right.createdAt || "") - Date.parse(left.updatedAt || left.createdAt || "");
}

function buildRunRoundMap(tasks: OpeningConditionPilotTask[]) {
  const ordered = [...tasks].sort((left, right) => Date.parse(left.createdAt || "") - Date.parse(right.createdAt || ""));
  return new Map(ordered.map((task, index) => [task.id, index + 1]));
}

function summarizePreviousRun(currentTask: OpeningConditionPilotTask | null | undefined, tasks: OpeningConditionPilotTask[]) {
  if (!currentTask || tasks.length < 2) {
    return null;
  }
  const sorted = [...tasks].sort(compareTaskByUpdatedAtDesc);
  const index = sorted.findIndex((task) => task.id === currentTask.id);
  if (index < 0) {
    return null;
  }
  const previous = sorted.slice(index + 1).find((task) => task.state === "archived") ?? sorted[index + 1];
  if (!previous) {
    return null;
  }
  const countProblemItems = (task: OpeningConditionPilotTask) => {
    const latestReviewByTargetId = buildLatestHumanReviewMap(task.humanReviewQueue);
    return task.checkItems.filter((item) => isProblemCheckItem(item, latestReviewByTargetId.get(item.id))).length;
  };
  const currentLatestReviewByTargetId = buildLatestHumanReviewMap(currentTask.humanReviewQueue);
  const previousLatestReviewByTargetId = buildLatestHumanReviewMap(previous.humanReviewQueue);
  const currentSet = new Set(
    currentTask.checkItems
      .filter((item) => isProblemCheckItem(item, currentLatestReviewByTargetId.get(item.id)))
      .map((item) => item.id),
  );
  const previousSet = new Set(
    previous.checkItems
      .filter((item) => isProblemCheckItem(item, previousLatestReviewByTargetId.get(item.id)))
      .map((item) => item.id),
  );
  return {
    previousFailed: countProblemItems(previous),
    currentFailed: countProblemItems(currentTask),
    carried: [...currentSet].filter((id) => previousSet.has(id)).length,
  };
}

type PilotCheckItem = OpeningConditionPilotTask["checkItems"][number];

const problemVerdicts = new Set<FinalReviewDisposition>(["fail", "warning", "needs_human_review", "blocked", "reject"]);

function buildHumanReviewMap(queue: OpeningConditionPilotHumanReviewItem[]) {
  const reviewByTargetId = new Map<string, OpeningConditionPilotHumanReviewItem[]>();
  queue.forEach((item) => {
    const current = reviewByTargetId.get(item.targetId) ?? [];
    current.push(item);
    reviewByTargetId.set(item.targetId, current);
  });
  return reviewByTargetId;
}

function buildLatestHumanReviewMap(queue: OpeningConditionPilotHumanReviewItem[]) {
  const latestByTargetId = new Map<string, OpeningConditionPilotHumanReviewItem>();
  queue.forEach((item) => {
    const current = latestByTargetId.get(item.targetId);
    const currentTime = Date.parse(current?.decidedAt || "");
    const nextTime = Date.parse(item.decidedAt || "");
    const currentRank = Number.isNaN(currentTime) ? -1 : currentTime;
    const nextRank = Number.isNaN(nextTime) ? -1 : nextTime;
    if (!current || nextRank >= currentRank) {
      latestByTargetId.set(item.targetId, item);
    }
  });
  return latestByTargetId;
}

function getCheckItemDisposition(
  item?: PilotCheckItem | null,
  latestReview?: OpeningConditionPilotHumanReviewItem | null,
): FinalReviewDisposition {
  if (!item) {
    return "missing_in_current_run";
  }

  switch (latestReview?.status) {
    case "confirmed":
      return "confirm";
    case "corrected":
      return "correct";
    case "rejected":
      return "reject";
    case "open":
    case "deferred":
      return "needs_human_review";
    default:
      return (item.finalDisposition ?? item.verdict) as FinalReviewDisposition;
  }
}

function isProblemCheckItem(
  item?: PilotCheckItem | null,
  latestReview?: OpeningConditionPilotHumanReviewItem | null,
) {
  if (!item) {
    return false;
  }
  return problemVerdicts.has(getCheckItemDisposition(item, latestReview));
}

function getCheckItemCategory(item: PilotCheckItem) {
  return item.subCategory ? `${item.category} / ${item.subCategory}` : item.category;
}

function getPreviousArchivedRun(selectedTask: OpeningConditionPilotTask | null | undefined, tasks: OpeningConditionPilotTask[]) {
  if (!selectedTask) {
    return null;
  }
  const selectedCreatedAt = Date.parse(selectedTask.createdAt || selectedTask.updatedAt || "");
  return [...tasks]
    .filter((task) => task.id !== selectedTask.id && task.state === "archived")
    .filter((task) => Date.parse(task.createdAt || task.updatedAt || "") < selectedCreatedAt)
    .sort(compareTaskByUpdatedAtDesc)[0] ?? null;
}

function getRectificationNextAction(category: RectificationClosureCategory) {
  switch (category) {
    case "rectified":
      return "本项可作为已补齐记录进入本轮报告留痕。";
    case "carried_over":
      return "继续列入整改清单，要求补齐资料后进入下一轮复审。";
    case "newly_added":
      return "作为本轮新增问题补充整改要求，避免只处理上一轮遗留项。";
    case "pending_human_review":
      return "先由监理人工判断是否接受说明、修正或驳回。";
  }
}

function buildRectificationClosureDiff(
  selectedTask: OpeningConditionPilotTask | null | undefined,
  tasks: OpeningConditionPilotTask[],
): RectificationClosureDiff | null {
  const previousTask = getPreviousArchivedRun(selectedTask, tasks);
  if (!selectedTask || !previousTask) {
    return null;
  }

  const previousById = new Map(previousTask.checkItems.map((item) => [item.id, item]));
  const currentById = new Map(selectedTask.checkItems.map((item) => [item.id, item]));
  const previousLatestReviewByTargetId = buildLatestHumanReviewMap(previousTask.humanReviewQueue);
  const currentLatestReviewByTargetId = buildLatestHumanReviewMap(selectedTask.humanReviewQueue);
  const allProblemIds = new Set<string>();
  previousTask.checkItems
    .filter((item) => isProblemCheckItem(item, previousLatestReviewByTargetId.get(item.id)))
    .forEach((item) => allProblemIds.add(item.id));
  selectedTask.checkItems
    .filter((item) => isProblemCheckItem(item, currentLatestReviewByTargetId.get(item.id)))
    .forEach((item) => allProblemIds.add(item.id));

  const items = [...allProblemIds].map((id) => {
    const previousItem = previousById.get(id);
    const currentItem = currentById.get(id);
    const previousProblem = isProblemCheckItem(previousItem, previousLatestReviewByTargetId.get(id));
    const currentProblem = isProblemCheckItem(currentItem, currentLatestReviewByTargetId.get(id));
    const currentDisposition = getCheckItemDisposition(currentItem, currentLatestReviewByTargetId.get(id));
    const closureCategory: RectificationClosureCategory =
      currentDisposition === "needs_human_review"
        ? "pending_human_review"
        : previousProblem && !currentProblem
          ? "rectified"
          : previousProblem && currentProblem
            ? "carried_over"
            : "newly_added";
    const displayItem = currentItem ?? previousItem;

    return {
      id,
      title: displayItem?.name ?? id,
      category: displayItem ? getCheckItemCategory(displayItem) : "未分类",
      closureCategory,
      previousStatus: getFindingDispositionLabel(getCheckItemDisposition(previousItem, previousLatestReviewByTargetId.get(id))),
      currentStatus: currentItem ? getFindingDispositionLabel(currentDisposition) : "本轮未再列为问题",
      nextAction: getRectificationNextAction(closureCategory),
    };
  });

  return {
    previousTask,
    selectedTask,
    items,
    summary: {
      rectified: items.filter((item) => item.closureCategory === "rectified").length,
      carried_over: items.filter((item) => item.closureCategory === "carried_over").length,
      newly_added: items.filter((item) => item.closureCategory === "newly_added").length,
      pending_human_review: items.filter((item) => item.closureCategory === "pending_human_review").length,
    },
  };
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
  const historyTasks = [...(workspaceTasks ?? [])]
    .filter((task) => !hiddenRunIds.has(task.id) || task.id === pilotTask?.id)
    .sort(compareTaskByUpdatedAtDesc);
  const [selectedHistoryTaskId, setSelectedHistoryTaskId] = useState<string | null>(null);
  const selectedTask = historyTasks.find((task) => task.id === selectedHistoryTaskId) ?? pilotTask ?? historyTasks[0] ?? null;
  const reportAsset = selectedTask?.reportAsset;
  const packageDiagnostics = reportAsset?.packageDiagnostics;
  const runRoundMap = buildRunRoundMap(historyTasks);
  const currentRound = selectedTask ? runRoundMap.get(selectedTask.id) : undefined;
  const findings = buildReportFindings(selectedTask);
  const findingGroups = buildReportFindingGroups(findings);
  const closureDiff = buildRectificationClosureDiff(selectedTask, historyTasks);
  const previousRun = summarizePreviousRun(selectedTask, historyTasks);
  const decisionLedger = packageDiagnostics?.decisionLedger ?? [];
  const isCurrentRun = Boolean(selectedTask && pilotTask && selectedTask.id === pilotTask.id);
  const selectedActionOwnership = deriveOpeningConditionRunActionOwnership({ pilotTask: selectedTask });
  const selectedOpenReviewCount =
    selectedTask?.humanReviewQueue.filter((item) => item.status === "open" || item.status === "deferred").length ?? 0;
  const findingSummary = {
    blocked: findings.filter((item) => item.disposition === "blocked").length,
    failed: findings.filter((item) => item.disposition === "fail" || item.disposition === "reject").length,
    pendingHuman: findings.filter((item) => item.disposition === "needs_human_review").length,
    warning: findings.filter((item) => item.disposition === "warning").length,
  };
  const canGenerateReport = Boolean(
    pilotTask && selectedTask?.id === pilotTask.id && pilotTask.state === "report_ready" && selectedOpenReviewCount === 0 && !reportAsset,
  );
  const canStartRectificationRerun = Boolean(
    onStartRectificationRerun && isCurrentRun && selectedTask?.state === "archived" && pilotTask?.state === "archived",
  );

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

          <div className="opening-report-summary-grid">
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
              <strong>提示关注</strong>
              <span>{findingSummary.warning}</span>
              <p>非阻塞提示，但建议跟踪。</p>
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
              <small>{selectedOpenReviewCount} 项仍待处理或延期。</small>
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
                  </div>
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

      {(onGenerateReport || onArchive) && (
        <div className="dialog-actions">
          {onGenerateReport && (
            <button type="button" className="primary" onClick={onGenerateReport} disabled={pilotBusy || !canGenerateReport}>
              生成报告摘要
            </button>
          )}
          {onArchive && reportAsset?.status === "ready" && isCurrentRun && (
            <button type="button" className="secondary" onClick={onArchive} disabled={pilotBusy}>
              归档任务
            </button>
          )}
        </div>
      )}

      {selectedTask && selectedOpenReviewCount > 0 && <small>仍有 {selectedOpenReviewCount} 项人工复核阻塞，处理后才能生成报告。</small>}
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
  const historyTasks = [...(workspaceTasks ?? [])]
    .filter((task) => !hiddenRunIds.has(task.id) || task.id === pilotTask?.id)
    .sort(compareTaskByUpdatedAtDesc);
  const [selectedHistoryTaskId, setSelectedHistoryTaskId] = useState<string | null>(null);
  const selectedTask =
    historyTasks.find((task) => task.id === selectedHistoryTaskId) ??
    pilotTask ??
    historyTasks[0] ??
    null;
  const reportAsset = selectedTask?.reportAsset;
  const packageDiagnostics = reportAsset?.packageDiagnostics;
  const blockingReviewCount =
    selectedTask?.humanReviewQueue.filter((item) => item.status === "open" || item.status === "deferred").length ?? 0;
  const canGenerateReport = Boolean(
    pilotTask && selectedTask?.id === pilotTask.id && pilotTask.state === "report_ready" && blockingReviewCount === 0 && !reportAsset,
  );
  const findings = buildReportFindings(selectedTask);
  const runRoundMap = buildRunRoundMap(historyTasks);
  const currentRound = selectedTask ? runRoundMap.get(selectedTask.id) : undefined;
  const previousRun = summarizePreviousRun(selectedTask, historyTasks);
  const closureDiff = buildRectificationClosureDiff(selectedTask, historyTasks);
  const decisionLedger = packageDiagnostics?.decisionLedger ?? [];
  const isCurrentRun = Boolean(selectedTask && pilotTask && selectedTask.id === pilotTask.id);
  const currentRunArchived = pilotTask?.state === "archived";
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
              {onStartRectificationRerun && currentRunArchived && (
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
          {onStartRectificationRerun && currentRunArchived && (
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
  const matchDisabled = busy || !pilotTask || portalState.currentRunMutationLocked || readinessStatus !== "ready";
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
          <button type="button" className="primary" onClick={onInitialize} disabled={busy || !portalState.canInitializeCurrentRun}>
            {pilotTask ? "重新初始化资料包接入" : "初始化资料包接入"}
          </button>
        )}
        {onPublishBasis && (
          <button type="button" className="secondary" onClick={onPublishBasis} disabled={busy || !portalState.canMutateCurrentRun}>
            发布当前 run 依据
          </button>
        )}
        {onConfirmMasterData && (
          <button type="button" className="secondary" onClick={onConfirmMasterData} disabled={busy || !portalState.canMutateCurrentRun}>
            确认当前 run 主数据
          </button>
        )}
        {onRunMatch && (
          <button type="button" className="primary" onClick={onRunMatch} disabled={matchDisabled}>
            执行正式核查
          </button>
        )}
        {onEnsureKnowledgeBase && (
          <button type="button" className="secondary" onClick={onEnsureKnowledgeBase} disabled={busy || !portalState.canMutateCurrentRun}>
            生成并绑定试点知识库
          </button>
        )}
      </div>
      <strong>{statusMessage}</strong>
      <small>
        {portalState.currentRunMutationLocked
          ? "当前归档轮次只用于查看历史接入事实。请从报告归档页发起下一轮整改复审后，再回到本页上传新资料。"
          : matchDisabled && pilotTask?.state !== "archived" && readinessStatus !== "ready"
          ? readiness?.preflightReadiness?.nextAction ?? "请先完成接入预览确认、依据发布、主数据确认和知识库门禁。"
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
  getNextOpeningPilotRunTaskId,
}: {
  packet: OpeningConditionReviewPacket;
  pilotTask?: OpeningConditionPilotTask | null;
  portalState: OpeningConditionPortalViewState;
  busy?: boolean;
  submittedBy: string;
  onComplete?: (result: OpeningConditionPilotIntakeInitResult) => void;
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

  const disabled = busy || submitting || !portalState.canUploadNewRun;

  return (
    <section className="opening-panel opening-panel-wide">
      <div className="section-title row">
        <div>
          <span className="eyebrow">{isRectificationRerun ? "整改复审资料接入" : "真实试点资料接入"}</span>
          <h2>{isRectificationRerun ? "上传补正后的依据、核查表和资料包" : "合同依据、核查表和资料包"}</h2>
        </div>
        <button type="button" className="primary" onClick={handleBootstrap} disabled={disabled}>
          {submitting ? "接入中..." : isRectificationRerun ? "上传并创建复审 run" : "上传并初始化试点"}
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
          <input type="file" accept=".pdf,.doc,.docx" disabled={disabled} onChange={(event) => setBasisFile(event.target.files?.[0] ?? null)} />
          <small>{basisFile ? `${basisFile.name} · ${formatFileSize(basisFile.size)}` : "例如：结构资质报审表及附件"}</small>
        </label>
        <label>
          <span>资料核查表</span>
          <input type="file" accept=".doc,.docx,.pdf" disabled={disabled} onChange={(event) => setChecklistFile(event.target.files?.[0] ?? null)} />
          <small>{checklistFile ? `${checklistFile.name} · ${formatFileSize(checklistFile.size)}` : "例如：承台施工条件核查表"}</small>
        </label>
        <label>
          <span>核查资料包</span>
          <input type="file" accept=".zip" disabled={disabled} onChange={(event) => setPacketFile(event.target.files?.[0] ?? null)} />
          <small>{packetFile ? `${packetFile.name} · ${formatFileSize(packetFile.size)}` : "上传 ZIP 后由后端提取 manifest"}</small>
        </label>
      </div>
      <small>{message}</small>
    </section>
  );
}
