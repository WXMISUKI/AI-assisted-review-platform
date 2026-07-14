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
  ReviewDraftIssueGenerationDiagnostics,
  ReviewDraftIssueGenerationSource,
  ReviewDraftIssueGenerationStatus,
  ReviewGenerationActivity,
  ReviewGenerationRunActiveStage,
  ReviewGenerationRunDiagnostics,
  ReviewGenerationRunStatus,
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

function nowIsoString() {
  return new Date().toISOString();
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

function createGenerationRunId(taskId: string) {
  return `review-generation-${taskId}-${Date.now().toString(36)}`;
}

function createGenerationActivityId(runId: string, type: ReviewGenerationActivity["type"]) {
  return `review-activity-${runId}-${type}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

function isTerminalGenerationRunStatus(status: ReviewGenerationRunStatus | undefined) {
  return status === "ready" || status === "degraded" || status === "failed";
}

function shouldReuseGenerationRun(task: ReviewTask) {
  return task.reviewGenerationRun?.status === "running";
}

function createGenerationRunActiveStage(
  snapshot: {
    streamStageIndex?: number;
    streamStageType?: ReviewPipelineStageType;
    streamAgentKey?: ReviewAgentKey;
    streamParagraphIndex?: number;
    streamParagraphTotal?: number;
    streamCurrentParagraphId?: string;
    streamParagraphLabel?: string;
  },
  task?: ReviewTask,
): ReviewGenerationRunActiveStage {
  return {
    stageIndex: snapshot.streamStageIndex ?? task?.streamStageIndex ?? 0,
    stageType: snapshot.streamStageType ?? task?.streamStageType,
    agentKey: snapshot.streamAgentKey ?? task?.streamAgentKey,
    paragraphIndex: snapshot.streamParagraphIndex ?? task?.streamParagraphIndex,
    paragraphTotal: snapshot.streamParagraphTotal ?? task?.streamParagraphTotal,
    currentParagraphId: snapshot.streamCurrentParagraphId ?? task?.streamCurrentParagraphId,
    paragraphLabel: snapshot.streamParagraphLabel ?? task?.streamParagraphLabel,
    currentSection: snapshot.streamParagraphLabel ?? task?.streamParagraphLabel,
  };
}

function normalizeGenerationRunDiagnostics(
  diagnostics: ReviewGenerationRunDiagnostics | undefined,
) {
  return diagnostics
    ? {
        status: diagnostics.status,
        message: diagnostics.message,
        source: diagnostics.source,
      }
    : undefined;
}

function sanitizeActivityMessage(message: string | undefined) {
  if (!message) {
    return undefined;
  }

  if (/https?:\/\/|api[_-]?key|token|secret|password|authorization/i.test(message)) {
    return undefined;
  }

  return message.slice(0, 140);
}

function appendReviewGenerationActivities(
  task: ReviewTask,
  activities: Array<
    Omit<ReviewGenerationActivity, "id" | "occurredAt"> & {
      occurredAt?: string;
    }
  >,
) {
  if (activities.length === 0) {
    return task;
  }

  const safeActivities = activities.map((activity) => ({
    ...activity,
    id: createGenerationActivityId(activity.runId, activity.type),
    occurredAt: activity.occurredAt ?? nowIsoString(),
    message: sanitizeActivityMessage(activity.message),
  }));

  return {
    ...task,
    reviewGenerationActivities: [...(task.reviewGenerationActivities ?? []), ...safeActivities].slice(-50),
  };
}

function isSameGenerationStage(
  left: ReviewGenerationRunActiveStage | undefined,
  right: ReviewGenerationRunActiveStage | undefined,
) {
  return (
    left?.stageIndex === right?.stageIndex &&
    left?.stageType === right?.stageType &&
    left?.agentKey === right?.agentKey &&
    left?.paragraphIndex === right?.paragraphIndex &&
    left?.paragraphTotal === right?.paragraphTotal &&
    left?.currentParagraphId === right?.currentParagraphId &&
    left?.paragraphLabel === right?.paragraphLabel &&
    left?.currentSection === right?.currentSection
  );
}

function appendGenerationTerminalActivity(
  task: ReviewTask,
  status: "ready" | "degraded",
  input: {
    preparationPackageId?: string;
    draftIssueGenerationRunId?: string;
    generatedIssueCount?: number;
    diagnostics?: ReviewGenerationRunDiagnostics;
    completedAt?: string;
  },
) {
  const runId = task.reviewGenerationRun?.runId ?? createGenerationRunId(task.id);
  return appendReviewGenerationActivities(task, [
    {
      type: status === "ready" ? "run-ready" : "run-degraded",
      runId,
      occurredAt: input.completedAt,
      status,
      message: input.diagnostics?.message,
      preparationPackageId: input.preparationPackageId,
      draftIssueGenerationRunId: input.draftIssueGenerationRunId,
      issueCount: input.generatedIssueCount,
    },
  ]);
}

function startGenerationRunForTask(
  task: ReviewTask,
  activeStage?: ReviewGenerationRunActiveStage,
) {
  const reuseRun = shouldReuseGenerationRun(task);
  const startedAt = reuseRun ? task.reviewGenerationRun!.startedAt : nowIsoString();
  const nextTask = {
    ...task,
    reviewGenerationRun: {
      runId: reuseRun ? task.reviewGenerationRun!.runId : createGenerationRunId(task.id),
      status: "running" as const,
      startedAt,
      updatedAt: nowIsoString(),
      activeStage: activeStage ?? (reuseRun ? task.reviewGenerationRun?.activeStage : undefined),
      preparationPackageId: reuseRun ? task.reviewGenerationRun?.preparationPackageId : undefined,
      draftIssueGenerationRunId: reuseRun ? task.reviewGenerationRun?.draftIssueGenerationRunId : undefined,
      generatedIssueCount: reuseRun ? task.reviewGenerationRun?.generatedIssueCount ?? 0 : 0,
      diagnostics: undefined,
    },
  };

  if (reuseRun) {
    return nextTask;
  }

  const runId = nextTask.reviewGenerationRun.runId;
  return appendReviewGenerationActivities(nextTask, [
    ...(isTerminalGenerationRunStatus(task.reviewGenerationRun?.status)
      ? [
          {
            type: "run-retried" as const,
            runId,
            occurredAt: startedAt,
            status: "running" as const,
            message: "Review generation restarted after a terminal run.",
          },
        ]
      : []),
    {
      type: "run-started",
      runId,
      occurredAt: startedAt,
      stage: activeStage,
      status: "running",
      message: "Review generation started.",
    },
  ]);
}

function updateGenerationRunForTask(
  task: ReviewTask,
  update: {
    activeStage?: ReviewGenerationRunActiveStage;
    preparationPackageId?: string;
    draftIssueGenerationRunId?: string;
    generatedIssueCount?: number;
    status?: "running" | "ready" | "degraded" | "failed";
    completedAt?: string;
    diagnostics?: ReviewGenerationRunDiagnostics;
  },
) {
  const currentRun = task.reviewGenerationRun;
  const startedAt = currentRun?.startedAt ?? nowIsoString();
  const updatedAt = nowIsoString();

  return {
    ...task,
    reviewGenerationRun: {
      runId: currentRun?.runId ?? createGenerationRunId(task.id),
      status: update.status ?? currentRun?.status ?? "running",
      startedAt,
      updatedAt,
      completedAt: update.completedAt ?? currentRun?.completedAt,
      activeStage: update.activeStage ?? currentRun?.activeStage,
      preparationPackageId: update.preparationPackageId ?? currentRun?.preparationPackageId,
      draftIssueGenerationRunId:
        update.draftIssueGenerationRunId ?? currentRun?.draftIssueGenerationRunId,
      generatedIssueCount: update.generatedIssueCount ?? currentRun?.generatedIssueCount ?? 0,
      diagnostics: normalizeGenerationRunDiagnostics(update.diagnostics) ?? currentRun?.diagnostics,
    },
  };
}

export function startReviewGenerationRun(
  tasks: ReviewTask[],
  taskId: string,
  snapshot?: Parameters<typeof createGenerationRunActiveStage>[0],
): ReviewTask[] {
  return updateTask(tasks, taskId, (task) =>
    startGenerationRunForTask(
      task,
      createGenerationRunActiveStage(
        snapshot ?? {
          streamStageIndex: task.streamStageIndex,
          streamStageType: task.streamStageType,
          streamAgentKey: task.streamAgentKey,
          streamParagraphIndex: task.streamParagraphIndex,
          streamParagraphTotal: task.streamParagraphTotal,
          streamCurrentParagraphId: task.streamCurrentParagraphId,
          streamParagraphLabel: task.streamParagraphLabel,
        },
        task,
      ),
    ),
  );
}

export function updateReviewGenerationRunStage(
  tasks: ReviewTask[],
  taskId: string,
  snapshot: Parameters<typeof createGenerationRunActiveStage>[0],
): ReviewTask[] {
  return updateTask(tasks, taskId, (task) => {
    const activeStage = createGenerationRunActiveStage(snapshot, task);
    const nextTask = updateGenerationRunForTask(task, {
      status: task.reviewGenerationRun?.status === "running" ? "running" : undefined,
      activeStage,
    });
    const existingActivities = task.reviewGenerationActivities ?? [];
    const lastActivity = existingActivities[existingActivities.length - 1];

    if (lastActivity?.type === "stage-updated" && isSameGenerationStage(lastActivity.stage, activeStage)) {
      return nextTask;
    }

    return appendReviewGenerationActivities(nextTask, [
      {
        type: "stage-updated",
        runId: nextTask.reviewGenerationRun!.runId,
        stage: activeStage,
        status: nextTask.reviewGenerationRun!.status,
      },
    ]);
  });
}

export function completeReviewGenerationRun(
  tasks: ReviewTask[],
  taskId: string,
  input: {
    status: "ready" | "degraded";
    preparationPackageId?: string;
    draftIssueGenerationRunId?: string;
    generatedIssueCount?: number;
    completedAt?: string;
    diagnostics?: ReviewGenerationRunDiagnostics;
  },
): ReviewTask[] {
  return updateTask(tasks, taskId, (task) => {
    const nextTask = updateGenerationRunForTask(task, {
      status: input.status,
      completedAt: input.completedAt ?? nowIsoString(),
      preparationPackageId: input.preparationPackageId,
      draftIssueGenerationRunId: input.draftIssueGenerationRunId,
      generatedIssueCount: input.generatedIssueCount,
      diagnostics: input.diagnostics,
    });

    return appendGenerationTerminalActivity(nextTask, input.status, input);
  });
}

export function failReviewGenerationRun(
  tasks: ReviewTask[],
  taskId: string,
  diagnostics: ReviewGenerationRunDiagnostics,
): ReviewTask[] {
  return updateTask(tasks, taskId, (task) => {
    const completedAt = nowIsoString();
    const nextTask = updateGenerationRunForTask(task, {
      status: "failed",
      completedAt,
      diagnostics,
    });

    return appendReviewGenerationActivities(nextTask, [
      {
        type: "run-failed",
        runId: nextTask.reviewGenerationRun!.runId,
        occurredAt: completedAt,
        status: "failed",
        message: diagnostics.message,
      },
    ]);
  });
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
    draftIssueGenerationSnapshot: task.draftIssueGenerationSnapshot,
    reviewGenerationRun: task.reviewGenerationRun,
    reviewGenerationActivities: task.reviewGenerationActivities ?? [],
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
  return updateTask(tasks, taskId, (task) => {
    const nextTask = updateGenerationRunForTask(
      {
        ...task,
        preparationPackage,
        updatedAt: nowString(),
      },
      {
        preparationPackageId: preparationPackage.packageId,
        diagnostics:
          preparationPackage.status === "failed"
            ? {
                status: preparationPackage.status,
                message: preparationPackage.message ?? "Review preparation package failed.",
                source: preparationPackage.source === "local-fallback" ? "local-fallback" : "review-preparation",
            }
            : undefined,
      },
    );

    return appendReviewGenerationActivities(
      nextTask,
      [
        {
          type: "package-persisted",
          runId: nextTask.reviewGenerationRun!.runId,
          status: preparationPackage.status,
          message: preparationPackage.message,
          preparationPackageId: preparationPackage.packageId,
        },
      ],
    );
  });
}

function mergeReviewIssues(existingIssues: ReviewIssue[], generatedIssues: ReviewIssue[]) {
  const deduped = new Map<string, ReviewIssue>();
  [...existingIssues, ...generatedIssues].forEach((issue) => {
    const key = `${issue.finding.title}|${issue.anchor.paragraphId}|${issue.anchor.text}`;
    if (!deduped.has(key)) {
      deduped.set(key, issue);
    }
  });
  return Array.from(deduped.values());
}

export interface MergeGeneratedReviewIssuesMetadata {
  source: ReviewDraftIssueGenerationSource;
  status: ReviewDraftIssueGenerationStatus;
  diagnostics?: ReviewDraftIssueGenerationDiagnostics;
  preparationPackageId?: string;
  startedAt?: string;
  completedAt?: string;
  runId?: string;
}

export function mergeGeneratedReviewIssues(
  tasks: ReviewTask[],
  taskId: string,
  generatedIssues: ReviewIssue[],
  metadata: MergeGeneratedReviewIssuesMetadata,
): ReviewTask[] {
  return updateTask(tasks, taskId, (task) => {
    const completedAt = metadata.completedAt ?? new Date().toISOString();
    const startedAt = metadata.startedAt ?? completedAt;
    const runId =
      metadata.runId ?? `draft-issues-${taskId}-${Date.now().toString(36)}`;
    if (
      metadata.runId &&
      task.draftIssueGenerationSnapshot?.runId === metadata.runId &&
      task.reviewGenerationRun?.draftIssueGenerationRunId === metadata.runId
    ) {
      return task;
    }
    const taggedGeneratedIssues = generatedIssues.map((issue) => ({
      ...issue,
      generation: {
        generationRunId: runId,
        generationSource: metadata.source,
        generatedAt: completedAt,
      },
    }));
    const issues = mergeReviewIssues(task.issues, taggedGeneratedIssues);
    const acceptedIssueIds = new Set(
      issues
        .filter((issue) => issue.generation?.generationRunId === runId)
        .map((issue) => issue.id),
    );

    const nextTask: ReviewTask = {
      ...task,
      issues,
      issueCount: getIssueCounts(issues).total,
      draftIssueGenerationSnapshot: {
        runId,
        source: metadata.source,
        status: metadata.status,
        startedAt,
        completedAt,
        issueIds: taggedGeneratedIssues
          .filter((issue) => acceptedIssueIds.has(issue.id))
          .map((issue) => issue.id),
        candidateCount: metadata.diagnostics?.candidateCount ?? generatedIssues.length,
        diagnostics: metadata.diagnostics,
        preparationPackageId: metadata.preparationPackageId,
      },
      updatedAt: nowString(),
    };

    const terminalStatus = metadata.status === "ready" ? "ready" : "degraded";
    const taskWithRun = updateGenerationRunForTask(nextTask, {
      status: terminalStatus,
      completedAt,
      preparationPackageId: metadata.preparationPackageId,
      draftIssueGenerationRunId: runId,
      generatedIssueCount: acceptedIssueIds.size,
      diagnostics:
        terminalStatus === "degraded" && metadata.diagnostics
          ? {
              status: metadata.diagnostics.status,
              message: metadata.diagnostics.message,
              source: "draft-issue-generation",
            }
          : undefined,
    });

    const taskWithDraftActivity = appendReviewGenerationActivities(
      taskWithRun,
      [
        {
          type: "draft-issues-generated",
          runId: taskWithRun.reviewGenerationRun!.runId,
          occurredAt: completedAt,
          status: metadata.status,
          message: metadata.diagnostics?.message,
          preparationPackageId: metadata.preparationPackageId,
          draftIssueGenerationRunId: runId,
          issueCount: acceptedIssueIds.size,
        },
      ],
    );

    return appendGenerationTerminalActivity(taskWithDraftActivity, terminalStatus, {
      preparationPackageId: metadata.preparationPackageId,
      draftIssueGenerationRunId: runId,
      generatedIssueCount: acceptedIssueIds.size,
      diagnostics:
        terminalStatus === "degraded" && metadata.diagnostics
          ? {
              status: metadata.diagnostics.status,
              message: metadata.diagnostics.message,
              source: "draft-issue-generation",
            }
          : undefined,
      completedAt,
    });
  });
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
