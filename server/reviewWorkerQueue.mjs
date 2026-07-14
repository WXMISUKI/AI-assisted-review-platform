import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const STORAGE_VERSION = 1;
const MAX_JOBS = 300;
const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY_MS = 1500;
const DEFAULT_STORE_PATH = resolve(process.cwd(), ".local-data", "review-worker-queue.json");

const jobStatuses = new Set([
  "queued",
  "leased",
  "running",
  "succeeded",
  "retryable_failed",
  "dead_lettered",
  "canceled",
  "skipped",
]);
const terminalStatuses = new Set(["succeeded", "dead_lettered", "canceled", "skipped"]);
const unsafeKeyPattern =
  /(api[_-]?key|token|secret|password|authorization|credential|prompt|rawtrace|raw_trace|presigned|privateurl|private_url|fileurl|file_url|rawtext|raw_text)/i;

let writeQueue = Promise.resolve();

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function nowIsoString() {
  return new Date().toISOString();
}

function normalizeString(value, fallback = "", maxLength = 180) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maxLength) : fallback;
}

function normalizeInteger(value, fallback = 0, max = Number.MAX_SAFE_INTEGER) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 0) {
    return fallback;
  }
  return Math.min(Math.floor(numberValue), max);
}

function normalizeTimestamp(value, fallback = nowIsoString()) {
  const text = normalizeString(value, "", 80);
  return text || fallback;
}

function sanitizeValue(value) {
  if (typeof value === "string") {
    return value.slice(0, 600);
  }

  if (Array.isArray(value)) {
    return value.slice(0, 50).map(sanitizeValue);
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

function normalizeStatus(value, fallback = "queued") {
  return jobStatuses.has(value) ? value : fallback;
}

function normalizeJob(value) {
  if (!isPlainObject(value)) {
    return null;
  }

  const jobId = normalizeString(value.jobId, "", 180);
  const runId = normalizeString(value.runId, "", 180);
  const taskId = normalizeString(value.taskId, "", 180);
  if (!jobId || !runId || !taskId) {
    return null;
  }

  const createdAt = normalizeTimestamp(value.createdAt);
  const status = normalizeStatus(value.status);
  return sanitizeValue({
    schemaVersion: STORAGE_VERSION,
    jobId,
    jobType: normalizeString(value.jobType, "review-generation", 80),
    runId,
    taskId,
    status,
    priority: normalizeInteger(value.priority, 0, 100),
    attempt: normalizeInteger(value.attempt, 0, 100),
    maxAttempts: normalizeInteger(value.maxAttempts, DEFAULT_MAX_ATTEMPTS, 20) || DEFAULT_MAX_ATTEMPTS,
    availableAt: normalizeTimestamp(value.availableAt, createdAt),
    createdAt,
    updatedAt: normalizeTimestamp(value.updatedAt, createdAt),
    leasedAt: normalizeString(value.leasedAt, "", 80) || undefined,
    leaseExpiresAt: normalizeString(value.leaseExpiresAt, "", 80) || undefined,
    workerId: normalizeString(value.workerId, "", 160) || undefined,
    heartbeatAt: normalizeString(value.heartbeatAt, "", 80) || undefined,
    completedAt: normalizeString(value.completedAt, "", 80) || undefined,
    failedAt: normalizeString(value.failedAt, "", 80) || undefined,
    safePayloadSummary: sanitizeValue(value.safePayloadSummary ?? {}),
    safeError: sanitizeValue(value.safeError),
  });
}

function normalizeSnapshot(value) {
  if (!isPlainObject(value)) {
    return {
      schemaVersion: STORAGE_VERSION,
      jobs: [],
    };
  }

  const jobs = Array.isArray(value.jobs)
    ? value.jobs
        .map(normalizeJob)
        .filter(Boolean)
        .sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)))
        .slice(0, MAX_JOBS)
    : [];

  return {
    schemaVersion: STORAGE_VERSION,
    jobs,
  };
}

function createJobId(taskId) {
  const safeTaskId = normalizeString(taskId, "task", 80).replace(/[^a-zA-Z0-9_-]+/g, "-");
  return `review-job-${safeTaskId}-${Date.now().toString(36)}`;
}

function isDue(job, now = new Date()) {
  return new Date(job.availableAt).getTime() <= now.getTime();
}

