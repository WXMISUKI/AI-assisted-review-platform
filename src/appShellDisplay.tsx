import { LucideIcon } from "lucide-react";
import type {
  BackendHealthResult,
  MinioStatusResult,
  MinioUploadResult,
  OcrJobStatusResult,
  ProviderCheckResult,
  ReviewStreamEvent,
} from "./domain/backendConnectivity";
import { agentAssetCatalog } from "./domain/agentAssets";
import { mockStreamingStages as reviewStreamingStages } from "./domain/mockReviewTaskSeeds";
import type {
  DocumentStatus,
  ReviewAgentKey,
  ReviewMode,
  ReviewPipelineStageType,
  ReviewResultAsset,
  ReviewTask,
  ReviewTaskOcrJob,
} from "./domain/reviewTypes";
import { roleLabels, roleModes } from "./appShellTypes";

export const pageLabels = {
  documents: "文档库",
  "knowledge-base": "知识库",
  "data-assets": "数据资产",
} as const;

export const statusLabels: Record<DocumentStatus, string> = {
  uploading: "上传中",
  uploaded: "待开始",
  parsing: "OCR识别中",
  reviewing: "审查准备中",
  ready: "待审核",
  completed: "已完成",
  failed: "失败",
};

export const agentKeyLabels: Record<ReviewAgentKey, string> = {
  "structure-restoration": "文档结构恢复智能体",
  "construction-review": "施工方案审查智能体",
  "report-generation": "审查报告生成智能体",
};

export const pipelineStageLabels: Record<ReviewPipelineStageType, string> = {
  ocr: "OCR 识别",
  "structure-restoration": "结构恢复",
  "basis-binding": "依据匹配",
  "rule-review": "规则审查",
  "semantic-review": "语义研判",
  "issue-structuring": "问题结构化",
  "result-packaging": "结果包装",
};

export function formatResultTime(value: string) {
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

export function formatFileSize(value: number) {
  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / 1024 / 1024).toFixed(1)} MB`;
}

export function formatOcrJobLabel(job: ReviewTaskOcrJob) {
  const progress = job.progress;
  const percent =
    progress &&
    typeof progress.totalPages === "number" &&
    progress.totalPages > 0 &&
    typeof progress.extractedPages === "number"
      ? Math.round((progress.extractedPages / progress.totalPages) * 100)
      : null;

  if (job.state === "done") {
    return percent != null ? `OCR已完成 · ${percent}%` : "OCR已完成";
  }

  if (job.state === "running") {
    return percent != null ? `OCR处理中 · ${percent}%` : "OCR处理中";
  }

  if (job.state === "pending") {
    return percent != null ? `OCR排队中 · ${percent}%` : "OCR排队中";
  }

  if (job.state === "failed") {
    return `OCR失败：${job.message ?? "提交失败"}`;
  }

  if (job.jobId) {
    return percent != null
      ? `OCR已提交 #${job.jobId.slice(-8)} · ${percent}%`
      : `OCR已提交 #${job.jobId.slice(-8)}`;
  }

  return "OCR已提交";
}

export function modeName(mode?: ReviewMode) {
  if (mode === "review") return "审查模式";
  if (mode === "revise") return "审查修改模式";
  return "未设置";
}

export function resultTypeName(asset: ReviewResultAsset) {
  return asset.type === "supervisor-report" ? "审核报告" : "整改后方案";
}

export function severityName(severity: "critical" | "high" | "medium" | "low") {
  const labels = {
    critical: "重大",
    high: "高",
    medium: "中",
    low: "低",
  } as const;

  return labels[severity];
}

export function getInitialTheme() {
  if (typeof window === "undefined") {
    return "light" as const;
  }

  const storedTheme = window.localStorage.getItem("app-theme");
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? ("dark" as const) : ("light" as const);
}

export { roleLabels, roleModes };

