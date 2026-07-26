import { createSeedReviewTasks } from "./mockReviewTaskSeeds";
import { syncPersistedReviewTasks, upsertPersistedReviewTask } from "./backendConnectivity";
import { mergeRecoveredStructureIssues } from "./reviewIssueDrafts";
import { deriveReviewPipelineSnapshot } from "./reviewPipelineSnapshot";
import type { ReviewStorageSnapshot, ReviewTask } from "./reviewTypes";

const STORAGE_KEY = "ai-assisted-review-platform.review-tasks";
const STORAGE_VERSION = 1;
const BACKEND_TASKS_ENDPOINT = "/api/review-tasks";
const BACKEND_TASKS_BULK_ENDPOINT = "/api/review-tasks/bulk";
const LOCAL_STORAGE_TASK_LIMIT = 20;
const LOCAL_STORAGE_PARAGRAPH_LIMIT = 80;
const LOCAL_STORAGE_ISSUE_LIMIT = 120;
const LOCAL_STORAGE_TEXT_LIMIT = 800;

export interface SaveReviewTasksOptions {
  backendSync?: "none" | "upsert-changed" | "bulk-replace";
  changedTaskIds?: string[];
}

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

function compactText(value: string, maxLength = LOCAL_STORAGE_TEXT_LIMIT) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
}

function compactParagraph(paragraph: ReviewTask["paragraphs"][number]) {
  return {
    ...paragraph,
    text: compactText(paragraph.text),
  };
}

function compactIssue(issue: ReviewTask["issues"][number]) {
  return {
    ...issue,
    anchor: {
      ...issue.anchor,
      text: compactText(issue.anchor.text, 240),
    },
    finding: {
      ...issue.finding,
      reason: compactText(issue.finding.reason),
      basis: compactText(issue.finding.basis),
      suggestion: compactText(issue.finding.suggestion),
    },
  };
}

function compactReviewTaskForLocalStorage(task: ReviewTask): ReviewTask {
  const paragraphs = task.paragraphs.slice(0, LOCAL_STORAGE_PARAGRAPH_LIMIT).map(compactParagraph);
  const recoveredParagraphs = task.recoveredStructure?.paragraphs.slice(0, LOCAL_STORAGE_PARAGRAPH_LIMIT).map(compactParagraph);

  return {
    ...task,
    paragraphs,
    recoveredStructure: task.recoveredStructure
      ? {
          ...task.recoveredStructure,
          sections: task.recoveredStructure.sections.slice(0, LOCAL_STORAGE_PARAGRAPH_LIMIT).map((section) => ({
            ...section,
            paragraphIds: section.paragraphIds.slice(0, LOCAL_STORAGE_PARAGRAPH_LIMIT),
          })),
          paragraphs: recoveredParagraphs ?? [],
        }
      : undefined,
    issues: task.issues.slice(0, LOCAL_STORAGE_ISSUE_LIMIT).map(compactIssue),
    reviewGenerationActivities: task.reviewGenerationActivities?.slice(-20),
    reviewDecisionActivities: task.reviewDecisionActivities?.slice(-50),
  };
}

function buildLocalStorageSnapshot(tasks: ReviewTask[], compact = false): ReviewStorageSnapshot {
  return {
    schemaVersion: STORAGE_VERSION,
    tasks: compact ? tasks.slice(0, LOCAL_STORAGE_TASK_LIMIT).map(compactReviewTaskForLocalStorage) : tasks,
  };
}

function persistReviewTasksToLocalStorage(key: string, tasks: ReviewTask[]) {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(buildLocalStorageSnapshot(tasks)));
    return;
  } catch (error) {
    if (!(error instanceof DOMException) || error.name !== "QuotaExceededError") {
      throw error;
    }
  }

  try {
    window.localStorage.removeItem(key);
    window.localStorage.setItem(key, JSON.stringify(buildLocalStorageSnapshot(tasks, true)));
  } catch {
    window.localStorage.removeItem(key);
  }
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
  persistReviewTasksToLocalStorage(`${STORAGE_KEY}.backend-cache`, tasks);
}

function canSyncBackend() {
  return typeof window !== "undefined" && typeof window.fetch === "function";
}

function syncBackendReviewTasksBulk(tasks: ReviewTask[]) {
  if (!canSyncBackend()) {
    return;
  }

  syncPersistedReviewTasks(tasks).catch(() => {
    // Keep local state as fallback when the backend is unavailable.
  });
}

function syncChangedReviewTasks(tasks: ReviewTask[], changedTaskIds: string[]) {
  if (!canSyncBackend() || changedTaskIds.length === 0) {
    return;
  }

  const taskMap = new Map(tasks.map((task) => [task.id, task]));
  changedTaskIds.forEach((taskId) => {
    const task = taskMap.get(taskId);
    if (!task) {
      return;
    }

    upsertPersistedReviewTask(task).catch(() => {
      // Keep local state as fallback when the backend is unavailable.
    });
  });
}

/**
 * Synchronous load for first render. Returns localStorage or backend cache.
 * Use hydrateReviewTasksFromBackend() in useEffect to get authoritative backend data.
 */
export function loadReviewTasks(): ReviewTask[] {
  const backendCachedTasks = loadBackendCachedReviewTasks();
  if (backendCachedTasks.length > 0) {
    return backendCachedTasks;
  }

  return loadLocalReviewTasks();
}

/**
 * Async hydration from backend. Call in useEffect after initial render.
 * Returns backend tasks on success, null on failure (caller keeps existing state).
 * Updates both localStorage and backend cache when successful.
 */
export async function hydrateReviewTasksFromBackend(): Promise<ReviewTask[] | null> {
  if (!canSyncBackend()) {
    return null;
  }

  try {
    const response = await window.fetch(BACKEND_TASKS_ENDPOINT);
    if (!response.ok) {
      return null;
    }

    const payload: unknown = await response.json();
    if (!isValidSnapshot(payload)) {
      return null;
    }

    const tasks = (payload as ReviewStorageSnapshot).tasks.map(normalizeLoadedTask);

    if (tasks.length === 0 && loadLocalReviewTasks().length > 0) {
      return null;
    }

    cacheBackendReviewTasks(tasks);
    persistReviewTasksToLocalStorage(STORAGE_KEY, tasks);

    return tasks;
  } catch {
    return null;
  }
}

export function saveReviewTasks(
  tasks: ReviewTask[],
  options: SaveReviewTasksOptions = {},
): ReviewTask[] {
  persistReviewTasksToLocalStorage(STORAGE_KEY, tasks);

  const backendSync = options.backendSync ?? "none";
  if (backendSync === "bulk-replace") {
    syncBackendReviewTasksBulk(tasks);
  } else if (backendSync === "upsert-changed") {
    syncChangedReviewTasks(tasks, options.changedTaskIds ?? []);
  }

  return tasks;
}
