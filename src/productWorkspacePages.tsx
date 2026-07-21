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
  getOpeningConditionRiskSummary,
  getOpeningConditionVerdictSummary,
  openingConditionRecordStatusLabels,
  openingConditionRiskLabels,
  openingConditionVerdictLabels,
  type OpeningConditionReviewPacket,
  type OpeningConditionWorkspace,
} from "./domain/openingConditionReview";
import type {
  OpeningConditionObjectRef,
  OpeningConditionPilotChecklistDefinitionItem,
  OpeningConditionPilotEvidence,
  OpeningConditionPilotHumanReviewItem,
  OpeningConditionPilotKnowledgeBaseRef,
  OpeningConditionPilotTask,
} from "./domain/openingConditionPilot";

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
  dispositionTone: "danger" | "warning" | "success" | "muted";
  statusLabel: string;
  description: string;
  basis: string;
  rectification: string;
  evidence: string[];
  humanReview: string[];
};

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
  onConfirmPilotMasterData,
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
  onConfirmPilotMasterData?: () => void;
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
            <OpeningConditionOverviewPage
              packet={packet}
              workspaces={workspaces}
              selectedWorkspaceId={selectedWorkspaceId}
              pilotTask={pilotTask}
              pilotReadiness={pilotReadiness}
              onSelectWorkspace={onSelectWorkspace}
              onGoToIntake={() => onSelectPage("material-intake")}
            />
          )}
          {activePage === "material-intake" && (
            <OpeningConditionMaterialIntakePage
              packet={packet}
              roleLabel={roleLabel}
              pilotTask={pilotTask}
              pilotBasisRecords={pilotBasisRecords}
              pilotMasterDataRecords={pilotMasterDataRecords}
              pilotKnowledgeBases={pilotKnowledgeBases}
              pilotReadiness={pilotReadiness}
              pilotStatus={pilotStatus}
              pilotBusy={pilotBusy}
              onRefreshPilotTask={onRefreshPilotTask}
              onInitializePilotTask={onInitializePilotTask}
              onPublishPilotBasis={onPublishPilotBasis}
              onConfirmPilotMasterData={onConfirmPilotMasterData}
              onRunPilotMatch={onRunPilotMatch}
              onEnsureKnowledgeBase={onEnsureKnowledgeBase}
              onTrialBootstrapComplete={onTrialBootstrapComplete}
              getNextOpeningPilotRunTaskId={getNextOpeningPilotRunTaskId}
            />
          )}
          {activePage === "basis-sets" && (
            <OpeningConditionBasisAndMasterDataPage
              packet={packet}
              pilotTask={pilotTask}
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
            />
          )}
          {activePage === "reports" && (
            <OpeningConditionReportArchivePage
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

function OpeningConditionMaterialIntakePage({
  packet,
  roleLabel,
  pilotTask,
  pilotBasisRecords,
  pilotMasterDataRecords,
  pilotKnowledgeBases,
  pilotReadiness,
  pilotStatus,
  pilotBusy,
  onRefreshPilotTask,
  onInitializePilotTask,
  onPublishPilotBasis,
  onConfirmPilotMasterData,
  onRunPilotMatch,
  onEnsureKnowledgeBase,
  onTrialBootstrapComplete,
  getNextOpeningPilotRunTaskId,
}: {
  packet: OpeningConditionReviewPacket;
  roleLabel: string;
  pilotTask?: OpeningConditionPilotTask | null;
  pilotBasisRecords?: OpeningConditionPilotBasisRecord[];
  pilotMasterDataRecords?: OpeningConditionPilotMasterDataRecord[];
  pilotKnowledgeBases?: OpeningConditionPilotKnowledgeBaseRef[];
  pilotReadiness?: OpeningConditionPilotReadinessResult | null;
  pilotStatus: string;
  pilotBusy?: boolean;
  onRefreshPilotTask?: () => void;
  onInitializePilotTask?: () => void;
  onPublishPilotBasis?: () => void;
  onConfirmPilotMasterData?: () => void;
  onRunPilotMatch?: () => void;
  onEnsureKnowledgeBase?: () => void;
  onTrialBootstrapComplete?: (result: OpeningConditionPilotIntakeInitResult) => void;
  getNextOpeningPilotRunTaskId?: () => string;
}) {
  return (
    <div className="opening-condition-page">
      <OpeningConditionRealTrialIntakePanel
        packet={packet}
        pilotTask={pilotTask}
        busy={pilotBusy}
        submittedBy={roleLabel}
        onComplete={onTrialBootstrapComplete}
        getNextOpeningPilotRunTaskId={getNextOpeningPilotRunTaskId}
      />
      <OpeningConditionPilotExecutionPanel
        pilotTask={pilotTask}
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
      <OpeningConditionTrialIntakeOverviewPanel
        pilotTask={pilotTask}
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
  readiness,
  basisRecords,
  masterDataRecords,
  knowledgeBases,
  onPublishBasis,
  onConfirmMasterData,
  pilotBusy,
}: {
  pilotTask?: OpeningConditionPilotTask | null;
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
              <button type="button" className="secondary" onClick={onPublishBasis} disabled={pilotBusy || !basisNeedsPublish}>
                发布当前 run 依据
              </button>
            )}
            {onConfirmMasterData && (
              <button
                type="button"
                className="secondary"
                onClick={onConfirmMasterData}
                disabled={pilotBusy || pendingMasterDataCount === 0}
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
}: {
  packet: OpeningConditionReviewPacket;
  pilotTask?: OpeningConditionPilotTask | null;
  pilotBusy?: boolean;
  onReviewDecision?: (reviewId: string, decision: "confirm" | "correct" | "reject" | "defer") => void;
}) {
  const queue = pilotTask?.humanReviewQueue ?? [];
  const evidenceById = new Map((pilotTask?.evidence ?? []).map((item) => [item.id, item]));
  const checkItemsById = new Map((pilotTask?.checkItems ?? []).map((item) => [item.id, item]));
  const definitionsById = new Map((pilotTask?.checklistDefinition ?? []).map((item) => [item.id, item]));

  return (
    <section className="opening-panel opening-panel-wide">
      <span className="eyebrow">人工复核</span>
      <h2>需要人工确认的核查项</h2>
      <div className="opening-condition-meta">
        <span>待处理 {queue.filter((item) => item.status === "open" || item.status === "deferred").length}</span>
        <span>已确认 {queue.filter((item) => item.status === "confirmed").length}</span>
        <span>报告 {pilotTask?.trialPackage?.reportStatus ?? "missing"}</span>
      </div>
      <div className="opening-record-list">
        {queue.length > 0
          ? queue.map((item) => {
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
                    {(item.category ?? fallbackContext?.category ?? "未解析分类")}
                    {(item.subCategory ?? fallbackContext?.subCategory) ? ` / ${item.subCategory ?? fallbackContext?.subCategory}` : ""} | {item.status}
                  </span>
                  <p>{item.reason}</p>
                  {item.ruleExplanation && <small>核查规则：{item.ruleExplanation}</small>}
                  {item.expectedEvidenceHints && item.expectedEvidenceHints.length > 0 && (
                    <small>期望资料：{item.expectedEvidenceHints.join(" / ")}</small>
                  )}
                  {evidenceSummary && <small>证据：{evidenceSummary}</small>}
                  {item.safeNote && <small>{item.safeNote}</small>}
                  {onReviewDecision && (item.status === "open" || item.status === "deferred") && (
                    <div className="dialog-actions">
                      <button type="button" className="primary" onClick={() => onReviewDecision(item.id, "confirm")} disabled={pilotBusy}>
                        确认
                      </button>
                      <button type="button" className="secondary" onClick={() => onReviewDecision(item.id, "correct")} disabled={pilotBusy}>
                        修正
                      </button>
                      <button type="button" className="secondary" onClick={() => onReviewDecision(item.id, "defer")} disabled={pilotBusy}>
                        延期
                      </button>
                      <button type="button" className="danger subtle" onClick={() => onReviewDecision(item.id, "reject")} disabled={pilotBusy}>
                        驳回
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          : packet.humanReviewQueue.map((item) => (
              <div key={item.id}>
                <strong>{item.targetId}</strong>
                <span>{item.trigger}</span>
                <p>{item.reason}</p>
              </div>
            ))}
      </div>
    </section>
  );
}

function buildReportFindings(pilotTask?: OpeningConditionPilotTask | null): ReportFinding[] {
  if (!pilotTask) {
    return [];
  }

  const evidenceById = new Map<string, OpeningConditionPilotEvidence>(pilotTask.evidence.map((item) => [item.id, item]));
  const reviewByTargetId = new Map<string, OpeningConditionPilotHumanReviewItem[]>();
  pilotTask.humanReviewQueue.forEach((item) => {
    const current = reviewByTargetId.get(item.targetId) ?? [];
    current.push(item);
    reviewByTargetId.set(item.targetId, current);
  });

  return pilotTask.checkItems
    .filter((item) => ["fail", "warning", "needs_human_review", "blocked"].includes(item.verdict))
    .map((item) => {
      const severity =
        item.finalDisposition === "blocked" || (item.required && item.verdict === "fail")
          ? "high"
          : item.verdict === "fail" || item.verdict === "needs_human_review"
            ? "medium"
            : "low";
      const disposition = item.finalDisposition ?? item.verdict;
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
          item.documentPresence === "missing"
            ? "补齐对应资料后重新提交复审。"
            : item.verdict === "blocked"
              ? "先解决前置依据或授权边界阻塞，再重新发起复审。"
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
  const failedLike = (task: OpeningConditionPilotTask) =>
    task.checkItems.filter((item) => item.verdict === "fail" || item.verdict === "blocked").length;
  const currentSet = new Set(
    currentTask.checkItems
      .filter((item) => item.verdict === "fail" || item.verdict === "blocked" || item.verdict === "needs_human_review")
      .map((item) => item.id),
  );
  const previousSet = new Set(
    previous.checkItems
      .filter((item) => item.verdict === "fail" || item.verdict === "blocked" || item.verdict === "needs_human_review")
      .map((item) => item.id),
  );
  return {
    previousFailed: failedLike(previous),
    currentFailed: failedLike(currentTask),
    carried: [...currentSet].filter((id) => previousSet.has(id)).length,
  };
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
  const decisionLedger = packageDiagnostics?.decisionLedger ?? [];
  const isCurrentRun = Boolean(selectedTask && pilotTask && selectedTask.id === pilotTask.id);
  const currentRunArchived = pilotTask?.state === "archived";
  const findingSummary = {
    blocked: findings.filter((item) => item.disposition === "blocked").length,
    failed: findings.filter((item) => item.disposition === "fail").length,
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
                {task.checkItems.filter((item) => item.verdict === "fail" || item.verdict === "blocked").length} 项 / 待复核{" "}
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
  const matchDisabled = busy || !pilotTask || pilotTask.state === "archived" || readinessStatus !== "ready";

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
      <div className="dialog-actions">
        {onInitialize && (
          <button type="button" className="primary" onClick={onInitialize} disabled={busy}>
            {pilotTask ? "重新初始化资料包接入" : "初始化资料包接入"}
          </button>
        )}
        {onPublishBasis && (
          <button type="button" className="secondary" onClick={onPublishBasis} disabled={busy || !pilotTask}>
            发布当前 run 依据
          </button>
        )}
        {onConfirmMasterData && (
          <button type="button" className="secondary" onClick={onConfirmMasterData} disabled={busy || !pilotTask}>
            确认当前 run 主数据
          </button>
        )}
        {onRunMatch && (
          <button type="button" className="primary" onClick={onRunMatch} disabled={matchDisabled}>
            执行正式核查
          </button>
        )}
        {onEnsureKnowledgeBase && (
          <button type="button" className="secondary" onClick={onEnsureKnowledgeBase} disabled={busy}>
            生成并绑定试点知识库
          </button>
        )}
      </div>
      <strong>{statusMessage}</strong>
      <small>
        {matchDisabled && pilotTask?.state !== "archived" && readinessStatus !== "ready"
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
  busy,
  submittedBy,
  onComplete,
  getNextOpeningPilotRunTaskId,
}: {
  packet: OpeningConditionReviewPacket;
  pilotTask?: OpeningConditionPilotTask | null;
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
  const isRectificationRerun = pilotTask?.state === "archived";

  async function handleBootstrap() {
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
        pilotTask?.state === "archived"
          ? (getNextOpeningPilotRunTaskId?.() ?? `oc-pilot-${packet.workspaceId}-run-${Date.now()}`)
          : (pilotTask?.id ?? `oc-pilot-${packet.workspaceId}`);

      const result = await bootstrapOpeningConditionPilotTrial({
        taskId,
        context: {
          workspaceId: packet.workspaceId,
          tenantId: workspace.tenantName || "tenant-opening-condition",
          projectId: workspace.projectName || packet.projectName,
          contractPackageId: workspace.contractPackage || "contract-package",
          participatingOrganizationId: workspace.participatingOrganization || "organization",
        },
        basisObject,
        checklistObject,
        sourceObjects: [sourceObject],
        subcontractTeamId: workspace.participatingOrganization,
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

  const disabled = busy || submitting;

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
