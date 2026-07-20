import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Archive,
  BookOpen,
  ClipboardCheck,
  FileArchive,
  FileSearch,
  FileText,
  LayoutDashboard,
  LogOut,
  ShieldCheck,
  SunMoon,
  Upload,
  Users,
} from "lucide-react";
import { ConnectivityStatus, formatFileSize, MetricBlock, NavButton } from "./appShellDisplay";
import { roleLabels } from "./appShellTypes";
import type { OpeningConditionPortalPage, Role, Session, ThemeMode, UploadDraft } from "./appShellTypes";
import { ReviewWorkbenchPage } from "./ReviewWorkbenchPage";
import {
  bootstrapOpeningConditionPilotTrial,
  uploadMinioDocument,
  type OpeningConditionPilotIntakeInitResult,
  type OpeningConditionPilotReadinessResult,
} from "./domain/backendConnectivity";
import type { ProductLauncherEntry, ProductPortalId } from "./domain/productPortal";
import {
  getOpeningConditionRiskSummary,
  getOpeningConditionVerdictSummary,
  openingConditionRecordStatusLabels,
  openingConditionRiskLabels,
  openingConditionVerdictLabels,
  type OpeningConditionCheckItem,
  type OpeningConditionReviewPacket,
  type OpeningConditionWorkspace,
} from "./domain/openingConditionReview";
import type { OpeningConditionPilotTask } from "./domain/openingConditionPilot";
import { createSeedReviewTasks } from "./domain/mockReviewTaskSeeds";
import type { ReviewTask } from "./domain/reviewTypes";

type ConstructionPlanWorkspacePage = "documents" | "knowledge-base" | "data-assets" | "review-workbench";

const constructionWorkspaceNav: Array<{
  id: ConstructionPlanWorkspacePage;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: "documents", label: "文档库", icon: FileText },
  { id: "knowledge-base", label: "知识库", icon: BookOpen },
  { id: "data-assets", label: "数据资产", icon: FileArchive },
  { id: "review-workbench", label: "审查工作台", icon: ClipboardCheck },
];

const openingWorkspaceNav: Array<{
  id: OpeningConditionPortalPage;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: "workspace-context", label: "工作台概览", icon: LayoutDashboard },
  { id: "material-intake", label: "资料接入", icon: Upload },
  { id: "basis-sets", label: "依据与主数据", icon: BookOpen },
  { id: "check-tasks", label: "资料核查", icon: ClipboardCheck },
  { id: "human-review", label: "人工复核", icon: FileSearch },
  { id: "reports", label: "报告归档", icon: Archive },
];

const readinessLabels: Record<string, string> = {
  ready: "就绪",
  blocked: "阻塞",
  provisional: "待完善",
  missing: "缺失",
  stale: "需刷新",
  unreachable: "不可达",
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
          <p>统一登录后进入业务选择门户。施工方案审查与开工条件核查拥有各自入口和工作台，共享底层 OCR、对象存储、LLM 与知识库能力。</p>
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
          <p>两个业务产品各自进入独立工作台。底层能力可以共享，但项目上下文、上传资料、核查任务和人工结论保持隔离。</p>
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
              {entry.id === "construction-plan-review" ? <FileText size={16} /> : <ClipboardCheck size={16} />}
              {entry.primaryActionLabel}
            </button>
          </article>
        ))}
      </section>

      <footer className="product-launcher-footer">
        <strong>{username}</strong>
        <span>当前身份：{roleLabel}。进入业务门户后可返回这里重新选择产品。</span>
      </footer>
    </main>
  );
}

function createConstructionPlanSeedTasks() {
  const cleanNames = [
    {
      name: "南京综合楼施工组织设计.pdf",
      project: "南京综合楼项目",
      uploader: "张工",
      updatedAt: "2026-07-09 09:12",
    },
    {
      name: "塔吊专项施工方案.docx",
      project: "南京综合楼项目",
      uploader: "李工",
      updatedAt: "2026-07-08 18:43",
    },
    {
      name: "脚手架专项方案（整改版）.pdf",
      project: "西湖机电安装项目",
      uploader: "王工",
      updatedAt: "2026-07-07 15:20",
    },
    {
      name: "临时用电方案（初稿）.pdf",
      project: "东苏住宅项目",
      uploader: "陈工",
      updatedAt: "2026-07-09 08:20",
    },
  ];

  return createSeedReviewTasks().map((task, index) => ({
    ...task,
    ...(cleanNames[index] ?? {}),
  }));
}

