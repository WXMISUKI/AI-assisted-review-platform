import {
  getGenerationRunRecord,
  listGenerationRunEvents,
} from "./reviewGenerationRunStore.mjs";
import { mutateReviewTask } from "./reviewTaskStore.mjs";

const MAX_ACTIVITIES = 50;

function nowIsoString() {
  return new Date().toISOString();
}

function nowDisplayString() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeString(value, fallback = "", maxLength = 180) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maxLength) : fallback;
}

function normalizeNumber(value, fallback = 0, max = Number.MAX_SAFE_INTEGER) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 0) {
    return fallback;
  }
  return Math.min(Math.floor(numberValue), max);
}

function sanitizeMessage(message) {
  const value = normalizeString(message, "", 180);
  if (!value || /https?:\/\/|api[_-]?key|token|secret|password|authorization/i.test(value)) {
    return undefined;
  }
  return value;
}

function safeDiagnostic(value, fallbackStatus = "completed", fallbackMessage = "Review generation completed.") {
  if (!isPlainObject(value)) {
    return {
      status: fallbackStatus,
      message: fallbackMessage,
    };
  }

  return {
    status: normalizeString(value.status, fallbackStatus, 80),
    message: normalizeString(value.message, fallbackMessage, 180),
    candidateCount: value.candidateCount == null ? undefined : normalizeNumber(value.candidateCount, 0, 1000),
  };
}

function isReviewIssue(value) {
  return Boolean(
    isPlainObject(value) &&
      typeof value.id === "string" &&
      isPlainObject(value.anchor) &&
      typeof value.anchor.paragraphId === "string" &&
      typeof value.anchor.text === "string" &&
      isPlainObject(value.finding) &&
      typeof value.finding.title === "string",
  );
}

function issueFingerprint(issue) {
  return [
    normalizeString(issue.finding?.title, "", 240),
    normalizeString(issue.anchor?.paragraphId, "", 160),
    normalizeString(issue.anchor?.text, "", 240),
  ].join("|");
}

function mergeGeneratedIssues(existingIssues, generatedIssues, metadata) {
  const deduped = new Map();
  for (const issue of Array.isArray(existingIssues) ? existingIssues : []) {
    if (isReviewIssue(issue)) {
      deduped.set(issueFingerprint(issue), issue);
    }
  }

  const acceptedIds = [];
  for (const issue of Array.isArray(generatedIssues) ? generatedIssues : []) {
    if (!isReviewIssue(issue)) {
      continue;
    }

    const taggedIssue = {
      ...issue,
      status: ["pending", "accepted", "rejected", "modified"].includes(issue.status) ? issue.status : "pending",
      generation: {
        generationRunId: metadata.runId,
        generationSource: metadata.source,
        generatedAt: metadata.completedAt,
      },
    };
    const key = issueFingerprint(taggedIssue);
    if (!deduped.has(key)) {
      deduped.set(key, taggedIssue);
      acceptedIds.push(taggedIssue.id);
      continue;
    }

    const existingIssue = deduped.get(key);
    if (!existingIssue.generation && taggedIssue.generation) {
      deduped.set(key, {
        ...existingIssue,
        generation: taggedIssue.generation,
      });
    }
    acceptedIds.push(existingIssue.id);
  }

  return {
    issues: Array.from(deduped.values()),
    acceptedIssueIds: Array.from(new Set(acceptedIds)),
  };
}

