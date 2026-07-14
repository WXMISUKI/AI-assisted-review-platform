import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const STORAGE_VERSION = 1;
const MAX_RUNS = 100;
const MAX_EVENTS_PER_RUN = 200;
const MAX_ISSUE_SUMMARIES = 30;
const MAX_STRING_LENGTH = 2000;
const MAX_PARAGRAPHS_PER_RUN = 12;
const MAX_PARAGRAPH_TEXT_LENGTH = 1600;
const DEFAULT_STORE_PATH = resolve(process.cwd(), ".local-data", "review-generation-runs.json");

const terminalStatuses = new Set(["ready", "degraded", "failed", "expired"]);
const unsafeKeyPattern =
  /(api[_-]?key|token|secret|password|authorization|credential|prompt|rawtrace|raw_trace|presigned|privateurl|private_url|fileurl|file_url)/i;

let writeQueue = Promise.resolve();

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isTerminalStatus(status) {
  return terminalStatuses.has(status);
}

function normalizeString(value, fallback = "", maxLength = 160) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maxLength) : fallback;
}

function normalizeNumber(value, fallback = 0, max = Number.MAX_SAFE_INTEGER) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 0) {
    return fallback;
  }
  return Math.min(Math.floor(numberValue), max);
}

function sanitizeValue(value) {
  if (typeof value === "string") {
    return value.slice(0, MAX_STRING_LENGTH);
  }

  if (Array.isArray(value)) {
    return value.slice(0, 100).map(sanitizeValue);
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

function normalizeStatus(value, fallback = "created") {
  return ["created", "running", "ready", "degraded", "failed", "expired"].includes(value) ? value : fallback;
}

function normalizeMode(value) {
  return value === "revise" ? "revise" : "review";
}

function normalizeActiveStage(value) {
  if (!isPlainObject(value)) {
    return undefined;
  }

  return sanitizeValue({
    stageId: normalizeString(value.stageId, "", 120),
    stageType: normalizeString(value.stageType, "", 120),
    title: normalizeString(value.title, "", 180),
    detail: normalizeString(value.detail, "", 300),
    progress: normalizeNumber(value.progress, 0, 100),
    currentSection: normalizeString(value.currentSection, "", 180),
    currentParagraphId: normalizeString(value.currentParagraphId, "", 120),
    currentParagraphIndex: normalizeNumber(value.currentParagraphIndex, 0, 10000) || undefined,
    currentParagraphTotal: normalizeNumber(value.currentParagraphTotal, 0, 10000) || undefined,
    currentParagraphLabel: normalizeString(value.currentParagraphLabel, "", 180),
    agentKey: normalizeString(value.agentKey, "", 120),
    agentLabel: normalizeString(value.agentLabel, "", 180),
  });
}

function normalizeParagraphs(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((paragraph) => paragraph && typeof paragraph.id === "string" && typeof paragraph.text === "string")
    .slice(0, MAX_PARAGRAPHS_PER_RUN)
    .map((paragraph) =>
      sanitizeValue({
        id: normalizeString(paragraph.id, "", 120),
        section: normalizeString(paragraph.section, "", 160),
        text: String(paragraph.text).slice(0, MAX_PARAGRAPH_TEXT_LENGTH),
      }),
    );
}

function summarizePreparationPackage(value) {
  if (!isPlainObject(value)) {
    return undefined;
  }

  return sanitizeValue({
    packageId: normalizeString(value.packageId, "", 160),
    source: normalizeString(value.source, "", 80),
    status: normalizeString(value.status, "", 80),
    structureSummary: value.structureSummary,
    issueSummaries: Array.isArray(value.issueSummaries)
      ? value.issueSummaries.slice(0, MAX_ISSUE_SUMMARIES).map((item) => normalizeString(item, "", 180))
      : [],
    providerSummary: value.providerSummary,
    message: normalizeString(value.message, "", 240),
    completedAt: normalizeString(value.completedAt, "", 80),
  });
}

function summarizeDraftIssueGeneration(value) {
  if (!isPlainObject(value)) {
    return undefined;
  }

  return sanitizeValue({
    runId: normalizeString(value.runId, "", 180),
    source: normalizeString(value.source, "", 80),
    status: normalizeString(value.status, "", 80),
    diagnostics: value.diagnostics,
    issueCount: Array.isArray(value.issues) ? value.issues.length : normalizeNumber(value.issueCount, 0, 100),
    startedAt: normalizeString(value.startedAt, "", 80),
    completedAt: normalizeString(value.completedAt, "", 80),
  });
}

function normalizeEvent(value, fallbackSequence = 0) {
  if (!isPlainObject(value)) {
    return null;
  }

  const sequence = normalizeNumber(value.sequence, fallbackSequence, Number.MAX_SAFE_INTEGER);
  const runId = normalizeString(value.runId, "", 180);
  const taskId = normalizeString(value.taskId, "", 180);
  const type = normalizeString(value.type, "review.stage", 120);
  const status = normalizeStatus(value.status, "running");
  const progress = normalizeNumber(value.progress, 0, 100);
  const occurredAt = normalizeString(value.occurredAt, new Date().toISOString(), 80);
  const event = sanitizeValue({
    ...value,
    sequence,
    runId,
    taskId,
    type,
    status,
    stageId: normalizeString(value.stageId, "", 120),
    stageType: normalizeString(value.stageType, "", 120),
    title: normalizeString(value.title, "", 180),
    detail: normalizeString(value.detail, "", 360),
    progress,
    issueSummaries: Array.isArray(value.issueSummaries)
      ? value.issueSummaries.slice(0, MAX_ISSUE_SUMMARIES).map((item) => normalizeString(item, "", 180))
      : [],
    occurredAt,
    completedAt: normalizeString(value.completedAt, "", 80) || undefined,
    diagnostics: value.diagnostics,
    preparationPackage: value.preparationPackage,
    draftIssueGeneration: value.draftIssueGeneration,
  });

  return event.runId ? event : null;
}

function normalizeRun(value) {
  if (!isPlainObject(value)) {
    return null;
  }

  const runId = normalizeString(value.runId, "", 180);
  const taskId = normalizeString(value.taskId, "", 180);
  if (!runId || !taskId) {
    return null;
  }

  const now = new Date().toISOString();
  const events = Array.isArray(value.events)
    ? value.events
        .slice(-MAX_EVENTS_PER_RUN)
        .map((event, index) => normalizeEvent(event, index + 1))
        .filter(Boolean)
    : [];
  const lastSequence = events.reduce((max, event) => Math.max(max, event.sequence), 0);

  return sanitizeValue({
    schemaVersion: STORAGE_VERSION,
    runId,
    taskId,
    mode: normalizeMode(value.mode),
    status: normalizeStatus(value.status),
    createdAt: normalizeString(value.createdAt, now, 80),
    updatedAt: normalizeString(value.updatedAt, now, 80),
    startedAt: normalizeString(value.startedAt, "", 80) || undefined,
    completedAt: normalizeString(value.completedAt, "", 80) || undefined,
    expiresAt: normalizeString(value.expiresAt, "", 80) || undefined,
    progress: normalizeNumber(value.progress, 0, 100),
    activeStage: normalizeActiveStage(value.activeStage),
    structureSummary: sanitizeValue(value.structureSummary ?? {}),
    paragraphs: normalizeParagraphs(value.paragraphs),
    acceptedParagraphCount: normalizeNumber(value.acceptedParagraphCount, 0, 5000),
    maxIssues: normalizeNumber(value.maxIssues, 6, 50) || 6,
    preparationPackageSummary: summarizePreparationPackage(value.preparationPackageSummary ?? value.preparationPackage),
    draftIssueGenerationSummary: summarizeDraftIssueGeneration(
      value.draftIssueGenerationSummary ?? value.draftIssueGeneration,
    ),
    safeDiagnostics: sanitizeValue(value.safeDiagnostics ?? value.diagnostics),
    events,
    lastSequence,
  });
}

function normalizeSnapshot(value) {
  if (!isPlainObject(value)) {
    return {
      schemaVersion: STORAGE_VERSION,
      runs: [],
    };
  }

  const runs = Array.isArray(value.runs)
    ? value.runs
        .map(normalizeRun)
        .filter(Boolean)
        .sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)))
        .slice(0, MAX_RUNS)
    : [];

  return {
    schemaVersion: STORAGE_VERSION,
    runs,
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
        runs: [],
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
    const nextSnapshot = result?.snapshot ?? snapshot;
    await writeSnapshot(nextSnapshot);
    return result?.value;
  });
  writeQueue = operation.catch(() => undefined);
  return operation;
}

