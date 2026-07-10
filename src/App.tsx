import { useEffect, useMemo, useRef, useState } from "react";
import {
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
import type { ReviewMode } from "./domain/reviewTypes";

type Role = "super_admin" | "supervisor" | "contractor";
type ShellPage = "documents" | "knowledge-base" | "data-assets" | "review-loading" | "review-detail";
type DocumentStatus = "uploaded" | "parsing" | "reviewing" | "ready" | "completed" | "failed";

interface Session {
  username: string;
  role: Role;
}

interface LibraryDocument {
  id: string;
  name: string;
  project: string;
  uploader: string;
  updatedAt: string;
  status: DocumentStatus;
  issueCount: number;
  mode: ReviewMode;
}

interface UploadDraft {
  name: string;
  project: string;
}

type ThemeMode = "light" | "dark";

interface StreamingStage {
  id: string;
  title: string;
  detail: string;
  progress: number;
  outlineItems: string[];
  documentSnippets: string[];
  issueSummaries: string[];
  hazardLabel?: string;
  basisTrace?: {
    complete: number;
    partial: number;
    missing: number;
  };
}

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

const pageLabels: Record<Exclude<ShellPage, "review-loading" | "review-detail">, string> = {
  documents: "文档库",
  "knowledge-base": "知识库",
  "data-assets": "数据资产",
};

const statusLabels: Record<DocumentStatus, string> = {
  uploaded: "待开始",
  parsing: "解析中",
  reviewing: "审查中",
  ready: "待审核",
  completed: "已完成",
  failed: "失败",
};

const mockDocuments: LibraryDocument[] = [
  {
    id: "doc-001",
    name: "南京综合楼施工组织设计.pdf",
    project: "南京综合楼项目",
    uploader: "张工",
    updatedAt: "2026-07-09 09:12",
    status: "ready",
    issueCount: 4,
    mode: "review",
  },
  {
    id: "doc-002",
    name: "塔吊专项施工方案.docx",
    project: "南京综合楼项目",
    uploader: "李工",
    updatedAt: "2026-07-08 18:43",
    status: "reviewing",
    issueCount: 0,
    mode: "revise",
  },
  {
    id: "doc-003",
    name: "脚手架专项方案（整改版）.pdf",
    project: "西湖机电安装项目",
    uploader: "王工",
    updatedAt: "2026-07-07 15:20",
    status: "completed",
    issueCount: 6,
    mode: "review",
  },
  {
    id: "doc-004",
    name: "临时用电方案（初稿）.pdf",
    project: "东苑住宅项目",
    uploader: "陈工",
    updatedAt: "2026-07-09 08:20",
    status: "uploaded",
    issueCount: 0,
    mode: "revise",
  },
];

const mockStreamingStages: StreamingStage[] = [
  {
    id: "upload",
    title: "建立审查任务",
    detail: "已接收文件，正在创建文档解析任务。",
    progress: 12,
    outlineItems: [],
    documentSnippets: ["正在读取文件元数据与项目基础信息。"],
    issueSummaries: [],
  },
  {
    id: "parse",
    title: "解析文档结构",
    detail: "识别章节、段落、表格与可锚定文本位置。",
    progress: 28,
    outlineItems: ["一、工程概况", "二、脚手架工程"],
    documentSnippets: ["工程概况已解析，识别到项目规模、工期与施工组织描述。"],
    issueSummaries: [],
  },
  {
    id: "hazard",
    title: "危大等级判定",
    detail: "依据附录范围和项目场景判断是否触发危大/超危大程序。",
    progress: 38,
    outlineItems: ["一、工程概况", "二、脚手架工程"],
    documentSnippets: [
      "外脚手架高度 24m，触发危大工程管理校验。",
      "塔吊附着和临时用电将进入专业技术与程序合规复核。",
    ],
    issueSummaries: ["危大工程：需要专项方案审批、交底和验收闭环。"],
    hazardLabel: "危大工程 · 需程序核验",
    basisTrace: { complete: 1, partial: 1, missing: 0 },
  },
  {
    id: "basis",
    title: "匹配审查依据",
    detail: "匹配专项施工方案编制内容、危大工程与监理审查条款。",
    progress: 46,
    outlineItems: ["一、工程概况", "二、脚手架工程", "三、塔吊安装与附着"],
    documentSnippets: [
      "脚手架章节已进入规则匹配，正在核对搭设高度与交底要求。",
      "塔吊章节已定位到安装、附着与验收相关段落。",
    ],
    issueSummaries: ["发现 1 条疑似编制内容缺项，等待语义复核。"],
    hazardLabel: "危大工程 · 需程序核验",
    basisTrace: { complete: 2, partial: 1, missing: 0 },
  },
  {
    id: "rule",
    title: "规则引擎遍历",
    detail: "执行编制内容、程序节点、签字盖章、量化阈值等确定性校验。",
    progress: 58,
    outlineItems: ["一、工程概况", "二、脚手架工程", "三、塔吊安装与附着"],
    documentSnippets: [
      "规则命中：脚手架工程不应按普通分项工程管理。",
      "规则命中：塔吊附着固定方式缺少可靠构造与验收资料。",
    ],
    issueSummaries: [
      "危大工程管理方式不符合要求。",
      "塔吊附着固定方式存在重大风险。",
    ],
    hazardLabel: "危大工程 · 需程序核验",
    basisTrace: { complete: 3, partial: 1, missing: 0 },
  },
  {
    id: "semantic",
    title: "语义审查与风险研判",
    detail: "分析措施针对性、工序逻辑与整改建议。",
    progress: 68,
    outlineItems: ["一、工程概况", "二、脚手架工程", "三、塔吊安装与附着", "四、安全管理措施"],
    documentSnippets: [
      "已识别安全管理措施章节，正在判断责任矩阵和检查频次是否可执行。",
      "正在核对临时用电、验收程序与应急措施是否形成闭环。",
    ],
    issueSummaries: [
      "脚手架搭设章节缺少验收责任主体。",
      "安全交底描述偏模板化，缺少双方签字确认要求。",
    ],
    hazardLabel: "危大工程 · 需程序核验",
    basisTrace: { complete: 3, partial: 2, missing: 0 },
  },
  {
    id: "issues",
    title: "生成结构化问题",
    detail: "正在生成原文锚点、依据、理由与建议修改。",
    progress: 86,
    outlineItems: ["一、工程概况", "二、脚手架工程", "三、塔吊安装与附着", "四、安全管理措施"],
    documentSnippets: [
      "已生成可回溯锚点，问题将展示在右侧意见面板。",
      "正在合并重复问题并计算风险等级。",
    ],
    issueSummaries: [
      "脚手架搭设章节缺少验收责任主体。",
      "安全交底描述偏模板化，缺少双方签字确认要求。",
      "塔吊附着验收流程缺少监理复核节点。",
    ],
    hazardLabel: "危大工程 · 需程序核验",
    basisTrace: { complete: 4, partial: 1, missing: 0 },
  },
  {
    id: "complete",
    title: "审查结果准备完成",
    detail: "标注、依据和处理动作已准备，即将进入审查工作台。",
    progress: 100,
    outlineItems: ["一、工程概况", "二、脚手架工程", "三、塔吊安装与附着", "四、安全管理措施"],
    documentSnippets: [
      "AI 审查已完成。进入详情后可逐条接受、拒绝或补充人工标注。",
    ],
    issueSummaries: [
      "脚手架搭设章节缺少验收责任主体。",
      "安全交底描述偏模板化，缺少双方签字确认要求。",
      "塔吊附着验收流程缺少监理复核节点。",
      "临时用电方案缺少独立编制条件核验。",
    ],
    hazardLabel: "危大工程 · 需程序核验",
    basisTrace: { complete: 4, partial: 0, missing: 0 },
  },
];

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
  const [session, setSession] = useState<Session | null>(null);
  const [activePage, setActivePage] = useState<ShellPage>("documents");
  const [selectedDocId, setSelectedDocId] = useState(mockDocuments[0]?.id ?? "");
  const [documents, setDocuments] = useState<LibraryDocument[]>(mockDocuments);
  const [uploadDraft, setUploadDraft] = useState<UploadDraft>({ name: "", project: "" });
  const [dragging, setDragging] = useState(false);
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
        if (nextIndex < mockStreamingStages.length) {
          return nextIndex;
        }

        if (loadingTimerRef.current) {
          window.clearInterval(loadingTimerRef.current);
          loadingTimerRef.current = null;
        }

        window.setTimeout(() => {
          setDocuments((currentDocs) =>
            currentDocs.map((doc) =>
              doc.id === loadingDocId ? { ...doc, status: "ready", updatedAt: nowString() } : doc,
            ),
          );
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
    setSelectedDocId(mockDocuments[0]?.id ?? "");
    setActivePage("documents");
  }

  function handleLogout() {
    setSession(null);
    setActivePage("documents");
  }

  function toggleTheme() {
    setThemeMode((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
  }

  function handleUpload(name: string, project: string) {
    const newDoc: LibraryDocument = {
      id: `doc-${Date.now()}`,
      name,
      project,
      uploader: session?.username ?? "当前用户",
      updatedAt: nowString(),
      status: "uploaded",
      issueCount: 0,
      mode: session?.role === "contractor" ? "revise" : "review",
    };

    setDocuments((currentDocs) => [newDoc, ...currentDocs]);
    setSelectedDocId(newDoc.id);
    setUploadDraft({ name: "", project: "" });
  }

  function startReview(documentId: string) {
    setSelectedDocId(documentId);
    setLoadingDocId(documentId);
    setStreamStageIndex(0);
    setDocuments((currentDocs) =>
      currentDocs.map((doc) =>
        doc.id === documentId
          ? { ...doc, status: "reviewing", updatedAt: nowString() }
          : doc,
      ),
    );
    setActivePage("review-loading");
  }

  function openDocument(documentId: string) {
    const doc = documents.find((item) => item.id === documentId);
    if (!doc) {
      return;
    }

    setSelectedDocId(documentId);

    if (doc.status === "ready" || doc.status === "completed") {
      setActivePage("review-detail");
      return;
    }

    if (doc.status === "reviewing" || doc.status === "parsing" || doc.status === "uploaded") {
      startReview(documentId);
    }
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
            <h1>{pageLabels[activePage as Exclude<ShellPage, "review-loading" | "review-detail">]}</h1>
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
              onUpload={handleUpload}
              onDragChange={setDragging}
              onStartReview={startReview}
              onOpenDocument={openDocument}
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
              stage={mockStreamingStages[streamStageIndex] ?? mockStreamingStages[0]}
              stages={mockStreamingStages}
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
  onUpload,
  onDragChange,
  onStartReview,
  onOpenDocument,
}: {
  documents: LibraryDocument[];
  uploadDraft: UploadDraft;
  dragging: boolean;
  onUploadDraftChange: (draft: UploadDraft) => void;
  onUpload: (name: string, project: string) => void;
  onDragChange: (value: boolean) => void;
  onStartReview: (documentId: string) => void;
  onOpenDocument: (documentId: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recentDocs = documents.slice(0, 5);

  function submitUpload() {
    const name = uploadDraft.name.trim() || `施工方案_${Date.now()}.pdf`;
    const project = uploadDraft.project.trim() || "未知项目";
    onUpload(name, project);
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
            <button key={doc.id} className="history-item" type="button" onClick={() => onOpenDocument(doc.id)}>
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
                  onUpload(file.name, uploadDraft.project.trim() || "未知项目");
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
                  onUpload(file.name, uploadDraft.project.trim() || "未知项目");
                }
              }}
            >
              <Upload size={22} />
              <span>拖拽文件到此处</span>
              <small>支持 PDF、Word（当前为 mock）</small>
            </div>
            <button
              type="button"
              className="upload-pick-button"
              onClick={() => fileInputRef.current?.click()}
            >
              选择文件
            </button>
          </div>

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
            <button type="button" className="upload-button" onClick={submitUpload}>
              <Plus size={16} />
              添加到文档库
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
                  <small>上传人：{doc.uploader}</small>
                </div>
                <span>{doc.project}</span>
                <span className={`status-pill status-${doc.status}`}>{statusLabels[doc.status]}</span>
                <span className="mode-pill">{modeName(doc.mode)}</span>
                <span>{doc.updatedAt}</span>
                <div className="row-actions">
                  <button type="button" onClick={() => onOpenDocument(doc.id)}>
                    查看
                  </button>
                  {doc.status === "ready" || doc.status === "completed" ? (
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
    </div>
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

function nowString() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}
