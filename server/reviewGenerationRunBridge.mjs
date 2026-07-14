import { generateDraftIssues } from "./reviewDraftIssueAdapter.mjs";
import {
  buildPreparationPackagePayload,
  createStructureAwareStages,
} from "./reviewAgentStream.mjs";

const RUN_TTL_MS = 10 * 60 * 1000;
const MAX_RUNS = 50;
const MAX_PARAGRAPHS = 12;
const MAX_PARAGRAPH_TEXT_LENGTH = 1600;

const runs = new Map();

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

function cleanupExpiredRuns() {
  const now = Date.now();
  for (const [runId, run] of runs.entries()) {
    if (run.expiresAt <= now) {
      runs.delete(runId);
    }
  }

  while (runs.size > MAX_RUNS) {
    const oldestRunId = runs.keys().next().value;
    if (!oldestRunId) {
      break;
    }
    runs.delete(oldestRunId);
  }
}

export function createReviewGenerationRun(input = {}) {
  cleanupExpiredRuns();

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
  const run = {
    runId,
    taskId,
    createdAt,
    createdAtIso: new Date(createdAt).toISOString(),
    expiresAt: createdAt + RUN_TTL_MS,
    mode: input.mode === "revise" ? "revise" : "review",
    structureSummary: normalizeStructureSummary(input.structureSummary),
    paragraphs,
    maxIssues: normalizePositiveInteger(input.maxIssues, 6, 10) || 6,
  };

  runs.set(runId, run);

  return {
    ok: true,
    runId,
    status: "created",
    streamUrl: `/api/review-agent/generation-runs/${encodeURIComponent(runId)}/stream`,
    expiresAt: new Date(run.expiresAt).toISOString(),
    acceptedParagraphCount: paragraphs.length,
  };
}

function getRun(runId) {
  cleanupExpiredRuns();
  const run = runs.get(runId);
  if (!run) {
    return null;
  }

  if (run.expiresAt <= Date.now()) {
    runs.delete(runId);
    return null;
  }

  return run;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

export async function writeReviewGenerationRunStream(response, runId) {
  const send = (event, data) => {
    response.write(`event: ${event}\n`);
    response.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const run = getRun(runId);
  if (!run) {
    send("review-event", {
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

  try {
    send("review-event", {
      type: "review.connection",
      stageId: "connect",
      title: "Connected backend generation run",
      detail: "A backend review generation run stream has been established.",
      progress: 5,
      runId,
      status: "running",
      issueSummaries: [],
      currentSection: run.structureSummary.currentSection,
    });

    const stages = createStructureAwareStages(run.structureSummary);
    for (const stage of stages) {
      send("review-event", {
        ...stage,
        runId,
        status: "running",
      });
      await sleep(250);
    }

    const completedAt = nowIsoString();
    const preparationPackage = buildPreparationPackagePayload(run.structureSummary, stages, completedAt);
    send("review-event", {
      type: "review.stage",
      stageId: "draft-issues",
      stageType: "issue-structuring",
      title: "Generating draft review issues",
      detail: "The backend is generating structured draft issue candidates from the preparation package.",
      progress: 92,
      runId,
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
          paragraphs: run.paragraphs,
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
    send("review-event", {
      type: "review.complete",
      stageId: "complete",
      title: terminalStatus === "ready" ? "Review generation completed" : "Review generation completed with fallback",
      detail:
        terminalStatus === "ready"
          ? "The backend generated a preparation package and draft issue candidates."
          : "The backend produced a reviewable preparation package with safe degraded draft issue output.",
      progress: 100,
      runId,
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
  } finally {
    runs.delete(runId);
  }
}
