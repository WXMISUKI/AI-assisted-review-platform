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

function getGenerationRunProgressLabel(task: ReviewTask) {
  const run = task.reviewGenerationRun;
  if (!run) {
    return null;
  }

  if (run.status === "running") {
    return run.activeStage ? `阶段 ${run.activeStage.stageIndex + 1}` : "审查生成中";
  }

  if (run.status === "ready") {
    return `生成完成 · ${run.generatedIssueCount} 条`;
  }

  if (run.status === "degraded") {
    return `降级可审查 · ${run.generatedIssueCount} 条`;
  }

  if (run.status === "failed") {
    return "审查生成失败";
  }

  return "等待生成";
}

export function getReviewTaskOrchestrationSnapshot(task: ReviewTask): ReviewTaskOrchestrationSnapshot {
  const summary = getTaskLifecycleSummary(task);
  const ocrPercent = getOcrPercent(task);
  const pipelineSnapshot = task.pipelineSnapshot;
  const currentContextLabel =
    task.recoveredStructure?.progress.currentSection ??
    pipelineSnapshot?.currentSection ??
    pipelineSnapshot?.paragraphLabel ??
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

  if (task.reviewGenerationRun?.status === "running") {
    const run = task.reviewGenerationRun;
    return {
      phase: "review-preparation",
      entryTarget: "loading",
      locked: true,
      resumable: true,
      summary,
      progressLabel: getGenerationRunProgressLabel(task),
      currentContextLabel:
        run.activeStage?.currentSection ??
        run.activeStage?.paragraphLabel ??
        currentContextLabel,
      currentStageLabel: run.activeStage?.stageType ?? pipelineSnapshot?.stageType ?? null,
    };
  }

  if (task.reviewGenerationRun?.status === "failed") {
    const run = task.reviewGenerationRun;
    return {
      phase: "review-failed",
      entryTarget: "none",
      locked: true,
      resumable: true,
      summary,
      progressLabel: getGenerationRunProgressLabel(task),
      currentContextLabel: run.diagnostics?.message ?? currentContextLabel,
      currentStageLabel: run.diagnostics?.source ?? run.activeStage?.stageType ?? null,
    };
  }

  if (task.status === "reviewing") {
    const stageIndex = pipelineSnapshot?.stageIndex ?? task.streamStageIndex;
    return {
      phase: "review-preparation",
      entryTarget: "loading",
      locked: true,
      resumable: true,
      summary,
      progressLabel:
        (pipelineSnapshot?.paragraphIndex && pipelineSnapshot?.paragraphTotal)
          ? `阶段 ${stageIndex + 1} · ${pipelineSnapshot.paragraphIndex}/${pipelineSnapshot.paragraphTotal}`
          : task.streamParagraphIndex && task.streamParagraphTotal
            ? `阶段 ${stageIndex + 1} · ${task.streamParagraphIndex}/${task.streamParagraphTotal}`
            : `阶段 ${stageIndex + 1}`,
      currentContextLabel,
      currentStageLabel: pipelineSnapshot?.stageType ?? task.streamStageType ?? "structure-restoration",
    };
  }

  if (task.status === "ready") {
    return {
      phase: "review-ready",
      entryTarget: "detail",
      locked: false,
      resumable: true,
      summary,
      progressLabel: getGenerationRunProgressLabel(task) ?? "待进入审查",
      currentContextLabel:
        pipelineSnapshot?.currentSection ??
        pipelineSnapshot?.paragraphLabel ??
        task.recoveredStructure?.progress.currentSection ??
        task.recoveredStructure?.sourceFormat ??
        null,
      currentStageLabel: pipelineSnapshot?.stageType ?? task.streamStageType ?? null,
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
