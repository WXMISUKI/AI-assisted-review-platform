import { createSeedReviewTasks } from "./mockReviewTaskSeeds";
import { mergeRecoveredStructureIssues } from "./reviewIssueDrafts";
import { deriveReviewPipelineSnapshot } from "./reviewPipelineSnapshot";
import type { ReviewStorageSnapshot, ReviewTask } from "./reviewTypes";

const STORAGE_KEY = "ai-assisted-review-platform.review-tasks";
const STORAGE_VERSION = 1;
const BACKEND_TASKS_ENDPOINT = "/api/review-tasks";
const BACKEND_TASKS_BULK_ENDPOINT = "/api/review-tasks/bulk";

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

function loadLocalReviewTasks() {
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

function loadBackendCachedReviewTasks() {
  if (!canUseStorage()) {
    return [];
  }

  const rawValue = window.localStorage.getItem(`${STORAGE_KEY}.backend-cache`);
  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue: unknown = JSON.parse(rawValue);
    if (isValidSnapshot(parsedValue)) {
      return parsedValue.tasks.map(normalizeLoadedTask);
    }
  } catch {
    // Backend cache is opportunistic and should never block fallback state.
  }

  return [];
}

function cacheBackendReviewTasks(tasks: ReviewTask[]) {
  if (!canUseStorage()) {
    return;
  }

  const snapshot: ReviewStorageSnapshot = {
    schemaVersion: STORAGE_VERSION,
    tasks,
  };
  window.localStorage.setItem(`${STORAGE_KEY}.backend-cache`, JSON.stringify(snapshot));
}

function refreshBackendTaskCache() {
  if (typeof window === "undefined" || typeof window.fetch !== "function") {
    return;
  }

  window.fetch(BACKEND_TASKS_ENDPOINT)
    .then((response) => (response.ok ? response.json() : null))
    .then((payload: unknown) => {
      if (!isValidSnapshot(payload)) {
        return;
      }

      const tasks = payload.tasks.map(normalizeLoadedTask);
      if (tasks.length > 0) {
        cacheBackendReviewTasks(tasks);
      }
    })
    .catch(() => {
      // Backend persistence is a best-effort foundation in this slice.
    });
}

function syncBackendReviewTasks(tasks: ReviewTask[]) {
  if (typeof window === "undefined" || typeof window.fetch !== "function") {
    return;
  }

  window.fetch(BACKEND_TASKS_BULK_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tasks }),
  }).catch(() => {
    // Keep local state authoritative when the backend is unavailable.
  });
}

export function loadReviewTasks(): ReviewTask[] {
  const backendCachedTasks = loadBackendCachedReviewTasks();
  refreshBackendTaskCache();
  if (backendCachedTasks.length > 0) {
    return backendCachedTasks;
  }

  return loadLocalReviewTasks();
}

export function saveReviewTasks(tasks: ReviewTask[]): ReviewTask[] {
  if (canUseStorage()) {
    const snapshot: ReviewStorageSnapshot = {
      schemaVersion: STORAGE_VERSION,
      tasks,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }

  syncBackendReviewTasks(tasks);

  return tasks;
}
