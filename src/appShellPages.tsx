import { useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileSearch,
  GitCompareArrows,
  ListChecks,
  Plus,
  ShieldCheck,
  Sparkles,
  SunMoon,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { agentAssetCatalog, promptAssetRegistry } from "./domain/agentAssets";
import type {
  BackendHealthResult,
  MinioStatusResult,
  MinioUploadResult,
  OcrJobStatusResult,
  ProviderCheckResult,
  ReviewStreamEvent,
  OcrStatusResult,
} from "./domain/backendConnectivity";
import type {
  ReviewResultAsset,
  ReviewTask,
  ReviewTaskOcrJob,
} from "./domain/reviewTypes";
import { mockStreamingStages as reviewStreamingStages } from "./domain/mockReviewTaskSeeds";
import {
  agentKeyLabels,
  pipelineStageLabels,
  formatFileSize,
  formatOcrJobLabel,
  formatResultTime,
  getOcrLoadingStageIndex,
  getOcrPercent,
  getOcrStepIndex,
  getTaskLifecycleSummary,
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
  runLlmConnectivityCheck,
  runReviewStreamConnectivityCheck,
  uploadMinioDocument,
} from "./domain/backendConnectivity";

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
  const recentDocs = documents.slice(0, 5);

  return (
    <div className="library-layout">
      <aside className="library-rail">
        <div className="section-title">
          <span className="eyebrow">最近文档</span>
          <h2>历史记录</h2>
        </div>
        <div className="history-list">
          {recentDocs.map((doc) => {
            const lifecycle = getTaskLifecycleSummary(doc);

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
                    {lifecycle.label} · {lifecycle.detail}
                  </small>
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
              <span>{uploading ? "正在上传到对象存储" : "拖拽文件到此处"}</span>
              <small>支持 PDF、Word，确认添加后写入文档库</small>
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
                <X size={15} />
                移除
              </button>
            </div>
          )}
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
            <button type="button" className="upload-button" onClick={onAddDocument} disabled={uploading}>
              <Plus size={16} />
              {stagedFile ? "添加文档" : "添加演示文档"}
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
            {documents.map((doc) => {
              const lifecycle = getTaskLifecycleSummary(doc);

              return (
                <div key={doc.id} className="table-row">
                  <div>
                    <strong>{doc.name}</strong>
                    <small>
                      上传人：{doc.uploader}
                      {doc.sourceObject ? ` · 已存储 ${formatFileSize(doc.sourceObject.size)}` : " · mock"}
                      {doc.ocrJob ? ` · ${formatOcrJobLabel(doc.ocrJob)}` : ""}
                      {doc.failure ? ` · ${doc.failure.message}` : ""}
                    </small>
                    <small className="table-row-lifecycle">
                      {lifecycle.label} · {lifecycle.detail}
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
                    ) : doc.status === "parsing" ? (
                      <button type="button" className="primary" onClick={() => onOpenDocument(doc.id)}>
                        查看识别进度
                      </button>
                    ) : doc.status === "reviewing" ? (
                      <button type="button" className="primary" onClick={() => onOpenDocument(doc.id)}>
                        继续审核
                      </button>
                    ) : (
                      <button type="button" className="primary" onClick={() => onStartReview(doc.id)}>
                        开始审核
                      </button>
                    )}
                    <button
                      type="button"
                      className="danger subtle"
                      onClick={() => onDeleteDocument(doc.id)}
                    >
                      <Trash2 size={15} />
                      删除
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

export function ResultPreviewPage({
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

export function KnowledgeBasePage() {
  return (
    <div className="placeholder-page">
      <span className="eyebrow">知识库</span>
      <h2>页面暂未开发</h2>
      <p>后续将接入招标、投标、法规、管理办法、企业标准等资料，并提供上传、切分和检索入口。</p>
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
          {agent.key === "construction-review" ? (
            <button type="button" className="primary" onClick={onOpenDocument}>
              先去文档库
            </button>
          ) : (
            <button type="button" className="secondary" onClick={onOpenDocument}>
              返回文档库
            </button>
          )}
        </section>
      ))}
      <section className="assets-card">
        <span className="eyebrow">提示词资产</span>
        <h2>{editable ? "可维护" : "只读"}</h2>
        <p>提示词资产将按智能体绑定、版本、负责人和状态进行管理。当前先展示草稿目录。</p>
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
  const loadingMode = document?.status === "parsing" ? "ocr" : "review";
  const ocrPercent = getOcrPercent(document?.ocrJob);
  const recoveredStructure = document?.recoveredStructure;
  const recoveredSections = recoveredStructure?.sections ?? [];
  const recoveredParagraphs = recoveredStructure?.paragraphs ?? [];
  const recoveredCurrentSection =
    recoveredStructure?.progress.currentSection ?? stage.currentSection ?? "待恢复";

  if (loadingMode === "ocr") {
    return (
      <div className="streaming-review-page">
        <section className="streaming-hero ocr-hero">
          <div>
            <span className="eyebrow">OCR 识别中 · {statusLabel}</span>
            <h2>{document?.name ?? "文档接入任务"}</h2>
            <p>系统正在识别版面、章节和可锚定文本。完成后会自动进入审查准备阶段。</p>
            <div className="streaming-meta">
              <span>{pipelineStageLabels[stage.stageType ?? "ocr"]}</span>
              {stage.agentLabel && <span>{stage.agentLabel}</span>}
              {stage.currentParagraphLabel && <span>{stage.currentParagraphLabel}</span>}
            </div>
          </div>
          <div className="streaming-progress">
            <strong>{ocrPercent}%</strong>
            <span>{document?.ocrJob?.message || "正在提取文档结构"}</span>
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
                  className={
                    index <= getOcrStepIndex(ocrPercent)
                      ? "streaming-step done"
                      : "streaming-step"
                  }
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
                <strong>OCR 正在处理</strong>
                <p>{document?.ocrJob?.message || "等待 OCR 服务返回分页与版面信息。"}</p>
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
          <span className="eyebrow">审查准备中 · {statusLabel}</span>
          <h2>{document?.name ?? "文档审查任务"}</h2>
          <p>
            {roleLabel}可在详情页观察文档结构化、依据匹配、问题生成的流式进度。当前任务已经接入真实
            OCR 结构恢复结果。
          </p>
          <div className="streaming-meta">
            <span>{pipelineStageLabels[stage.stageType ?? "structure-restoration"]}</span>
            <span>{stage.agentLabel ?? agentKeyLabels[stage.agentKey ?? "construction-review"]}</span>
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
          <span>{stage.title}</span>
        </div>
      </section>

      {recoveredStructure && (
        <section className="streaming-kernel-strip recovered-structure-strip" aria-label="恢复结构摘要">
          <span>
            <strong>结构来源</strong>
            {recoveredStructure.sourceFormat}
          </span>
          <span>
            <strong>章节</strong>
            {recoveredSections.length}
          </span>
          <span>
            <strong>段落</strong>
            {recoveredParagraphs.length}
          </span>
          <span>
            <strong>当前章节</strong>
            {recoveredCurrentSection}
          </span>
        </section>
      )}

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
            <span>{recoveredSections.length > 0 ? "恢复章节" : "目录识别"}</span>
          </div>
          {recoveredSections.length > 0 ? (
            recoveredSections.map((section) => (
              <div
                key={section.id}
                className={
                  recoveredCurrentSection === section.title
                    ? "streaming-outline-item active"
                    : "streaming-outline-item"
                }
              >
                <CheckCircle2 size={15} />
                {section.title} · {section.paragraphIds.length} 段
              </div>
            ))
          ) : stage.outlineItems.length > 0 ? (
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
          <div className="streaming-stage-focus">
            <article>
              <span>当前智能体</span>
              <strong>{stage.agentLabel ?? agentKeyLabels[stage.agentKey ?? "construction-review"]}</strong>
              <p>{stage.stageType ? pipelineStageLabels[stage.stageType] : "审查准备"}</p>
            </article>
            <article>
              <span>当前段落</span>
              <strong>
                {recoveredStructure?.progress.currentParagraphId
                  ? recoveredStructure.progress.currentParagraphId
                  : stage.currentParagraphLabel
                    ? `${stage.currentParagraphIndex}/${stage.currentParagraphTotal}`
                    : "待定位"}
              </strong>
              <p>{recoveredStructure?.progress.currentSection ?? stage.currentParagraphLabel ?? "等待段落锚点恢复"}</p>
            </article>
          </div>
          <div className="streaming-snippets">
            {recoveredStructure?.paragraphs.slice(0, 3).map((paragraph, index) => (
              <article key={paragraph.id}>
                <span>
                  恢复段落 {index + 1}
                  {paragraph.section ? ` · ${paragraph.section}` : ""}
                </span>
                <p>{paragraph.text}</p>
              </article>
            ))}
            {recoveredStructure?.paragraphs.length ? null : stage.documentSnippets.map((snippet, index) => (
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
