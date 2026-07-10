import { createSeedReviewTasks } from "./mockReviewTaskSeeds";
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

export function loadReviewTasks(): ReviewTask[] {
  if (!canUseStorage()) {
    return createSeedReviewTasks();
  }

  const rawValue = window.localStorage.getItem(STORAGE_KEY);
  if (!rawValue) {
    const seedTasks = createSeedReviewTasks();
    saveReviewTasks(seedTasks);
    return seedTasks;
  }

  try {
    const parsedValue: unknown = JSON.parse(rawValue);
    if (isValidSnapshot(parsedValue)) {
      return parsedValue.tasks;
    }
  } catch {
    // Invalid MVP storage should never block the review UI.
  }

  const fallbackTasks = createSeedReviewTasks();
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