export function ConstructionPlanWorkspaceShell({
  role,
  roleLabel,
  themeMode,
  onToggleTheme,
  onBack,
}: {
  role: Role;
  roleLabel: string;
  themeMode: ThemeMode;
  onToggleTheme: () => void;
  onBack: () => void;
}) {
  const [activePage, setActivePage] = useState<ConstructionPlanWorkspacePage>("documents");
  const [documents, setDocuments] = useState<ReviewTask[]>(() => createConstructionPlanSeedTasks());
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>(() => documents[0]?.id ?? "");
  const [uploadDraft, setUploadDraft] = useState<UploadDraft>({ name: "", project: "" });
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const activeNav = constructionWorkspaceNav.find((item) => item.id === activePage) ?? constructionWorkspaceNav[0];
  const selectedDocument = documents.find((document) => document.id === selectedDocumentId) ?? documents[0];
  const summary = useMemo(
    () => ({
      total: documents.length,
      ready: documents.filter((item) => item.status === "ready").length,
      reviewing: documents.filter((item) => item.status === "reviewing" || item.status === "parsing").length,
      completed: documents.filter((item) => item.status === "completed").length,
    }),
    [documents],
  );

  function openWorkbench(documentId: string) {
    setSelectedDocumentId(documentId);
    setActivePage("review-workbench");
  }

  function addDocument() {
    const template = documents[0];
    if (!template) {
      return;
    }

    const nextName = uploadDraft.name.trim() || stagedFile?.name || "新上传施工方案";
    const nextProject = uploadDraft.project.trim() || "未命名项目";
    const nextTask: ReviewTask = {
      ...structuredClone(template),
      id: `doc-local-${Date.now()}`,
      name: nextName,
      project: nextProject,
      uploader: roleLabel,
      updatedAt: new Date().toLocaleString("zh-CN", { hour12: false }),
      status: stagedFile ? "uploaded" : "ready",
      mode: role === "contractor" ? "revise" : "review",
      resultAsset: undefined,
      sourceObject: stagedFile
        ? {
            bucket: "local-staged",
            key: stagedFile.name,
            originalFilename: stagedFile.name,
            contentType: stagedFile.type || "application/octet-stream",
            size: stagedFile.size,
          }
        : undefined,
    };

    setDocuments((current) => [nextTask, ...current]);
    setSelectedDocumentId(nextTask.id);
    setUploadDraft({ name: "", project: "" });
    setStagedFile(null);
    setUploadError(stagedFile ? "当前切片只恢复工作台结构，真实上传仍走既有接入链路；此处先创建本地任务用于审查入口验证。" : "");
  }

  function deleteDocument(documentId: string) {
    setDocuments((current) => {
      const next = current.filter((document) => document.id !== documentId);
      if (selectedDocumentId === documentId) {
        setSelectedDocumentId(next[0]?.id ?? "");
      }
      return next;
    });
  }

  function renderContent() {
    if (activePage === "review-workbench") {
      return selectedDocument ? (
        <ReviewWorkbenchPage
          roleLabel={roleLabel}
          documentName={selectedDocument.name}
          projectName={selectedDocument.project}
          themeMode={themeMode}
          onToggleTheme={onToggleTheme}
          allowedModes={role === "contractor" ? ["revise"] : role === "supervisor" ? ["review"] : ["review", "revise"]}
          paragraphs={selectedDocument.paragraphs}
          initialIssues={selectedDocument.issues}
          recoveredStructure={selectedDocument.recoveredStructure}
          onBack={() => setActivePage("documents")}
        />
      ) : (
        <ConstructionPlanEmptyState onGoDocuments={() => setActivePage("documents")} />
      );
    }

    if (activePage === "knowledge-base") {
      return (
        <section className="opening-panel opening-panel-wide">
          <span className="eyebrow">施工方案知识库</span>
          <h2>规范依据、项目文件和历史审查经验</h2>
          <p>这里保留施工方案审查自己的知识库入口。后续可接入规范库、企业标准、项目合同图纸和历史审查问题，不与开工条件核查的分包队伍知识库混用。</p>
          <div className="product-service-list">
            <span>规范条文库</span>
            <span>项目依据库</span>
            <span>历史问题库</span>
            <span>审查模板库</span>
          </div>
        </section>
      );
    }

    if (activePage === "data-assets") {
      return (
        <section className="opening-panel opening-panel-wide">
          <span className="eyebrow">数据资产</span>
          <h2>智能体、提示词和后端连通性</h2>
          <p>施工方案审查的数据资产应服务于方案文档审查，包括 OCR 结构恢复、规范检索、问题生成、人工决策和报告归档能力。</p>
          <div className="connectivity-grid">
            <ConnectivityStatus title="OCR" status="pending" detail="复用平台 OCR 接入能力，按任务状态展示安全摘要。" />
            <ConnectivityStatus title="LLM" status="pending" detail="复用平台 LLM 适配器，不在前端暴露密钥。" />
            <ConnectivityStatus title="对象存储" status="pending" detail="复用 MinIO 文档接入能力，文档状态归属施工方案产品。" />
            <ConnectivityStatus title="知识库" status="pending" detail="施工方案知识库与开工条件资料包知识库保持业务隔离。" />
          </div>
        </section>
      );
    }

    return (
      <ConstructionPlanDocumentLibrary
        documents={documents}
        summary={summary}
        uploadDraft={uploadDraft}
        stagedFile={stagedFile}
        dragging={dragging}
        uploadError={uploadError}
        onUploadDraftChange={setUploadDraft}
        onAddDocument={addDocument}
        onFileSelect={(file) => {
          setStagedFile(file);
          setUploadError("");
        }}
        onStagedFileRemove={() => setStagedFile(null)}
        onDragChange={setDragging}
        onOpenDocument={openWorkbench}
        onStartReview={openWorkbench}
        onDeleteDocument={deleteDocument}
      />
    );
  }

  return (
    <main className="platform-shell construction-plan-shell">
      <aside className="shell-sidebar">
        <div className="shell-brand">
          <div className="shell-brand-mark">方</div>
          <div>
            <strong>施工方案审查</strong>
            <span>Construction plan workspace</span>
          </div>
        </div>

        <nav className="shell-nav" aria-label="施工方案审查导航">
          {constructionWorkspaceNav.map((item) => (
            <NavButton
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activePage === item.id}
              onClick={() => setActivePage(item.id)}
            />
          ))}
        </nav>

        <div className="shell-sidebar-foot">
          <div className="shell-role-card">
            <span>{roleLabel}</span>
            <strong>施工方案审查工作台</strong>
            <p>文档库、知识库、数据资产和审查详情保持在同一产品工作区内。</p>
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
            <span className="eyebrow">AI资料审查平台 / 施工方案审查</span>
            <h1>{activeNav.label}</h1>
          </div>
          <div className="shell-topbar-actions">
            <span className="shell-role-pill">
              <Users size={14} />
              {roleLabel}
            </span>
          </div>
        </header>
        <div className="construction-workspace-content">{renderContent()}</div>
      </section>
    </main>
  );
}