function isLeaseExpired(job, now = new Date()) {
  return Boolean(job.leaseExpiresAt) && new Date(job.leaseExpiresAt).getTime() <= now.getTime();
}

function summarizeCounts(jobs) {
  const counts = Object.fromEntries(Array.from(jobStatuses).map((status) => [status, 0]));
  for (const job of jobs) {
    counts[job.status] = (counts[job.status] ?? 0) + 1;
  }
  return counts;
}

function getOldestQueuedAgeMs(jobs, now = new Date()) {
  const dueQueuedJobs = jobs.filter((job) => ["queued", "retryable_failed"].includes(job.status));
  if (dueQueuedJobs.length === 0) {
    return 0;
  }

  const oldestTimestamp = Math.min(...dueQueuedJobs.map((job) => new Date(job.createdAt).getTime()));
  return Math.max(0, now.getTime() - oldestTimestamp);
}

async function readSnapshot(storePath = DEFAULT_STORE_PATH) {
  try {
    const rawValue = await readFile(storePath, "utf8");
    return normalizeSnapshot(JSON.parse(rawValue));
  } catch (error) {
    if (error && error.code === "ENOENT") {
      return {
        schemaVersion: STORAGE_VERSION,
        jobs: [],
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

async function mutateSnapshot(mutator) {
  const operation = writeQueue.then(async () => {
    const snapshot = await readSnapshot();
    const result = await mutator(snapshot);
    await writeSnapshot(result?.snapshot ?? snapshot);
    return result?.value;
  });
  writeQueue = operation.catch(() => undefined);
  return operation;
}

export async function enqueueReviewGenerationJob(input) {
  const now = nowIsoString();
  const job = normalizeJob({
    jobId: createJobId(input.taskId),
    jobType: "review-generation",
    runId: input.runId,
    taskId: input.taskId,
    status: "queued",
    priority: input.priority ?? 0,
    attempt: 0,
    maxAttempts: input.maxAttempts ?? DEFAULT_MAX_ATTEMPTS,
    availableAt: input.availableAt ?? now,
    createdAt: now,
    updatedAt: now,
    safePayloadSummary: {
      runId: input.runId,
      taskId: input.taskId,
      source: "review-generation-run",
    },
  });

  if (!job) {
    return {
      ok: false,
      status: "invalid_input",
      message: "A valid review generation job is required.",
    };
  }

  await mutateSnapshot((snapshot) => ({
    snapshot: {
      schemaVersion: STORAGE_VERSION,
      jobs: [job, ...snapshot.jobs.filter((item) => item.jobId !== job.jobId)].slice(0, MAX_JOBS),
    },
    value: job,
  }));

  return {
    ok: true,
    job,
  };
}

export async function getQueueJob(jobId) {
  const snapshot = await readSnapshot();
  return snapshot.jobs.find((job) => job.jobId === jobId) ?? null;
}

export async function getQueueStatus() {
  const snapshot = await readSnapshot();
  const now = new Date();
  const counts = summarizeCounts(snapshot.jobs);
  const activeJobs = snapshot.jobs.filter((job) => ["leased", "running"].includes(job.status));
  return {
    ok: true,
    schemaVersion: STORAGE_VERSION,
    adapter: "file-development",
    ready: true,
    counts,
    total: snapshot.jobs.length,
    activeWorkerIds: Array.from(new Set(activeJobs.map((job) => job.workerId).filter(Boolean))),
    activeJobCount: activeJobs.length,
    oldestQueuedAgeMs: getOldestQueuedAgeMs(snapshot.jobs, now),
    maxJobs: MAX_JOBS,
  };
}

export async function claimNextJob({ workerId, leaseMs = 10_000 } = {}) {
  const safeWorkerId = normalizeString(workerId, "local-review-worker", 160);
  return mutateSnapshot((snapshot) => {
    const now = new Date();
    const candidate = snapshot.jobs
      .filter((job) => ["queued", "retryable_failed"].includes(job.status) && isDue(job, now))
      .sort((left, right) => right.priority - left.priority || String(left.availableAt).localeCompare(String(right.availableAt)))[0];
    if (!candidate) {
      return {
        snapshot,
        value: null,
      };
    }

    const leasedAt = now.toISOString();
    const nextJob = normalizeJob({
      ...candidate,
      status: "leased",
      attempt: candidate.attempt + 1,
      leasedAt,
      leaseExpiresAt: new Date(now.getTime() + leaseMs).toISOString(),
      workerId: safeWorkerId,
      heartbeatAt: leasedAt,
      updatedAt: leasedAt,
    });
    const jobs = snapshot.jobs.map((job) => (job.jobId === candidate.jobId ? nextJob : job));
    return {
      snapshot: {
        schemaVersion: STORAGE_VERSION,
        jobs,
      },
      value: nextJob,
    };
  });
}

export async function markJobRunning(jobId, workerId) {
  return updateOwnedJob(jobId, workerId, (job) => ({
    ...job,
    status: "running",
    heartbeatAt: nowIsoString(),
    updatedAt: nowIsoString(),
  }));
}

export async function heartbeatJob(jobId, workerId, leaseMs = 10_000) {
  return updateOwnedJob(jobId, workerId, (job) => {
    const now = new Date();
    return {
      ...job,
      heartbeatAt: now.toISOString(),
      leaseExpiresAt: new Date(now.getTime() + leaseMs).toISOString(),
      updatedAt: now.toISOString(),
    };
  });
}

export async function completeJob(jobId, workerId, summary = {}) {
  return updateOwnedJob(jobId, workerId, (job) => {
    const completedAt = nowIsoString();
    return {
      ...job,
      status: summary.skipped ? "skipped" : "succeeded",
      completedAt,
      updatedAt: completedAt,
      safePayloadSummary: {
        ...job.safePayloadSummary,
        completion: sanitizeValue(summary),
      },
    };
  });
}

export async function failJob(jobId, workerId, error = {}, options = {}) {
  return updateOwnedJob(jobId, workerId, (job) => {
    const failedAt = nowIsoString();
    const hasRetry = job.attempt < job.maxAttempts;
    return {
      ...job,
      status: hasRetry ? "retryable_failed" : "dead_lettered",
      failedAt,
      updatedAt: failedAt,
      availableAt: hasRetry
        ? new Date(Date.now() + (options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS)).toISOString()
        : job.availableAt,
      leaseExpiresAt: undefined,
      leasedAt: undefined,
      workerId: undefined,
      safeError: sanitizeValue({
        status: error.status ?? "worker_failed",
        message: error.message ?? "Review worker job failed.",
      }),
    };
  });
}

export async function requeueExpiredLeases() {
  return mutateSnapshot((snapshot) => {
    const now = new Date();
    let requeued = 0;
    const jobs = snapshot.jobs.map((job) => {
      if (!["leased", "running"].includes(job.status) || !isLeaseExpired(job, now)) {
        return job;
      }

      requeued += 1;
      const hasRetry = job.attempt < job.maxAttempts;
      return normalizeJob({
        ...job,
        status: hasRetry ? "retryable_failed" : "dead_lettered",
        updatedAt: now.toISOString(),
        failedAt: now.toISOString(),
        availableAt: hasRetry ? now.toISOString() : job.availableAt,
        leasedAt: undefined,
        leaseExpiresAt: undefined,
        workerId: undefined,
        heartbeatAt: undefined,
        safeError: {
          status: hasRetry ? "lease_expired" : "lease_expired_max_attempts",
          message: "Worker lease expired before job completion.",
        },
      });
    });

    return {
      snapshot: {
        schemaVersion: STORAGE_VERSION,
        jobs,
      },
      value: {
        requeued,
      },
    };
  });
}

async function updateOwnedJob(jobId, workerId, updater) {
  const safeWorkerId = normalizeString(workerId, "", 160);
  return mutateSnapshot((snapshot) => {
    const index = snapshot.jobs.findIndex((job) => job.jobId === jobId);
    if (index < 0) {
      return {
        snapshot,
        value: null,
      };
    }

    const existingJob = snapshot.jobs[index];
    if (existingJob.workerId && existingJob.workerId !== safeWorkerId && !terminalStatuses.has(existingJob.status)) {
      return {
        snapshot,
        value: null,
      };
    }

    const nextJob = normalizeJob(updater(existingJob));
    const jobs = [...snapshot.jobs];
    jobs[index] = nextJob;
    return {
      snapshot: {
        schemaVersion: STORAGE_VERSION,
        jobs,
      },
      value: nextJob,
    };
  });
}
