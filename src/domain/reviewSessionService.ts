import { documentParagraphs, initialReviewIssues } from "./mockReview";
import { recoverStructureFromParagraphs } from "./ocrStructureRecovery";
import { loadReviewTasks, saveReviewTasks } from "./reviewTaskRepository";
import {
  buildProcessedParagraphs,
  createReviewResultAsset,
  getIssueCounts,
  resolveIssue,
} from "./reviewUtils";
import type {
  CreateReviewTaskInput,
  DocumentParagraph,
  IssueStatus,
  ReviewAgentKey,
  ReviewCompletionPayload,
  ReviewIssue,
  ReviewMode,
  ReviewSession,
  ReviewPipelineStageType,
  ReviewTask,
  ReviewTaskOcrJob,
  ReviewTaskSourceObject,
  RecoveredDocumentStructure,
} from "./reviewTypes";

function nowString() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

function cloneParagraphs(paragraphs: DocumentParagraph[]) {
  return paragraphs.map((paragraph) => ({ ...paragraph }));
}

function cloneIssues() {
  return initialReviewIssues.map((issue) => structuredClone(issue));
}

function createIdleRecoveredStructure(): RecoveredDocumentStructure {
  return {
    status: "idle",
    sourceFormat: "mock",
    recoveredAt: null,
    progress: {
      totalParagraphs: 0,
      recoveredParagraphs: 0,
    },
    sections: [],
    paragraphs: [],
  };
}

function updateTask(
  tasks: ReviewTask[],
  taskId: string,
  updater: (task: ReviewTask) => ReviewTask,
): ReviewTask[] {
  return saveReviewTasks(tasks.map((task) => (task.id === taskId ? updater(task) : task)));
}

export function listReviewTasks(): ReviewTask[] {
  return loadReviewTasks();
}

export function createDocumentTask(
  tasks: ReviewTask[],
  input: CreateReviewTaskInput,
): ReviewTask[] {
  const newTask: ReviewTask = {
    id: `doc-${Date.now()}`,
    name: input.name,
    project: input.project,
    uploader: input.uploader,
    updatedAt: nowString(),
    status: input.status ?? "uploaded",
    issueCount: 0,
    mode: input.mode,
    paragraphs: cloneParagraphs(documentParagraphs),
    issues: cloneIssues(),
    recoveredStructure:
      input.recoveredStructure ??
      (input.status === "uploaded" || input.status === "parsing"
        ? createIdleRecoveredStructure()
        : recoverStructureFromParagraphs(cloneParagraphs(documentParagraphs))),
    streamStageIndex: 0,
    sourceObject: input.sourceObject,
    ocrJob: input.ocrJob,
    failure: input.status === "failed" ? input.failure : undefined,
  };

  return saveReviewTasks([newTask, ...tasks]);
}

export function updateDocumentTaskUploadResult(
  tasks: ReviewTask[],
  taskId: string,
  input: {
    status: "uploaded" | "parsing" | "failed";
    sourceObject?: ReviewTaskSourceObject;
    ocrJob?: ReviewTaskOcrJob;
    failureMessage?: string;
    recoveredStructure?: RecoveredDocumentStructure;
  },
): ReviewTask[] {
  return updateTask(tasks, taskId, (task) => ({
    ...task,
    status: input.status,
    sourceObject: input.sourceObject ?? task.sourceObject,
    ocrJob: input.ocrJob ?? task.ocrJob,
    recoveredStructure: input.recoveredStructure ?? task.recoveredStructure,
    failure: input.status === "failed"
      ? {
          message: input.failureMessage || input.ocrJob?.message || "文档上传或解析任务提交失败。",
          failedAt: new Date().toISOString(),
        }
      : undefined,
    updatedAt: nowString(),
  }));
}