function ConstructionPlanDocumentLibrary({
  documents,
  summary,
  uploadDraft,
  stagedFile,
  dragging,
  uploadError,
  onUploadDraftChange,
  onAddDocument,
  onFileSelect,
  onStagedFileRemove,
  onDragChange,
  onOpenDocument,
  onStartReview,
  onDeleteDocument,
}: {
  documents: ReviewTask[];
  summary: { total: number; ready: number; reviewing: number; completed: number };
  uploadDraft: UploadDraft;
  stagedFile: File | null;
  dragging: boolean;
  uploadError: string;
  onUploadDraftChange: (draft: UploadDraft) => void;
  onAddDocument: () => void;
  onFileSelect: (file: File) => void;
  onStagedFileRemove: () => void;
  onDragChange: (value: boolean) => void;
  onOpenDocument: (documentId: string) => void;
  onStartReview: (documentId: string) => void;
  onDeleteDocument: (documentId: string) => void;
}) {
  return (
    <div className="construction-library-page">
      <section className="opening-condition-hero construction-library-hero">
        <div>
          <span className="eyebrow">文档库</span>
          <h2>先管理施工方案文档，再进入审查工作台</h2>
          <p>施工方案审查恢复为标准平台工作流：上传或选择文档，完成 OCR/审查准备后，再进入右侧审查工作台处理问题和生成报告。</p>
        </div>
        <div className="opening-condition-verdict">
          <strong>{summary.total}</strong>
          <span>份文档</span>
        </div>
      </section>

      <section className="opening-metric-grid">
        <MetricBlock label="文档总数" value={summary.total} />
        <MetricBlock label="待审查" value={summary.ready} />
        <MetricBlock label="处理中" value={summary.reviewing} />
        <MetricBlock label="已完成" value={summary.completed} tone="success" />
      </section>

      <section className="construction-library-grid">
        <article className="opening-panel construction-upload-panel">
          <span className="eyebrow">上传文档</span>
          <h2>创建新的施工方案审查任务</h2>
          <div
            className={dragging ? "upload-dropzone dragging" : "upload-dropzone"}
            onDragOver={(event) => {
              event.preventDefault();
              onDragChange(true);
            }}
            onDragLeave={() => onDragChange(false)}
            onDrop={(event) => {
              event.preventDefault();
              onDragChange(false);
              const file = event.dataTransfer.files[0];
              if (file) onFileSelect(file);
            }}
          >
            <input
              className="upload-input"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  onFileSelect(file);
                  event.target.value = "";
                }
              }}
            />
            <div className="upload-dropzone-body">
              <Upload size={22} />
              <span>拖拽施工方案到此处</span>
              <small>支持 PDF、Word。确认添加后进入文档库。</small>
            </div>
          </div>
          {stagedFile && (
            <div className="staged-file-card" title={stagedFile.name}>
              <div>
                <strong>{stagedFile.name}</strong>
                <small>{formatFileSize(stagedFile.size)} · 待添加</small>
              </div>
              <button type="button" onClick={onStagedFileRemove}>
                移除
              </button>
            </div>
          )}
          <div className="library-form">
            <label>
              <span>文档名称</span>
              <input
                value={uploadDraft.name}
                onChange={(event) => onUploadDraftChange({ ...uploadDraft, name: event.target.value })}
                placeholder="例如：承台专项施工方案"
              />
            </label>
            <label>
              <span>项目名称</span>
              <input
                value={uploadDraft.project}
                onChange={(event) => onUploadDraftChange({ ...uploadDraft, project: event.target.value })}
                placeholder="例如：G15嘉金段改扩建工程"
              />
            </label>
            <button type="button" className="primary" onClick={onAddDocument}>
              添加文档
            </button>
          </div>
          {uploadError && <div className="connectivity-error">{uploadError}</div>}
        </article>

        <section className="construction-document-list">
          {documents.map((document) => (
            <article key={document.id} className="document-card">
              <div className="document-card-head">
                <div>
                  <span className="eyebrow">任务 {document.id}</span>
                  <h3>{document.name}</h3>
                </div>
                <button type="button" className="ghost-icon" onClick={() => onDeleteDocument(document.id)}>
                  删除
                </button>
              </div>
              <p>{document.project}</p>
              <div className="document-card-meta">
                <span className={`status-pill status-${document.status}`}>{document.status}</span>
                <span className="mode-pill">{document.mode === "review" ? "审查模式" : "审查修改模式"}</span>
              </div>
              <div className="dialog-actions">
                <button type="button" className="secondary" onClick={() => onOpenDocument(document.id)}>
                  打开
                </button>
                <button type="button" className="primary" onClick={() => onStartReview(document.id)}>
                  进入审查
                </button>
              </div>
            </article>
          ))}
        </section>
      </section>
    </div>
  );
}

