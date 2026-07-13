import { createSeedReviewTasks } from "./mockReviewTaskSeeds";
import { mergeRecoveredStructureIssues } from "./reviewIssueDrafts";
import { deriveReviewPipelineSnapshot } from "./reviewPipelineSnapshot";
import type { ReviewStorageSnapshot, ReviewTask } from "./reviewTypes";

const STORAGE_KEY = "ai-assisted-review-platform.review-tasks";
const STORAGE_VERSION = 1;

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function isValidSnapshot(value: unknown): value is ReviewStorageSnapshot {
  if (!value || typeof value !== "object") {
    return false;
  }

  const snapshot = value as ReviewStorageSnapshot;
  return snapshot.schemaVersion === STORAGE_VERSION && Array.isArray(snapshot.tasks);
}

function normalizeLoadedTask(task: ReviewTask): ReviewTask {
  const pipelineSnapshot = task.pipelineSnapshot ?? deriveReviewPipelineSnapshot(task);
  if (!task.recoveredStructure) {
    return pipelineSnapshot ? { ...task, pipelineSnapshot } : task;
  }

  const issues = mergeRecoveredStructureIssues(task.issues, task.recoveredStructure);
  return {
    ...task,
    issues,
    issueCount: issues.length,
    paragraphs: task.recoveredStructure.paragraphs.length > 0 ? task.recoveredStructure.paragraphs : task.paragraphs,
    pipelineSnapshot,
  };
}

export function loadReviewTasks(): ReviewTask[] {
  if (!canUseStorage()) {
    return createSeedReviewTasks().map(normalizeLoadedTask);
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);
  if (!rawValue) {
    const seedTasks = createSeedReviewTasks().map(normalizeLoadedTask);
    saveReviewTasks(seedTasks);
    return seedTasks;
  }

  try {
    const parsedValue: unknown = JSON.parse(rawValue);
    if (isValidSnapshot(parsedValue)) {
      return parsedValue.tasks.map(normalizeLoadedTask);
    }
  } catch {
    // Invalid MVP storage should never block the review UI.
  }

  const fallbackTasks = createSeedReviewTasks().map(normalizeLoadedTask);
  saveReviewTasks(fallbackTasks);
  return fallbackTasks;
}

export function saveReviewTasks(tasks: ReviewTask[]): ReviewTask[] {
  if (canUseStorage()) {
    const snapshot: ReviewStorageSnapshot = {
      schemaVersion: STORAGE_VERSION,
      tasks,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }

  return tasks;
}
