import {
  claimNextJob,
  completeJob,
  failJob,
  heartbeatJob,
  markJobRunning,
  requeueExpiredLeases,
} from "./reviewWorkerQueue.mjs";
import {
  executeReviewGenerationRunJob,
  failReviewGenerationRunFromWorker,
} from "./reviewGenerationRunBridge.mjs";

const WORKER_ID = `local-review-worker-${process.pid}`;
const POLL_INTERVAL_MS = 400;
const LEASE_MS = 10_000;
const HEARTBEAT_INTERVAL_MS = 2_500;

let started = false;
let busy = false;
let timer = null;

async function withHeartbeat(job, callback) {
  const heartbeatTimer = setInterval(() => {
    void heartbeatJob(job.jobId, WORKER_ID, LEASE_MS);
  }, HEARTBEAT_INTERVAL_MS);
  try {
    return await callback();
  } finally {
    clearInterval(heartbeatTimer);
  }
}

async function processOneJob() {
  await requeueExpiredLeases();
  const job = await claimNextJob({
    workerId: WORKER_ID,
    leaseMs: LEASE_MS,
  });
  if (!job) {
    return;
  }

  await markJobRunning(job.jobId, WORKER_ID);
  try {
    const result = await withHeartbeat(job, () => executeReviewGenerationRunJob(job));
    await completeJob(job.jobId, WORKER_ID, {
      skipped: result?.skipped,
      status: result?.status ?? "completed",
      runId: job.runId,
    });
  } catch (error) {
    const failedJob = await failJob(job.jobId, WORKER_ID, {
      status: "worker_failed",
      message: error instanceof Error ? error.message : "Review generation worker failed.",
    });
    if (failedJob?.status === "dead_lettered") {
      await failReviewGenerationRunFromWorker(job.runId, error);
    }
  }
}

async function tick() {
  if (busy) {
    return;
  }

  busy = true;
  try {
    await processOneJob();
  } finally {
    busy = false;
  }
}

export function startReviewWorkerLoop() {
  if (started) {
    return {
      started,
      workerId: WORKER_ID,
    };
  }

  started = true;
  timer = setInterval(() => {
    void tick();
  }, POLL_INTERVAL_MS);
  void tick();
  return {
    started,
    workerId: WORKER_ID,
  };
}

export function getReviewWorkerLoopInfo() {
  return {
    started,
    workerId: WORKER_ID,
    busy,
    pollIntervalMs: POLL_INTERVAL_MS,
    leaseMs: LEASE_MS,
  };
}

export function stopReviewWorkerLoop() {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  started = false;
}