function ConstructionPlanEmptyState({ onGoDocuments }: { onGoDocuments: () => void }) {
  return (
    <section className="opening-panel opening-panel-wide">
      <span className="eyebrow">审查工作台</span>
      <h2>请先从文档库选择施工方案</h2>
      <p>审查工作台是文档任务的详情面，不再作为施工方案产品的默认入口。</p>
      <button type="button" className="primary" onClick={onGoDocuments}>
        返回文档库
      </button>
    </section>
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
  pilotReadiness,
  pilotStatus,
  pilotBusy,
  onToggleTheme,
  onBack,
  onSelectPage,
  onSelectWorkspace,
  onRefreshPilotTask,
  onInitializePilotTask,
  onRunPilotMatch,
  onEnsureKnowledgeBase,
  onReviewDecision,
  onGenerateReport,
  onArchivePilotTask,
  onTrialBootstrapComplete,
}: {
  roleLabel: string;
  themeMode: ThemeMode;
  activePage: OpeningConditionPortalPage;
  workspaces: OpeningConditionWorkspace[];
  selectedWorkspaceId: string;
  packet: OpeningConditionReviewPacket;
  pilotTask?: OpeningConditionPilotTask | null;
  pilotReadiness?: OpeningConditionPilotReadinessResult | null;
  pilotStatus: string;
  pilotBusy?: boolean;
  onToggleTheme: () => void;
  onBack: () => void;
  onSelectPage: (page: OpeningConditionPortalPage) => void;
  onSelectWorkspace: (workspaceId: string) => void;
  onRefreshPilotTask?: () => void;
  onInitializePilotTask?: () => void;
  onRunPilotMatch?: () => void;
  onEnsureKnowledgeBase?: () => void;
  onReviewDecision?: (reviewId: string, decision: "confirm" | "correct" | "reject" | "defer") => void;
  onGenerateReport?: () => void;
  onArchivePilotTask?: () => void;
  onTrialBootstrapComplete?: (result: OpeningConditionPilotIntakeInitResult) => void;
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
              icon={item.icon}
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
              pilotReadiness={pilotReadiness}
              pilotStatus={pilotStatus}
              pilotBusy={pilotBusy}
              onRefreshPilotTask={onRefreshPilotTask}
              onInitializePilotTask={onInitializePilotTask}
              onRunPilotMatch={onRunPilotMatch}
              onEnsureKnowledgeBase={onEnsureKnowledgeBase}
              onTrialBootstrapComplete={onTrialBootstrapComplete}
            />
          )}
          {activePage === "basis-sets" && <OpeningConditionBasisAndMasterDataPage packet={packet} />}
          {activePage === "master-data" && <OpeningConditionBasisAndMasterDataPage packet={packet} defaultSection="master-data" />}
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
              pilotBusy={pilotBusy}
              onGenerateReport={onGenerateReport}
              onArchive={onArchivePilotTask}
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
  const readinessStatus = readiness.status;

  return (
    <div className="opening-condition-page">
      <section className="opening-condition-hero opening-workspace-hero">
        <div>
          <span className="eyebrow">单项目真实试点闭环</span>
          <h2>{packet.projectName}</h2>
          <p>
            当前工作台按正式平台流程组织：先确认项目与参与机构，再接入合同依据、核查表和资料包，之后进入资料核查、人工复核和报告归档。
          </p>
          <div className="opening-condition-meta">
            <span>{packet.reviewTarget}</span>
            <span>{packet.workspaceContext.contractPackage}</span>
            <span>{packet.workspaceContext.participatingOrganization}</span>
          </div>
        </div>
        <div className="opening-condition-verdict">
          <strong>{verdictSummary.needsHumanReview}</strong>
          <span>项待人工复核</span>
        </div>
      </section>

      <section className="opening-metric-grid">
        <MetricBlock label="核查项" value={verdictSummary.total} />
        <MetricBlock label="符合" value={verdictSummary.passed} tone="success" />
        <MetricBlock label="不符合" value={verdictSummary.failed} tone={verdictSummary.failed > 0 ? "danger" : "neutral"} />
        <MetricBlock label="高风险" value={riskSummary.high + riskSummary.critical} tone="danger" />
        <MetricBlock label="依据状态" value={readinessLabels[readiness.basis] ?? readiness.basis} />
        <MetricBlock label="资料包" value={readinessLabels[readiness.materialPacket] ?? readiness.materialPacket} />
      </section>

      <section className="opening-condition-grid">
        <article className="opening-panel">
          <span className="eyebrow">当前工作区</span>
          <h2>项目、标段和机构先行</h2>
          <div className="opening-record-list">
            {workspaces.map((workspace) => (
              <div key={workspace.id} className={workspace.id === selectedWorkspaceId ? "opening-selected-record" : ""}>
                <strong>{workspace.projectName}</strong>
                <span>{workspace.contractPackage}</span>
                <p>{workspace.participatingOrganization}</p>
                <button type="button" className="secondary" onClick={() => onSelectWorkspace(workspace.id)}>
                  {workspace.id === selectedWorkspaceId ? "当前工作区" : "切换到此工作区"}
                </button>
              </div>
            ))}
          </div>
        </article>

        <article className="opening-panel">
          <span className="eyebrow">正式核查门禁</span>
          <h2>{readinessStatus === "ready" ? "前置条件基本就绪" : "仍需补齐前置条件"}</h2>
          <p>{readiness.nextAction}</p>
          <div className="opening-condition-meta">
            <span>依据 {readinessLabels[readiness.basis] ?? readiness.basis}</span>
            <span>主数据 {readinessLabels[readiness.masterData] ?? readiness.masterData}</span>
            <span>知识库 {readinessLabels[readiness.knowledgeBase] ?? readiness.knowledgeBase}</span>
            <span>任务 {pilotTask?.state ?? "未初始化"}</span>
          </div>
          <button type="button" className="primary" onClick={onGoToIntake}>
            进入资料接入
          </button>
        </article>
      </section>
    </div>
  );
}

