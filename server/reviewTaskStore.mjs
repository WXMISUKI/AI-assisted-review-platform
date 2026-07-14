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

export async function listReviewTasks() {
  return readSnapshot();
}

export async function getReviewTask(taskId) {
  const snapshot = await readSnapshot();
  const task = snapshot.tasks.find((item) => item.id === taskId);
  return task ?? null;
}

export async function upsertReviewTask(taskId, task) {
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

  const snapshot = await readSnapshot();
  const nextTasks = [normalizedTask, ...snapshot.tasks.filter((item) => item.id !== taskId)].slice(0, MAX_TASKS);
  await writeSnapshot({
    schemaVersion: STORAGE_VERSION,
    tasks: nextTasks,
  });

  return {
    ok: true,
    task: normalizedTask,
  };
}

export async function replaceReviewTasks(tasks) {
  const snapshot = await writeSnapshot({
    schemaVersion: STORAGE_VERSION,
    tasks: normalizeTasks(tasks),
  });

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