function createActivityId(runId, type) {
  return `review-activity-${runId}-${type}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

function hasActivity(task, runId, type, draftRunId) {
  return (task.reviewGenerationActivities ?? []).some(
    (activity) =>
      activity.runId === runId &&
      activity.type === type &&
      (!draftRunId || activity.draftIssueGenerationRunId === draftRunId),
  );
}

function appendActivities(task, activities) {
  const nextActivities = [...(task.reviewGenerationActivities ?? [])];
  for (const activity of activities) {
    if (hasActivity(task, activity.runId, activity.type, activity.draftIssueGenerationRunId)) {
      continue;
    }

    nextActivities.push({
      ...activity,
      id: createActivityId(activity.runId, activity.type),
      occurredAt: activity.occurredAt ?? nowIsoString(),
      message: sanitizeMessage(activity.message),
    });
  }

  return nextActivities.slice(-MAX_ACTIVITIES);
}

function toPreparationPackage(event) {
  return isPlainObject(event?.preparationPackage) ? event.preparationPackage : undefined;
}

function toDraftIssueGeneration(event) {
  return isPlainObject(event?.draftIssueGeneration) ? event.draftIssueGeneration : undefined;
}

function toActiveStage(run) {
  const stage = run.activeStage;
  if (!isPlainObject(stage)) {
    return undefined;
  }

  return {
    stageIndex: normalizeNumber(stage.stageIndex ?? stage.progress, 0, 100),
    stageType: normalizeString(stage.stageType, "", 120) || undefined,
    agentKey: normalizeString(stage.agentKey, "", 120) || undefined,
    paragraphIndex: stage.currentParagraphIndex,
    paragraphTotal: stage.currentParagraphTotal,
    currentParagraphId: normalizeString(stage.currentParagraphId, "", 160) || undefined,
    paragraphLabel: normalizeString(stage.currentParagraphLabel, "", 180) || undefined,
    currentSection: normalizeString(stage.currentSection, "", 180) || undefined,
  };
}

function toRunSnapshot(run, status, input = {}) {
  const completedAt = input.completedAt ?? run.completedAt ?? nowIsoString();
  return {
    runId: run.runId,
    status,
    startedAt: run.startedAt ?? run.createdAt ?? completedAt,
    updatedAt: nowIsoString(),
    completedAt,
    activeStage: toActiveStage(run),
    preparationPackageId: input.preparationPackageId,
    draftIssueGenerationRunId: input.draftIssueGenerationRunId,
    generatedIssueCount: normalizeNumber(input.generatedIssueCount, 0, 1000),
    diagnostics: input.diagnostics,
  };
}

function findTerminalCompletionEvent(events) {
  return [...(events ?? [])]
    .reverse()
    .find((event) => event.type === "review.complete" || event.type === "review.failed");
}

export async function materializeReviewGenerationRunToTask(runId) {
  const run = await getGenerationRunRecord(runId);
  if (!run) {
    return {
      ok: false,
      status: "not_found",
      message: "Review generation run not found.",
    };
  }

  const events = await listGenerationRunEvents(runId);
  const terminalEvent = findTerminalCompletionEvent(events);
  if (!terminalEvent || terminalEvent.type !== "review.complete") {
    return {
      ok: false,
      status: "not_ready",
      message: "Review generation run does not have a completion event yet.",
    };
  }

  const preparationPackage = toPreparationPackage(terminalEvent);
  const draftIssueGeneration = toDraftIssueGeneration(terminalEvent);
  const completedAt = normalizeString(
    terminalEvent.completedAt ?? draftIssueGeneration?.completedAt ?? run.completedAt,
    nowIsoString(),
    80,
  );
  const draftRunId = normalizeString(draftIssueGeneration?.runId, `draft-issues-${runId}`, 180);
  const draftSource =
    draftIssueGeneration?.source === "llm" || draftIssueGeneration?.source === "deterministic-fallback"
      ? draftIssueGeneration.source
      : "deterministic-fallback";
  const draftStatus =
    draftIssueGeneration?.status === "ready" || draftIssueGeneration?.status === "failed"
      ? draftIssueGeneration.status
      : "fallback";
  const diagnostics = safeDiagnostic(
    terminalEvent.diagnostics ?? draftIssueGeneration?.diagnostics,
    run.status === "ready" ? "ready" : "degraded",
    terminalEvent.detail ?? "Review generation completed.",
  );

  return mutateReviewTask(run.taskId, (task) => {
    const alreadyApplied = task.draftIssueGenerationSnapshot?.runId === draftRunId;
    const generatedIssues = alreadyApplied ? [] : draftIssueGeneration?.issues ?? [];
    const merged = mergeGeneratedIssues(task.issues, generatedIssues, {
      runId: draftRunId,
      source: draftSource,
      completedAt,
    });
    const generatedIssueCount = alreadyApplied
      ? task.reviewGenerationRun?.generatedIssueCount ?? task.draftIssueGenerationSnapshot?.issueIds?.length ?? 0
      : merged.acceptedIssueIds.length;
    const terminalStatus = run.status === "ready" && generatedIssueCount > 0 ? "ready" : "degraded";
    const nextDiagnostics =
      terminalStatus === "degraded"
        ? {
            status: diagnostics.status,
            message: diagnostics.message,
            source: "draft-issue-generation",
          }
        : undefined;
    const preparationPackageId = preparationPackage?.packageId ?? task.preparationPackage?.packageId;
    const draftSnapshot = {
      runId: draftRunId,
      source: draftSource,
      status: draftStatus,
      startedAt: normalizeString(draftIssueGeneration?.startedAt, completedAt, 80),
      completedAt,
      issueIds: alreadyApplied ? task.draftIssueGenerationSnapshot?.issueIds ?? [] : merged.acceptedIssueIds,
      candidateCount: diagnostics.candidateCount ?? draftIssueGeneration?.issues?.length ?? generatedIssueCount,
      diagnostics,
      preparationPackageId,
    };

    const runSnapshot = toRunSnapshot(run, terminalStatus, {
      completedAt,
      preparationPackageId,
      draftIssueGenerationRunId: draftRunId,
      generatedIssueCount,
      diagnostics: nextDiagnostics,
    });

    return {
      ...task,
      status: "ready",
      preparationPackage: preparationPackage ?? task.preparationPackage,
      issues: alreadyApplied ? task.issues : merged.issues,
      issueCount: alreadyApplied ? task.issueCount : merged.issues.length,
      draftIssueGenerationSnapshot: task.draftIssueGenerationSnapshot?.runId === draftRunId
        ? task.draftIssueGenerationSnapshot
        : draftSnapshot,
      reviewGenerationRun: runSnapshot,
      reviewGenerationActivities: appendActivities(task, [
        ...(preparationPackageId
          ? [
              {
                type: "package-persisted",
                runId,
                occurredAt: completedAt,
                status: preparationPackage?.status ?? "ready",
                message: preparationPackage?.message,
                preparationPackageId,
              },
            ]
          : []),
        {
          type: "draft-issues-generated",
          runId,
          occurredAt: completedAt,
          status: draftStatus,
          message: diagnostics.message,
          preparationPackageId,
          draftIssueGenerationRunId: draftRunId,
          issueCount: generatedIssueCount,
        },
        {
          type: terminalStatus === "ready" ? "run-ready" : "run-degraded",
          runId,
          occurredAt: completedAt,
          status: terminalStatus,
          message: nextDiagnostics?.message,
          preparationPackageId,
          draftIssueGenerationRunId: draftRunId,
          issueCount: generatedIssueCount,
        },
      ]),
      failure: undefined,
      updatedAt: nowDisplayString(),
    };
  });
}

export async function materializeReviewGenerationFailureToTask(runId, error) {
  const run = await getGenerationRunRecord(runId);
  if (!run) {
    return {
      ok: false,
      status: "not_found",
      message: "Review generation run not found.",
    };
  }

  const completedAt = run.completedAt ?? nowIsoString();
  const message = error instanceof Error ? error.message : "Review generation worker failed.";
  return mutateReviewTask(run.taskId, (task) => {
    if (task.reviewGenerationRun?.status === "ready" || task.reviewGenerationRun?.status === "degraded") {
      return task;
    }

    const diagnostics = {
      status: "worker_failed",
      message: normalizeString(message, "Review generation worker failed.", 180),
      source: "draft-issue-generation",
    };

    return {
      ...task,
      status: "failed",
      reviewGenerationRun: toRunSnapshot(run, "failed", {
        completedAt,
        generatedIssueCount: task.reviewGenerationRun?.generatedIssueCount ?? 0,
        diagnostics,
      }),
      reviewGenerationActivities: appendActivities(task, [
        {
          type: "run-failed",
          runId,
          occurredAt: completedAt,
          status: "failed",
          message: diagnostics.message,
        },
      ]),
      failure: {
        message: diagnostics.message,
        failedAt: completedAt,
      },
      updatedAt: nowDisplayString(),
    };
  });
}