function OpeningConditionMaterialIntakePage({
  packet,
  roleLabel,
  pilotTask,
  pilotReadiness,
  pilotStatus,
  pilotBusy,
  onRefreshPilotTask,
  onInitializePilotTask,
  onRunPilotMatch,
  onEnsureKnowledgeBase,
  onTrialBootstrapComplete,
}: {
  packet: OpeningConditionReviewPacket;
  roleLabel: string;
  pilotTask?: OpeningConditionPilotTask | null;
  pilotReadiness?: OpeningConditionPilotReadinessResult | null;
  pilotStatus: string;
  pilotBusy?: boolean;
  onRefreshPilotTask?: () => void;
  onInitializePilotTask?: () => void;
  onRunPilotMatch?: () => void;
  onEnsureKnowledgeBase?: () => void;
  onTrialBootstrapComplete?: (result: OpeningConditionPilotIntakeInitResult) => void;
}) {
  return (
    <div className="opening-condition-page">
      <OpeningConditionRealTrialIntakePanel
        packet={packet}
        busy={pilotBusy}
        submittedBy={roleLabel}
        onComplete={onTrialBootstrapComplete}
      />
      <OpeningConditionPilotExecutionPanel
        pilotTask={pilotTask}
        readiness={pilotReadiness}
        statusMessage={pilotStatus}
        busy={pilotBusy}
        onRefresh={onRefreshPilotTask}
        onInitialize={onInitializePilotTask}
        onRunMatch={onRunPilotMatch}
        onEnsureKnowledgeBase={onEnsureKnowledgeBase}
      />
      <section className="opening-condition-grid">
        <article className="opening-panel">
          <span className="eyebrow">资料包职责</span>
          <h2>平台先拆清单，再交给 provider</h2>
          <p>ZIP 内文件的项目归属、类型初判、是否纳入本次核查、人工确认状态由前置平台负责；MaxKB 侧只接收带 metadata 的 OCR 派生产物并提供召回支撑。</p>
        </article>
        <article className="opening-panel">
          <span className="eyebrow">当前支撑能力</span>
          <h2>OCR Worker / MaxKB Provider Proxy</h2>
          <p>本轮不要求浏览器直连 MaxKB，也不把 MaxKB 管理账号放到前置平台。平台只调用安全 proxy，并保存安全 provider refs。</p>
        </article>
      </section>
    </div>
  );
}