export function getTaskLifecycleSummary(task: ReviewTask) {
  if (task.status === "parsing") {
    const progress = task.ocrJob?.progress;
    const percent =
      progress &&
      typeof progress.totalPages === "number" &&
      progress.totalPages > 0 &&
      typeof progress.extractedPages === "number"
        ? Math.round((progress.extractedPages / progress.totalPages) * 100)
        : null;

    return {
      label: "OCR识别中",
      detail:
        percent != null
          ? `${percent}% · ${task.ocrJob?.message ?? "正在识别版面与段落"}`
          : task.ocrJob?.message ?? "正在识别版面与段落",
    };
  }

  if (task.status === "reviewing") {
    const stageLabel = pipelineStageLabels[task.streamStageType ?? "structure-restoration"];
    const paragraphLabel =
      task.streamParagraphLabel ??
      task.recoveredStructure?.progress.currentSection ??
      task.streamCurrentParagraphId ??
      "当前段落待恢复";
    const position =
      task.streamParagraphIndex && task.streamParagraphTotal
        ? ` ${task.streamParagraphIndex}/${task.streamParagraphTotal}`
        : "";

    return {
      label: "审查准备中",
      detail: `${stageLabel}${position} · ${paragraphLabel}`,
    };
  }

  if (task.status === "ready") {
    return {
      label: "待审核",
      detail:
        task.recoveredStructure?.progress.currentSection ??
        task.recoveredStructure?.sourceFormat ??
        "结构已恢复，等待打开详情",
    };
  }

  if (task.status === "completed") {
    return {
      label: task.resultAsset ? "结果已生成" : "已完成",
      detail: task.resultAsset
        ? `${task.resultAsset.type === "supervisor-report" ? "监理报告" : "整改快照"} · ${formatResultTime(task.resultAsset.createdAt)}`
        : "审查结果已归档",
    };
  }

  if (task.status === "failed") {
    return {
      label: "处理失败",
      detail: task.failure?.message ?? task.ocrJob?.message ?? "请检查失败原因",
    };
  }

  if (task.status === "uploaded") {
    return {
      label: "待开始",
      detail: task.sourceObject ? "已上传到对象存储，等待提交 OCR" : "演示任务，等待开始审核",
    };
  }

  return {
    label: statusLabels[task.status],
    detail: task.ocrJob?.message ?? "任务状态正常",
  };
}

export function MetricBlock({
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

export function ConnectivityStatus({
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

export function AgentProfileBlock({ title, items }: { title: string; items: string[] }) {
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

export function AlertBadge({ index }: { index: number }) {
  return <span className="streaming-issue-badge">#{index}</span>;
}


export function getOcrLoadingStageIndex(jobStatus?: OcrJobStatusResult | null) {
  if (!jobStatus || jobStatus.state === "submitted" || jobStatus.state === "pending") {
    return 0;
  }

  if (jobStatus.state === "failed") {
    return Math.max(0, reviewStreamingStages.length - 2);
  }

  if (jobStatus.state === "done") {
    return reviewStreamingStages.length - 1;
  }

  const progress = jobStatus.progress;
  if (
    progress &&
    typeof progress.totalPages === "number" &&
    progress.totalPages > 0 &&
    typeof progress.extractedPages === "number"
  ) {
    const ratio = progress.extractedPages / progress.totalPages;
    const boundedIndex = Math.round(ratio * (reviewStreamingStages.length - 1));
    return Math.min(Math.max(boundedIndex, 1), reviewStreamingStages.length - 2);
  }

  return 1;
}

export function getOcrPercent(job?: ReviewTaskOcrJob) {
  const progress = job?.progress;
  if (
    progress &&
    typeof progress.totalPages === "number" &&
    progress.totalPages > 0 &&
    typeof progress.extractedPages === "number"
  ) {
    return Math.min(100, Math.max(0, Math.round((progress.extractedPages / progress.totalPages) * 100)));
  }

  if (job?.state === "done") {
    return 100;
  }

  return 0;
}

export function getOcrStepIndex(percent: number) {
  if (percent >= 100) return 3;
  if (percent >= 75) return 2;
  if (percent >= 35) return 1;
  return 0;
}

export function NavButton({
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
