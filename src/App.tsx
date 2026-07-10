import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock3,
  Database,
  FileSearch,
  GitCompareArrows,
  LayoutDashboard,
  ListChecks,
  LogOut,
  LucideIcon,
  Plus,
  ShieldCheck,
  SunMoon,
  Sparkles,
  Upload,
  Users,
} from "lucide-react";
import { ReviewWorkbenchPage } from "./ReviewWorkbenchPage";
import type {
  DocumentStatus,
  ReviewCompletionPayload,
  ReviewMode,
  ReviewResultAsset,
  ReviewStreamingStage,
  ReviewTask,
  ReviewTaskOcrJob,
} from "./domain/reviewTypes";
import { mockStreamingStages as reviewStreamingStages } from "./domain/mockReviewTaskSeeds";
import {
  addManualTaskIssue,
  completeReviewTask,
  createDocumentTask,
  deleteManualTaskIssue,
  listReviewTasks,
  markReviewTaskReady,
  resolveTaskIssue,
  startReviewTask,
  updateDocumentTaskUploadResult,
  updateReviewTaskStreamStage,
  updateTaskIssueDraft,
} from "./domain/reviewSessionService";
import {
  fetchBackendHealth,
  fetchMinioStatus,
  fetchOcrStatus,
  runLlmConnectivityCheck,
  runReviewStreamConnectivityCheck,
  submitStoredObjectOcrJob,
  uploadMinioDocument,
  type BackendHealthResult,
  type MinioStatusResult,
  type MinioUploadResult,
  type OcrStatusResult,
  type ProviderCheckResult,
  type ReviewStreamEvent,
} from "./domain/backendConnectivity";

type Role = "super_admin" | "supervisor" | "contractor";
type ShellPage =
  | "documents"
  | "knowledge-base"
  | "data-assets"
  | "review-loading"
  | "review-detail"
  | "review-result";

interface Session {
  username: string;
  role: Role;
}

type LibraryDocument = ReviewTask;

interface UploadDraft {
  name: string;
  project: string;
}

type ThemeMode = "light" | "dark";

type StreamingStage = ReviewStreamingStage;

interface AgentKernelProfile {
  name: string;
  schemaVersion: string;
  promptAsset: string;
  engines: string[];
  checkDomains: string[];
  outputScenarios: string[];
  basisCategories: string[];
  knowledgeBindings: Array<{
    name: string;
    status: string;
  }>;
}

const roleLabels: Record<Role, string> = {
  super_admin: "超管",
  supervisor: "监理",
  contractor: "施工方",
};

const roleModes: Record<Role, ReviewMode[]> = {
  super_admin: ["review", "revise"],
  supervisor: ["review"],
  contractor: ["revise"],
};

const pageLabels: Record<Exclude<ShellPage, "review-loading" | "review-detail" | "review-result">, string> = {
  documents: "文档库",
  "knowledge-base": "知识库",
  "data-assets": "数据资产",
};

const statusLabels: Record<DocumentStatus, string> = {
  uploading: "上传中",
  uploaded: "待开始",
  parsing: "解析中",
  reviewing: "审查中",
  ready: "待审核",
  completed: "已完成",
  failed: "失败",
};

const constructionReviewAgentProfile: AgentKernelProfile = {
  name: "施工方案审查智能体",
  schemaVersion: "review-kernel-2.1-mock",
  promptAsset: "专项施工方案审查 Prompt v0.3",
  engines: ["强规则引擎", "大模型语义推理", "结构化结论生成"],
  checkDomains: ["编制内容", "程序合规", "专家论证", "分专业技术校验"],
  outputScenarios: ["施工单位内审辅助", "监理正式审查", "专家论证辅助"],
  basisCategories: [
    "JT/T 1495-2024",
    "JTG F90-2015",
    "JTG G10-2016",
    "招投标/合同/图纸",
    "施工安全风险评估报告",
  ],
  knowledgeBindings: [
    { name: "规范知识图谱", status: "预留入口" },
    { name: "项目招投标与合同文件", status: "待接入" },
    { name: "设计图纸与施工组织设计", status: "待接入" },
    { name: "安全风险评估报告", status: "待接入" },
  ],
};

