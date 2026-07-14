import { useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Clock3,
  FileSearch,
  FileText,
  GitCompareArrows,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Plus,
  ShieldCheck,
  Sparkles,
  SunMoon,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { agentAssetCatalog, promptAssetRegistry } from "./domain/agentAssets";
import type {
  BackendHealthResult,
  MinioStatusResult,
  MinioUploadResult,
  OcrStatusResult,
  ProviderCheckResult,
  ReviewStreamEvent,
} from "./domain/backendConnectivity";
import { getReviewTaskOrchestrationSnapshot } from "./domain/reviewTaskOrchestration";
import { mockStreamingStages as reviewStreamingStages } from "./domain/mockReviewTaskSeeds";
import type {
  ReviewResultAsset,
  ReviewSession,
  ReviewTask,
  ReviewGenerationActivity,
  ReviewTaskOcrJob,
} from "./domain/reviewTypes";
import {
  agentKeyLabels,
  formatFileSize,
  formatOcrJobLabel,
  formatResultTime,
  getOcrLoadingStageIndex,
  getOcrPercent,
  getOcrStepIndex,
  MetricBlock,
  modeName,
  pageLabels,
  resultTypeName,
  severityName,
  statusLabels,
  ConnectivityStatus,
  AgentProfileBlock,
  AlertBadge,
} from "./appShellDisplay";
import { roleLabels } from "./appShellTypes";
import type { Role, Session, StreamingStage, ThemeMode, UploadDraft, LibraryDocument } from "./appShellTypes";
import {
  fetchBackendHealth,
  fetchMinioStatus,
  fetchOcrStatus,
  fetchReviewQueueStatus,
  runLlmConnectivityCheck,
  runReviewStreamConnectivityCheck,
  uploadMinioDocument,
} from "./domain/backendConnectivity";

function getFallbackSummaryLabel(document: LibraryDocument) {
  return (
    document.streamParagraphLabel ??
    document.recoveredStructure?.progress.currentSection ??
    document.ocrJob?.message ??
    getReviewTaskOrchestrationSnapshot(document).currentStageLabel ??
    "待恢复"
  );
}

function getGenerationRunSummaryLabel(document: LibraryDocument) {
  const run = document.reviewGenerationRun;
  if (!run) {
    return null;
  }

  if (run.status === "running") {
    return run.activeStage
      ? `审查生成中 · 阶段 ${run.activeStage.stageIndex + 1}`
      : "审查生成中";
  }

  if (run.status === "ready") {
    return `生成完成 · ${run.generatedIssueCount} 条候选`;
  }

  if (run.status === "degraded") {
    return run.diagnostics?.message
      ? `降级可审查 · ${run.diagnostics.status}`
      : `降级可审查 · ${run.generatedIssueCount} 条候选`;
  }

  if (run.status === "failed") {
    return run.diagnostics?.message
      ? `生成失败 · ${run.diagnostics.status}`
      : "审查生成失败";
  }

  return "等待审查生成";
}

function getReviewGenerationActivityLabel(activity: ReviewGenerationActivity) {
  const stageLabel = activity.stage ? `阶段 ${activity.stage.stageIndex + 1}` : null;
  const countLabel =
    typeof activity.issueCount === "number" ? `${activity.issueCount} 条候选` : null;

  if (activity.type === "run-started") {
    return stageLabel ? `生成已启动 · ${stageLabel}` : "生成已启动";
  }

  if (activity.type === "run-retried") {
    return "失败后重新生成";
  }

  if (activity.type === "stage-updated") {
    return stageLabel ? `进度更新 · ${stageLabel}` : "进度已更新";
  }

  if (activity.type === "package-persisted") {
    return activity.status ? `准备包已保存 · ${activity.status}` : "准备包已保存";
  }

  if (activity.type === "draft-issues-generated") {
    return countLabel ? `候选问题已生成 · ${countLabel}` : "候选问题已生成";
  }

  if (activity.type === "run-ready") {
    return countLabel ? `生成完成 · ${countLabel}` : "生成完成";
  }

  if (activity.type === "run-degraded") {
    return countLabel ? `降级可审查 · ${countLabel}` : "降级可审查";
  }

  if (activity.type === "run-failed") {
    return activity.status ? `生成失败 · ${activity.status}` : "生成失败";
  }

  return "生成状态已更新";
}

function getLatestReviewGenerationActivityLabel(document: LibraryDocument) {
  const activities = document.reviewGenerationActivities ?? [];
  const latestActivity = activities[activities.length - 1];
  return latestActivity ? getReviewGenerationActivityLabel(latestActivity) : null;
}

function getRecentReviewGenerationActivities(document: LibraryDocument | undefined, limit = 4) {
  const activities = document?.reviewGenerationActivities ?? [];
  return activities.slice(Math.max(0, activities.length - limit)).reverse();
}

function getResultSourceLabel(document: LibraryDocument, sessionSnapshot?: ReviewSession) {
  if (sessionSnapshot?.resultAsset) {
    return "会话快照";
  }

  if (document.resultAsset) {
    return "持久化任务";
  }

  return "暂无结果";
}

function getResultSourceDetail(document: LibraryDocument, sessionSnapshot?: ReviewSession) {
  if (sessionSnapshot?.resultAsset) {
    return "结果直接来自当前会话，适合查看刚完成的审查产物。";
  }

  if (document.resultAsset) {
    return "结果从任务实体读取，适合查看已归档的审查产物。";
  }

  return "当前任务尚未生成可展示的结果资产，页面保留了安全兜底壳。";
}

function ResultHeaderMeta({
  sourceLabel,
  sourceDetail,
  statusLabel,
  modeLabel,
}: {
  sourceLabel: string;
  sourceDetail: string;
  statusLabel: string;
  modeLabel: string;
}) {
  return (
    <div className="result-source-banner">
      <span className="result-source-chip">{sourceLabel}</span>
      <p>{sourceDetail}</p>
      <div className="result-source-inline-meta">
        <span>{statusLabel}</span>
        <span>{modeLabel}</span>
      </div>
    </div>
  );
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
          <span className="eyebrow">AI-assisted review platform</span>
          <h1>施工方案审查平台</h1>
          <p>登录后进入文档库，按角色进入对应审查模式、数据资产和智能体资源配置。</p>
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

          <button type="button" className="login-submit" onClick={() => onSignIn({ username, role })}>
            <ShieldCheck size={16} />
            登录进入平台
          </button>
        </div>
      </section>
    </main>
  );
}

