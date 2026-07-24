import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const STORAGE_VERSION = 1;
const MAX_TASKS = 200;
const MAX_PARAGRAPHS_PER_TASK = 2000;
const MAX_ISSUES_PER_TASK = 1000;
const MAX_ACTIVITIES_PER_TASK = 200;
const DEFAULT_STORE_PATH = resolve(process.cwd(), ".local-data", "review-tasks.json");

const unsafeKeyPattern = /(api[_-]?key|token|secret|password|authorization|credential|prompt|rawtrace|raw_trace|presigned|privateurl|private_url)/i;

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function sanitizeValue(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (!isPlainObject(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !unsafeKeyPattern.test(key))
      .map(([key, nestedValue]) => [key, sanitizeValue(nestedValue)]),
  );
}

function normalizeString(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeTask(value) {
  if (!isPlainObject(value)) {
    return null;
  }

  const sanitized = sanitizeValue(value);
  const id = normalizeString(sanitized.id);
  if (!id) {
    return null;
  }

  return {
    ...sanitized,
    id,
    name: normalizeString(sanitized.name, "Untitled review task"),
    project: normalizeString(sanitized.project, "Unspecified project"),
    uploader: normalizeString(sanitized.uploader, "Unknown"),
    updatedAt: normalizeString(sanitized.updatedAt, new Date().toISOString()),
    status: normalizeString(sanitized.status, "uploaded"),
    issueCount: Number.isFinite(Number(sanitized.issueCount)) ? Number(sanitized.issueCount) : 0,
    mode: sanitized.mode === "revise" ? "revise" : "review",
    paragraphs: Array.isArray(sanitized.paragraphs)
      ? sanitized.paragraphs.slice(0, MAX_PARAGRAPHS_PER_TASK)
      : [],
    issues: Array.isArray(sanitized.issues) ? sanitized.issues.slice(0, MAX_ISSUES_PER_TASK) : [],
    reviewGenerationActivities: Array.isArray(sanitized.reviewGenerationActivities)
      ? sanitized.reviewGenerationActivities.slice(-MAX_ACTIVITIES_PER_TASK)
      : undefined,
    streamStageIndex: Number.isFinite(Number(sanitized.streamStageIndex))
      ? Number(sanitized.streamStageIndex)
      : 0,
  };
}

function normalizeTasks(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  const deduped = new Map();
  for (const rawTask of value.slice(0, MAX_TASKS)) {
    const task = normalizeTask(rawTask);
    if (task) {
      deduped.set(task.id, task);
    }
  }

  return Array.from(deduped.values());
}

function normalizeSnapshot(value) {
  if (!isPlainObject(value)) {
    return {
      schemaVersion: STORAGE_VERSION,
      tasks: [],
    };
  }

  return {
    schemaVersion: STORAGE_VERSION,
    tasks: normalizeTasks(value.tasks),
  };
}

async function readSnapshot(storePath = DEFAULT_STORE_PATH) {
  try {
    const rawValue = await readFile(storePath, "utf8");
    return normalizeSnapshot(JSON.parse(rawValue));
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return {
        schemaVersion: STORAGE_VERSION,
        tasks: [],
      };
    }
    throw error;
  }
}

async function writeSnapshot(snapshot, storePath = DEFAULT_STORE_PATH) {
  const normalized = normalizeSnapshot(snapshot);
  await mkdir(dirname(storePath), { recursive: true });
  await writeFile(storePath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
  return normalized;
}

async function mutateSnapshot(mutator, storePath = DEFAULT_STORE_PATH) {
  const snapshot = await readSnapshot(storePath);
  const result = await mutator(snapshot);
  const nextSnapshot = result?.snapshot ?? snapshot;
  await writeSnapshot(nextSnapshot, storePath);
  return result?.value;
}

export async function listReviewTasks(storePath = DEFAULT_STORE_PATH) {
  return readSnapshot(storePath);
}

export async function getReviewTask(taskId, storePath = DEFAULT_STORE_PATH) {
  const snapshot = await readSnapshot(storePath);
  const task = snapshot.tasks.find((item) => item.id === taskId);
  return task ?? null;
}

export async function upsertReviewTask(taskId, task, storePath = DEFAULT_STORE_PATH) {
  const normalizedTask = normalizeTask({
    ...task,
    id: taskId,
  });
  if (!normalizedTask) {
    return {
      ok: false,
      message: "A valid review task snapshot is required.",
    };
  }

  const snapshot = await readSnapshot(storePath);
  const nextTasks = [normalizedTask, ...snapshot.tasks.filter((item) => item.id !== taskId)].slice(0, MAX_TASKS);
  await writeSnapshot({
    schemaVersion: STORAGE_VERSION,
    tasks: nextTasks,
  }, storePath);

  return {
    ok: true,
    task: normalizedTask,
  };
}

export async function mutateReviewTask(taskId, updater, storePath = DEFAULT_STORE_PATH) {
  if (typeof updater !== "function") {
    return {
      ok: false,
      status: "invalid_input",
      message: "A review task updater function is required.",
    };
  }

  const value = await mutateSnapshot((snapshot) => {
    const index = snapshot.tasks.findIndex((task) => task.id === taskId);
    if (index < 0) {
      return {
        snapshot,
        value: {
          ok: false,
          status: "not_found",
          message: "Review task not found.",
        },
      };
    }

    const existingTask = snapshot.tasks[index];
    const nextTask = normalizeTask(updater(existingTask));
    if (!nextTask) {
      return {
        snapshot,
        value: {
          ok: false,
          status: "invalid_output",
          message: "Review task updater returned an invalid task.",
        },
      };
    }

    const nextTasks = [...snapshot.tasks];
    nextTasks[index] = nextTask;
    return {
      snapshot: {
        schemaVersion: STORAGE_VERSION,
        tasks: nextTasks,
      },
      value: {
        ok: true,
        task: nextTask,
      },
    };
  }, storePath);

  return value;
}

export async function replaceReviewTasks(tasks, storePath = DEFAULT_STORE_PATH) {
  const snapshot = await writeSnapshot({
    schemaVersion: STORAGE_VERSION,
    tasks: normalizeTasks(tasks),
  }, storePath);

  return {
    ok: true,
    schemaVersion: snapshot.schemaVersion,
    savedCount: snapshot.tasks.length,
    tasks: snapshot.tasks,
  };
}

export function getReviewTaskStoreInfo() {
  return {
    schemaVersion: STORAGE_VERSION,
    maxTasks: MAX_TASKS,
    store: "file-development",
  };
}
