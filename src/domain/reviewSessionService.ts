import { documentParagraphs, initialReviewIssues } from "./mockReview";
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
  ReviewCompletionPayload,
  ReviewIssue,
  ReviewMode,
  ReviewSession,
  ReviewTask,
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
    status: "uploaded",
    issueCount: 0,
    mode: input.mode,
    paragraphs: cloneParagraphs(documentParagraphs),
    issues: cloneIssues(),
    streamStageIndex: 0,
  };

  return saveReviewTasks([newTask, ...tasks]);
}

export function startReviewTask(tasks: ReviewTask[], taskId: string): ReviewTask[] {
  return updateTask(tasks, taskId, (task) => ({
    ...task,
    status: "reviewing",
    streamStageIndex: 0,
    updatedAt: nowString(),
  }));
}

export function updateReviewTaskStreamStage(
  tasks: ReviewTask[],
  taskId: string,
  streamStageIndex: number,
): ReviewTask[] {
  return updateTask(tasks, taskId, (task) => ({
    ...task,
    streamStageIndex,
  }));
}

export function markReviewTaskReady(tasks: ReviewTask[], taskId: string): ReviewTask[] {
  return updateTask(tasks, taskId, (task) => ({
    ...task,
    status: "ready",
    issueCount: getIssueCounts(task.issues).total,
    updatedAt: nowString(),
  }));
}

export function createReviewSession(task: ReviewTask, mode: ReviewMode): ReviewSession {
  return {
    task,
    paragraphs: task.paragraphs,
    issues: task.issues,
    processedParagraphs: buildProcessedParagraphs(task.paragraphs, task.issues, mode),
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
