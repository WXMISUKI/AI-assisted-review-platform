import { config, getSafeProviderStatus } from "./config.mjs";
import { generateDraftIssues } from "./reviewDraftIssueAdapter.mjs";
import {
  buildPreparationPackagePayload,
  createStructureAwareStages,
} from "./reviewAgentStream.mjs";

const REQUEST_SCHEMA_VERSION = 1;
const MAX_PARAGRAPHS = 12;
const MAX_PARAGRAPH_TEXT_LENGTH = 1600;
const MAX_STAGE_EVENTS = 24;
const MAX_ISSUE_SUMMARIES = 30;
const MAX_DIAGNOSTIC_MESSAGE_LENGTH = 180;

function nowIsoString() {
  return new Date().toISOString();
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeString(value, fallback = "", maxLength = 160) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maxLength) : fallback;
}

function normalizePositiveInteger(value, fallback = 0, max = Number.MAX_SAFE_INTEGER) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    return fallback;
  }
  return Math.min(Math.floor(numberValue), max);
}

function normalizeStatus(value, fallback = "degraded") {
  return ["ready", "degraded", "failed"].includes(value) ? value : fallback;
}

function safeDiagnostic(status, message, extra = {}) {
  return {
    status: normalizeString(status, "unknown", 80),
    message: normalizeString(message, "Agent service bridge used safe fallback.", MAX_DIAGNOSTIC_MESSAGE_LENGTH),
    ...extra,
  };
}

function sanitizeValue(value, maxStringLength = 2000) {
  const unsafeKeyPattern =
    /(api[_-]?key|token|secret|password|authorization|credential|prompt|rawtrace|raw_trace|presigned|privateurl|private_url|fileurl|file_url|baseurl|base_url|url|headers?)/i;

  if (typeof value === "string") {
    return value.slice(0, maxStringLength);
  }

  if (Array.isArray(value)) {
    return value.slice(0, 100).map((item) => sanitizeValue(item, maxStringLength));
  }

  if (!isPlainObject(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !unsafeKeyPattern.test(key))
      .map(([key, nestedValue]) => [key, sanitizeValue(nestedValue, maxStringLength)]),
  );
}

function normalizeStructureSummary(value = {}) {
  return sanitizeValue({
    sectionCount: normalizePositiveInteger(value.sectionCount, 0, 500),
    paragraphCount: normalizePositiveInteger(value.paragraphCount, 0, 5000),
    currentSection: normalizeString(value.currentSection, "", 160),
    currentParagraphLabel: normalizeString(value.currentParagraphLabel, "", 160),
    currentParagraphIndex: normalizePositiveInteger(value.currentParagraphIndex, 0, 5000) || undefined,
    currentParagraphTotal: normalizePositiveInteger(value.currentParagraphTotal, 0, 5000) || undefined,
  });
}

function normalizeParagraphs(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((paragraph) => paragraph && typeof paragraph.id === "string" && typeof paragraph.text === "string")
    .slice(0, MAX_PARAGRAPHS)
    .map((paragraph) =>
      sanitizeValue({
        id: normalizeString(paragraph.id, "", 120),
        section: normalizeString(paragraph.section, "", 160),
        text: String(paragraph.text).slice(0, MAX_PARAGRAPH_TEXT_LENGTH),
      }),
    );
}

function normalizeDraftIssueCompletion(result) {
  const issues = Array.isArray(result?.issues) ? result.issues : [];
  return sanitizeValue({
    ok: result?.ok !== false,
    source: result?.source === "llm" ? "llm" : "deterministic-fallback",
    status: result?.status === "ready" ? "ready" : result?.status === "failed" ? "failed" : "fallback",
    issues,
    diagnostics: result?.diagnostics
      ? {
          status: normalizeString(result.diagnostics.status, "completed", 80),
          message: normalizeString(result.diagnostics.message, "Draft issue generation completed.", 180),
          candidateCount: normalizePositiveInteger(result.diagnostics.candidateCount, issues.length, 100),
        }
      : {
          status: "completed",
          message: "Draft issue generation completed.",
          candidateCount: issues.length,
        },
  });
}