export function App() {
  const initialTasks = useMemo(() => listReviewTasks(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [activePage, setActivePage] = useState<ShellPage>("documents");
  const [selectedDocId, setSelectedDocId] = useState(initialTasks[0]?.id ?? "");
  const [documents, setDocuments] = useState<LibraryDocument[]>(initialTasks);
  const [uploadDraft, setUploadDraft] = useState<UploadDraft>({ name: "", project: "" });
  const [dragging, setDragging] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [documentUploadError, setDocumentUploadError] = useState("");
  const [loadingDocId, setLoadingDocId] = useState<string | null>(null);
  const [streamStageIndex, setStreamStageIndex] = useState(0);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getInitialTheme());
  const loadingTimerRef = useRef<number | null>(null);

  const selectedDocument = documents.find((doc) => doc.id === selectedDocId) ?? documents[0];
  const allowedModes: ReviewMode[] = session ? roleModes[session.role] : ["review", "revise"];

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    window.localStorage.setItem("app-theme", themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (activePage !== "review-loading" || !loadingDocId) {
      return;
    }

    setStreamStageIndex(0);
    loadingTimerRef.current = window.setInterval(() => {
      setStreamStageIndex((currentIndex) => {
        const nextIndex = currentIndex + 1;
        if (nextIndex < reviewStreamingStages.length) {
          setDocuments((currentDocs) =>
            updateReviewTaskStreamStage(currentDocs, loadingDocId, nextIndex),
          );
          return nextIndex;
        }

        if (loadingTimerRef.current) {
          window.clearInterval(loadingTimerRef.current);
          loadingTimerRef.current = null;
        }

        window.setTimeout(() => {
          setDocuments((currentDocs) => markReviewTaskReady(currentDocs, loadingDocId));
          setSelectedDocId(loadingDocId);
          setActivePage("review-detail");
          setLoadingDocId(null);
        }, 650);

        return currentIndex;
      });
    }, 850);

    return () => {
      if (loadingTimerRef.current) {
        window.clearInterval(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
    };
  }, [activePage, loadingDocId]);

  function handleSignIn(nextSession: Session) {
    setSession(nextSession);
    setSelectedDocId(documents[0]?.id ?? "");
    setActivePage("documents");
  }

  function handleLogout() {
    setSession(null);
    setActivePage("documents");
  }

  function toggleTheme() {
    setThemeMode((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
  }

  function createUploadedTask(input: Parameters<typeof createDocumentTask>[1]) {
    const nextDocuments = createDocumentTask(documents, {
      ...input,
      uploader: session?.username ?? "当前用户",
      mode: session?.role === "contractor" ? "revise" : "review",
    });
    const newDoc = nextDocuments[0];

    setDocuments(nextDocuments);
    setSelectedDocId(newDoc.id);
    setUploadDraft({ name: "", project: "" });
    setDocumentUploadError("");
  }

  function updateCreatedTaskUploadResult(
    taskId: string,
    input: Parameters<typeof updateDocumentTaskUploadResult>[2],
  ) {
    setDocuments((currentDocs) => updateDocumentTaskUploadResult(currentDocs, taskId, input));
  }

  function handleManualUpload(name: string, project: string) {
    createUploadedTask({
      name,
      project,
      uploader: session?.username ?? "当前用户",
      mode: session?.role === "contractor" ? "revise" : "review",
    });
  }

  async function handleFileUpload(file: File) {
    setUploadingDocument(true);
    setDocumentUploadError("");
    const taskName = uploadDraft.name.trim() || file.name;
    const taskProject = uploadDraft.project.trim() || "未知项目";
    const pendingTasks = createDocumentTask(documents, {
      name: taskName,
      project: taskProject,
      uploader: session?.username ?? "当前用户",
      mode: session?.role === "contractor" ? "revise" : "review",
      status: "uploading",
    });
    const pendingTask = pendingTasks[0];

    setDocuments(pendingTasks);
    setSelectedDocId(pendingTask.id);
    setUploadDraft({ name: "", project: "" });

    try {
      const uploadResult = await uploadMinioDocument(file);
      if (!uploadResult.ok || !uploadResult.object) {
        const message = uploadResult.message || "文件上传到对象存储失败。";
        setDocumentUploadError(message);
        updateCreatedTaskUploadResult(pendingTask.id, {
          status: "failed",
          failureMessage: message,
        });
        return;
      }

      const ocrResult = await submitStoredObjectOcrJob(uploadResult.object.key);
      const ocrSubmittedAt = new Date().toISOString();
      const ocrJob = {
        jobId: ocrResult.jobId ?? null,
        state: ocrResult.ok && ocrResult.jobId ? "submitted" : "failed",
        submittedAt: ocrSubmittedAt,
        sourceObjectKey: uploadResult.object.key,
        message: ocrResult.ok
          ? ocrResult.status || "OCR 任务已提交。"
          : ocrResult.message || ocrResult.status || "OCR 任务提交失败。",
      } as const;

      updateCreatedTaskUploadResult(pendingTask.id, {
        status: ocrResult.ok && ocrResult.jobId ? "parsing" : "failed",
        sourceObject: uploadResult.object,
        ocrJob,
        failureMessage: ocrJob.state === "failed" ? ocrJob.message : undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "文件上传到对象存储失败。";
      setDocumentUploadError(message);
      updateCreatedTaskUploadResult(pendingTask.id, {
        status: "failed",
        failureMessage: message,
      });
    } finally {
      setUploadingDocument(false);
    }
  }

  function startReview(documentId: string) {
    setSelectedDocId(documentId);
    setLoadingDocId(documentId);
    setStreamStageIndex(0);
    setDocuments((currentDocs) => startReviewTask(currentDocs, documentId));
    setActivePage("review-loading");
  }

  function openDocument(documentId: string) {
    const doc = documents.find((item) => item.id === documentId);
    if (!doc) {
      return;
    }

    setSelectedDocId(documentId);

    if (doc.resultAsset) {
      setActivePage("review-result");
      return;
    }

    if (doc.status === "ready" || doc.status === "completed") {
      setActivePage("review-detail");
      return;
    }

    if (doc.status === "reviewing" || doc.status === "parsing") {
      setLoadingDocId(documentId);
      setStreamStageIndex(doc.streamStageIndex);
      setActivePage("review-loading");
      return;
    }

    if (doc.status === "uploaded") {
      startReview(documentId);
    }
  }

  function openResult(documentId: string) {
    const doc = documents.find((item) => item.id === documentId);
    if (!doc?.resultAsset) {
      openDocument(documentId);
      return;
    }

    setSelectedDocId(documentId);
    setActivePage("review-result");
  }

  function completeReview(payload: ReviewCompletionPayload) {
    if (!selectedDocument) {
      return;
    }

    const { tasks } = completeReviewTask(documents, selectedDocument.id, payload);

    setDocuments(tasks);
    setSelectedDocId(selectedDocument.id);
    setActivePage("review-result");
  }

  function updateSelectedIssueResolution(
    issueId: string,
    status: "accepted" | "rejected",
    editedText: string,
  ) {
    if (!selectedDocument) {
      return;
    }

    setDocuments((currentDocs) =>
      resolveTaskIssue(currentDocs, selectedDocument.id, issueId, status, editedText),
    );
  }

  function updateSelectedIssueDraft(issueId: string, suggestion: string) {
    if (!selectedDocument) {
      return;
    }

    setDocuments((currentDocs) =>
      updateTaskIssueDraft(currentDocs, selectedDocument.id, issueId, suggestion),
    );
  }

  function addSelectedManualIssue(issue: Parameters<typeof addManualTaskIssue>[2]) {
    if (!selectedDocument) {
      return;
    }

    setDocuments((currentDocs) => addManualTaskIssue(currentDocs, selectedDocument.id, issue));
  }

  function deleteSelectedManualIssue(issueId: string) {
    if (!selectedDocument) {
      return;
    }

    setDocuments((currentDocs) =>
      deleteManualTaskIssue(currentDocs, selectedDocument.id, issueId),
    );
  }

  if (!session) {
    return <LoginPage onSignIn={handleSignIn} themeMode={themeMode} onToggleTheme={toggleTheme} />;
  }

  if (activePage === "review-detail" && selectedDocument) {
    return (
      <ReviewWorkbenchPage
        allowedModes={allowedModes}
        roleLabel={roleLabels[session.role]}
        documentName={selectedDocument.name}
        projectName={selectedDocument.project}
        onBack={() => setActivePage("documents")}
        themeMode={themeMode}
        onToggleTheme={toggleTheme}
        onComplete={completeReview}
        paragraphs={selectedDocument.paragraphs}
        initialIssues={selectedDocument.issues}
        onIssueResolve={updateSelectedIssueResolution}
        onIssueDraftChange={updateSelectedIssueDraft}
        onManualIssueAdd={addSelectedManualIssue}
        onManualIssueDelete={deleteSelectedManualIssue}
      />
    );
  }

  if (activePage === "review-result" && selectedDocument?.resultAsset) {
    return (
      <ResultPreviewPage
        document={selectedDocument}
        onBack={() => setActivePage("documents")}
        themeMode={themeMode}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <div className="platform-shell">
      <aside className="shell-sidebar">
        <div className="shell-brand">
          <div className="shell-brand-mark">AI</div>
          <div>
            <strong>施工审查平台</strong>
            <span>企业审查工作台</span>
          </div>
        </div>

        <nav className="shell-nav" aria-label="主导航">
          <NavButton
            icon={LayoutDashboard}
            label={pageLabels.documents}
            active={activePage === "documents"}
            onClick={() => setActivePage("documents")}
          />
          <NavButton
            icon={BookOpen}
            label={pageLabels["knowledge-base"]}
            active={activePage === "knowledge-base"}
            onClick={() => setActivePage("knowledge-base")}
          />
          <NavButton
            icon={Database}
            label={pageLabels["data-assets"]}
            active={activePage === "data-assets"}
            onClick={() => setActivePage("data-assets")}
          />
        </nav>

        <div className="shell-sidebar-foot">
          <div className="shell-role-card">
            <span className="eyebrow">当前角色</span>
            <strong>{roleLabels[session.role]}</strong>
            <p>{session.username}</p>
          </div>
          <button type="button" className="shell-logout" onClick={handleLogout}>
            <LogOut size={16} />
            退出登录
          </button>
        </div>
      </aside>

      <section className="shell-main">
        <header className="shell-topbar">
          <div>
            <span className="eyebrow">默认入口</span>
            <h1>
              {
                pageLabels[
                  activePage as Exclude<
                    ShellPage,
                    "review-loading" | "review-detail" | "review-result"
                  >
                ]
              }
            </h1>
          </div>
          <div className="shell-topbar-actions">
            <button type="button" className="theme-toggle" onClick={toggleTheme}>
              <SunMoon size={16} />
              {themeMode === "light" ? "深色主题" : "浅色主题"}
            </button>
            <span className="shell-role-pill">
              <Users size={14} />
              {roleLabels[session.role]}
            </span>
            <span className="shell-role-pill muted">
              <GitCompareArrows size={14} />
              {allowedModes.length === 2 ? "双模式可用" : `${modeName(allowedModes[0])} 可用`}
            </span>
          </div>
        </header>

        <div className="shell-content">
          {activePage === "documents" && (
            <DocumentLibraryPage
              documents={documents}
              uploadDraft={uploadDraft}
              dragging={dragging}
              onUploadDraftChange={setUploadDraft}
              onManualUpload={handleManualUpload}
              onFileUpload={handleFileUpload}
              onDragChange={setDragging}
              uploading={uploadingDocument}
              uploadError={documentUploadError}
              onStartReview={startReview}
              onOpenDocument={openDocument}
              onOpenResult={openResult}
            />
          )}

          {activePage === "knowledge-base" && <KnowledgeBasePage />}

          {activePage === "data-assets" && (
            <DataAssetsPage role={session.role} onOpenDocument={() => setActivePage("documents")} />
          )}

          {activePage === "review-loading" && (
            <ReviewLoadingPage
              document={selectedDocument}
              roleLabel={roleLabels[session.role]}
              statusLabel={statusLabels[selectedDocument?.status ?? "uploaded"]}
              stage={reviewStreamingStages[streamStageIndex] ?? reviewStreamingStages[0]}
              stages={reviewStreamingStages}
              stageIndex={streamStageIndex}
            />
          )}
        </div>
      </section>
    </div>
  );
}

function LoginPage({
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
          <span className="eyebrow">AI-assisted review platform</span>
          <h1>施工方案审查平台</h1>
          <p>登录后进入文档库，按角色进入对应审查模式、数据资产和智能体配置。</p>
        </div>

        <div className="login-form">
          <div className="login-form-topline">
            <button type="button" className="theme-toggle subtle" onClick={onToggleTheme}>
              <SunMoon size={16} />
              {themeMode === "light" ? "切换到深色" : "切换到浅色"}
            </button>
          </div>
          <label>
            <span>账号</span>
            <input value={username} onChange={(event) => setUsername(event.target.value)} />
          </label>
          <label>
            <span>密码</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
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

          <button
            type="button"
            className="login-submit"
            onClick={() => onSignIn({ username, role })}
          >
            <ShieldCheck size={16} />
            登录进入平台
          </button>
        </div>
      </section>
    </main>
  );
}

function DocumentLibraryPage({
  documents,
  uploadDraft,
  dragging,
  onUploadDraftChange,
  onManualUpload,
  onFileUpload,
  onDragChange,
  uploading,
  uploadError,
  onStartReview,
  onOpenDocument,
  onOpenResult,
}: {
  documents: LibraryDocument[];
  uploadDraft: UploadDraft;
  dragging: boolean;
  onUploadDraftChange: (draft: UploadDraft) => void;
  onManualUpload: (name: string, project: string) => void;
  onFileUpload: (file: File) => void;
  onDragChange: (value: boolean) => void;
  uploading: boolean;
  uploadError: string;
  onStartReview: (documentId: string) => void;
  onOpenDocument: (documentId: string) => void;
  onOpenResult: (documentId: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recentDocs = documents.slice(0, 5);

  function submitUpload() {
    const name = uploadDraft.name.trim() || `施工方案_${Date.now()}.pdf`;
    const project = uploadDraft.project.trim() || "未知项目";
    onManualUpload(name, project);
  }

  return (
    <div className="library-layout">
      <aside className="library-rail">
        <div className="section-title">
          <span className="eyebrow">最近文档</span>
          <h2>历史记录</h2>
        </div>
        <div className="history-list">
          {recentDocs.map((doc) => (
            <button
              key={doc.id}
              className="history-item"
              type="button"
              title={`${doc.name}\n${doc.project}`}
              onClick={() => onOpenDocument(doc.id)}
            >
              <span>
                <strong>{doc.name}</strong>
                <small>{doc.project}</small>
              </span>
              <GitCompareArrows size={16} />
            </button>
          ))}
        </div>
      </aside>

      <section className="library-main">
        <div className="library-upload-card">
          <div>
            <span className="eyebrow">上传文档</span>
            <h2>拖拽或选择文件，建立新的审查任务</h2>
            <p>上传后可点击开始审核，系统会先模拟文档解析与智能体审查的加载过程。</p>
          </div>
          <div className={dragging ? "upload-dropzone dragging" : "upload-dropzone"}>
            <input
              ref={fileInputRef}
              className="upload-input"
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  onFileUpload(file);
                  event.target.value = "";
                }
              }}
            />
            <div
              className="upload-dropzone-body"
              onDragOver={(event) => {
                event.preventDefault();
                onDragChange(true);
              }}
              onDragLeave={() => onDragChange(false)}
              onDrop={(event) => {
                event.preventDefault();
                onDragChange(false);
                const file = event.dataTransfer.files[0];
                if (file) {
                  onFileUpload(file);
                }
              }}
            >
              <Upload size={22} />
              <span>{uploading ? "正在上传到对象存储" : "拖拽文件到此处"}</span>
              <small>支持 PDF、Word，上传成功后写入文档库</small>
            </div>
            <button
              type="button"
              className="upload-pick-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "上传中..." : "选择文件"}
            </button>
          </div>
          {uploadError && <div className="upload-error">{uploadError}</div>}

          <div className="upload-form-row">
            <label>
              <span>文件名</span>
              <input
                value={uploadDraft.name}
                onChange={(event) =>
                  onUploadDraftChange({ ...uploadDraft, name: event.target.value })
                }
                placeholder="输入或粘贴文件名"
              />
            </label>
            <label>
              <span>项目名称</span>
              <input
                value={uploadDraft.project}
                onChange={(event) =>
                  onUploadDraftChange({ ...uploadDraft, project: event.target.value })
                }
                placeholder="例如：南京综合楼项目"
              />
            </label>
            <button type="button" className="upload-button" onClick={submitUpload} disabled={uploading}>
              <Plus size={16} />
              添加演示文档
            </button>
          </div>
        </div>

        <div className="library-table-card">
          <div className="section-title row">
            <div>
              <span className="eyebrow">文档库</span>
              <h2>当前平台文档</h2>
            </div>
            <span className="library-meta">{documents.length} 个文档</span>
          </div>

          <div className="table-head">
            <span>文档</span>
            <span>项目</span>
            <span>状态</span>
            <span>模式</span>
            <span>更新时间</span>
            <span>操作</span>
          </div>

          <div className="table-body">
            {documents.map((doc) => (
              <div key={doc.id} className="table-row">
                <div>
                  <strong>{doc.name}</strong>
                  <small>
                    上传人：{doc.uploader}
                    {doc.sourceObject ? ` · 已存储 ${formatFileSize(doc.sourceObject.size)}` : " · mock"}
                    {doc.ocrJob ? ` · ${formatOcrJobLabel(doc.ocrJob)}` : ""}
                  </small>
                </div>
                <span>{doc.project}</span>
                <span className={`status-pill status-${doc.status}`}>{statusLabels[doc.status]}</span>
                <span className="mode-pill">{modeName(doc.mode)}</span>
                <span>{doc.updatedAt}</span>
                <div className="row-actions">
                  <button type="button" onClick={() => onOpenDocument(doc.id)}>
                    查看
                  </button>
                  {doc.resultAsset ? (
                    <button type="button" className="primary" onClick={() => onOpenResult(doc.id)}>
                      {doc.resultAsset.type === "supervisor-report" ? "查看报告" : "查看结果"}
                    </button>
                  ) : doc.status === "ready" || doc.status === "completed" ? (
                    <button type="button" className="primary" onClick={() => onOpenDocument(doc.id)}>
                      打开详情
                    </button>
                  ) : (
                    <button type="button" className="primary" onClick={() => onStartReview(doc.id)}>
                      开始审核
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function ResultPreviewPage({
  document,
  onBack,
  themeMode,
  onToggleTheme,
}: {
  document: LibraryDocument;
  onBack: () => void;
  themeMode: ThemeMode;
  onToggleTheme: () => void;
}) {
  const asset = document.resultAsset;

  if (!asset) {
    return null;
  }

  return (
    <main className="result-page">
      <header className="topbar result-topbar">
        <button type="button" className="detail-back-button" onClick={onBack}>
          <ArrowLeft size={16} />
          返回文档库
        </button>
        <div>
          <span className="eyebrow">审查结果资产 · Mock Preview</span>
          <h1>{asset.documentName}</h1>
        </div>
        <div className="project-meta" aria-label="结果页操作">
          <button type="button" className="theme-toggle subtle" onClick={onToggleTheme}>
            <SunMoon size={16} />
            {themeMode === "light" ? "深色主题" : "浅色主题"}
          </button>
          <span>{resultTypeName(asset)}</span>
          <span>{asset.projectName}</span>
        </div>
      </header>

      <section className="result-hero">
        <div>
          <span className="eyebrow">生成时间</span>
          <h2>{formatResultTime(asset.createdAt)}</h2>
          <p>
            该页面用于验证审查完成后的业务产物结构。当前导出、盖章流转与后端归档接口均为预留。
          </p>
        </div>
        <button type="button" className="export-disabled" disabled>
          导出 PDF/Word 待接入
        </button>
      </section>

      <section className="result-metrics" aria-label="结果统计">
        <MetricBlock label="问题总数" value={asset.issueStats.total} />
        <MetricBlock label="已接受" value={asset.issueStats.accepted} tone="success" />
        <MetricBlock label="已拒绝" value={asset.issueStats.rejected} tone="danger" />
        <MetricBlock label="工作模式" value={modeName(asset.mode)} />
      </section>

      {asset.type === "supervisor-report" ? (
        <SupervisorReportPreview asset={asset} />
      ) : (
        <RevisedSnapshotPreview asset={asset} />
      )}
    </main>
  );
}

function SupervisorReportPreview({
  asset,
}: {
  asset: Extract<ReviewResultAsset, { type: "supervisor-report" }>;
}) {
  return (
    <section className="result-layout">
      <article className="result-card result-card-wide">
        <span className="eyebrow">审核概况</span>
        <h2>监理审核报告</h2>
        <p>{asset.summary}</p>
      </article>

      <article className="result-card">
        <span className="eyebrow">重大风险</span>
        <h2>风险摘要</h2>
        <ul className="result-list">
          {asset.majorRisks.map((risk) => (
            <li key={risk}>{risk}</li>
          ))}
        </ul>
      </article>

      <article className="result-card">
        <span className="eyebrow">整改建议</span>
        <h2>闭环要求</h2>
        <ul className="result-list">
          {asset.rectificationSuggestions.map((suggestion, index) => (
            <li key={`${suggestion}-${index}`}>{suggestion}</li>
          ))}
        </ul>
      </article>

      <article className="result-card result-card-wide">
        <span className="eyebrow">逐条审查意见</span>
        <h2>意见明细</h2>
        <div className="result-opinion-list">
          {asset.issueOpinions.map((opinion) => (
            <section key={opinion.issueId} className="result-opinion">
              <div>
                <strong>{opinion.issueId}</strong>
                <span className={`severity severity-${opinion.severity}`}>
                  {severityName(opinion.severity)}
                </span>
                <span className={`decision-chip ${opinion.decision}`}>
                  {opinion.decision === "accepted" ? "已接受" : "已拒绝"}
                </span>
              </div>
              <h3>{opinion.title}</h3>
              <p>{opinion.opinion}</p>
              <small>{opinion.basis}</small>
            </section>
          ))}
        </div>
      </article>

      <article className="result-card result-card-wide">
        <span className="eyebrow">结论</span>
        <h2>审核结论</h2>
        <p>{asset.conclusion}</p>
      </article>
    </section>
  );
}

function RevisedSnapshotPreview({
  asset,
}: {
  asset: Extract<ReviewResultAsset, { type: "revised-plan-snapshot" }>;
}) {
  return (
    <section className="result-layout">
      <article className="result-card result-card-wide">
        <span className="eyebrow">处理摘要</span>
        <h2>整改后方案快照</h2>
        <p>{asset.processingSummary}</p>
      </article>

      <article className="result-card">
        <span className="eyebrow">已采纳修改</span>
        <h2>替换记录</h2>
        <div className="change-list">
          {asset.acceptedChanges.length > 0 ? (
            asset.acceptedChanges.map((change) => (
              <section key={change.issueId} className="change-item">
                <strong>{change.issueId}</strong>
                <p>
                  <span>原文</span>
                  {change.originalText}
                </p>
                <p>
                  <span>修改后</span>
                  {change.revisedText}
                </p>
              </section>
            ))
          ) : (
            <p className="result-empty">本次没有采纳修改。</p>
          )}
        </div>
      </article>

      <article className="result-card">
        <span className="eyebrow">拒绝保留项</span>
        <h2>原文保留</h2>
        <ul className="result-list">
          {asset.rejectedItems.length > 0 ? (
            asset.rejectedItems.map((item) => (
              <li key={item.issueId}>
                {item.issueId} {item.title}：{item.reason}
              </li>
            ))
          ) : (
            <li>本次没有拒绝项。</li>
          )}
        </ul>
      </article>

      <article className="result-card result-card-wide">
        <span className="eyebrow">整改后方案全文</span>
        <h2>预览正文</h2>
        <div className="result-document">
          {asset.processedParagraphs.map((paragraph) => (
            <section key={paragraph.id} className="result-paragraph">
              <h3>{paragraph.section}</h3>
              <p>{paragraph.text}</p>
            </section>
          ))}
        </div>
      </article>
    </section>
  );
}

function MetricBlock({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string | number;
  tone?: "neutral" | "success" | "danger";
}) {
  return (
    <div className={`result-metric result-metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function KnowledgeBasePage() {
  return (
    <div className="placeholder-page">
      <span className="eyebrow">知识库</span>
      <h2>页面暂未开发</h2>
      <p>后续将接入招标、投标、法规、管理办法、企业标准等资料，并提供上传、切分和检索入口。</p>
    </div>
  );
}

function DataAssetsPage({
  role,
  onOpenDocument,
}: {
  role: Role;
  onOpenDocument: () => void;
}) {
  const editable = role === "super_admin";
  const [checkingConnectivity, setCheckingConnectivity] = useState(false);
  const [healthResult, setHealthResult] = useState<BackendHealthResult | null>(null);
  const [llmResult, setLlmResult] = useState<ProviderCheckResult | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrStatusResult | null>(null);
  const [minioResult, setMinioResult] = useState<MinioStatusResult | null>(null);
  const [minioUploadResult, setMinioUploadResult] = useState<MinioUploadResult | null>(null);
  const [uploadingToMinio, setUploadingToMinio] = useState(false);
  const [streamEvents, setStreamEvents] = useState<ReviewStreamEvent[]>([]);
  const [connectivityError, setConnectivityError] = useState("");
  const storageSmokeInputRef = useRef<HTMLInputElement | null>(null);

  async function runConnectivityChecks() {
    setCheckingConnectivity(true);
    setConnectivityError("");
    setStreamEvents([]);

    try {
      const health = await fetchBackendHealth();
      setHealthResult(health);

      const ocr = await fetchOcrStatus();
      setOcrResult(ocr);

      const minio = await fetchMinioStatus();
      setMinioResult(minio);

      const llm = await runLlmConnectivityCheck();
      setLlmResult(llm);

      const events = await runReviewStreamConnectivityCheck();
      setStreamEvents(events);
    } catch (error) {
      setConnectivityError(
        error instanceof Error ? error.message : "后端连通性检查失败。",
      );
    } finally {
      setCheckingConnectivity(false);
    }
  }

  async function handleMinioSmokeUpload(file?: File) {
    if (!file) {
      return;
    }

    setUploadingToMinio(true);
    setConnectivityError("");

    try {
      const result = await uploadMinioDocument(file);
      setMinioUploadResult(result);
      if (!result.ok) {
        setConnectivityError(result.message || "MinIO 上传验证失败。");
      }
    } catch (error) {
      setConnectivityError(error instanceof Error ? error.message : "MinIO 上传验证失败。");
    } finally {
      setUploadingToMinio(false);
    }
  }

  return (
    <div className="assets-grid">
      <section className="assets-card agent-profile-card">
        <span className="eyebrow">智能体</span>
        <h2>{constructionReviewAgentProfile.name}</h2>
        <p>
          已按 PDF 2.1 内核预留规则引擎、语义推理、依据追溯和三类输出场景。
        </p>
        <div className="agent-profile-meta">
          <span>{constructionReviewAgentProfile.schemaVersion}</span>
          <span>{constructionReviewAgentProfile.promptAsset}</span>
        </div>
        <AgentProfileBlock title="引擎链路" items={constructionReviewAgentProfile.engines} />
        <AgentProfileBlock title="校验域" items={constructionReviewAgentProfile.checkDomains} />
        <AgentProfileBlock title="输出场景" items={constructionReviewAgentProfile.outputScenarios} />
        <AgentProfileBlock title="审查依据" items={constructionReviewAgentProfile.basisCategories} />
        <div className="knowledge-binding-list">
          {constructionReviewAgentProfile.knowledgeBindings.map((binding) => (
            <div key={binding.name} className="knowledge-binding-item">
              <strong>{binding.name}</strong>
              <span>{binding.status}</span>
            </div>
          ))}
        </div>
        <button type="button" className="primary" onClick={onOpenDocument}>
          先去文档库
        </button>
      </section>
      <section className="assets-card">
        <span className="eyebrow">提示词资产</span>
        <h2>{editable ? "可维护" : "只读"}</h2>
        <p>后续支持提示词新增、修改、版本管理和绑定智能体。当前仅展示入口。</p>
      </section>
      <section className="assets-card connectivity-card">
        <div className="section-title row">
          <div>
            <span className="eyebrow">后端连通性</span>
            <h2>智能体资源检查</h2>
          </div>
          <button type="button" className="primary" onClick={runConnectivityChecks}>
            {checkingConnectivity ? "检查中..." : "运行检查"}
          </button>
        </div>
        <p>用于验证本地 BFF、OpenAI-compatible LLM、PaddleOCR-VL 和 SSE 流式通道。不会显示任何密钥。</p>
        {connectivityError && <div className="connectivity-error">{connectivityError}</div>}
        <div className="connectivity-grid">
          <ConnectivityStatus
            title="后端 BFF"
            status={healthResult?.ok ? "ready" : "pending"}
            detail={
              healthResult
                ? `${healthResult.service ?? "backend"} · ${healthResult.timestamp ?? "无时间戳"}`
                : "等待检查"
            }
          />
          <ConnectivityStatus
            title="LLM"
            status={llmResult?.ok ? "ready" : llmResult ? "failed" : "pending"}
            detail={
              llmResult
                ? llmResult.preview || llmResult.message || llmResult.status || "已返回"
                : healthResult?.providers?.openai?.configured
                  ? `已配置 ${healthResult.providers.openai.model}`
                  : "等待配置或检查"
            }
          />
          <ConnectivityStatus
            title="PaddleOCR-VL"
            status={ocrResult?.ok ? "ready" : ocrResult ? "failed" : "pending"}
            detail={
              ocrResult
                ? `${ocrResult.model} · ${ocrResult.hasToken ? "Token 已配置" : "Token 未配置"}`
                : "等待检查"
            }
          />
          <ConnectivityStatus
            title="MinIO 私有桶"
            status={minioResult?.ok ? "ready" : minioResult ? "failed" : "pending"}
            detail={
              minioResult
                ? `${minioResult.bucket ?? "未配置桶"} · ${
                    minioResult.configured ? "配置完整" : "配置不完整"
                  } · ${minioResult.hasPublicEndpoint ? "有公开端点" : "无公开端点"}`
                : healthResult?.providers?.minio?.configured
                  ? `已配置 ${healthResult.providers.minio.bucket}`
                  : "等待配置或检查"
            }
          />
          <ConnectivityStatus
            title="SSE 流式"
            status={streamEvents.length > 0 ? "ready" : "pending"}
            detail={
              streamEvents.length > 0
                ? `已收到 ${streamEvents.length} 个事件，最后：${
                    streamEvents[streamEvents.length - 1]?.title
                  }`
                : "等待检查"
            }
          />
        </div>
        <div className="storage-smoke-panel">
          <div>
            <strong>MinIO 上传验证</strong>
            <p>选择一个小文件写入私有桶，用于确认服务器凭证、桶权限和对象写入链路。</p>
            {minioUploadResult?.object && (
              <small>
                已写入 {minioUploadResult.object.bucket}/{minioUploadResult.object.key} ·{" "}
                {formatFileSize(minioUploadResult.object.size)}
              </small>
            )}
          </div>
          <input
            ref={storageSmokeInputRef}
            type="file"
            className="upload-input"
            onChange={(event) => {
              const file = event.target.files?.[0];
              void handleMinioSmokeUpload(file);
              event.target.value = "";
            }}
          />
          <button
            type="button"
            className="secondary"
            onClick={() => storageSmokeInputRef.current?.click()}
            disabled={uploadingToMinio}
          >
            <Upload size={16} />
            {uploadingToMinio ? "上传中..." : "选择文件验证"}
          </button>
        </div>
      </section>
    </div>
  );
}

function ConnectivityStatus({
  title,
  status,
  detail,
}: {
  title: string;
  status: "ready" | "pending" | "failed";
  detail: string;
}) {
  const label = {
    ready: "可用",
    pending: "待检查",
    failed: "失败",
  }[status];

  return (
    <article className={`connectivity-status ${status}`}>
      <div>
        <strong>{title}</strong>
        <span>{label}</span>
      </div>
      <p>{detail}</p>
    </article>
  );
}

function AgentProfileBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="agent-profile-block">
      <strong>{title}</strong>
      <div>
        {items.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </div>
  );
}

function ReviewLoadingPage({
  document,
  roleLabel,
  statusLabel,
  stage,
  stages,
  stageIndex,
}: {
  document?: LibraryDocument;
  roleLabel: string;
  statusLabel: string;
  stage: StreamingStage;
  stages: StreamingStage[];
  stageIndex: number;
}) {
  return (
    <div className="streaming-review-page">
      <section className="streaming-hero">
        <div>
          <span className="eyebrow">AI 审核执行中 · {statusLabel}</span>
          <h2>{document?.name ?? "文档审查任务"}</h2>
          <p>{roleLabel}可在详情页观察解析、依据匹配、问题生成的流式进度。当前为 mock 演示。</p>
        </div>
        <div className="streaming-progress">
          <strong>{stage.progress}%</strong>
          <span>{stage.title}</span>
        </div>
      </section>

      {(stage.hazardLabel || stage.basisTrace) && (
        <section className="streaming-kernel-strip" aria-label="审查内核状态">
          {stage.hazardLabel && (
            <span>
              <strong>危大判定</strong>
              {stage.hazardLabel}
            </span>
          )}
          {stage.basisTrace && (
            <span>
              <strong>依据追溯</strong>
              完整 {stage.basisTrace.complete} · 部分 {stage.basisTrace.partial} · 缺失{" "}
              {stage.basisTrace.missing}
            </span>
          )}
        </section>
      )}

      <div className="streaming-progress-bar" aria-label="AI 审核进度">
        <span style={{ width: `${stage.progress}%` }} />
      </div>

      <section className="streaming-layout" aria-label="流式审核工作台">
        <aside className="streaming-panel streaming-outline">
          <div className="streaming-panel-title">
            <ListChecks size={18} />
            <span>目录识别</span>
          </div>
          {stage.outlineItems.length > 0 ? (
            stage.outlineItems.map((item) => (
              <div key={item} className="streaming-outline-item">
                <CheckCircle2 size={15} />
                {item}
              </div>
            ))
          ) : (
            <p className="streaming-empty">等待章节结构解析。</p>
          )}
        </aside>

        <section className="streaming-panel streaming-document">
          <div className="streaming-panel-title">
            <FileSearch size={18} />
            <span>文档解析与依据匹配</span>
          </div>
          <div className="streaming-stage-card">
            <Sparkles size={18} />
            <div>
              <strong>{stage.title}</strong>
              <p>{stage.detail}</p>
            </div>
          </div>
          <div className="streaming-snippets">
            {stage.documentSnippets.map((snippet, index) => (
              <article key={`${stage.id}-${index}`}>
                <span>片段 {index + 1}</span>
                <p>{snippet}</p>
              </article>
            ))}
          </div>
        </section>

        <aside className="streaming-panel streaming-issues">
          <div className="streaming-panel-title">
            <Clock3 size={18} />
            <span>问题生成</span>
          </div>
          <div className="streaming-timeline">
            {stages.map((item, index) => (
              <div
                key={item.id}
                className={
                  index < stageIndex
                    ? "streaming-step done"
                    : index === stageIndex
                      ? "streaming-step active"
                      : "streaming-step"
                }
              >
                <span />
                <p>{item.title}</p>
              </div>
            ))}
          </div>
          <div className="streaming-issue-list">
            {stage.issueSummaries.length > 0 ? (
              stage.issueSummaries.map((issue, index) => (
                <div key={`${issue}-${index}`} className="streaming-issue-item">
                  <AlertBadge index={index + 1} />
                  <p>{issue}</p>
                </div>
              ))
            ) : (
              <p className="streaming-empty">AI 尚未输出结构化问题。</p>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}

function AlertBadge({ index }: { index: number }) {
  return <span className="streaming-issue-badge">#{index}</span>;
}

function NavButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className={active ? "shell-nav-item active" : "shell-nav-item"} onClick={onClick}>
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );
}

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem("app-theme");
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function modeName(mode?: ReviewMode) {
  if (mode === "review") return "审查模式";
  if (mode === "revise") return "审查修改模式";
  return "未设置";
}

function resultTypeName(asset: ReviewResultAsset) {
  return asset.type === "supervisor-report" ? "审核报告" : "整改后方案";
}

function severityName(severity: "critical" | "high" | "medium" | "low") {
  const labels = {
    critical: "重大",
    high: "高",
    medium: "中",
    low: "低",
  } as const;

  return labels[severity];
}

function formatResultTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

function formatFileSize(value: number) {
  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

function formatOcrJobLabel(job: ReviewTaskOcrJob) {
  if (job.state === "failed") {
    return `OCR失败：${job.message ?? "提交失败"}`;
  }

  if (job.jobId) {
    return `OCR已提交 #${job.jobId.slice(-8)}`;
  }

  return "OCR已提交";
}
