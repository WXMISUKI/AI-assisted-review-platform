import type { ReviewTask } from "./reviewTypes";
import { getTaskLifecycleSummary } from "./reviewTaskLifecycle";

export type ReviewTaskLifecyclePhase =
  | "uploaded"
  | "ocr-processing"
  | "review-preparation"
  | "review-ready"
  | "review-completed"
  | "review-failed";

export type ReviewTaskEntryTarget = "loading" | "detail" | "result" | "none";

export interface ReviewTaskOrchestrationSnapshot {
  phase: ReviewTaskLifecyclePhase;
  entryTarget: ReviewTaskEntryTarget;
  locked: boolean;
  resumable: boolean;
  summary: ReturnType<typeof getTaskLifecycleSummary>;
  progressLabel: string | null;
  currentContextLabel: string | null;
  currentStageLabel: string | null;
}

function getOcrPercent(task: ReviewTask) {
  const progress = task.ocrJob?.progress;
  if (
    progress &&
    typeof progress.totalPages === "number" &&
    progress.totalPages > 0 &&
    typeof progress.extractedPages === "number"
  ) {
    return Math.min(100, Math.max(0, Math.round((progress.extractedPages / progress.totalPages) * 100)));
  }

  return task.ocrJob?.state === "done" ? 100 : null;
}

export function getReviewTaskOrchestrationSnapshot(task: ReviewTask): ReviewTaskOrchestrationSnapshot {
  const summary = getTaskLifecycleSummary(task);
  const ocrPercent = getOcrPercent(task);
  const currentContextLabel =
    task.recoveredStructure?.progress.currentSection ??
    task.streamParagraphLabel ??
    task.streamCurrentParagraphId ??
    null;

  if (task.status === "parsing") {
    return {
      phase: "ocr-processing",
      entryTarget: "loading",
      locked: true,
      resumable: true,
      summary,
      progressLabel: ocrPercent != null ? `OCR ${ocrPercent}%` : "OCR处理中",
      currentContextLabel,
      currentStageLabel: task.ocrJob?.message ?? "正在识别版面与段落",
    };
  }

  if (task.status === "reviewing") {
    return {
      phase: "review-preparation",
      entryTarget: "loading",
      locked: true,
      resumable: true,
      summary,
      progressLabel:
        task.streamParagraphIndex && task.streamParagraphTotal
          ? `阶段 ${task.streamStageIndex + 1} · ${task.streamParagraphIndex}/${task.streamParagraphTotal}`
          : `阶段 ${task.streamStageIndex + 1}`,
      currentContextLabel,
      currentStageLabel: task.streamStageType ?? "structure-restoration",
    };
  }

  if (task.status === "ready") {
    return {
      phase: "review-ready",
      entryTarget: "detail",
      locked: false,
      resumable: true,
      summary,
      progressLabel: "待进入审查",
      currentContextLabel:
        task.recoveredStructure?.progress.currentSection ??
        task.recoveredStructure?.sourceFormat ??
        null,
      currentStageLabel: task.streamStageType ?? null,
    };
  }

  if (task.status === "completed") {
    return {
      phase: "review-completed",
      entryTarget: "result",
      locked: false,
      resumable: false,
      summary,
      progressLabel: "已完成",
      currentContextLabel: task.resultAsset?.documentName ?? task.name,
      currentStageLabel: task.resultAsset?.type ?? null,
    };
  }

  if (task.status === "failed") {
    return {
      phase: "review-failed",
      entryTarget: "none",
      locked: true,
      resumable: false,
      summary,
      progressLabel: "处理失败",
      currentContextLabel: task.failure?.message ?? task.ocrJob?.message ?? null,
      currentStageLabel: task.ocrJob?.state ?? null,
    };
  }

  return {
    phase: "uploaded",
    entryTarget: "loading",
    locked: true,
    resumable: true,
    summary,
    progressLabel: task.sourceObject ? "已上传，等待提交 OCR" : "等待开始审核",
    currentContextLabel: task.sourceObject?.originalFilename ?? task.name,
    currentStageLabel: null,
  };
}

export function isReviewTaskLocked(task: ReviewTask) {
  return getReviewTaskOrchestrationSnapshot(task).locked;
}