export function syncDocumentTaskOcrStatus(
  tasks: ReviewTask[],
  taskId: string,
  input: {
    state?: "submitted" | "pending" | "running" | "done" | "failed";
    progress?: ReviewTaskOcrJob["progress"];
    message?: string;
    errorMsg?: string | null;
    recoveredStructure?: RecoveredDocumentStructure;
    resultUrl?: {
      jsonUrl?: string;
    } | null;
  },
): ReviewTask[] {
  return updateTask(tasks, taskId, (task) => {
    const nextState =
      input.state === "submitted" ? "pending" : input.state ?? task.ocrJob?.state ?? "pending";
    const terminal = nextState === "done" || nextState === "failed";
    const message =
      input.errorMsg ||
      input.message ||
      (nextState === "done"
        ? "OCR 任务已完成，正在进入审查准备。"
        : nextState === "failed"
          ? "OCR 任务失败。"
          : "OCR 任务处理中。");

    return {
      ...task,
      status:
        nextState === "done" ? "reviewing" : terminal ? (nextState === "failed" ? "failed" : "ready") : "parsing",
      streamStageIndex: nextState === "done" ? 0 : task.streamStageIndex,
      recoveredStructure: input.recoveredStructure ?? task.recoveredStructure,
      ocrJob: {
        jobId: task.ocrJob?.jobId ?? null,
        state: nextState,
        submittedAt: task.ocrJob?.submittedAt ?? nowString(),
        sourceObjectKey: task.ocrJob?.sourceObjectKey,
        message,
        progress: input.progress ?? task.ocrJob?.progress ?? null,
      },
      failure:
        nextState === "failed"
          ? {
              message,
              failedAt: new Date().toISOString(),
            }
          : undefined,
      issueCount: nextState === "done" ? getIssueCounts(task.issues).total : task.issueCount,
      updatedAt: nowString(),
    };
  });
}

export function startReviewTask(tasks: ReviewTask[], taskId: string): ReviewTask[] {
  return updateTask(tasks, taskId, (task) => ({
    ...task,
    status: "reviewing",
    streamStageIndex: 0,
    streamStageType: task.streamStageType ?? "structure-restoration",
    streamAgentKey: task.streamAgentKey ?? "structure-restoration",
    streamParagraphIndex: task.streamParagraphIndex ?? 1,
    streamParagraphTotal: task.streamParagraphTotal ?? task.paragraphs.length,
    streamCurrentParagraphId: task.streamCurrentParagraphId ?? task.paragraphs[0]?.id,
    streamParagraphLabel: task.streamParagraphLabel ?? task.paragraphs[0]?.section,
    recoveredStructure:
      task.recoveredStructure && task.recoveredStructure.status !== "done"
        ? {
            ...task.recoveredStructure,
            status: "recovering",
          }
        : task.recoveredStructure,
    updatedAt: nowString(),
  }));
}

export function deleteDocumentTask(tasks: ReviewTask[], taskId: string): ReviewTask[] {
  return saveReviewTasks(tasks.filter((task) => task.id !== taskId));
}

export function updateReviewTaskStreamStage(
  tasks: ReviewTask[],
  taskId: string,
  snapshot: {
    streamStageIndex: number;
    streamStageType?: ReviewPipelineStageType;
    streamAgentKey?: ReviewAgentKey;
    streamParagraphIndex?: number;
    streamParagraphTotal?: number;
    streamCurrentParagraphId?: string;
    streamParagraphLabel?: string;
  },
): ReviewTask[] {
  return updateTask(tasks, taskId, (task) => ({
    ...task,
    streamStageIndex: snapshot.streamStageIndex,
    streamStageType: snapshot.streamStageType ?? task.streamStageType,
    streamAgentKey: snapshot.streamAgentKey ?? task.streamAgentKey,
    streamParagraphIndex: snapshot.streamParagraphIndex ?? task.streamParagraphIndex,
    streamParagraphTotal: snapshot.streamParagraphTotal ?? task.streamParagraphTotal,
    streamCurrentParagraphId: snapshot.streamCurrentParagraphId ?? task.streamCurrentParagraphId,
    streamParagraphLabel: snapshot.streamParagraphLabel ?? task.streamParagraphLabel,
    updatedAt: nowString(),
  }));
}