function OpeningConditionBasisAndMasterDataPage({
  packet,
  defaultSection = "basis",
}: {
  packet: OpeningConditionReviewPacket;
  defaultSection?: "basis" | "master-data";
}) {
  return (
    <div className="opening-condition-grid">
      <article className={`opening-panel ${defaultSection === "basis" ? "opening-panel-emphasis" : ""}`}>
        <span className="eyebrow">判定依据</span>
        <h2>合同、核查表与专项依据</h2>
        <div className="opening-record-list">
          {packet.basisVersions.map((basis) => (
            <div key={basis.id}>
              <strong>{basis.title}</strong>
              <span>
                {openingConditionRecordStatusLabels[basis.status]} · {basis.componentType} · {basis.confidence}
              </span>
              <p>{basis.applicability}</p>
            </div>
          ))}
        </div>
      </article>

      <article className={`opening-panel ${defaultSection === "master-data" ? "opening-panel-emphasis" : ""}`}>
        <span className="eyebrow">项目主数据</span>
        <h2>人员和设备以平台事实为准</h2>
        <div className="opening-record-list">
          {packet.masterData.map((record) => (
            <div key={record.id}>
              <strong>{record.label}</strong>
              <span>
                {record.type} · {openingConditionRecordStatusLabels[record.status]} · {record.confidence}
              </span>
              <p>{record.validity}</p>
              {record.reviewNeededReason && <small>{record.reviewNeededReason}</small>}
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}

function OpeningConditionCheckTasksPage({
  packet,
  pilotTask,
}: {
  packet: OpeningConditionReviewPacket;
  pilotTask?: OpeningConditionPilotTask | null;
}) {
  const pilotItems = pilotTask?.checkItems ?? [];
  const pilotEvidence = pilotTask?.evidence ?? [];

  return (
    <div className="opening-condition-grid">
      <section className="opening-panel opening-panel-wide">
        <span className="eyebrow">资料核查</span>
        <h2>只核查资料范围，现场核查先标记为不适用</h2>
        <div className="opening-check-list">
          {pilotItems.length > 0
            ? pilotItems.map((item) => (
                <article key={item.id} className={`opening-check-row verdict-${item.verdict.replace(/_/g, "-")}`}>
                  <div>
                    <span className="eyebrow">{item.category}</span>
                    <h3>{item.name}</h3>
                    <p>{item.ruleExplanation}</p>
                    {item.semanticNote && <small>{item.semanticNote}</small>}
                    {item.evidenceIds.length > 0 && <small>证据 {item.evidenceIds.join(" / ")}</small>}
                    {item.humanReviewIds.length > 0 && <small>待复核 {item.humanReviewIds.join(" / ")}</small>}
                  </div>
                  <div className="opening-check-meta">
                    <span>{item.verdict}</span>
                    <small>{item.finalDisposition ?? "not_evaluated"}</small>
                  </div>
                </article>
              ))
            : packet.checkItems.map((item) => <OpeningConditionCheckItemRow key={item.id} item={item} />)}
        </div>
      </section>

      <section className="opening-panel opening-panel-wide">
        <span className="eyebrow">证据链</span>
        <h2>{pilotEvidence.length > 0 ? "来自后端试点任务的命中证据" : "本地演示证据"}</h2>
        <div className="opening-record-list">
          {pilotEvidence.length > 0
            ? pilotEvidence.map((evidence) => (
                <div key={evidence.id}>
                  <strong>{evidence.objectRef.fileName}</strong>
                  <span>
                    {evidence.itemId ?? "未绑定核查项"} · {evidence.confidence}
                  </span>
                  <p>{evidence.extractedValue ?? evidence.objectRef.summary ?? evidence.locator ?? "后端已记录证据引用。"}</p>
                  {evidence.locator && <small>{evidence.locator}</small>}
                </div>
              ))
            : packet.evidence.map((evidence) => (
                <div key={evidence.id}>
                  <strong>{evidence.fileName}</strong>
                  <span>
                    {evidence.locator} · {evidence.confidence}
                  </span>
                  <p>{evidence.extractedValue}</p>
                </div>
              ))}
        </div>
      </section>
    </div>
  );
}

function OpeningConditionCheckItemRow({ item }: { item: OpeningConditionCheckItem }) {
  const visualAssertionSummary = item.visualAssertions
    ?.map((assertion) => `${assertion.type}:${assertion.status}`)
    .join(" / ");

  return (
    <article className={`opening-check-row verdict-${item.verdict}`}>
      <div>
        <span className="eyebrow">
          {item.category} · {item.subCategory}
        </span>
        <h3>{item.content}</h3>
        <p>{item.ruleExplanation}</p>
        {item.semanticNote && <small>{item.semanticNote}</small>}
        {visualAssertionSummary && <small>视觉断言：{visualAssertionSummary}</small>}
      </div>
      <div className="opening-check-meta">
        <span>{openingConditionVerdictLabels[item.verdict]}</span>
        <small>{openingConditionRiskLabels[item.riskLevel]}风险</small>
      </div>
    </article>
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
  const pilotReviewItems = pilotTask?.humanReviewQueue ?? [];

  return (
    <section className="opening-panel opening-panel-wide">
      <span className="eyebrow">人工复核</span>
      <h2>签章、签名、勾选和低置信内容由人工裁定</h2>
      <div className="opening-record-list">
        {pilotReviewItems.length > 0
          ? pilotReviewItems.map((item) => (
              <div key={item.id}>
                <strong>{item.targetId}</strong>
                <span>
                  {item.targetType} · {item.status}
                </span>
                <p>{item.reason}</p>
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
            ))
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

function OpeningConditionReportArchivePage({
  packet,
  pilotTask,
  pilotBusy,
  onGenerateReport,
  onArchive,
}: {
  packet: OpeningConditionReviewPacket;
  pilotTask?: OpeningConditionPilotTask | null;
  pilotBusy?: boolean;
  onGenerateReport?: () => void;
  onArchive?: () => void;
}) {
  const reportAsset = pilotTask?.reportAsset;
  const blockingReviewCount =
    pilotTask?.humanReviewQueue.filter((item) => item.status === "open" || item.status === "deferred").length ?? 0;
  const canGenerateReport = Boolean(pilotTask && blockingReviewCount === 0 && !reportAsset);

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
        </div>
      )}
      {pilotTask && blockingReviewCount > 0 && <small>仍有 {blockingReviewCount} 项人工复核阻塞，处理后才能生成报告。</small>}
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
  onRunMatch,
  onEnsureKnowledgeBase,
}: {
  pilotTask?: OpeningConditionPilotTask | null;
  readiness?: OpeningConditionPilotReadinessResult | null;
  statusMessage: string;
  busy?: boolean;
  onRefresh?: () => void;
  onInitialize?: () => void;
  onRunMatch?: () => void;
  onEnsureKnowledgeBase?: () => void;
}) {
  const readinessStatus = readiness?.preflightReadiness?.status ?? "provisional";
  const blockingReasons = readiness?.preflightReadiness?.blockingReasons ?? [];

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
        {onRunMatch && (
          <button type="button" className="primary" onClick={onRunMatch} disabled={busy || !pilotTask}>
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
        {blockingReasons.length > 0
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
  };
}

function OpeningConditionRealTrialIntakePanel({
  packet,
  busy,
  submittedBy,
  onComplete,
}: {
  packet: OpeningConditionReviewPacket;
  busy?: boolean;
  submittedBy: string;
  onComplete?: (result: OpeningConditionPilotIntakeInitResult) => void;
}) {
  const [basisFile, setBasisFile] = useState<File | null>(null);
  const [checklistFile, setChecklistFile] = useState<File | null>(null);
  const [packetFile, setPacketFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("选择合同依据、核查表和资料包后，可创建一条真实试点任务。");

  async function handleBootstrap() {
    if (!basisFile || !checklistFile || !packetFile) {
      setMessage("请先选择合同依据、核查表和资料包 ZIP。");
      return;
    }

    setSubmitting(true);
    setMessage("正在上传试点资料...");

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

      setMessage("资料已上传，正在初始化平台试点任务...");
      const workspace = packet.workspaceContext;
      const result = await bootstrapOpeningConditionPilotTrial({
        taskId: `oc-pilot-${packet.workspaceId}`,
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

      const inventoryCount = result.packet?.inventoryEntries.length ?? 0;
      setMessage(`真实试点任务已初始化，资料包清单 ${inventoryCount} 项，当前状态 ${result.task.state}。`);
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
          <span className="eyebrow">真实试点资料接入</span>
          <h2>合同依据、核查表和资料包</h2>
        </div>
        <button type="button" className="primary" onClick={handleBootstrap} disabled={disabled}>
          {submitting ? "接入中..." : "上传并初始化试点"}
        </button>
      </div>
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

export function OpeningConditionProviderSnapshot({
  ready,
  detail,
}: {
  ready?: boolean;
  detail: string;
}) {
  return <ConnectivityStatus title="MaxKB Provider" status={ready ? "ready" : "pending"} detail={detail} />;
}