function normalizeAgentExecution(source, status, diagnostics, completedAt = nowIsoString()) {
  return {
    source,
    status,
    completedAt,
    diagnostics: Array.isArray(diagnostics) ? diagnostics.slice(0, 5).map((item) => sanitizeValue(item)) : [],
  };
}

function withAgentExecution(event, execution) {
  return {
    ...event,
    agentExecution: {
      source: execution.source,
      status: execution.status,
      diagnostics: execution.diagnostics,
    },
  };
}

function normalizeStageEvent(event, fallback = {}) {
  if (!isPlainObject(event)) {
    return null;
  }

  const status = normalizeStatus(event.status, fallback.status ?? "running");
  const normalized = sanitizeValue({
    ...event,
    type: normalizeString(event.type, fallback.type ?? "review.stage", 120),
    stageId: normalizeString(event.stageId, fallback.stageId ?? "agent-stage", 120),
    stageType: normalizeString(event.stageType, "", 120),
    title: normalizeString(event.title, fallback.title ?? "Agent service stage", 180),
    detail: normalizeString(event.detail, fallback.detail ?? "Agent service stage completed.", 360),
    progress: normalizePositiveInteger(event.progress, fallback.progress ?? 0, 100),
    status,
    issueSummaries: Array.isArray(event.issueSummaries)
      ? event.issueSummaries.slice(0, MAX_ISSUE_SUMMARIES).map((item) => normalizeString(item, "", 180))
      : [],
    completedAt: normalizeString(event.completedAt, "", 80) || undefined,
    diagnostics: event.diagnostics ? sanitizeValue(event.diagnostics) : undefined,
    preparationPackage: event.preparationPackage ? sanitizeValue(event.preparationPackage) : undefined,
    draftIssueGeneration: event.draftIssueGeneration ? sanitizeValue(event.draftIssueGeneration) : undefined,
  });

  return normalized.stageId ? normalized : null;
}

function buildAgentRequest(run) {
  const providerStatus = getSafeProviderStatus();
  return {
    schemaVersion: REQUEST_SCHEMA_VERSION,
    runId: run.runId,
    taskId: run.taskId,
    mode: run.mode,
    structureSummary: normalizeStructureSummary(run.structureSummary),
    preparationPackageSummary: sanitizeValue(run.preparationPackageSummary ?? {}),
    paragraphExcerpts: normalizeParagraphs(run.paragraphs),
    maxIssues: normalizePositiveInteger(run.maxIssues, 6, 10) || 6,
    providerSummary: {
      openai: providerStatus.openai,
      paddleocr: {
        configured: providerStatus.paddleocr.configured,
        model: providerStatus.paddleocr.model,
      },
      minio: {
        configured: providerStatus.minio.configured,
        bucket: providerStatus.minio.bucket,
        region: providerStatus.minio.region,
      },
      summary: providerStatus.summary,
    },
    traceContext: {
      runId: run.runId,
      taskId: run.taskId,
    },
  };
}

function timeoutSignal(timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer),
  };
}

async function fetchJsonWithTimeout(url, options = {}) {
  const timeout = timeoutSignal(config.agentService.timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: timeout.signal,
    });
    const payload = await response.json().catch(() => ({}));
    return {
      response,
      payload,
    };
  } finally {
    timeout.clear();
  }
}