export function markReviewTaskReady(
  tasks: ReviewTask[],
  taskId: string,
  snapshot?: {
    streamStageIndex?: number;
    streamStageType?: ReviewPipelineStageType;
    streamAgentKey?: ReviewAgentKey;
    streamParagraphIndex?: number;
    streamParagraphTotal?: number;
    streamCurrentParagraphId?: string;
    streamParagraphLabel?: string;
  },
): ReviewTask[] {
  return updateTask(tasks, taskId, (task) => ({
    ...task,
    status: "ready",
    streamStageIndex: snapshot?.streamStageIndex ?? task.streamStageIndex,
    streamStageType: snapshot?.streamStageType ?? task.streamStageType,
    streamAgentKey: snapshot?.streamAgentKey ?? task.streamAgentKey,
    streamParagraphIndex: snapshot?.streamParagraphIndex ?? task.streamParagraphIndex,
    streamParagraphTotal: snapshot?.streamParagraphTotal ?? task.streamParagraphTotal,
    streamCurrentParagraphId: snapshot?.streamCurrentParagraphId ?? task.streamCurrentParagraphId,
    streamParagraphLabel: snapshot?.streamParagraphLabel ?? task.streamParagraphLabel,
    recoveredStructure: task.recoveredStructure
      ? {
          ...task.recoveredStructure,
          status: "done",
          recoveredAt: task.recoveredStructure.recoveredAt ?? new Date().toISOString(),
          progress: {
            totalParagraphs: task.recoveredStructure.paragraphs.length,
            recoveredParagraphs: task.recoveredStructure.paragraphs.length,
            currentSection:
              task.recoveredStructure.paragraphs[0]?.section ??
              task.recoveredStructure.progress.currentSection,
            currentParagraphId:
              task.recoveredStructure.paragraphs[0]?.id ??
              task.recoveredStructure.progress.currentParagraphId,
          },
        }
      : task.recoveredStructure,
    issueCount: getIssueCounts(task.issues).total,
    updatedAt: nowString(),
  }));
}

export function createReviewSession(task: ReviewTask, mode: ReviewMode): ReviewSession {
  return {
    task,
    paragraphs: task.recoveredStructure?.paragraphs ?? task.paragraphs,
    recoveredStructure: task.recoveredStructure,
    issues: task.issues,
    processedParagraphs: buildProcessedParagraphs(task.recoveredStructure?.paragraphs ?? task.paragraphs, task.issues, mode),
  };
}

export function resolveTaskIssue(
  tasks: ReviewTask[],
  taskId: string,
  issueId: string,
  status: Extract<IssueStatus, "accepted" | "rejected">,
  editedText?: string,
): ReviewTask[] {
  return updateTask(tasks, taskId, (task) => ({
    ...task,
    issues: task.issues.map((issue) =>
      issue.id === issueId ? resolveIssue(issue, status, editedText) : issue,
    ),
    updatedAt: nowString(),
  }));
}

export function updateTaskIssueDraft(
  tasks: ReviewTask[],
  taskId: string,
  issueId: string,
  suggestion: string,
): ReviewTask[] {
  return updateTask(tasks, taskId, (task) => ({
    ...task,
    issues: task.issues.map((issue) =>
      issue.id === issueId
        ? { ...issue, finding: { ...issue.finding, suggestion } }
        : issue,
    ),
    updatedAt: nowString(),
  }));
}

export function addManualTaskIssue(
  tasks: ReviewTask[],
  taskId: string,
  issue: ReviewIssue,
): ReviewTask[] {
  return updateTask(tasks, taskId, (task) => {
    const issues = [...task.issues, issue];
    return {
      ...task,
      issues,
      issueCount: getIssueCounts(issues).total,
      updatedAt: nowString(),
    };
  });
}

export function deleteManualTaskIssue(
  tasks: ReviewTask[],
  taskId: string,
  issueId: string,
): ReviewTask[] {
  return updateTask(tasks, taskId, (task) => {
    const issues = task.issues.filter((issue) => issue.id !== issueId);
    return {
      ...task,
      issues,
      issueCount: getIssueCounts(issues).total,
      updatedAt: nowString(),
    };
  });
}

export function completeReviewTask(
  tasks: ReviewTask[],
  taskId: string,
  payload: ReviewCompletionPayload,
) {
  const resultAsset = createReviewResultAsset(payload);
  const nextTasks = updateTask(tasks, taskId, (task) => ({
    ...task,
    status: "completed",
    mode: payload.mode,
    issues: payload.issues,
    issueCount: resultAsset.issueStats.total,
    updatedAt: nowString(),
    resultAsset,
  }));

  return { tasks: nextTasks, resultAsset };
}