export async function createGenerationRunRecord(input) {
  const now = new Date().toISOString();
  const normalized = normalizeRun({
    ...input,
    schemaVersion: STORAGE_VERSION,
    status: "created",
    createdAt: input.createdAt ?? now,
    updatedAt: input.updatedAt ?? now,
    progress: 0,
    events: [],
  });

  if (!normalized) {
    return {
      ok: false,
      status: "invalid_input",
      message: "A valid generation run record is required.",
    };
  }

  await mutateSnapshot((snapshot) => ({
    snapshot: {
      schemaVersion: STORAGE_VERSION,
      runs: [normalized, ...snapshot.runs.filter((run) => run.runId !== normalized.runId)].slice(0, MAX_RUNS),
    },
    value: normalized,
  }));

  return {
    ok: true,
    run: normalized,
  };
}

export async function getGenerationRunRecord(runId) {
  const snapshot = await readSnapshot();
  return snapshot.runs.find((run) => run.runId === runId) ?? null;
}

export async function updateGenerationRunRecord(runId, update = {}) {
  return mutateSnapshot((snapshot) => {
    const index = snapshot.runs.findIndex((run) => run.runId === runId);
    if (index < 0) {
      return {
        snapshot,
        value: null,
      };
    }

    const existingRun = snapshot.runs[index];
    const normalized = normalizeRun({
      ...existingRun,
      ...sanitizeValue(update),
      runId: existingRun.runId,
      taskId: existingRun.taskId,
      mode: update.mode ?? existingRun.mode,
      events: existingRun.events,
      lastSequence: existingRun.lastSequence,
      updatedAt: update.updatedAt ?? new Date().toISOString(),
    });
    const nextRuns = [...snapshot.runs];
    nextRuns[index] = normalized;

    return {
      snapshot: {
        schemaVersion: STORAGE_VERSION,
        runs: nextRuns,
      },
      value: normalized,
    };
  });
}