export async function getAgentServiceReadiness() {
  if (!config.agentService.baseURL) {
    return {
      configured: false,
      ready: false,
      status: "disabled",
      source: "local-fallback",
      summary: "Python agent service is not configured; local fallback is available.",
      diagnostics: [safeDiagnostic("not_configured", "AGENT_SERVICE_BASE_URL is not configured.")],
    };
  }

  try {
    const { response, payload } = await fetchJsonWithTimeout(`${config.agentService.baseURL}/health`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
    const payloadStatus = normalizeString(payload?.status, response.ok ? "ready" : "degraded", 80);
    const ready = response.ok && payload?.ok !== false && payloadStatus !== "unavailable";

    return {
      configured: true,
      ready,
      status: ready ? "ready" : "degraded",
      source: ready ? "python-agent-service" : "local-fallback",
      summary: ready ? "Python agent service is ready." : "Python agent service health check is degraded.",
      diagnostics: [
        safeDiagnostic(payloadStatus, payload?.message ?? `Health check returned HTTP ${response.status}.`, {
          statusCode: response.status,
        }),
      ],
    };
  } catch (error) {
    return {
      configured: true,
      ready: false,
      status: "unavailable",
      source: "local-fallback",
      summary: "Python agent service is unavailable; local fallback is available.",
      diagnostics: [
        safeDiagnostic(
          error?.name === "AbortError" ? "timeout" : "unavailable",
          error instanceof Error ? error.message : "Agent service health check failed.",
        ),
      ],
    };
  }
}

function validateAgentServicePayload(payload, run) {
  if (!isPlainObject(payload)) {
    return {
      ok: false,
      diagnostics: [safeDiagnostic("invalid_response", "Agent service returned a non-object response.")],
    };
  }

  const completedAt = normalizeString(payload.completedAt, nowIsoString(), 80);
  const status = normalizeStatus(payload.status, payload.ok === false ? "failed" : "degraded");
  const rawStageEvents = Array.isArray(payload.stageEvents) ? payload.stageEvents : [];
  const stageEvents = rawStageEvents
    .slice(0, MAX_STAGE_EVENTS)
    .map((event) => normalizeStageEvent(event))
    .filter(Boolean);
  const diagnostics = [
    safeDiagnostic(
      payload.diagnostics?.status ?? status,
      payload.diagnostics?.message ?? "Agent service returned a schema-valid response.",
    ),
  ];
  const preparationPackage = sanitizeValue(payload.preparationPackage ?? {});
  const draftIssueGeneration = sanitizeValue(payload.draftIssueGeneration ?? {});
  const hasPreparationPackage = isPlainObject(preparationPackage) && Object.keys(preparationPackage).length > 0;
  const hasDraftIssueGeneration = isPlainObject(draftIssueGeneration) && Object.keys(draftIssueGeneration).length > 0;

  if (!stageEvents.length && !hasPreparationPackage && !hasDraftIssueGeneration) {
    return {
      ok: false,
      diagnostics: [safeDiagnostic("invalid_response", "Agent service response did not include usable run output.")],
    };
  }

  const execution = normalizeAgentExecution("python-agent-service", status, diagnostics, completedAt);
  const finalStageEvents = stageEvents.map((event) => withAgentExecution(event, execution));
  const hasTerminalEvent = finalStageEvents.some((event) => event.type === "review.complete" || event.type === "review.failed");

  if (!hasTerminalEvent) {
    finalStageEvents.push(withAgentExecution({
      type: status === "failed" ? "review.failed" : "review.complete",
      stageId: status === "failed" ? "agent-failed" : "complete",
      title: status === "ready" ? "Agent service review generation completed" : "Agent service review generation degraded",
      detail:
        status === "ready"
          ? "The configured Python agent service returned review generation output."
          : "The configured Python agent service returned degraded review generation output.",
      progress: 100,
      status,
      completedAt,
      issueSummaries: Array.isArray(preparationPackage.issueSummaries) ? preparationPackage.issueSummaries : [],
      preparationPackage,
      draftIssueGeneration: {
        ...draftIssueGeneration,
        runId: draftIssueGeneration.runId ?? `agent-service-${run.runId}`,
        completedAt,
      },
      diagnostics: diagnostics[0],
    }, execution));
  }

  return {
    ok: true,
    status,
    source: "python-agent-service",
    stageEvents: finalStageEvents,
    diagnostics,
    completedAt,
  };
}

async function invokeAgentService(run, readiness) {
  if (!readiness.ready) {
    return {
      ok: false,
      diagnostics: readiness.diagnostics,
    };
  }

  try {
    const { response, payload } = await fetchJsonWithTimeout(`${config.agentService.baseURL}/review-generation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(buildAgentRequest(run)),
    });

    if (!response.ok) {
      return {
        ok: false,
        diagnostics: [safeDiagnostic("request_failed", `Agent service returned HTTP ${response.status}.`)],
      };
    }

    return validateAgentServicePayload(payload, run);
  } catch (error) {
    return {
      ok: false,
      diagnostics: [
        safeDiagnostic(
          error?.name === "AbortError" ? "timeout" : "request_failed",
          error instanceof Error ? error.message : "Agent service invocation failed.",
        ),
      ],
    };
  }
}

async function executeLocalFallback(run, fallbackDiagnostics = []) {
  const stages = createStructureAwareStages(run.structureSummary);
  const completedAt = nowIsoString();
  const preparationPackage = buildPreparationPackagePayload(run.structureSummary, stages, completedAt);
  const diagnostics = fallbackDiagnostics.length
    ? fallbackDiagnostics
    : [safeDiagnostic("local_fallback", "Local generation fallback executed.")];
  const execution = normalizeAgentExecution("local-fallback", "degraded", diagnostics, completedAt);
  const stageEvents = stages.map((stage) => withAgentExecution({
    ...stage,
    status: "running",
  }, execution));

  stageEvents.push(withAgentExecution({
    type: "review.stage",
    stageId: "draft-issues",
    stageType: "issue-structuring",
    title: "Generating draft review issues",
    detail: "The backend is generating structured draft issue candidates from the local preparation package.",
    progress: 92,
    status: "running",
    agentKey: "construction-review",
    agentLabel: "Construction plan review agent",
    issueSummaries: preparationPackage.issueSummaries ?? [],
    currentSection: run.structureSummary.currentSection,
  }, execution));

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
      diagnostics: safeDiagnostic(
        "request_failed",
        error instanceof Error ? error.message : "Draft issue generation failed.",
        { candidateCount: 0 },
      ),
    };
  }

  const terminalStatus =
    draftIssueGeneration.status === "ready" && draftIssueGeneration.issues.length > 0 ? "ready" : "degraded";
  const terminalExecution = normalizeAgentExecution("local-fallback", terminalStatus, diagnostics, completedAt);
  stageEvents.push(withAgentExecution({
    type: "review.complete",
    stageId: "complete",
    title: terminalStatus === "ready" ? "Review generation completed" : "Review generation completed with fallback",
    detail:
      terminalStatus === "ready"
        ? "The backend generated a preparation package and draft issue candidates through local fallback."
        : "The backend produced a reviewable preparation package with safe degraded draft issue output.",
    progress: 100,
    status: terminalStatus,
    completedAt,
    issueSummaries: preparationPackage.issueSummaries ?? [],
    preparationPackage,
    draftIssueGeneration: {
      ...draftIssueGeneration,
      runId: `draft-issues-${run.runId}`,
      startedAt: completedAt,
      completedAt,
    },
    diagnostics: {
      ...draftIssueGeneration.diagnostics,
      source: "local-fallback",
      fallbackReason: diagnostics[0]?.status,
    },
  }, terminalExecution));

  return {
    ok: true,
    source: "local-fallback",
    status: terminalStatus,
    stageEvents,
    diagnostics,
    completedAt,
  };
}

export async function executeReviewGenerationWithAgentBridge(run) {
  const readiness = await getAgentServiceReadiness();
  if (readiness.ready) {
    const delegated = await invokeAgentService(run, readiness);
    if (delegated.ok) {
      return delegated;
    }

    return executeLocalFallback(run, delegated.diagnostics);
  }

  return executeLocalFallback(run, readiness.diagnostics);
}
