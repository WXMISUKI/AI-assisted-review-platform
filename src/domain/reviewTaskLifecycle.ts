import type { ReviewTask } from "./reviewTypes";

export interface ReviewTaskLifecycleSummary {
  label: string;
  detail: string;
}

function getOcrPercent(task: ReviewTask) {
  const progress = task.ocrJob?.progress;
  if (
    progress &&
    typeof progress.totalPages === "number" &&
    progress.totalPages > 0 &&
    typeof progress.extractedPages === "number"
  ) {
    return Math.round((progress.extractedPages / progress.totalPages) * 100);
  }

  return null;
}

export function getTaskLifecycleSummary(task: ReviewTask): ReviewTaskLifecycleSummary {
  if (task.status === "parsing") {
    const percent = getOcrPercent(task);
    return {
      label: "OCR识别中",
      detail:
        percent != null
          ? `${percent}% · ${task.ocrJob?.message ?? "正在识别版面与段落"}`
          : task.ocrJob?.message ?? "正在识别版面与段落",
    };
  }

  if (task.status === "reviewing") {
    const stageLabel = task.streamStageType ?? "structure-restoration";
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
        ? `${task.resultAsset.type === "supervisor-report" ? "监理报告" : "整改快照"} · ${
            task.resultAsset.createdAt
          }`
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
    label: task.status,
    detail: task.ocrJob?.message ?? "任务状态正常",
  };
}