export function DocumentLibraryPage({
  documents,
  uploadDraft,
  stagedFile,
  dragging,
  onUploadDraftChange,
  onAddDocument,
  onFileSelect,
  onStagedFileRemove,
  onDragChange,
  uploading,
  uploadError,
  onStartReview,
  onOpenDocument,
  onOpenResult,
  onDeleteDocument,
}: {
  documents: LibraryDocument[];
  uploadDraft: UploadDraft;
  stagedFile: File | null;
  dragging: boolean;
  onUploadDraftChange: (draft: UploadDraft) => void;
  onAddDocument: () => void;
  onFileSelect: (file: File) => void;
  onStagedFileRemove: () => void;
  onDragChange: (value: boolean) => void;
  uploading: boolean;
  uploadError: string;
  onStartReview: (documentId: string) => void;
  onOpenDocument: (documentId: string) => void;
  onOpenResult: (documentId: string) => void;
  onDeleteDocument: (documentId: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recentDocs = useMemo(() => documents.slice(0, 5), [documents]);

  return (
    <div className="library-layout">
      <aside className="library-rail">
        <div className="section-title">
          <span className="eyebrow">最近文档</span>
          <h2>历史记录</h2>
        </div>
        <div className="history-list">
          {recentDocs.map((doc) => {
            const lifecycle = getReviewTaskOrchestrationSnapshot(doc);
            const generationRunSummary = getGenerationRunSummaryLabel(doc);
            const latestGenerationActivity = getLatestReviewGenerationActivityLabel(doc);

            return (
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
                  <small className="history-lifecycle">
                    {lifecycle.summary.label} · {lifecycle.summary.detail}
                  </small>
                  {generationRunSummary && (
                    <small className="history-lifecycle">{generationRunSummary}</small>
                  )}
                  {latestGenerationActivity && (
                    <small className="history-lifecycle">{latestGenerationActivity}</small>
                  )}
                </span>
                <GitCompareArrows size={16} />
              </button>
            );
          })}
        </div>
      </aside>

      <section className="library-main">
        <div className="library-upload-card">
          <div>
            <span className="eyebrow">上传文档</span>
            <h2>拖拽或选择文件，创建新的审查任务</h2>
            <p>上传后可以直接开始审查，系统会先走文档接入与结构恢复流程。</p>
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
                  onFileSelect(file);
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
                  onFileSelect(file);
                }
              }}
            >
              <Upload size={22} />
              <span>{uploading ? "正在上传到对象存储..." : "拖拽文件到此处"}</span>
              <small>支持 PDF、Word，确认后会写入文档库。</small>
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

          {stagedFile && (
            <div className="staged-file-card" title={stagedFile.name}>
              <div>
                <strong>{stagedFile.name}</strong>
                <small>{formatFileSize(stagedFile.size)} · 待添加</small>
              </div>
              <button type="button" onClick={onStagedFileRemove} disabled={uploading}>
                <X size={16} />
              </button>
            </div>
          )}

          <div className="library-form">
            <label>
              <span>文档名称</span>
              <input
                value={uploadDraft.name}
                onChange={(event) => onUploadDraftChange({ ...uploadDraft, name: event.target.value })}
                placeholder="例如：南京综合楼施工方案"
              />
            </label>
            <label>
              <span>项目名称</span>
              <input
                value={uploadDraft.project}
                onChange={(event) => onUploadDraftChange({ ...uploadDraft, project: event.target.value })}
                placeholder="例如：南京综合楼项目"
              />
            </label>
            <button type="button" className="primary" onClick={onAddDocument} disabled={uploading}>
              <Plus size={16} />
              添加文档
            </button>
          </div>

          {uploadError && <div className="connectivity-error">{uploadError}</div>}
        </div>

        <div className="document-grid">
          {documents.map((doc) => {
            const lifecycle = getReviewTaskOrchestrationSnapshot(doc);
            const generationRunSummary = getGenerationRunSummaryLabel(doc);
            const latestGenerationActivity = getLatestReviewGenerationActivityLabel(doc);
            const hasResult = Boolean(doc.resultAsset);
            const canRetryGeneration = lifecycle.phase === "review-failed" && lifecycle.resumable;

            return (
              <article key={doc.id} className="document-card">
                <div className="document-card-head">
                  <div>
                    <span className="eyebrow">任务 {doc.id}</span>
                    <h3>{doc.name}</h3>
                  </div>
                  <button type="button" className="ghost-icon" onClick={() => onDeleteDocument(doc.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>

                <p>{doc.project}</p>
                <div className="document-card-meta">
                  <span className={`status-pill status-${doc.status}`}>{statusLabels[doc.status]}</span>
                  <span className="mode-pill">{modeName(doc.mode)}</span>
                </div>
                <p className="document-summary">
                  {lifecycle.summary.label} · {lifecycle.summary.detail}
                  {generationRunSummary ? ` · ${generationRunSummary}` : ""}
                  {latestGenerationActivity ? ` · ${latestGenerationActivity}` : ""}
                </p>
                <div className="dialog-actions">
                  <button type="button" className="secondary" onClick={() => onOpenDocument(doc.id)}>
                    <FileText size={16} />
                    打开工作台
                  </button>
                  {canRetryGeneration ? (
                    <button type="button" className="primary" onClick={() => onStartReview(doc.id)}>
                      <Sparkles size={16} />
                      重新生成
                    </button>
                  ) : doc.status === "ready" || doc.status === "reviewing" ? (
                    <button type="button" className="primary" onClick={() => onStartReview(doc.id)}>
                      <Sparkles size={16} />
                      开始审查
                    </button>
                  ) : hasResult ? (
                    <button type="button" className="primary" onClick={() => onOpenResult(doc.id)}>
                      <FileText size={16} />
                      查看结果
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function renderResultAsset(asset: ReviewResultAsset) {
  if (asset.type === "supervisor-report") {
    return (
      <>
        <article className="result-card">
          <span className="eyebrow">审查结论</span>
          <h3>{asset.summary}</h3>
          <p>{asset.conclusion}</p>
        </article>
        <article className="result-card">
          <span className="eyebrow">主要风险</span>
          <ul className="result-list">
            {asset.majorRisks.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article className="result-card result-card-wide">
          <span className="eyebrow">问题意见</span>
          <div className="result-table">
            {asset.issueOpinions.map((opinion) => (
              <div key={opinion.issueId} className="result-table-row">
                <strong>
                  {opinion.issueId} · {opinion.title}
                </strong>
                <span>
                  {severityName(opinion.severity)} · {opinion.decision}
                </span>
                <p>{opinion.opinion}</p>
              </div>
            ))}
          </div>
        </article>
      </>
    );
  }

  return (
    <>
      <article className="result-card">
        <span className="eyebrow">处理摘要</span>
        <h3>{asset.processingSummary}</h3>
        <p>该结果用于展示整改后方案的归并结果与保留项。</p>
      </article>
      <article className="result-card">
        <span className="eyebrow">接受变更</span>
        <ul className="result-list">
          {asset.acceptedChanges.map((item) => (
            <li key={item.issueId}>
              <strong>{item.issueId}</strong>
              <span>{item.revisedText}</span>
            </li>
          ))}
        </ul>
      </article>
      <article className="result-card result-card-wide">
        <span className="eyebrow">拒绝项</span>
        <ul className="result-list">
          {asset.rejectedItems.map((item) => (
            <li key={item.issueId}>
              <strong>{item.issueId}</strong>
              <span>{item.reason}</span>
            </li>
          ))}
        </ul>
      </article>
    </>
  );
}

export function ResultPreviewPage({
  document,
  sessionSnapshot,
  onBack,
  onOpenWorkbench,
  themeMode,
  onToggleTheme,
}: {
  document: LibraryDocument;
  sessionSnapshot?: ReviewSession;
  onBack: () => void;
  onOpenWorkbench: () => void;
  themeMode: ThemeMode;
  onToggleTheme: () => void;
}) {
  const asset = sessionSnapshot?.resultAsset ?? document.resultAsset;
  const sourceLabel = getResultSourceLabel(document, sessionSnapshot);
  const sourceDetail = getResultSourceDetail(document, sessionSnapshot);

  return (
    <main className="result-page">
      <header className="topbar result-topbar">
        <button type="button" className="detail-back-button" onClick={onBack}>
          <ArrowLeft size={16} />
          返回文档库
        </button>
        <div>
          <span className="eyebrow">{asset ? "审查结果资产" : "结果预览 · Fallback Shell"}</span>
          <h1>{asset?.documentName ?? document.name}</h1>
        </div>
        <div className="project-meta" aria-label="结果页操作">
          <span>{`来源：${sourceLabel}`}</span>
          <button type="button" className="theme-toggle subtle" onClick={onToggleTheme}>
            <SunMoon size={16} />
            {themeMode === "light" ? "深色主题" : "浅色主题"}
          </button>
          <button type="button" className="theme-toggle subtle" onClick={onOpenWorkbench}>
            <FileText size={16} />
            返回工作台
          </button>
          <span>{statusLabels[document.status]}</span>
          <span>{modeName(document.mode)}</span>
        </div>
      </header>

      <section className="result-hero">
        <div>
          <span className="eyebrow">{asset ? "生成时间" : "恢复说明"}</span>
          {asset ? <h2>{formatResultTime(asset.createdAt)}</h2> : <h2>当前任务没有可展示的结果资产</h2>}
          <ResultHeaderMeta
            sourceLabel={sourceLabel}
            sourceDetail={sourceDetail}
            statusLabel={statusLabels[document.status]}
            modeLabel={modeName(document.mode)}
          />
          <p>
            {asset
              ? "页面用于验证审查完成后的业务产物结构，导出和归档仍然保留为后续接入点。"
              : "系统暂时无法从会话快照或持久化任务中恢复结果资产，但仍保留安全兜底外壳。"}
          </p>
        </div>
        <button type="button" className="export-disabled" disabled>
          导出 PDF/Word 待接入
        </button>
      </section>

      <section className="result-metrics" aria-label="结果概览">
        <MetricBlock label="结果来源" value={sourceLabel} />
        <MetricBlock label="任务状态" value={statusLabels[document.status]} />
        <MetricBlock label="任务模式" value={modeName(document.mode)} />
        <MetricBlock label="更新时间" value={document.updatedAt} />
        <MetricBlock label="当前阶段" value={getFallbackSummaryLabel(document)} />
      </section>

      {!asset ? (
        <section className="result-layout">
          <article className="result-card result-card-wide">
            <span className="eyebrow">恢复路径</span>
            <h2>结果资产缺失时的安全兜底</h2>
            <p>
              这个页面保留了可返回的恢复入口，方便你回到工作台继续检查任务状态、OCR 结果和审查进度。
            </p>
            <div className="dialog-actions">
              <button type="button" className="primary" onClick={onOpenWorkbench}>
                <FileText size={16} />
                返回工作台
              </button>
              <button type="button" onClick={onBack}>
                返回文档库
              </button>
            </div>
          </article>
        </section>
      ) : (
        <section className="result-layout">{renderResultAsset(asset)}</section>
      )}
    </main>
  );
}

export function KnowledgeBasePage() {
  return (
    <div className="assets-grid">
      <section className="assets-card result-card-wide">
        <span className="eyebrow">知识库</span>
        <h2>审查依据与智能体绑定</h2>
        <p>这里保留知识资产目录的骨架，后续可以继续挂接真实依据、提示词和版本状态。</p>
      </section>
    </div>
  );
}

export function DataAssetsPage({
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
  const [queueResult, setQueueResult] = useState<BackendHealthResult["queue"] | null>(null);
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

      const queue = await fetchReviewQueueStatus();
      setQueueResult(queue);

      const llm = await runLlmConnectivityCheck();
      setLlmResult(llm);

      const events = await runReviewStreamConnectivityCheck();
      setStreamEvents(events);
    } catch (error) {
      setConnectivityError(error instanceof Error ? error.message : "后端连通性检查失败");
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
        setConnectivityError(result.message || "MinIO 上传验证失败");
      }
    } catch (error) {
      setConnectivityError(error instanceof Error ? error.message : "MinIO 上传验证失败");
    } finally {
      setUploadingToMinio(false);
    }
  }

  const healthSummary = healthResult?.providers?.summary?.overall ?? "unconfigured";
  const queueSummary = queueResult
    ? `${queueResult.adapter ?? "queue"} | queued ${queueResult.counts?.queued ?? 0} | active ${queueResult.activeJobCount ?? 0}`
    : "waiting";

  return (
    <div className="assets-grid">
      {agentAssetCatalog.map((agent) => (
        <section key={agent.key} className="assets-card agent-profile-card">
          <span className="eyebrow">智能体</span>
          <h2>{agent.name}</h2>
          <p>{agent.summary}</p>
          <div className="agent-profile-meta">
            <span>{agent.schemaVersion}</span>
            <span>{agent.promptAsset}</span>
          </div>
          <div className="agent-profile-hint">{agent.stageHint}</div>
          <AgentProfileBlock title="引擎链路" items={agent.engines} />
          <AgentProfileBlock title="校验域" items={agent.checkDomains} />
          <AgentProfileBlock title="输出场景" items={agent.outputScenarios} />
          {agent.basisCategories && agent.basisCategories.length > 0 && (
            <AgentProfileBlock title="审查依据" items={agent.basisCategories} />
          )}
          <div className="knowledge-binding-list">
            {agent.knowledgeBindings.map((binding) => (
              <div key={binding.name} className="knowledge-binding-item">
                <strong>{binding.name}</strong>
                <span>{binding.status}</span>
              </div>
            ))}
          </div>
          <button type="button" className={agent.key === "construction-review" ? "primary" : "secondary"} onClick={onOpenDocument}>
            {agent.key === "construction-review" ? "先去文档库" : "返回文档库"}
          </button>
        </section>
      ))}

      <section className="assets-card">
        <span className="eyebrow">提示词资产</span>
        <h2>{editable ? "可维护" : "只读"}</h2>
        <p>提示词资产按智能体绑定、版本、负责人和状态管理，这里先展示目录骨架。</p>
        <div className="prompt-asset-list">
          {promptAssetRegistry.map((prompt) => (
            <article key={prompt.name} className="prompt-asset-item">
              <div className="prompt-asset-head">
                <strong>{prompt.name}</strong>
                <span>{prompt.status}</span>
              </div>
              <p>{prompt.description}</p>
              <small>
                {prompt.version} · {prompt.owner}
              </small>
            </article>
          ))}
        </div>
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
        <p>用于验证本地 BFF、OpenAI-compatible LLM、PaddleOCR-VL 与 SSE 流式通道，不会显示任何密钥。</p>
        {connectivityError && <div className="connectivity-error">{connectivityError}</div>}

        <div className="connectivity-grid">
          <ConnectivityStatus
            title="后端 BFF"
            status={healthResult?.ok ? "ready" : "pending"}
            detail={healthResult?.providers?.summary ? `整体状态：${healthSummary}` : "尚未检查"}
          />
          <ConnectivityStatus
            title="LLM"
            status={llmResult?.ok ? "ready" : "pending"}
            detail={llmResult?.message ?? llmResult?.preview ?? "等待检查"}
          />
          <ConnectivityStatus
            title="OCR"
            status={ocrResult?.ok ? "ready" : "pending"}
            detail={ocrResult?.model ?? "等待检查"}
          />
          <ConnectivityStatus
            title="MinIO"
            status={minioResult?.ok ? "ready" : "pending"}
            detail={minioResult?.summary ?? "等待检查"}
          />
          <ConnectivityStatus
            title="Worker Queue"
            status={queueResult?.ok && queueResult.ready ? "ready" : "pending"}
            detail={queueSummary}
          />
        </div>

        <div className="connectivity-grid">
          <article className="connectivity-stream-card">
            <span className="eyebrow">SSE 流</span>
            <h3>review stream connectivity</h3>
            <div className="stream-event-list">
              {streamEvents.length === 0 ? (
                <p>点击上方按钮后查看事件流。</p>
              ) : (
                streamEvents.map((event) => (
                  <div key={`${event.stageId}-${event.type}`} className="stream-event-item">
                    <strong>
                      {event.type} · {event.title}
                    </strong>
                    <span>{event.detail}</span>
                    {event.completedAt && <small>{event.completedAt}</small>}
                  </div>
                ))
              )}
            </div>
          </article>

          <article className="connectivity-stream-card">
            <span className="eyebrow">MinIO 冒烟上传</span>
            <h3>对象存储写入验证</h3>
            <p>用于检查对象存储写入链路是否可用。</p>
            <input
              ref={storageSmokeInputRef}
              type="file"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void handleMinioSmokeUpload(file);
                  event.target.value = "";
                }
              }}
            />
            {minioUploadResult && (
              <div className="stream-event-item">
                <strong>{minioUploadResult.ok ? "上传成功" : "上传失败"}</strong>
                <span>{minioUploadResult.message ?? minioUploadResult.object?.summary ?? "无附加说明"}</span>
              </div>
            )}
            <button
              type="button"
              className="secondary"
              onClick={() => storageSmokeInputRef.current?.click()}
              disabled={uploadingToMinio}
            >
              选择文件
            </button>
          </article>
        </div>
      </section>
    </div>
  );
}

export function ReviewLoadingPage({
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
  const lifecycle = document ? getReviewTaskOrchestrationSnapshot(document) : null;
  const recentGenerationActivities = getRecentReviewGenerationActivities(document);
  const loadingMode = lifecycle?.phase === "ocr-processing" ? "ocr" : "review";
  const ocrPercent = getOcrPercent(document?.ocrJob);
  const recoveredStructure = document?.recoveredStructure;
  const recoveredSections = recoveredStructure?.sections ?? [];
  const recoveredParagraphs = recoveredStructure?.paragraphs ?? [];
  const recoveredCurrentSection =
    recoveredStructure?.progress.currentSection ?? stage.currentSection ?? "待恢复";
  const hydrationSourceLabel = recoveredStructure
    ? `结构来源：${recoveredStructure.sourceFormat}`
    : "结构来源：等待 OCR 水合";
  const hydrationStatusLabel = recoveredStructure
    ? `恢复状态：${recoveredStructure.status}`
    : "恢复状态：未生成";

  if (loadingMode === "ocr") {
    return (
      <div className="streaming-review-page">
        <section className="streaming-hero ocr-hero">
          <div>
            <span className="eyebrow">OCR 识别 · {statusLabel}</span>
            <h2>{document?.name ?? "文档接入任务"}</h2>
            <p>系统正在识别版面、章节和可锚定文本，完成后会自动进入审查准备阶段。</p>
            <div className="streaming-meta">
              <span>{lifecycle?.currentStageLabel ?? stage.title}</span>
              {stage.agentLabel && <span>{stage.agentLabel}</span>}
              {stage.currentParagraphLabel && <span>{stage.currentParagraphLabel}</span>}
            </div>
          </div>
          <div className="streaming-progress">
            <strong>{lifecycle?.progressLabel ?? `${ocrPercent}%`}</strong>
            <span>{lifecycle?.currentStageLabel ?? document?.ocrJob?.message ?? "正在提取文档结构"}</span>
          </div>
        </section>

        <div className="streaming-progress-bar" aria-label="OCR 识别进度">
          <span style={{ width: `${ocrPercent}%` }} />
        </div>

        <section className="streaming-layout streaming-layout-ocr" aria-label="OCR 接入进度">
          <aside className="streaming-panel streaming-outline">
            <div className="streaming-panel-title">
              <ListChecks size={18} />
              <span>识别步骤</span>
            </div>
            <div className="streaming-timeline compact">
              {["接收文件", "识别版面", "提取章节", "生成结构化结果"].map((item, index) => (
                <div
                  key={item}
                  className={index <= getOcrStepIndex(ocrPercent) ? "streaming-step done" : "streaming-step"}
                >
                  <span />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </aside>

          <section className="streaming-panel streaming-document">
            <div className="streaming-panel-title">
              <FileSearch size={18} />
              <span>文档结构化说明</span>
            </div>
            <div className="streaming-stage-card">
              <Sparkles size={18} />
              <div>
                <strong>{lifecycle?.summary.label ?? "OCR 正在处理"}</strong>
                <p>{lifecycle?.summary.detail ?? document?.ocrJob?.message ?? "等待 OCR 服务返回分页与版面信息"}</p>
              </div>
            </div>
            <div className="streaming-snippets">
              <article>
                <span>当前状态</span>
                <p>识别完成前无法进入审查工作台。</p>
              </article>
              <article>
                <span>下一步</span>
                <p>OCR 完成后自动开始审查准备与智能体流式分析。</p>
              </article>
            </div>
          </section>

          <aside className="streaming-panel streaming-issues">
            <div className="streaming-panel-title">
              <Clock3 size={18} />
              <span>接入提示</span>
            </div>
            <div className="streaming-issue-list">
              <div className="streaming-issue-item">
                <AlertBadge index={1} />
                <p>OCR 完成前，详情页保持锁定。</p>
              </div>
              <div className="streaming-issue-item">
                <AlertBadge index={2} />
                <p>识别完成后，审查智能体自动接管。</p>
              </div>
            </div>
          </aside>
        </section>
      </div>
    );
  }

  return (
    <div className="streaming-review-page">
      <section className="streaming-hero">
          <div>
            <span className="eyebrow">审查准备 · {statusLabel}</span>
            <h2>{document?.name ?? "文档审查任务"}</h2>
            <p>{roleLabel}可在详情页观察文档结构化、依据匹配、问题生成的流式进度。</p>
            <div className="streaming-meta">
              <span>{stage.stageType ? pageLabels.documents : "审查中"}</span>
              <span>{stage.agentLabel ?? agentKeyLabels[stage.agentKey ?? "construction-review"]}</span>
              <span>{hydrationSourceLabel}</span>
              <span>{hydrationStatusLabel}</span>
              {recoveredStructure && <span>{recoveredStructure.sourceFormat}</span>}
              {stage.currentParagraphLabel && (
                <span>
                  段落 {stage.currentParagraphIndex}/{stage.currentParagraphTotal} · {stage.currentParagraphLabel}
                </span>
            )}
            {recoveredStructure?.progress.currentParagraphId && (
              <span>恢复锚点 {recoveredStructure.progress.currentParagraphId}</span>
            )}
          </div>
        </div>
        <div className="streaming-progress">
          <strong>{stage.progress}%</strong>
          <span>{stage.detail}</span>
        </div>
      </section>

      <div className="streaming-progress-bar" aria-label="审查准备进度">
        <span style={{ width: `${stage.progress}%` }} />
      </div>

      <section className="streaming-layout" aria-label="审查准备进度">
        <aside className="streaming-panel streaming-outline">
          <div className="streaming-panel-title">
            <ListChecks size={18} />
            <span>准备阶段</span>
          </div>
          <div className="streaming-timeline">
            {stages.map((item, index) => (
              <div key={item.id} className={index <= stageIndex ? "streaming-step done" : "streaming-step"}>
                <span />
                <p>{item.title}</p>
              </div>
            ))}
          </div>
        </aside>

        <section className="streaming-panel streaming-document">
          <div className="streaming-panel-title">
            <FileSearch size={18} />
            <span>当前流式阶段</span>
          </div>
          <div className="streaming-stage-card">
            <Sparkles size={18} />
            <div>
              <strong>{stage.title}</strong>
              <p>{stage.detail}</p>
            </div>
          </div>
          {recentGenerationActivities.length > 0 && (
            <div className="streaming-activity-list" aria-label="最近生成活动">
              {recentGenerationActivities.map((activity) => (
                <div key={activity.id} className="streaming-activity-item">
                  <span>{getReviewGenerationActivityLabel(activity)}</span>
                  <small>{new Date(activity.occurredAt).toLocaleTimeString()}</small>
                </div>
              ))}
            </div>
          )}
          <div className="streaming-snippets">
            <article>
              <span>当前上下文</span>
              <p>{recoveredCurrentSection}</p>
            </article>
            <article>
              <span>结构状态</span>
              <p>
                {recoveredSections.length} 个章节 · {recoveredParagraphs.length} 个段落
              </p>
            </article>
            <article>
              <span>水合来源</span>
              <p>{recoveredStructure ? `OCR 结果已转为 ${recoveredStructure.sourceFormat}` : "等待完成 OCR 水合"}</p>
            </article>
          </div>
        </section>

        <aside className="streaming-panel streaming-issues">
          <div className="streaming-panel-title">
            <Clock3 size={18} />
            <span>任务提示</span>
          </div>
          <div className="streaming-issue-list">
            {stage.issueSummaries.length > 0 ? (
              stage.issueSummaries.map((item, index) => (
                <div key={item} className="streaming-issue-item">
                  <AlertBadge index={index + 1} />
                  <p>{item}</p>
                </div>
              ))
            ) : (
              <div className="streaming-issue-item">
                <AlertBadge index={1} />
                <p>当前阶段尚未生成问题摘要。</p>
              </div>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