export async function appendGenerationRunEvent(runId, event) {
  return mutateSnapshot((snapshot) => {
    const index = snapshot.runs.findIndex((run) => run.runId === runId);
    if (index < 0) {
      return {
        snapshot,
        value: null,
      };
    }

    const existingRun = snapshot.runs[index];
    const sequence = (existingRun.lastSequence ?? 0) + 1;
    const normalizedEvent = normalizeEvent(
      {
        ...event,
        runId: existingRun.runId,
        taskId: existingRun.taskId,
        sequence,
        occurredAt: event.occurredAt ?? new Date().toISOString(),
      },
      sequence,
    );
    if (!normalizedEvent) {
      return {
        snapshot,
        value: null,
      };
    }

    const status = normalizeStatus(normalizedEvent.status, existingRun.status);
    const completedAt =
      normalizedEvent.completedAt ??
      (isTerminalStatus(status) ? normalizedEvent.occurredAt : existingRun.completedAt);
    const normalizedRun = normalizeRun({
      ...existingRun,
      status,
      updatedAt: normalizedEvent.occurredAt,
      startedAt: existingRun.startedAt ?? normalizedEvent.occurredAt,
      completedAt,
      progress: normalizedEvent.progress ?? existingRun.progress,
      activeStage: normalizeActiveStage(normalizedEvent),
      preparationPackageSummary:
        summarizePreparationPackage(normalizedEvent.preparationPackage) ?? existingRun.preparationPackageSummary,
      draftIssueGenerationSummary:
        summarizeDraftIssueGeneration(normalizedEvent.draftIssueGeneration) ?? existingRun.draftIssueGenerationSummary,
      safeDiagnostics: normalizedEvent.diagnostics ?? existingRun.safeDiagnostics,
      events: [...existingRun.events, normalizedEvent].slice(-MAX_EVENTS_PER_RUN),
    });

    const nextRuns = [...snapshot.runs];
    nextRuns[index] = normalizedRun;

    return {
      snapshot: {
        schemaVersion: STORAGE_VERSION,
        runs: nextRuns,
      },
      value: normalizedEvent,
    };
  });
}

export async function listGenerationRunEvents(runId, options = {}) {
  const run = await getGenerationRunRecord(runId);
  if (!run) {
    return null;
  }

  const afterSequence = normalizeNumber(options.afterSequence, 0);
  return run.events.filter((event) => event.sequence > afterSequence);
}

export function getGenerationRunStoreInfo() {
  return {
    schemaVersion: STORAGE_VERSION,
    maxRuns: MAX_RUNS,
    maxEventsPerRun: MAX_EVENTS_PER_RUN,
    store: "file-development",
  };
}
