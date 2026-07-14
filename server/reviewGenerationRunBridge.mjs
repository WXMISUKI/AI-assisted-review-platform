import { generateDraftIssues } from "./reviewDraftIssueAdapter.mjs";
import {
  buildPreparationPackagePayload,
  createStructureAwareStages,
} from "./reviewAgentStream.mjs";
import {
  appendGenerationRunEvent,
  createGenerationRunRecord,
  getGenerationRunRecord,
  listGenerationRunEvents,
  updateGenerationRunRecord,
} from "./reviewGenerationRunStore.mjs";
import {
  enqueueReviewGenerationJob,
  getQueueStatus,
} from "./reviewWorkerQueue.mjs";

const RUN_TTL_MS = 10 * 60 * 1000;
const MAX_PARAGRAPHS = 12;
const MAX_PARAGRAPH_TEXT_LENGTH = 1600;
const STREAM_POLL_INTERVAL_MS = 250;
const STREAM_IDLE_TIMEOUT_MS = 20_000;

function nowIsoString() {
  return new Date().toISOString();
}

function createRunId(taskId) {
  const safeTaskId = typeof taskId === "string" && taskId.trim() ? taskId.trim() : "task";
  return `backend-review-run-${safeTaskId}-${Date.now().toString(36)}`;
}

function normalizePositiveInteger(value, fallback = 0, max = Number.MAX_SAFE_INTEGER) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    return fallback;
  }
  return Math.min(Math.floor(numberValue), max);
}

function normalizeString(value, maxLength = 160) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeStructureSummary(value = {}) {
  return {
    sectionCount: normalizePositiveInteger(value.sectionCount, 0, 500),
    paragraphCount: normalizePositiveInteger(value.paragraphCount, 0, 5000),
    currentSection: normalizeString(value.currentSection, 160),
    currentParagraphLabel: normalizeString(value.currentParagraphLabel, 160),
    currentParagraphIndex: normalizePositiveInteger(value.currentParagraphIndex, 0, 5000) || undefined,
    currentParagraphTotal: normalizePositiveInteger(value.currentParagraphTotal, 0, 5000) || undefined,
  };
}

