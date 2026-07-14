import { documentParagraphs, initialReviewIssues } from "./mockReview";
import { rebindReviewIssueAnchors } from "./reviewIssueAnchorBinding";
import { mergeRecoveredStructureIssues } from "./reviewIssueDrafts";
import { recoverStructureFromParagraphs } from "./ocrStructureRecovery";
import {
  createReviewPipelineSnapshot,
  deriveReviewPipelineSnapshot,
} from "./reviewPipelineSnapshot";
import { loadReviewTasks, saveReviewTasks } from "./reviewTaskRepository";
import { getReviewTaskOrchestrationSnapshot } from "./reviewTaskOrchestration";
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
  ReviewPreparationPackage,
  ReviewTask,
  ReviewTaskOcrJob,
  ReviewTaskSourceObject,
  RecoveredDocumentStructure,
  ReviewViewContext,
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

function cloneParagraphsFromStructure(recoveredStructure: RecoveredDocumentStructure) {
  return recoveredStructure.paragraphs.map((paragraph) => ({ ...paragraph }));
}

function resolveRecoveredStructureIssues(
  issues: ReviewIssue[],
  recoveredStructure: RecoveredDocumentStructure | undefined,
) {
  return mergeRecoveredStructureIssues(
    rebindReviewIssueAnchors(issues, recoveredStructure),
    recoveredStructure,
  );
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
  const recoveredStructure =
    input.recoveredStructure ??
    (input.status === "uploaded" || input.status === "parsing"
      ? createIdleRecoveredStructure()
      : recoverStructureFromParagraphs(cloneParagraphs(documentParagraphs)));
  const issues = recoveredStructure
    ? resolveRecoveredStructureIssues(cloneIssues(), recoveredStructure)
    : cloneIssues();
  const newTask: ReviewTask = {
    id: `doc-${Date.now()}`,
    name: input.name,
    project: input.project,
    uploader: input.uploader,
    updatedAt: nowString(),
    status: input.status ?? "uploaded",
    issueCount: getIssueCounts(issues).total,
    mode: input.mode,
    paragraphs: input.recoveredStructure
      ? cloneParagraphsFromStructure(input.recoveredStructure)
      : cloneParagraphs(documentParagraphs),
    issues,
    recoveredStructure,
    streamStageIndex: 0,
    pipelineSnapshot: createReviewPipelineSnapshot({
      stageIndex: 0,
      stageType: "structure-restoration",
      agentKey: "structure-restoration",
      paragraphIndex: input.recoveredStructure?.paragraphs.length ? 1 : undefined,
      paragraphTotal: input.recoveredStructure?.paragraphs.length ?? documentParagraphs.length,
      currentParagraphId: input.recoveredStructure?.paragraphs[0]?.id ?? documentParagraphs[0]?.id,
      paragraphLabel: input.recoveredStructure?.paragraphs[0]?.section ?? documentParagraphs[0]?.section,
      currentSection:
        input.recoveredStructure?.progress.currentSection ??
        input.recoveredStructure?.paragraphs[0]?.section ??
        documentParagraphs[0]?.section,
      updatedAt: nowString(),
    }),
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
    paragraphs: input.recoveredStructure
      ? cloneParagraphsFromStructure(input.recoveredStructure)
      : task.paragraphs,
    issues: input.recoveredStructure
      ? resolveRecoveredStructureIssues(task.issues, input.recoveredStructure)
      : task.issues,
    ocrJob: input.ocrJob ?? task.ocrJob,
    recoveredStructure: input.recoveredStructure ?? task.recoveredStructure,
    pipelineSnapshot: input.recoveredStructure
      ? createReviewPipelineSnapshot({
          stageIndex: task.streamStageIndex ?? 0,
          stageType: task.streamStageType ?? "structure-restoration",
          agentKey: task.streamAgentKey ?? "structure-restoration",
          paragraphIndex:
            task.streamParagraphIndex ?? (input.recoveredStructure.paragraphs.length ? 1 : undefined),
          paragraphTotal: input.recoveredStructure.paragraphs.length,
          currentParagraphId:
            task.streamCurrentParagraphId ??
            input.recoveredStructure.progress.currentParagraphId ??
            input.recoveredStructure.paragraphs[0]?.id,
          paragraphLabel:
            task.streamParagraphLabel ??
            input.recoveredStructure.progress.currentSection ??
            input.recoveredStructure.paragraphs[0]?.section,
          currentSection:
            input.recoveredStructure.progress.currentSection ??
            input.recoveredStructure.paragraphs[0]?.section,
          updatedAt: nowString(),
        })
      : task.pipelineSnapshot,
    failure: input.status === "failed"
      ? {
          message: input.failureMessage || input.ocrJob?.message || "文档上传或解析任务提交失败。",
          failedAt: new Date().toISOString(),
        }
      : undefined,
    issueCount: input.recoveredStructure
      ? getIssueCounts(resolveRecoveredStructureIssues(task.issues, input.recoveredStructure)).total
      : task.issueCount,
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
      pipelineSnapshot:
        nextState === "done"
          ? createReviewPipelineSnapshot({
              stageIndex: 0,
              stageType: "structure-restoration",
              agentKey: "structure-restoration",
              paragraphIndex: input.recoveredStructure?.paragraphs.length ? 1 : undefined,
              paragraphTotal:
                input.recoveredStructure?.paragraphs.length ??
                task.recoveredStructure?.paragraphs.length ??
                task.paragraphs.length,
              currentParagraphId:
                input.recoveredStructure?.progress.currentParagraphId ??
                input.recoveredStructure?.paragraphs[0]?.id ??
                task.recoveredStructure?.progress.currentParagraphId ??
                task.streamCurrentParagraphId ??
                task.paragraphs[0]?.id,
              paragraphLabel:
                input.recoveredStructure?.progress.currentSection ??
                input.recoveredStructure?.paragraphs[0]?.section ??
                task.recoveredStructure?.progress.currentSection ??
                task.streamParagraphLabel ??
                task.paragraphs[0]?.section,
              currentSection:
                input.recoveredStructure?.progress.currentSection ??
                input.recoveredStructure?.paragraphs[0]?.section ??
                task.recoveredStructure?.progress.currentSection ??
                task.streamParagraphLabel ??
                task.paragraphs[0]?.section,
              updatedAt: nowString(),
            })
          : task.pipelineSnapshot,
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
      issueCount:
        nextState === "done"
          ? getIssueCounts(
              input.recoveredStructure
                ? resolveRecoveredStructureIssues(task.issues, input.recoveredStructure)
                : task.issues,
            ).total
          : task.issueCount,
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
    streamParagraphTotal:
      task.streamParagraphTotal ?? task.recoveredStructure?.paragraphs.length ?? task.paragraphs.length,
    streamCurrentParagraphId:
      task.streamCurrentParagraphId ?? task.recoveredStructure?.paragraphs[0]?.id ?? task.paragraphs[0]?.id,
    streamParagraphLabel:
      task.streamParagraphLabel ?? task.recoveredStructure?.paragraphs[0]?.section ?? task.paragraphs[0]?.section,
    pipelineSnapshot: createReviewPipelineSnapshot({
      stageIndex: 0,
      stageType: task.streamStageType ?? "structure-restoration",
      agentKey: task.streamAgentKey ?? "structure-restoration",
      paragraphIndex:
        task.streamParagraphIndex ?? (task.recoveredStructure?.paragraphs.length ?? task.paragraphs.length ? 1 : undefined),
      paragraphTotal: task.streamParagraphTotal ?? task.recoveredStructure?.paragraphs.length ?? task.paragraphs.length,
      currentParagraphId:
        task.streamCurrentParagraphId ??
        task.recoveredStructure?.paragraphs[0]?.id ??
        task.paragraphs[0]?.id,
      paragraphLabel:
        task.streamParagraphLabel ??
        task.recoveredStructure?.paragraphs[0]?.section ??
        task.paragraphs[0]?.section,
      currentSection:
        task.streamParagraphLabel ??
        task.recoveredStructure?.progress.currentSection ??
        task.recoveredStructure?.paragraphs[0]?.section ??
        task.paragraphs[0]?.section,
      updatedAt: nowString(),
    }),
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
    pipelineSnapshot: createReviewPipelineSnapshot({
      stageIndex: snapshot.streamStageIndex,
      stageType: snapshot.streamStageType ?? task.streamStageType,
      agentKey: snapshot.streamAgentKey ?? task.streamAgentKey,
      paragraphIndex: snapshot.streamParagraphIndex ?? task.streamParagraphIndex,
      paragraphTotal: snapshot.streamParagraphTotal ?? task.streamParagraphTotal,
      currentParagraphId: snapshot.streamCurrentParagraphId ?? task.streamCurrentParagraphId,
      paragraphLabel: snapshot.streamParagraphLabel ?? task.streamParagraphLabel,
      currentSection: snapshot.streamParagraphLabel ?? task.streamParagraphLabel,
      updatedAt: nowString(),
    }),
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
    pipelineSnapshot: createReviewPipelineSnapshot({
      stageIndex: snapshot?.streamStageIndex ?? task.streamStageIndex,
      stageType: snapshot?.streamStageType ?? task.streamStageType,
      agentKey: snapshot?.streamAgentKey ?? task.streamAgentKey,
      paragraphIndex: snapshot?.streamParagraphIndex ?? task.streamParagraphIndex,
      paragraphTotal: snapshot?.streamParagraphTotal ?? task.streamParagraphTotal,
      currentParagraphId: snapshot?.streamCurrentParagraphId ?? task.streamCurrentParagraphId,
      paragraphLabel: snapshot?.streamParagraphLabel ?? task.streamParagraphLabel,
      currentSection: snapshot?.streamParagraphLabel ?? task.streamParagraphLabel,
      updatedAt: nowString(),
    }),
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
  const lifecycle = getReviewTaskOrchestrationSnapshot(task);
  const resolvedStructure = task.recoveredStructure;
  const resolvedParagraphs = resolvedStructure?.paragraphs ?? task.paragraphs;
  const resolvedIssues = resolveRecoveredStructureIssues(task.issues, resolvedStructure);
  const pipelineSnapshot = deriveReviewPipelineSnapshot(task);
  return {
    task,
    paragraphs: resolvedParagraphs,
    recoveredStructure: resolvedStructure,
    issues: resolvedIssues,
    processedParagraphs: buildProcessedParagraphs(resolvedParagraphs, resolvedIssues, mode),
    pipelineSnapshot,
    reviewViewContext: task.reviewViewContext,
    preparationPackage: task.preparationPackage,
    resultAsset: task.resultAsset,
    lifecycle,
  };
}

export function updateReviewTaskViewContext(
  tasks: ReviewTask[],
  taskId: string,
  context: ReviewViewContext,
): ReviewTask[] {
  return updateTask(tasks, taskId, (task) => ({
    ...task,
    reviewViewContext: {
      ...task.reviewViewContext,
      ...context,
    },
    updatedAt: nowString(),
  }));
}

export function updateReviewTaskPreparationPackage(
  tasks: ReviewTask[],
  taskId: string,
  preparationPackage: ReviewPreparationPackage,
): ReviewTask[] {
  return updateTask(tasks, taskId, (task) => ({
    ...task,
    preparationPackage,
    updatedAt: nowString(),
  }));
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
