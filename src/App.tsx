import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Database,
  FileText,
  GitCompareArrows,
  LayoutDashboard,
  LogOut,
  LucideIcon,
  Menu,
  Play,
  Plus,
  ShieldCheck,
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

export function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [activePage, setActivePage] = useState<ShellPage>("documents");
  const [selectedDocId, setSelectedDocId] = useState(mockDocuments[0]?.id ?? "");
  const [documents, setDocuments] = useState<LibraryDocument[]>(mockDocuments);
  const [uploadDraft, setUploadDraft] = useState<UploadDraft>({ name: "", project: "" });
  const [dragging, setDragging] = useState(false);
  const [loadingDocId, setLoadingDocId] = useState<string | null>(null);
  const loadingTimerRef = useRef<number | null>(null);

  const selectedDocument = documents.find((doc) => doc.id === selectedDocId) ?? documents[0];
  const allowedModes: ReviewMode[] = session ? roleModes[session.role] : ["review", "revise"];

  useEffect(() => {
    if (activePage !== "review-loading" || !loadingDocId) {
      return;
    }

    loadingTimerRef.current = window.setTimeout(() => {
      setDocuments((currentDocs) =>
        currentDocs.map((doc) =>
          doc.id === loadingDocId ? { ...doc, status: "ready", updatedAt: nowString() } : doc,
        ),
      );
      setSelectedDocId(loadingDocId);
      setActivePage("review-detail");
      setLoadingDocId(null);
    }, 1800);

    return () => {
      if (loadingTimerRef.current) {
        window.clearTimeout(loadingTimerRef.current);
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
    return <LoginPage onSignIn={handleSignIn} />;
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
        {activePage !== "review-detail" && (
          <header className="shell-topbar">
            <div>
              <span className="eyebrow">默认入口</span>
              <h1>{pageLabels[activePage as Exclude<ShellPage, "review-loading" | "review-detail">]}</h1>
            </div>
            <div className="shell-topbar-actions">
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
        )}

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
            />
          )}

          {activePage === "review-detail" && selectedDocument && (
            <ReviewWorkbenchPage
              allowedModes={allowedModes}
              roleLabel={roleLabels[session.role]}
              documentName={selectedDocument.name}
            />
          )}
        </div>
      </section>
    </div>
  );
}

function LoginPage({ onSignIn }: { onSignIn: (session: Session) => void }) {
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
  const selectedDocument = documents[0];
  const recentDocs = documents.slice(0, 5);

  function submitUpload() {
    const name = uploadDraft.name.trim() || `施工方案_${Date.now()}.pdf`;
    const project = uploadDraft.project.trim() || "未命名项目";
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
              if (file) {
                onUpload(file.name, "拖拽导入项目");
              }
            }}
          >
            <Upload size={22} />
            <span>拖拽文件到此处</span>
            <small>支持 PDF、Word（当前为 mock）</small>
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

        <div className="detail-preview-card">
          <div className="section-title row">
            <div>
              <span className="eyebrow">快速预览</span>
              <h2>{selectedDocument?.name ?? "未选择文档"}</h2>
            </div>
            <span className="library-meta">{selectedDocument?.project}</span>
          </div>
          {selectedDocument ? (
            <div className="quick-preview">
              <p>状态：{statusLabels[selectedDocument.status]}</p>
              <p>建议模式：{modeName(selectedDocument.mode)}</p>
              <p>问题数量：{selectedDocument.issueCount}</p>
            </div>
          ) : (
            <p className="placeholder-text">尚未选择文档。</p>
          )}
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
      <section className="assets-card">
        <span className="eyebrow">智能体</span>
        <h2>页面暂未开发</h2>
        <p>这里将配置施工方案审查智能体和审核报告生成智能体。</p>
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

function ReviewLoadingPage({
  document,
  roleLabel,
  statusLabel,
}: {
  document?: LibraryDocument;
  roleLabel: string;
  statusLabel: string;
}) {
  return (
    <div className="loading-page">
      <div className="loading-card">
        <Sparkles size={24} />
        <span className="eyebrow">任务执行中</span>
        <h2>{document?.name ?? "文档审查任务"}</h2>
        <p>
          {roleLabel}正在等待文档解析和施工方案审查智能体完成处理。{statusLabel}
        </p>
        <div className="loading-bar">
          <span />
        </div>
        <small>即使离开页面，后台任务也会继续执行。</small>
      </div>
    </div>
  );
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