function normalizeParagraphs(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((paragraph) => paragraph && typeof paragraph.id === "string" && typeof paragraph.text === "string")
    .slice(0, MAX_PARAGRAPHS)
    .map((paragraph) => ({
      id: normalizeString(paragraph.id, 120),
      section: normalizeString(paragraph.section, 160),
      text: paragraph.text.slice(0, MAX_PARAGRAPH_TEXT_LENGTH),
    }));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isTerminalStatus(status) {
  return ["ready", "degraded", "failed", "expired"].includes(status);
}

function normalizeDraftIssueCompletion(result) {
  const issues = Array.isArray(result?.issues) ? result.issues : [];
  return {
    ok: result?.ok !== false,
    source: result?.source === "llm" ? "llm" : "deterministic-fallback",
    status: result?.status === "ready" ? "ready" : result?.status === "failed" ? "failed" : "fallback",
    issues,
    diagnostics: result?.diagnostics
      ? {
          status: normalizeString(result.diagnostics.status, 80),
          message: normalizeString(result.diagnostics.message, 180),
          candidateCount: normalizePositiveInteger(result.diagnostics.candidateCount, issues.length, 100),
        }
      : {
          status: "completed",
          message: "Draft issue generation completed.",
          candidateCount: issues.length,
        },
  };
}

function toStatusPayload(run) {
  if (!run) {
    return {
      ok: false,
      status: "not_found",
      message: "Review generation run not found.",
    };
  }

  return {
    ok: true,
    schemaVersion: run.schemaVersion,
    runId: run.runId,
    taskId: run.taskId,
    mode: run.mode,
    status: run.status,
    createdAt: run.createdAt,
    updatedAt: run.updatedAt,
    startedAt: run.startedAt,
    completedAt: run.completedAt,
    expiresAt: run.expiresAt,
    progress: run.progress,
    activeStage: run.activeStage,
    structureSummary: run.structureSummary,
    acceptedParagraphCount: run.acceptedParagraphCount,
    maxIssues: run.maxIssues,
    preparationPackageSummary: run.preparationPackageSummary,
    draftIssueGenerationSummary: run.draftIssueGenerationSummary,
    diagnostics: run.safeDiagnostics,
    lastSequence: run.lastSequence ?? 0,
    statusUrl: `/api/review-agent/generation-runs/${encodeURIComponent(run.runId)}`,
    eventsUrl: `/api/review-agent/generation-runs/${encodeURIComponent(run.runId)}/events`,
    streamUrl: `/api/review-agent/generation-runs/${encodeURIComponent(run.runId)}/stream`,
  };
}

async function appendRunEvent(run, event) {
  return appendGenerationRunEvent(run.runId, {
    ...event,
    runId: run.runId,
    taskId: run.taskId,
  });
}

export async function executeReviewGenerationRunJob(job) {
  const runId = job.runId;
  const run = await getGenerationRunRecord(runId);
  if (!run) {
    return {
      skipped: true,
      status: "not_found",
    };
  }

  if (isTerminalStatus(run.status)) {
    return {
      skipped: true,
      status: run.status,
    };
  }

  await updateGenerationRunRecord(runId, {
    status: "running",
    startedAt: run.startedAt ?? nowIsoString(),
    updatedAt: nowIsoString(),
  });

  await appendRunEvent(run, {
    type: "review.connection",
    stageId: "connect",
    title: "Connected backend generation run",
    detail: "A backend review generation run worker has started processing this run.",
    progress: 5,
    status: "running",
    issueSummaries: [],
    currentSection: run.structureSummary.currentSection,
  });

  const stages = createStructureAwareStages(run.structureSummary);
  for (const stage of stages) {
    await appendRunEvent(run, {
      ...stage,
      status: "running",
    });
    await sleep(250);
  }

  const completedAt = nowIsoString();
  const preparationPackage = buildPreparationPackagePayload(run.structureSummary, stages, completedAt);
  await appendRunEvent(run, {
    type: "review.stage",
    stageId: "draft-issues",
    stageType: "issue-structuring",
    title: "Generating draft review issues",
    detail: "The backend is generating structured draft issue candidates from the preparation package.",
    progress: 92,
    status: "running",
    agentKey: "construction-review",
    agentLabel: "Construction plan review agent",
    issueSummaries: preparationPackage.issueSummaries ?? [],
    currentSection: run.structureSummary.currentSection,
  });

  let draftIssueGeneration;
  try {
    draftIssueGeneration = normalizeDraftIssueCompletion(
      await generateDraftIssues({
        taskId: run.taskId,
        mode: run.mode,
        preparationPackage,
        paragraphs: run.paragraphs ?? [],
        maxIssues: run.maxIssues,
      }),
    );
  } catch (error) {
    draftIssueGeneration = {
      ok: true,
      source: "deterministic-fallback",
      status: "fallback",
      issues: [],
      diagnostics: {
        status: "request_failed",
        message: error instanceof Error ? error.message.slice(0, 180) : "Draft issue generation failed.",
        candidateCount: 0,
      },
    };
  }

  const terminalStatus =
    draftIssueGeneration.status === "ready" && draftIssueGeneration.issues.length > 0 ? "ready" : "degraded";
  await appendRunEvent(run, {
    type: "review.complete",
    stageId: "complete",
    title: terminalStatus === "ready" ? "Review generation completed" : "Review generation completed with fallback",
    detail:
      terminalStatus === "ready"
        ? "The backend generated a preparation package and draft issue candidates."
        : "The backend produced a reviewable preparation package with safe degraded draft issue output.",
    progress: 100,
    status: terminalStatus,
    completedAt,
    issueSummaries: preparationPackage.issueSummaries ?? [],
    preparationPackage,
    draftIssueGeneration: {
      ...draftIssueGeneration,
      runId: `draft-issues-${runId}`,
      startedAt: completedAt,
      completedAt,
    },
  });

  return {
    skipped: false,
    status: terminalStatus,
  };
}

export async function failReviewGenerationRunFromWorker(runId, error) {
  const run = await getGenerationRunRecord(runId);
  if (!run || isTerminalStatus(run.status)) {
    return;
  }

  const completedAt = nowIsoString();
  await appendRunEvent(run, {
    type: "review.failed",
    stageId: "failed",
    title: "Review generation failed",
    detail: "The backend review generation worker exhausted retry attempts.",
    progress: 100,
    status: "failed",
    completedAt,
    issueSummaries: [],
    diagnostics: {
      status: "worker_failed",
      message: error instanceof Error ? error.message.slice(0, 180) : "Review generation worker failed.",
    },
  });
}

export async function createReviewGenerationRun(input = {}) {
  const taskId = normalizeString(input.taskId, 120);
  if (!taskId) {
    return {
      ok: false,
      status: "invalid_input",
      message: "taskId is required.",
    };
  }

  const paragraphs = normalizeParagraphs(input.paragraphs);
  const runId = createRunId(taskId);
  const createdAt = Date.now();
  const expiresAt = new Date(createdAt + RUN_TTL_MS).toISOString();
  const result = await createGenerationRunRecord({
    runId,
    taskId,
    createdAt: new Date(createdAt).toISOString(),
    expiresAt,
    mode: input.mode === "revise" ? "revise" : "review",
    structureSummary: normalizeStructureSummary(input.structureSummary),
    paragraphs,
    acceptedParagraphCount: paragraphs.length,
    maxIssues: normalizePositiveInteger(input.maxIssues, 6, 10) || 6,
  });

  if (!result.ok) {
    return result;
  }

  const queued = await enqueueReviewGenerationJob({
    runId,
    taskId,
    priority: 0,
  });
  if (!queued.ok) {
    return queued;
  }
  const queueStatus = await getQueueStatus();

  return {
    ok: true,
    runId,
    jobId: queued.job.jobId,
    queueStatus,
    status: "created",
    statusUrl: `/api/review-agent/generation-runs/${encodeURIComponent(runId)}`,
    eventsUrl: `/api/review-agent/generation-runs/${encodeURIComponent(runId)}/events`,
    streamUrl: `/api/review-agent/generation-runs/${encodeURIComponent(runId)}/stream`,
    expiresAt,
    createdAt: new Date(createdAt).toISOString(),
    acceptedParagraphCount: paragraphs.length,
  };
}

export async function getReviewGenerationRunStatus(runId) {
  return toStatusPayload(await getGenerationRunRecord(runId));
}

export async function getReviewGenerationRunEvents(runId, options = {}) {
  const run = await getGenerationRunRecord(runId);
  if (!run) {
    return {
      ok: false,
      status: "not_found",
      message: "Review generation run not found.",
      events: [],
    };
  }

  const events = await listGenerationRunEvents(runId, options);
  return {
    ok: true,
    schemaVersion: run.schemaVersion,
    runId,
    taskId: run.taskId,
    status: run.status,
    events: events ?? [],
    lastSequence: run.lastSequence ?? 0,
  };
}

function sendSseEvent(response, eventName, data) {
  response.write(`event: ${eventName}\n`);
  response.write(`data: ${JSON.stringify(data)}\n\n`);
}

export async function writeReviewGenerationRunStream(response, runId, options = {}) {
  let lastSequence = normalizePositiveInteger(options.afterSequence, 0);
  let idleStartedAt = Date.now();

  while (true) {
    const events = await listGenerationRunEvents(runId, { afterSequence: lastSequence });
    const run = await getGenerationRunRecord(runId);

    if (!run) {
      sendSseEvent(response, "review-event", {
        type: "review.failed",
        stageId: "not-found",
        title: "Review generation run unavailable",
        detail: "The generation run was not found or has expired.",
        progress: 100,
        runId,
        status: "failed",
        issueSummaries: [],
        diagnostics: {
          status: "not_found",
          message: "The generation run was not found or has expired.",
        },
        completedAt: nowIsoString(),
      });
      return;
    }

    if (events?.length) {
      for (const event of events) {
        sendSseEvent(response, "review-event", event);
        lastSequence = Math.max(lastSequence, event.sequence ?? lastSequence);
      }
      idleStartedAt = Date.now();
    }

    if (isTerminalStatus(run.status)) {
      return;
    }

    if (Date.now() - idleStartedAt > STREAM_IDLE_TIMEOUT_MS) {
      sendSseEvent(response, "review-event", {
        type: "review.failed",
        stageId: "stream-timeout",
        title: "Review generation stream timed out",
        detail: "No new persisted generation events were observed before the stream timeout.",
        progress: run.progress ?? 0,
        runId,
        status: "failed",
        issueSummaries: [],
        diagnostics: {
          status: "stream_timeout",
          message: "No new generation events were observed before the stream timeout.",
        },
        completedAt: nowIsoString(),
      });
      return;
    }

    await sleep(STREAM_POLL_INTERVAL_MS);
  }
}
