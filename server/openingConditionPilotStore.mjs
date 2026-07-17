import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { normalizeProviderRefs } from "./providerContracts.mjs";

const STORAGE_VERSION = 1;
const MAX_TASKS = 100;
const MAX_EVENTS_PER_TASK = 300;
const MAX_OBJECTS_PER_PACKET = 200;
const MAX_CHECKLIST_ITEMS = 300;
const MAX_STRING_LENGTH = 2000;
const MAX_KNOWLEDGE_BASE_RECORDS = 300;
const MAX_KNOWLEDGE_BASE_ENTRIES = 200;
const DEFAULT_STORE_PATH = resolve(process.cwd(), ".local-data", "opening-condition-pilot-tasks.json");

export const pilotTaskStates = [
  "draft",
  "blocked_missing_basis",
  "blocked_missing_master_data",
  "ready_for_packet",
  "packet_uploaded",
  "extracting",
  "matching",
  "awaiting_human_review",
  "report_ready",
  "archived",
  "failed",
  "canceled",
];

const stateSet = new Set(pilotTaskStates);
const terminalStates = new Set(["archived", "failed", "canceled"]);
const unsafeKeyPattern =
  /(api[_-]?key|token|secret|password|authorization|credential|prompt|rawtrace|raw_trace|providertrace|provider_trace|presigned|privateurl|private_url|fileurl|file_url|rawtext|raw_text|fulltext|full_text|cookie|session)/i;

const allowedTransitions = {
  draft: new Set(["blocked_missing_basis", "blocked_missing_master_data", "ready_for_packet", "canceled", "failed"]),
  blocked_missing_basis: new Set(["ready_for_packet", "canceled", "failed"]),
  blocked_missing_master_data: new Set(["ready_for_packet", "canceled", "failed"]),
  ready_for_packet: new Set(["packet_uploaded", "canceled", "failed"]),
  packet_uploaded: new Set(["extracting", "canceled", "failed"]),
  extracting: new Set(["matching", "awaiting_human_review", "failed", "canceled"]),
  matching: new Set(["awaiting_human_review", "report_ready", "failed", "canceled"]),
  awaiting_human_review: new Set(["matching", "report_ready", "failed", "canceled"]),
  report_ready: new Set(["archived", "failed", "canceled"]),
  archived: new Set([]),
  failed: new Set([]),
  canceled: new Set([]),
};

const scopeStatusValues = new Set(["in_scope", "out_of_scope"]);
const documentPresenceValues = new Set(["present", "missing", "ambiguous", "not_required"]);
const relevanceStatusValues = new Set(["matched", "wrong_subject", "wrong_project", "unconfirmed", "not_applicable"]);
const contentComplianceValues = new Set(["compliant", "non_compliant", "partially_compliant", "not_evaluated"]);
const finalDispositionValues = new Set(["pass", "fail", "needs_human_review", "blocked", "not_applicable"]);
const visualAssertionTypes = new Set(["stamp", "signature", "checkbox", "handwritten_date", "seal", "other"]);
const visualAssertionStatuses = new Set(["detected", "missing", "uncertain", "confirmed", "rejected", "not_required"]);
const knowledgeBaseStatusValues = new Set(["draft", "ready", "needs_review", "archived"]);

let writeQueue = Promise.resolve();

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

export function sanitizeOpeningConditionPilotValue(value, options = {}) {
  const maxStringLength = normalizeNumber(options.maxStringLength, MAX_STRING_LENGTH, 10000) || MAX_STRING_LENGTH;

  if (typeof value === "string") {
    return value.slice(0, maxStringLength);
  }

  if (Array.isArray(value)) {
    return value.slice(0, 100).map((item) => sanitizeOpeningConditionPilotValue(item, options));
  }

  if (!isPlainObject(value)) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !unsafeKeyPattern.test(key))
      .map(([key, nestedValue]) => [key, sanitizeOpeningConditionPilotValue(nestedValue, options)]),
  );
}

export function canTransitionOpeningConditionPilotTask(fromState, toState) {
  if (!stateSet.has(fromState) || !stateSet.has(toState)) {
    return false;
  }

  if (fromState === toState) {
    return true;
  }

  return allowedTransitions[fromState]?.has(toState) ?? false;
}

function normalizeState(value, fallback = "draft") {
  return stateSet.has(value) ? value : fallback;
}

function normalizeWorkspaceContext(value) {
  if (!isPlainObject(value)) {
    return null;
  }

  const context = {
    workspaceId: normalizeString(value.workspaceId, "", 160),
    tenantId: normalizeString(value.tenantId, "", 160),
    projectId: normalizeString(value.projectId, "", 160),
    contractPackageId: normalizeString(value.contractPackageId, "", 160),
    participatingOrganizationId: normalizeString(value.participatingOrganizationId, "", 160),
  };

  return Object.values(context).every(Boolean) ? context : null;
}

function normalizeObjectRef(value) {
  if (!isPlainObject(value)) {
    return null;
  }

  const objectId = normalizeString(value.objectId ?? value.id, "", 180);
  const fileName = normalizeString(value.fileName ?? value.name, "", 240);
  if (!objectId || !fileName) {
    return null;
  }

  return sanitizeOpeningConditionPilotValue({
    objectId,
    kind: normalizeString(value.kind, "evidence", 80),
    fileName,
    storageKey: normalizeString(value.storageKey ?? value.key, "", 500) || undefined,
    contentType: normalizeString(value.contentType, "", 120) || undefined,
    sizeBytes: normalizeNumber(value.sizeBytes ?? value.size, 0, 1024 * 1024 * 1024) || undefined,
    checksum: normalizeString(value.checksum, "", 160) || undefined,
    summary: normalizeString(value.summary, "", 300) || undefined,
  });
}

function normalizeBasisVersion(value) {
  if (!isPlainObject(value)) {
    return undefined;
  }

  const id = normalizeString(value.id, "", 180);
  const workspaceId = normalizeString(value.workspaceId, "", 160);
  if (!id || !workspaceId || value.status !== "published") {
    return undefined;
  }

  return sanitizeOpeningConditionPilotValue({
    id,
    workspaceId,
    version: normalizeString(value.version, "published", 120),
    status: "published",
    publishedAt: normalizeString(value.publishedAt, new Date().toISOString(), 80),
    sourceObject: normalizeObjectRef(value.sourceObject) ?? undefined,
    evidenceRefs: Array.isArray(value.evidenceRefs)
      ? value.evidenceRefs.map(normalizeObjectRef).filter(Boolean).slice(0, 50)
      : [],
  });
}

function normalizeBasisRecord(value, workspaceId = "") {
  if (!isPlainObject(value)) {
    return null;
  }

  const id = normalizeString(value.id, "", 180);
  const resolvedWorkspaceId = normalizeString(value.workspaceId, workspaceId, 160);
  if (!id || !resolvedWorkspaceId) {
    return null;
  }

  const status = ["draft", "pending_confirmation", "confirmed", "published", "superseded", "rejected"].includes(
    value.status,
  )
    ? value.status
    : "draft";

  return sanitizeOpeningConditionPilotValue({
    id,
    workspaceId: resolvedWorkspaceId,
    title: normalizeString(value.title, "未命名依据", 240),
    componentType: normalizeString(value.componentType, "project_rule", 100),
    sourceObject: normalizeObjectRef(value.sourceObject) ?? undefined,
    version: normalizeString(value.version, "draft", 120),
    status,
    evidenceRefs: Array.isArray(value.evidenceRefs)
      ? value.evidenceRefs.map(normalizeObjectRef).filter(Boolean).slice(0, 50)
      : [],
    confirmedBy: normalizeString(value.confirmedBy, "", 160) || undefined,
    confirmedAt: normalizeString(value.confirmedAt, "", 80) || undefined,
    publishedBy: normalizeString(value.publishedBy, "", 160) || undefined,
    publishedAt: normalizeString(value.publishedAt, "", 80) || undefined,
    applicability: normalizeString(value.applicability, "", 500),
    confidence: ["high", "medium", "low"].includes(value.confidence) ? value.confidence : "medium",
    safeNote: normalizeString(value.safeNote, "", 500) || undefined,
  });
}

function normalizeMasterDataRef(value) {
  if (!isPlainObject(value)) {
    return null;
  }

  const id = normalizeString(value.id, "", 180);
  const workspaceId = normalizeString(value.workspaceId, "", 160);
  const status = value.status === "human_approved" ? "human_approved" : value.status === "published" ? "published" : "";
  if (!id || !workspaceId || !status) {
    return null;
  }

  return sanitizeOpeningConditionPilotValue({
    id,
    workspaceId,
    type: normalizeString(value.type, "system_document", 80),
    status,
    label: normalizeString(value.label, id, 240),
  });
}

function normalizeStringList(value, maxItems = 50, maxLength = 180) {
  return Array.isArray(value)
    ? value.map((item) => normalizeString(item, "", maxLength)).filter(Boolean).slice(0, maxItems)
    : [];
}

function normalizeKnowledgeBaseRef(value, workspaceId = "") {
  if (!isPlainObject(value)) {
    return undefined;
  }

  const id = normalizeString(value.id, "", 180);
  const resolvedWorkspaceId = normalizeString(value.workspaceId, workspaceId, 160);
  if (!id || !resolvedWorkspaceId) {
    return undefined;
  }

  const status = knowledgeBaseStatusValues.has(value.status) ? value.status : "draft";
  const rawProviderRefs = Array.isArray(value.providerRefs)
    ? value.providerRefs
    : value.providerRef
      ? [value.providerRef]
      : [];
  const providerRefs = normalizeProviderRefs(rawProviderRefs);
  const providerSyncStatus = deriveKnowledgeBaseProviderSyncStatus(providerRefs);
  return sanitizeOpeningConditionPilotValue({
    id,
    workspaceId: resolvedWorkspaceId,
    organizationId: normalizeString(value.organizationId, "", 160),
    contractPackageId: normalizeString(value.contractPackageId, "", 160),
    subcontractTeamId: normalizeString(value.subcontractTeamId, "", 160),
    label: normalizeString(value.label, id, 240),
    status,
    summary: normalizeString(value.summary, "", 500),
    providerRefs,
    providerSyncStatus,
  });
}

function deriveKnowledgeBaseProviderSyncStatus(providerRefs = []) {
  if (!providerRefs.length) {
    return undefined;
  }

  const statuses = providerRefs.map((item) => item.syncStatus).filter(Boolean);
  if (statuses.includes("unreachable")) {
    return "unreachable";
  }
  if (statuses.includes("stale")) {
    return "stale";
  }
  if (statuses.includes("provisional")) {
    return "provisional";
  }
  if (statuses.every((status) => status === "disabled")) {
    return "disabled";
  }
  return statuses.every((status) => status === "ready") ? "ready" : "provisional";
}

function isKnowledgeBaseReadyForFormalReview(knowledgeBaseRef) {
  return Boolean(
    knowledgeBaseRef &&
      knowledgeBaseRef.status === "ready" &&
      !["stale", "unreachable", "disabled"].includes(knowledgeBaseRef.providerSyncStatus ?? ""),
  );
}

function normalizeKnowledgeBaseEntry(value) {
  if (!isPlainObject(value)) {
    return null;
  }

  const id = normalizeString(value.id, "", 180);
  if (!id) {
    return null;
  }

  return sanitizeOpeningConditionPilotValue({
    id,
    type: ["template", "historical_evidence", "extraction_note", "human_correction", "master_data_reference"].includes(
      value.type,
    )
      ? value.type
      : "historical_evidence",
    title: normalizeString(value.title, id, 240),
    summary: normalizeString(value.summary, "", 500),
    sourceObject: normalizeObjectRef(value.sourceObject) ?? undefined,
    masterDataIds: normalizeStringList(value.masterDataIds, 50, 180),
    evidenceIds: normalizeStringList(value.evidenceIds, 50, 180),
    confidence: ["high", "medium", "low"].includes(value.confidence) ? value.confidence : "medium",
    updatedAt: normalizeString(value.updatedAt, new Date().toISOString(), 80),
  });
}

function normalizeKnowledgeBaseRecord(value, workspaceId = "") {
  if (!isPlainObject(value)) {
    return null;
  }

  const ref = normalizeKnowledgeBaseRef(value, workspaceId);
  if (!ref) {
    return null;
  }

  return sanitizeOpeningConditionPilotValue({
    ...ref,
    entries: Array.isArray(value.entries)
      ? value.entries.map(normalizeKnowledgeBaseEntry).filter(Boolean).slice(0, MAX_KNOWLEDGE_BASE_ENTRIES)
      : [],
    safeNote: normalizeString(value.safeNote, "", 500) || undefined,
    createdAt: normalizeString(value.createdAt, new Date().toISOString(), 80),
    updatedAt: normalizeString(value.updatedAt, new Date().toISOString(), 80),
  });
}

function normalizeMasterDataRecord(value, workspaceId = "") {
  if (!isPlainObject(value)) {
    return null;
  }

  const id = normalizeString(value.id, "", 180);
  const resolvedWorkspaceId = normalizeString(value.workspaceId, workspaceId, 160);
  if (!id || !resolvedWorkspaceId) {
    return null;
  }

  const status = ["provisional", "confirmed", "published", "human_approved", "rejected", "expired"].includes(
    value.status,
  )
    ? value.status
    : "provisional";

  return sanitizeOpeningConditionPilotValue({
    id,
    workspaceId: resolvedWorkspaceId,
    type: normalizeString(value.type, "system_document", 100),
    label: normalizeString(value.label, id, 240),
    normalizedFields: sanitizeOpeningConditionPilotValue(value.normalizedFields ?? {}),
    status,
    evidenceRefs: Array.isArray(value.evidenceRefs)
      ? value.evidenceRefs.map(normalizeObjectRef).filter(Boolean).slice(0, 50)
      : [],
    validity: normalizeString(value.validity, "", 300),
    confidence: ["high", "medium", "low"].includes(value.confidence) ? value.confidence : "medium",
    confirmedBy: normalizeString(value.confirmedBy, "", 160) || undefined,
    confirmedAt: normalizeString(value.confirmedAt, "", 80) || undefined,
    publishedBy: normalizeString(value.publishedBy, "", 160) || undefined,
    publishedAt: normalizeString(value.publishedAt, "", 80) || undefined,
    rejectionReason: normalizeString(value.rejectionReason, "", 500) || undefined,
    safeNote: normalizeString(value.safeNote, "", 500) || undefined,
  });
}

function normalizeVisualAssertion(value, fallbackEvidenceIds = []) {
  if (!isPlainObject(value)) {
    return null;
  }

  const type = visualAssertionTypes.has(value.type) ? value.type : "other";
  const status = visualAssertionStatuses.has(value.status) ? value.status : "uncertain";
  const confidence = ["high", "medium", "low"].includes(value.confidence) ? value.confidence : "low";
  const evidenceIds = Array.isArray(value.evidenceIds)
    ? value.evidenceIds.map((item) => normalizeString(item, "", 180)).filter(Boolean).slice(0, 50)
    : fallbackEvidenceIds;

  return sanitizeOpeningConditionPilotValue({
    type,
    status,
    confidence,
    locator: normalizeString(value.locator, "", 240) || undefined,
    evidenceIds,
    requiresHumanReview: value.requiresHumanReview !== false && status !== "detected" && status !== "confirmed",
    note: normalizeString(value.note, "", 500) || undefined,
  });
}

function normalizePacket(value, taskId, workspaceId) {
  if (!isPlainObject(value)) {
    return undefined;
  }

  const id = normalizeString(value.id, `${taskId}-packet`, 180);
  const checklistObject = normalizeObjectRef(value.checklistObject);
  const sourceObjects = Array.isArray(value.sourceObjects)
    ? value.sourceObjects.map(normalizeObjectRef).filter(Boolean).slice(0, MAX_OBJECTS_PER_PACKET)
    : [];

  if (!id || !checklistObject) {
    return undefined;
  }

  return {
    id,
    taskId,
    workspaceId,
    checklistObject,
    sourceObjects,
    submittedAt: normalizeString(value.submittedAt, new Date().toISOString(), 80),
    submittedBy: normalizeString(value.submittedBy, "pilot-user", 160),
  };
}

function normalizeEvidence(value, taskId) {
  if (!isPlainObject(value)) {
    return null;
  }

  const id = normalizeString(value.id, "", 180);
  const objectRef = normalizeObjectRef(value.objectRef);
  if (!id || !objectRef) {
    return null;
  }

  return sanitizeOpeningConditionPilotValue({
    id,
    taskId,
    itemId: normalizeString(value.itemId, "", 180) || undefined,
    objectRef,
    locator: normalizeString(value.locator, "", 240) || undefined,
    extractedValue: normalizeString(value.extractedValue, "", 500) || undefined,
    confidence: ["high", "medium", "low"].includes(value.confidence) ? value.confidence : "medium",
    masterDataIds: Array.isArray(value.masterDataIds)
      ? value.masterDataIds.map((item) => normalizeString(item, "", 180)).filter(Boolean).slice(0, 50)
      : [],
  });
}

function normalizeHumanReviewItem(value, taskId) {
  if (!isPlainObject(value)) {
    return null;
  }

  const id = normalizeString(value.id, "", 180);
  const targetId = normalizeString(value.targetId, "", 180);
  if (!id || !targetId) {
    return null;
  }

  return sanitizeOpeningConditionPilotValue({
    id,
    taskId,
    targetType: normalizeString(value.targetType, "check_item", 80),
    targetId,
    reason: normalizeString(value.reason, "Needs human review.", 500),
    status: ["open", "confirmed", "corrected", "rejected", "deferred"].includes(value.status)
      ? value.status
      : "open",
    evidenceIds: Array.isArray(value.evidenceIds)
      ? value.evidenceIds.map((item) => normalizeString(item, "", 180)).filter(Boolean).slice(0, 50)
      : [],
    reviewerId: normalizeString(value.reviewerId, "", 160) || undefined,
    decidedAt: normalizeString(value.decidedAt, "", 80) || undefined,
    safeNote: normalizeString(value.safeNote, "", 500) || undefined,
  });
}

function normalizeChecklistItem(value, index = 0) {
  if (!isPlainObject(value) && typeof value !== "string") {
    return null;
  }

  const source = typeof value === "string" ? { name: value } : value;
  const name = normalizeString(source.name ?? source.content ?? source.title, "", 240);
  if (!name) {
    return null;
  }

  const hints = Array.isArray(source.expectedEvidenceHints ?? source.hints)
    ? (source.expectedEvidenceHints ?? source.hints)
        .map((item) => normalizeString(item, "", 120))
        .filter(Boolean)
        .slice(0, 20)
    : [];

  return {
    id: normalizeString(source.id, `check-${index + 1}`, 180),
    category: normalizeString(source.category, "资料核查", 160),
    subCategory: normalizeString(source.subCategory, "", 120),
    name,
    required: source.required !== false && source.mandatory !== false,
    expectedEvidenceHints: hints.length > 0 ? hints : [name],
    basisVersionId: normalizeString(source.basisVersionId, "", 180),
    masterDataIds: Array.isArray(source.masterDataIds)
      ? source.masterDataIds.map((item) => normalizeString(item, "", 180)).filter(Boolean).slice(0, 50)
      : [],
    scopeStatus: scopeStatusValues.has(source.scopeStatus) ? source.scopeStatus : undefined,
    visualAssertions: Array.isArray(source.visualAssertions)
      ? source.visualAssertions.map((item) => normalizeVisualAssertion(item)).filter(Boolean).slice(0, 20)
      : [],
  };
}

function normalizeCheckItem(value, taskId) {
  if (!isPlainObject(value)) {
    return null;
  }

  const id = normalizeString(value.id, "", 180);
  if (!id) {
    return null;
  }

  return sanitizeOpeningConditionPilotValue({
    id,
    taskId,
    category: normalizeString(value.category, "资料核查", 160),
    name: normalizeString(value.name ?? value.content, "未命名核查项", 240),
    required: value.required !== false,
    verdict: ["pass", "fail", "warning", "needs_human_review", "blocked"].includes(value.verdict)
      ? value.verdict
      : "needs_human_review",
    ruleExplanation: normalizeString(value.ruleExplanation, "", 500),
    semanticNote: normalizeString(value.semanticNote, "", 500) || undefined,
    basisVersionId: normalizeString(value.basisVersionId, "", 180),
    evidenceIds: Array.isArray(value.evidenceIds)
      ? value.evidenceIds.map((item) => normalizeString(item, "", 180)).filter(Boolean).slice(0, 50)
      : [],
    masterDataIds: Array.isArray(value.masterDataIds)
      ? value.masterDataIds.map((item) => normalizeString(item, "", 180)).filter(Boolean).slice(0, 50)
      : [],
    humanReviewIds: Array.isArray(value.humanReviewIds)
      ? value.humanReviewIds.map((item) => normalizeString(item, "", 180)).filter(Boolean).slice(0, 50)
      : [],
    scopeStatus: scopeStatusValues.has(value.scopeStatus) ? value.scopeStatus : undefined,
    documentPresence: documentPresenceValues.has(value.documentPresence) ? value.documentPresence : undefined,
    relevanceStatus: relevanceStatusValues.has(value.relevanceStatus) ? value.relevanceStatus : undefined,
    contentCompliance: contentComplianceValues.has(value.contentCompliance) ? value.contentCompliance : undefined,
    visualAssertions: Array.isArray(value.visualAssertions)
      ? value.visualAssertions.map((item) => normalizeVisualAssertion(item, value.evidenceIds ?? [])).filter(Boolean)
      : [],
    finalDisposition: finalDispositionValues.has(value.finalDisposition) ? value.finalDisposition : undefined,
  });
}

function normalizeMatchText(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

function getMatchScore(checklistItem, objectRef) {
  const fileText = normalizeMatchText(`${objectRef.fileName} ${objectRef.summary ?? ""}`);
  const hints = checklistItem.expectedEvidenceHints.map(normalizeMatchText).filter(Boolean);
  if (hints.length === 0 || !fileText) {
    return 0;
  }

  return hints.reduce((score, hint) => {
    if (!hint) {
      return score;
    }

    if (fileText.includes(hint) || hint.includes(fileText)) {
      return score + 3;
    }

    const partial = hint.length >= 2 && fileText.includes(hint.slice(0, Math.min(4, hint.length))) ? 1 : 0;
    return score + partial;
  }, 0);
}

function getChecklistReviewText(checklistItem) {
  return normalizeMatchText(
    [
      checklistItem.category,
      checklistItem.subCategory,
      checklistItem.name,
      ...(checklistItem.expectedEvidenceHints ?? []),
    ].join(" "),
  );
}

function isOutOfScopeChecklistItem(checklistItem) {
  if (checklistItem.scopeStatus === "out_of_scope") {
    return true;
  }

  const text = getChecklistReviewText(checklistItem);
  return /现场核查|现场检查|现场确认|应急响应|应急演练|应急处置|现场观测/.test(text);
}

function isResourceChecklistItem(checklistItem) {
  const text = getChecklistReviewText(checklistItem);
  return /人员|安全员|特种作业|作业人员|管理人员|设备|机械|起重|汽车吊|泵车|仪器/.test(text);
}

function getAuthorizedMasterDataIds(task, checklistItem) {
  const authorizedIds = new Set(task.requiredMasterData.map((record) => record.id));
  return checklistItem.masterDataIds.filter((masterDataId) => authorizedIds.has(masterDataId));
}

function getVisualAssertionType(checklistItem) {
  const text = getChecklistReviewText(checklistItem);
  if (/盖章|公章|印章|章/.test(text)) return "stamp";
  if (/签字|签名/.test(text)) return "signature";
  if (/勾选|打勾|勾|复选/.test(text)) return "checkbox";
  if (/手写日期|日期/.test(text)) return "handwritten_date";
  if (/签章|盖印/.test(text)) return "seal";
  return "";
}

function buildVisualAssertions(checklistItem, matches, evidenceIds) {
  if (Array.isArray(checklistItem.visualAssertions) && checklistItem.visualAssertions.length > 0) {
    return checklistItem.visualAssertions.map((assertion) =>
      normalizeVisualAssertion(
        {
          ...assertion,
          evidenceIds: assertion.evidenceIds?.length ? assertion.evidenceIds : evidenceIds,
        },
        evidenceIds,
      ),
    );
  }

  const type = getVisualAssertionType(checklistItem);
  if (!type) {
    return [];
  }

  const evidenceText = matches.map((match) => `${match.objectRef.fileName} ${match.objectRef.summary ?? ""}`).join(" ");
  const normalizedEvidenceText = normalizeMatchText(evidenceText);
  const stable = /清晰|完整|已确认|签章完整|盖章完整|签字完整|勾选完整/.test(normalizedEvidenceText);
  const uncertain = matches.length === 0 || /疑似|不清晰|模糊|低置信|无法确认|待确认/.test(normalizedEvidenceText);
  const status = stable && !uncertain ? "detected" : matches.length === 0 ? "missing" : "uncertain";
  const confidence = status === "detected" ? "high" : matches.length > 0 ? "low" : "low";

  return [
    normalizeVisualAssertion(
      {
        type,
        status,
        confidence,
        locator: matches.length > 0 ? "资料包文件清单 / 视觉要素摘要" : "未命中稳定视觉要素资料",
        evidenceIds,
        requiresHumanReview: status !== "detected",
        note:
          status === "detected"
            ? "检测到较稳定的视觉要素存在性，仍不代表实体签章或签名真实有效。"
            : "视觉要素存在性或清晰度不足，需要人工确认。",
      },
      evidenceIds,
    ),
  ];
}

function buildSemanticNote(checklistItem, matches, verdict) {
  if (matches.length > 1) {
    return `存在 ${matches.length} 个候选资料，需要人工确认最准确证据。`;
  }

  if (matches.length === 1) {
    return `资料名称与“${checklistItem.name}”存在可解释匹配，仍以规则证据为准。`;
  }

  if (verdict === "fail" || verdict === "warning") {
    return `未在资料包清单中找到“${checklistItem.name}”的稳定匹配文件。`;
  }

  return "";
}

function createMatchEvent(taskId, sequence, type, state, message, progress, safeDiagnostics = {}) {
  return normalizeEvent(
    {
      id: `oc-event-${taskId}-${sequence}`,
      taskId,
      sequence,
      type,
      state,
      occurredAt: new Date().toISOString(),
      message,
      progress,
      safeDiagnostics,
    },
    taskId,
    sequence,
  );
}

function normalizeReportAsset(value, taskId) {
  if (!isPlainObject(value)) {
    return undefined;
  }

  const id = normalizeString(value.id, "", 180);
  if (!id) {
    return undefined;
  }

  return sanitizeOpeningConditionPilotValue({
    id,
    taskId,
    title: normalizeString(value.title, "开工条件核查内部辅助意见", 240),
    status: ["draft", "ready", "archived"].includes(value.status) ? value.status : "draft",
    summary: {
      total: normalizeNumber(value.summary?.total, 0, 10000),
      passed: normalizeNumber(value.summary?.passed, 0, 10000),
      failed: normalizeNumber(value.summary?.failed, 0, 10000),
      warnings: normalizeNumber(value.summary?.warnings, 0, 10000),
      humanReview: normalizeNumber(value.summary?.humanReview, 0, 10000),
    },
    objectRef: normalizeObjectRef(value.objectRef) ?? undefined,
    disclaimer: normalizeString(
      value.disclaimer,
      "本结果为平台智能辅助审查意见，不替代施工单位、监理单位及相关责任人的最终审核责任。",
      500,
    ),
    createdAt: normalizeString(value.createdAt, new Date().toISOString(), 80),
  });
}

function normalizeEvent(value, taskId, fallbackSequence = 0) {
  if (!isPlainObject(value)) {
    return null;
  }

  const id = normalizeString(value.id, `oc-event-${fallbackSequence}`, 180);
  return sanitizeOpeningConditionPilotValue({
    id,
    taskId,
    sequence: normalizeNumber(value.sequence, fallbackSequence, Number.MAX_SAFE_INTEGER),
    type: normalizeString(value.type, "task.created", 120),
    state: normalizeState(value.state),
    occurredAt: normalizeString(value.occurredAt, new Date().toISOString(), 80),
    message: normalizeString(value.message, "Opening-condition pilot task updated.", 500),
    progress: normalizeNumber(value.progress, 0, 100),
    safeDiagnostics: sanitizeOpeningConditionPilotValue(value.safeDiagnostics ?? {}),
  });
}

export function validateOpeningConditionPilotTaskInput(input) {
  const errors = [];
  const context = normalizeWorkspaceContext(input?.context);
  if (!context) {
    errors.push("workspace context with workspaceId, tenantId, projectId, contractPackageId, and participatingOrganizationId is required");
  }

  if (input?.basisVersion && !normalizeBasisVersion(input.basisVersion)) {
    errors.push("basisVersion must be published before it can be bound to a formal pilot task");
  }

  if (input?.packet && !normalizePacket(input.packet, normalizeString(input.id, "task"), context?.workspaceId ?? "")) {
    errors.push("packet must include id and checklistObject with objectId and fileName");
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

function deriveInitialState(input, currentState = "draft") {
  if (terminalStates.has(currentState)) {
    return currentState;
  }

  if (!normalizeBasisVersion(input.basisVersion)) {
    return "blocked_missing_basis";
  }

  const requiredMasterData = Array.isArray(input.requiredMasterData)
    ? input.requiredMasterData.map(normalizeMasterDataRef).filter(Boolean)
    : [];
  if (input.requiresMasterData !== false && requiredMasterData.length === 0) {
    return "blocked_missing_master_data";
  }

  return input.packet ? "packet_uploaded" : "ready_for_packet";
}

export function deriveOpeningConditionPilotPreflightReadiness(input = {}) {
  const basisReady = Boolean(normalizeBasisVersion(input.basisVersion));
  const requiredMasterData = Array.isArray(input.requiredMasterData)
    ? input.requiredMasterData.map(normalizeMasterDataRef).filter(Boolean)
    : [];
  const requiresMasterData = input.requiresMasterData !== false;
  const masterDataReady = !requiresMasterData || requiredMasterData.length > 0;
  const knowledgeBaseRef = normalizeKnowledgeBaseRef(input.knowledgeBaseRef, input.context?.workspaceId);
  const providerSyncStatus = knowledgeBaseRef?.providerSyncStatus;
  const providerBlocks =
    providerSyncStatus === "stale" || providerSyncStatus === "unreachable" || providerSyncStatus === "disabled";
  const knowledgeBaseReady = knowledgeBaseRef?.status === "ready" && !providerBlocks;
  const knowledgeBaseState = !knowledgeBaseRef
    ? "missing"
    : knowledgeBaseRef.status !== "ready"
      ? "provisional"
      : providerSyncStatus === "stale"
        ? "stale"
        : providerSyncStatus === "unreachable"
          ? "unreachable"
          : providerSyncStatus === "disabled"
            ? "blocked"
            : providerSyncStatus === "provisional"
              ? "provisional"
              : "ready";
  const packetReady = Boolean(input.packet);
  const blockingReasons = [];

  if (!basisReady) {
    blockingReasons.push("published_basis_required");
  }
  if (!masterDataReady) {
    blockingReasons.push("published_master_data_required");
  }
  if (!knowledgeBaseReady) {
    blockingReasons.push("subcontract_knowledge_base_required");
    if (providerSyncStatus === "stale") {
      blockingReasons.push("subcontract_knowledge_base_provider_stale");
    }
    if (providerSyncStatus === "unreachable") {
      blockingReasons.push("subcontract_knowledge_base_provider_unreachable");
    }
    if (providerSyncStatus === "disabled") {
      blockingReasons.push("subcontract_knowledge_base_provider_disabled");
    }
  }

  const status = blockingReasons.length === 0 ? "ready" : packetReady ? "blocked" : "provisional";
  const nextAction = !basisReady
    ? "确认并发布判定依据版本。"
    : !masterDataReady
      ? "确认并发布项目人员、设备、证照、单位或制度资料主数据。"
      : !knowledgeBaseReady
        ? providerSyncStatus === "stale"
          ? "刷新组织/分包队伍专属知识库外部索引。"
          : providerSyncStatus === "unreachable"
            ? "恢复知识库 provider 连通性后再执行正式资料核查。"
            : "绑定组织/分包队伍专属知识库。"
        : packetReady
          ? "可以执行正式资料核查。"
          : "上传开工条件核查表和资料包。";

  return sanitizeOpeningConditionPilotValue({
    status,
    basis: basisReady ? "ready" : "missing",
    masterData: masterDataReady ? "ready" : "missing",
    knowledgeBase: knowledgeBaseState,
    materialPacket: packetReady ? "ready" : "missing",
    blockingReasons,
    nextAction,
  });
}

export function normalizeOpeningConditionPilotTask(value) {
  if (!isPlainObject(value)) {
    return null;
  }

  const id = normalizeString(value.id, "", 180);
  const context = normalizeWorkspaceContext(value.context);
  if (!id || !context) {
    return null;
  }

  const state = normalizeState(value.state, deriveInitialState(value));
  const now = new Date().toISOString();
  const requiredMasterData = Array.isArray(value.requiredMasterData)
    ? value.requiredMasterData.map(normalizeMasterDataRef).filter(Boolean)
    : [];
  const events = Array.isArray(value.events)
    ? value.events
        .slice(-MAX_EVENTS_PER_TASK)
        .map((event, index) => normalizeEvent(event, id, index + 1))
        .filter(Boolean)
    : [];

  const knowledgeBaseRef = normalizeKnowledgeBaseRef(value.knowledgeBaseRef, context.workspaceId);
  const packet = normalizePacket(value.packet, id, context.workspaceId);
  const normalizedTask = {
    id,
    context,
    state,
    basisVersion: normalizeBasisVersion(value.basisVersion),
    requiredMasterData,
    knowledgeBaseRef,
    packet,
    checkItems: Array.isArray(value.checkItems)
      ? value.checkItems.map((item) => normalizeCheckItem(item, id)).filter(Boolean)
      : [],
    evidence: Array.isArray(value.evidence)
      ? value.evidence.map((item) => normalizeEvidence(item, id)).filter(Boolean)
      : [],
    humanReviewQueue: Array.isArray(value.humanReviewQueue)
      ? value.humanReviewQueue.map((item) => normalizeHumanReviewItem(item, id)).filter(Boolean)
      : [],
    reportAsset: normalizeReportAsset(value.reportAsset, id),
    events,
    createdAt: normalizeString(value.createdAt, now, 80),
    updatedAt: normalizeString(value.updatedAt, now, 80),
  };

  return sanitizeOpeningConditionPilotValue({
    ...normalizedTask,
    preflightReadiness: deriveOpeningConditionPilotPreflightReadiness(normalizedTask),
  });
}

function normalizeSnapshot(value) {
  if (!isPlainObject(value)) {
    return {
      schemaVersion: STORAGE_VERSION,
      tasks: [],
      basisVersions: [],
      masterDataRecords: [],
      knowledgeBases: [],
    };
  }

  const tasks = Array.isArray(value.tasks)
    ? value.tasks
        .map(normalizeOpeningConditionPilotTask)
        .filter(Boolean)
        .sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)))
        .slice(0, MAX_TASKS)
    : [];
  const basisVersions = Array.isArray(value.basisVersions)
    ? value.basisVersions.map((item) => normalizeBasisRecord(item)).filter(Boolean).slice(0, 300)
    : [];
  const masterDataRecords = Array.isArray(value.masterDataRecords)
    ? value.masterDataRecords.map((item) => normalizeMasterDataRecord(item)).filter(Boolean).slice(0, 1000)
    : [];
  const knowledgeBases = Array.isArray(value.knowledgeBases)
    ? value.knowledgeBases
        .map((item) => normalizeKnowledgeBaseRecord(item))
        .filter(Boolean)
        .slice(0, MAX_KNOWLEDGE_BASE_RECORDS)
    : [];

  return {
    schemaVersion: STORAGE_VERSION,
    tasks,
    basisVersions,
    masterDataRecords,
    knowledgeBases,
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
        basisVersions: [],
        masterDataRecords: [],
        knowledgeBases: [],
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
  const operation = writeQueue.then(async () => {
    const snapshot = await readSnapshot(storePath);
    const result = await mutator(snapshot);
    const nextSnapshot = result?.snapshot ?? snapshot;
    await writeSnapshot(nextSnapshot, storePath);
    return result?.value;
  });
  writeQueue = operation.catch(() => undefined);
  return operation;
}

export async function listOpeningConditionPilotTasks(options = {}) {
  return readSnapshot(options.storePath);
}

export async function listOpeningConditionPilotBasisVersions(workspaceId, options = {}) {
  const snapshot = await readSnapshot(options.storePath);
  return {
    ok: true,
    workspaceId,
    basisVersions: snapshot.basisVersions.filter((item) => item.workspaceId === workspaceId),
  };
}

export async function upsertOpeningConditionPilotBasisVersion(workspaceId, basisId, input, options = {}) {
  const normalized = normalizeBasisRecord(
    {
      ...input,
      id: basisId,
      workspaceId,
    },
    workspaceId,
  );

  if (!normalized) {
    return {
      ok: false,
      status: "invalid_input",
      message: "A valid opening-condition basis version is required.",
    };
  }

  return mutateSnapshot((snapshot) => ({
    snapshot: {
      ...snapshot,
      basisVersions: [
        normalized,
        ...snapshot.basisVersions.filter((item) => !(item.workspaceId === workspaceId && item.id === basisId)),
      ],
    },
    value: {
      ok: true,
      basisVersion: normalized,
    },
  }), options.storePath);
}

export async function publishOpeningConditionPilotBasisVersion(workspaceId, basisId, input = {}, options = {}) {
  return mutateSnapshot((snapshot) => {
    const index = snapshot.basisVersions.findIndex((item) => item.workspaceId === workspaceId && item.id === basisId);
    if (index < 0) {
      return {
        snapshot,
        value: {
          ok: false,
          status: "not_found",
          message: "Opening-condition basis version not found.",
        },
      };
    }

    const now = new Date().toISOString();
    const nextBasisVersions = snapshot.basisVersions.map((item, itemIndex) => {
      if (item.workspaceId !== workspaceId) {
        return item;
      }

      if (itemIndex === index) {
        return normalizeBasisRecord({
          ...item,
          status: "published",
          confirmedBy: input.confirmedBy ?? item.confirmedBy ?? input.actorId,
          confirmedAt: item.confirmedAt ?? now,
          publishedBy: input.publishedBy ?? input.actorId ?? item.publishedBy,
          publishedAt: now,
          safeNote: input.safeNote ?? item.safeNote,
        });
      }

      return item.status === "published"
        ? normalizeBasisRecord({
            ...item,
            status: "superseded",
          })
        : item;
    });

    return {
      snapshot: {
        ...snapshot,
        basisVersions: nextBasisVersions,
      },
      value: {
        ok: true,
        basisVersion: nextBasisVersions[index],
      },
    };
  }, options.storePath);
}

export async function listOpeningConditionPilotMasterData(workspaceId, options = {}) {
  const snapshot = await readSnapshot(options.storePath);
  return {
    ok: true,
    workspaceId,
    masterDataRecords: snapshot.masterDataRecords.filter((item) => item.workspaceId === workspaceId),
  };
}

export async function upsertOpeningConditionPilotMasterDataRecord(workspaceId, recordId, input, options = {}) {
  const normalized = normalizeMasterDataRecord(
    {
      ...input,
      id: recordId,
      workspaceId,
    },
    workspaceId,
  );

  if (!normalized) {
    return {
      ok: false,
      status: "invalid_input",
      message: "A valid opening-condition master-data record is required.",
    };
  }

  return mutateSnapshot((snapshot) => ({
    snapshot: {
      ...snapshot,
      masterDataRecords: [
        normalized,
        ...snapshot.masterDataRecords.filter((item) => !(item.workspaceId === workspaceId && item.id === recordId)),
      ],
    },
    value: {
      ok: true,
      masterDataRecord: normalized,
    },
  }), options.storePath);
}

export async function decideOpeningConditionPilotMasterDataRecord(workspaceId, recordId, input = {}, options = {}) {
  const nextStatus = input.decision === "reject" ? "rejected" : input.decision === "approve" ? "human_approved" : "published";
  return mutateSnapshot((snapshot) => {
    const index = snapshot.masterDataRecords.findIndex((item) => item.workspaceId === workspaceId && item.id === recordId);
    if (index < 0) {
      return {
        snapshot,
        value: {
          ok: false,
          status: "not_found",
          message: "Opening-condition master-data record not found.",
        },
      };
    }

    const now = new Date().toISOString();
    const nextRecord = normalizeMasterDataRecord({
      ...snapshot.masterDataRecords[index],
      status: nextStatus,
      confirmedBy: input.actorId ?? input.confirmedBy ?? snapshot.masterDataRecords[index].confirmedBy,
      confirmedAt: snapshot.masterDataRecords[index].confirmedAt ?? now,
      publishedBy: nextStatus === "published" || nextStatus === "human_approved" ? input.actorId ?? input.publishedBy : undefined,
      publishedAt: nextStatus === "published" || nextStatus === "human_approved" ? now : undefined,
      rejectionReason: nextStatus === "rejected" ? input.safeNote ?? input.rejectionReason : undefined,
      safeNote: input.safeNote ?? snapshot.masterDataRecords[index].safeNote,
    });
    const nextRecords = [...snapshot.masterDataRecords];
    nextRecords[index] = nextRecord;

    return {
      snapshot: {
        ...snapshot,
        masterDataRecords: nextRecords,
      },
      value: {
        ok: true,
        masterDataRecord: nextRecord,
      },
    };
  }, options.storePath);
}

export async function listOpeningConditionPilotKnowledgeBases(workspaceId, options = {}) {
  const snapshot = await readSnapshot(options.storePath);
  return {
    ok: true,
    workspaceId,
    knowledgeBases: snapshot.knowledgeBases.filter((item) => item.workspaceId === workspaceId),
  };
}

export async function upsertOpeningConditionPilotKnowledgeBase(workspaceId, knowledgeBaseId, input, options = {}) {
  const normalized = normalizeKnowledgeBaseRecord(
    {
      ...input,
      id: knowledgeBaseId,
      workspaceId,
      updatedAt: new Date().toISOString(),
    },
    workspaceId,
  );

  if (!normalized) {
    return {
      ok: false,
      status: "invalid_input",
      message: "A valid opening-condition subcontract knowledge base is required.",
    };
  }

  return mutateSnapshot((snapshot) => ({
    snapshot: {
      ...snapshot,
      knowledgeBases: [
        normalized,
        ...snapshot.knowledgeBases.filter((item) => !(item.workspaceId === workspaceId && item.id === knowledgeBaseId)),
      ],
    },
    value: {
      ok: true,
      knowledgeBase: normalized,
    },
  }), options.storePath);
}

export async function bindOpeningConditionPilotKnowledgeBase(taskId, knowledgeBaseId, options = {}) {
  return mutateSnapshot((snapshot) => {
    const taskIndex = snapshot.tasks.findIndex((task) => task.id === taskId);
    if (taskIndex < 0) {
      return {
        snapshot,
        value: {
          ok: false,
          status: "not_found",
          message: "Opening-condition pilot task not found.",
        },
      };
    }

    const existingTask = snapshot.tasks[taskIndex];
    const knowledgeBase = snapshot.knowledgeBases.find(
      (item) => item.workspaceId === existingTask.context.workspaceId && item.id === knowledgeBaseId,
    );
    if (!knowledgeBase) {
      return {
        snapshot,
        value: {
          ok: false,
          status: "not_found",
          message: "Opening-condition subcontract knowledge base not found.",
        },
      };
    }

    const now = new Date().toISOString();
    const nextTask = normalizeOpeningConditionPilotTask({
      ...existingTask,
      knowledgeBaseRef: knowledgeBase,
      updatedAt: now,
    });
    const nextTasks = [...snapshot.tasks];
    nextTasks[taskIndex] = nextTask;

    return {
      snapshot: {
        ...snapshot,
        tasks: nextTasks,
      },
      value: {
        ok: true,
        task: nextTask,
        knowledgeBase,
        preflightReadiness: nextTask.preflightReadiness,
      },
    };
  }, options.storePath);
}

export async function getOpeningConditionPilotTask(taskId, options = {}) {
  const snapshot = await readSnapshot(options.storePath);
  return snapshot.tasks.find((task) => task.id === taskId) ?? null;
}

export async function getOpeningConditionPilotTaskReadiness(taskId, options = {}) {
  const task = await getOpeningConditionPilotTask(taskId, options);
  if (!task) {
    return {
      ok: false,
      status: "not_found",
      message: "Opening-condition pilot task not found.",
    };
  }

  return {
    ok: true,
    taskId: task.id,
    workspaceId: task.context.workspaceId,
    state: task.state,
    preflightReadiness: deriveOpeningConditionPilotPreflightReadiness(task),
    knowledgeBaseRef: task.knowledgeBaseRef,
  };
}

function sortByPublishedAtDesc(left, right) {
  return String(right.publishedAt ?? "").localeCompare(String(left.publishedAt ?? ""));
}

function getPublishedBasisRecord(snapshot, workspaceId, basisVersionId = "") {
  const publishedRecords = snapshot.basisVersions
    .filter((item) => item.workspaceId === workspaceId && item.status === "published")
    .sort(sortByPublishedAtDesc);

  if (basisVersionId) {
    return publishedRecords.find((item) => item.id === basisVersionId) ?? null;
  }

  return publishedRecords[0] ?? null;
}

function toTaskBasisVersionRef(basisRecord) {
  if (!basisRecord) {
    return undefined;
  }

  return normalizeBasisVersion({
    ...basisRecord,
    status: "published",
    sourceObject: basisRecord.sourceObject,
    evidenceRefs: basisRecord.evidenceRefs,
  });
}

function getApprovedWorkspaceMasterDataRecords(snapshot, workspaceId) {
  return snapshot.masterDataRecords.filter(
    (item) =>
      item.workspaceId === workspaceId && (item.status === "published" || item.status === "human_approved"),
  );
}

function toTaskMasterDataRef(record) {
  return normalizeMasterDataRef({
    id: record.id,
    workspaceId: record.workspaceId,
    type: record.type,
    status: record.status,
    label: record.label,
  });
}

function resolveRequiredMasterDataForIntake(snapshot, workspaceId, requiredMasterDataIds = []) {
  const requestedIds = normalizeStringList(requiredMasterDataIds, 200, 180);
  const approvedWorkspaceRecords = getApprovedWorkspaceMasterDataRecords(snapshot, workspaceId);
  const recordMap = new Map(approvedWorkspaceRecords.map((item) => [item.id, item]));
  const selectedRecords =
    requestedIds.length > 0
      ? requestedIds.map((id) => recordMap.get(id)).filter(Boolean)
      : approvedWorkspaceRecords;
  const boundRefs = selectedRecords.map(toTaskMasterDataRef).filter(Boolean);
  const missingIds = requestedIds.filter((id) => !recordMap.has(id));

  return {
    requestedIds,
    approvedWorkspaceCount: approvedWorkspaceRecords.length,
    boundRefs,
    missingIds,
  };
}

function resolveKnowledgeBaseForIntake(snapshot, workspaceId, requestedKnowledgeBaseId = "", existingKnowledgeBaseId = "") {
  const workspaceKnowledgeBases = snapshot.knowledgeBases
    .filter((item) => item.workspaceId === workspaceId)
    .map((item) => normalizeKnowledgeBaseRecord(item, workspaceId))
    .filter(Boolean);
  const readyKnowledgeBases = workspaceKnowledgeBases.filter((item) => isKnowledgeBaseReadyForFormalReview(item));

  if (requestedKnowledgeBaseId) {
    const selected = workspaceKnowledgeBases.find((item) => item.id === requestedKnowledgeBaseId);
    return {
      knowledgeBaseRef: selected ? normalizeKnowledgeBaseRef(selected, workspaceId) : undefined,
      resolution: selected ? "bound_from_input" : "knowledge_base_not_found",
      selectedKnowledgeBaseId: selected?.id,
    };
  }

  if (existingKnowledgeBaseId) {
    const existing = workspaceKnowledgeBases.find((item) => item.id === existingKnowledgeBaseId);
    if (existing) {
      return {
        knowledgeBaseRef: normalizeKnowledgeBaseRef(existing, workspaceId),
        resolution: "bound_from_existing_task",
        selectedKnowledgeBaseId: existing.id,
      };
    }
  }

  if (readyKnowledgeBases.length === 1) {
    return {
      knowledgeBaseRef: normalizeKnowledgeBaseRef(readyKnowledgeBases[0], workspaceId),
      resolution: "auto_bound_single_ready",
      selectedKnowledgeBaseId: readyKnowledgeBases[0].id,
    };
  }

  if (readyKnowledgeBases.length > 1) {
    return {
      knowledgeBaseRef: undefined,
      resolution: "multiple_ready_candidates",
      selectedKnowledgeBaseId: undefined,
    };
  }

  return {
    knowledgeBaseRef: undefined,
    resolution: existingKnowledgeBaseId ? "knowledge_base_not_found" : "no_ready_candidate",
    selectedKnowledgeBaseId: undefined,
  };
}

function buildPilotPacketFromIntakeInput(taskId, context, input = {}) {
  return normalizePacket(
    {
      id: input.packetId ?? `${taskId}-packet`,
      checklistObject: input.checklistObject,
      sourceObjects: Array.isArray(input.sourceObjects) ? input.sourceObjects : [],
      submittedBy: input.submittedBy,
      submittedAt: input.submittedAt,
    },
    taskId,
    context.workspaceId,
  );
}

function createPilotIntakeEvent(taskId, sequence, type, state, message, progress, safeDiagnostics = {}) {
  return normalizeEvent(
    {
      id: `oc-event-${taskId}-${sequence}`,
      taskId,
      sequence,
      type,
      state,
      occurredAt: new Date().toISOString(),
      message,
      progress,
      safeDiagnostics,
    },
    taskId,
    sequence,
  );
}

export async function initializeOpeningConditionPilotTaskIntake(input = {}, options = {}) {
  const taskId = normalizeString(input.taskId, "", 180);
  const context = normalizeWorkspaceContext(input.context);
  const errors = [];

  if (!taskId) {
    errors.push("taskId is required");
  }

  if (!context) {
    errors.push("workspace context with workspaceId, tenantId, projectId, contractPackageId, and participatingOrganizationId is required");
  }

  const packet = context ? buildPilotPacketFromIntakeInput(taskId, context, input) : undefined;
  if (!packet) {
    errors.push("intake packet must include checklistObject with objectId and fileName");
  }

  if (errors.length > 0) {
    return {
      ok: false,
      status: "invalid_input",
      message: "A valid opening-condition intake/init request is required.",
      errors,
    };
  }

  return mutateSnapshot((snapshot) => {
    const existingTask = snapshot.tasks.find((task) => task.id === taskId) ?? null;
    if (existingTask && terminalStates.has(existingTask.state)) {
      return {
        snapshot,
        value: {
          ok: false,
          status: "invalid_state",
          message: `Cannot reinitialize opening-condition pilot task while task is ${existingTask.state}.`,
        },
      };
    }

    const basisRecord = getPublishedBasisRecord(snapshot, context.workspaceId, normalizeString(input.basisVersionId, "", 180));
    const basisVersion = basisRecord ? toTaskBasisVersionRef(basisRecord) : undefined;
    const basisResolution = basisRecord
      ? "bound_from_workspace"
      : input.basisVersionId
        ? "basis_not_found"
        : "basis_missing";

    const masterDataResolution = resolveRequiredMasterDataForIntake(
      snapshot,
      context.workspaceId,
      Array.isArray(input.requiredMasterDataIds) ? input.requiredMasterDataIds : [],
    );

    const knowledgeBaseResolution = resolveKnowledgeBaseForIntake(
      snapshot,
      context.workspaceId,
      normalizeString(input.knowledgeBaseId, "", 180),
      existingTask?.knowledgeBaseRef?.id ?? "",
    );

    const nextTaskState = deriveInitialState(
      {
        context,
        basisVersion,
        requiredMasterData: masterDataResolution.boundRefs,
        knowledgeBaseRef: knowledgeBaseResolution.knowledgeBaseRef,
        packet,
      },
      existingTask?.state ?? "draft",
    );
    const now = new Date().toISOString();
    const existingEvents = existingTask?.events ?? [];
    const startSequence = existingEvents.length + 1;
    const intakeDiagnostics = {
      basisResolution,
      selectedBasisVersionId: basisVersion?.id,
      boundBasisSourceObject: Boolean(basisVersion?.sourceObject),
      masterDataResolution: {
        requestedIds: masterDataResolution.requestedIds,
        approvedWorkspaceCount: masterDataResolution.approvedWorkspaceCount,
        boundCount: masterDataResolution.boundRefs.length,
        missingIds: masterDataResolution.missingIds,
      },
      knowledgeBaseResolution: knowledgeBaseResolution.resolution,
      selectedKnowledgeBaseId: knowledgeBaseResolution.selectedKnowledgeBaseId,
      packetObjectCount: packet.sourceObjects.length,
    };
    const intakeEvent = createPilotIntakeEvent(
      taskId,
      startSequence,
      existingTask ? "task.intake_initialized" : "task.created",
      nextTaskState,
      existingTask ? "开工条件试点任务已重新初始化。" : "开工条件试点任务已初始化。",
      5,
      {
        basisResolution,
        knowledgeBaseResolution: knowledgeBaseResolution.resolution,
        boundMasterDataCount: masterDataResolution.boundRefs.length,
        missingMasterDataIds: masterDataResolution.missingIds,
      },
    );
    const packetEvent = createPilotIntakeEvent(
      taskId,
      startSequence + 1,
      "packet.uploaded",
      nextTaskState,
      `资料包已接收，包含 ${packet.sourceObjects.length} 个资料对象。`,
      nextTaskState === "packet_uploaded" ? 15 : 10,
      {
        checklistFileName: packet.checklistObject.fileName,
        sourceObjectCount: packet.sourceObjects.length,
        sourceFileNames: packet.sourceObjects.map((item) => item.fileName).slice(0, 30),
      },
    );

    const nextTask = normalizeOpeningConditionPilotTask({
      ...existingTask,
      id: taskId,
      context,
      state: nextTaskState,
      basisVersion,
      requiredMasterData: masterDataResolution.boundRefs,
      knowledgeBaseRef: knowledgeBaseResolution.knowledgeBaseRef,
      packet,
      checkItems: [],
      evidence: [],
      humanReviewQueue: [],
      reportAsset: undefined,
      createdAt: existingTask?.createdAt ?? now,
      updatedAt: now,
      events: [...existingEvents, intakeEvent, packetEvent],
    });
    const nextTasks = [nextTask, ...snapshot.tasks.filter((task) => task.id !== taskId)].slice(0, MAX_TASKS);

    return {
      snapshot: {
        ...snapshot,
        tasks: nextTasks,
      },
      value: {
        ok: true,
        task: nextTask,
        packet: nextTask.packet,
        preflightReadiness: nextTask.preflightReadiness,
        intake: intakeDiagnostics,
      },
    };
  }, options.storePath);
}

export async function upsertOpeningConditionPilotTask(taskId, input, options = {}) {
  const validation = validateOpeningConditionPilotTaskInput({ ...input, id: taskId });
  if (!validation.ok) {
    return {
      ok: false,
      status: "invalid_input",
      message: "A valid opening-condition pilot task is required.",
      errors: validation.errors,
    };
  }

  const normalized = normalizeOpeningConditionPilotTask({
    ...input,
    id: taskId,
    updatedAt: input.updatedAt ?? new Date().toISOString(),
  });

  if (!normalized) {
    return {
      ok: false,
      status: "invalid_input",
      message: "A valid opening-condition pilot task is required.",
      errors: ["task could not be normalized"],
    };
  }

  await mutateSnapshot((snapshot) => ({
    snapshot: {
      ...snapshot,
      schemaVersion: STORAGE_VERSION,
      tasks: [normalized, ...snapshot.tasks.filter((task) => task.id !== taskId)].slice(0, MAX_TASKS),
    },
    value: normalized,
  }), options.storePath);

  return {
    ok: true,
    task: normalized,
  };
}

export async function transitionOpeningConditionPilotTask(taskId, toState, event = {}, options = {}) {
  if (!stateSet.has(toState)) {
    return {
      ok: false,
      status: "invalid_state",
      message: "Unknown opening-condition pilot task state.",
    };
  }

  return mutateSnapshot((snapshot) => {
    const index = snapshot.tasks.findIndex((task) => task.id === taskId);
    if (index < 0) {
      return {
        snapshot,
        value: {
          ok: false,
          status: "not_found",
          message: "Opening-condition pilot task not found.",
        },
      };
    }

    const existingTask = snapshot.tasks[index];
    if (!canTransitionOpeningConditionPilotTask(existingTask.state, toState)) {
      return {
        snapshot,
        value: {
          ok: false,
          status: "invalid_transition",
          message: `Cannot transition opening-condition pilot task from ${existingTask.state} to ${toState}.`,
        },
      };
    }

    const sequence = existingTask.events.length + 1;
    const occurredAt = event.occurredAt ?? new Date().toISOString();
    const normalizedEvent = normalizeEvent(
      {
        ...event,
        taskId,
        sequence,
        state: toState,
        occurredAt,
      },
      taskId,
      sequence,
    );
    const nextTask = normalizeOpeningConditionPilotTask({
      ...existingTask,
      state: toState,
      updatedAt: occurredAt,
      events: [...existingTask.events, normalizedEvent].slice(-MAX_EVENTS_PER_TASK),
    });
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
        event: normalizedEvent,
      },
    };
  }, options.storePath);
}

export async function intakeOpeningConditionPilotPacket(taskId, input = {}, options = {}) {
  return mutateSnapshot((snapshot) => {
    const index = snapshot.tasks.findIndex((task) => task.id === taskId);
    if (index < 0) {
      return {
        snapshot,
        value: {
          ok: false,
          status: "not_found",
          message: "Opening-condition pilot task not found.",
        },
      };
    }

    const existingTask = snapshot.tasks[index];
    const packet = normalizePacket(input.packet ?? input, taskId, existingTask.context.workspaceId);
    if (!packet) {
      return {
        snapshot,
        value: {
          ok: false,
          status: "invalid_input",
          message: "Packet intake requires a checklistObject and bounded source object references.",
        },
      };
    }

    if (!canTransitionOpeningConditionPilotTask(existingTask.state, "packet_uploaded")) {
      return {
        snapshot,
        value: {
          ok: false,
          status: "invalid_transition",
          message: `Cannot attach packet while task is ${existingTask.state}.`,
        },
      };
    }

    const sequence = existingTask.events.length + 1;
    const occurredAt = new Date().toISOString();
    const event = normalizeEvent(
      {
        id: `oc-event-${taskId}-${sequence}`,
        taskId,
        sequence,
        type: "packet.uploaded",
        state: "packet_uploaded",
        occurredAt,
        message: input.message ?? `资料包已接收，包含 ${packet.sourceObjects.length} 个资料对象。`,
        progress: 15,
        safeDiagnostics: {
          checklistFileName: packet.checklistObject.fileName,
          sourceObjectCount: packet.sourceObjects.length,
          sourceFileNames: packet.sourceObjects.map((item) => item.fileName).slice(0, 30),
        },
      },
      taskId,
      sequence,
    );

    const nextTask = normalizeOpeningConditionPilotTask({
      ...existingTask,
      state: "packet_uploaded",
      packet,
      updatedAt: occurredAt,
      events: [...existingTask.events, event],
    });
    const nextTasks = [...snapshot.tasks];
    nextTasks[index] = nextTask;

    return {
      snapshot: {
        ...snapshot,
        tasks: nextTasks,
      },
      value: {
        ok: true,
        task: nextTask,
        packet,
        event,
      },
    };
  }, options.storePath);
}

export async function runOpeningConditionPilotChecklistMatch(taskId, input = {}, options = {}) {
  return mutateSnapshot((snapshot) => {
    const index = snapshot.tasks.findIndex((task) => task.id === taskId);
    if (index < 0) {
      return {
        snapshot,
        value: {
          ok: false,
          status: "not_found",
          message: "Opening-condition pilot task not found.",
        },
      };
    }

    const existingTask = snapshot.tasks[index];
    if (!existingTask.packet) {
      return {
        snapshot,
        value: {
          ok: false,
          status: "missing_packet",
          message: "Checklist matching requires a submitted packet first.",
        },
      };
    }

    const preflightReadiness = deriveOpeningConditionPilotPreflightReadiness(existingTask);
    if (preflightReadiness.status !== "ready") {
      return {
        snapshot,
        value: {
          ok: false,
          status: "preflight_blocked",
          message: "Formal checklist matching requires published basis, required master data, and a ready subcontract knowledge base.",
          preflightReadiness,
        },
      };
    }

    if (!["packet_uploaded", "extracting", "matching", "awaiting_human_review"].includes(existingTask.state)) {
      return {
        snapshot,
        value: {
          ok: false,
          status: "invalid_state",
          message: `Cannot run checklist matching while task is ${existingTask.state}.`,
        },
      };
    }

    const checklistItems = Array.isArray(input.checklistItems)
      ? input.checklistItems.map(normalizeChecklistItem).filter(Boolean).slice(0, MAX_CHECKLIST_ITEMS)
      : [];
    if (checklistItems.length === 0) {
      return {
        snapshot,
        value: {
          ok: false,
          status: "invalid_input",
          message: "At least one checklist item is required for deterministic matching.",
        },
      };
    }

    const basisVersionId = existingTask.basisVersion?.id ?? "";
    const sourceObjects = existingTask.packet.sourceObjects;
    const evidence = [];
    const humanReviewQueue = [];
    const checkItems = checklistItems.map((item, itemIndex) => {
      if (isOutOfScopeChecklistItem(item)) {
        return {
          id: item.id,
          taskId,
          category: item.category,
          name: item.name,
          required: false,
          verdict: "warning",
          ruleExplanation: "该核查项属于当前试点不处理的现场、应急或非资料核查范围，未计入资料缺失。",
          semanticNote: "当前开工条件试点只处理可由资料包和已发布主数据支撑的资料核查项。",
          basisVersionId: item.basisVersionId || basisVersionId,
          evidenceIds: [],
          masterDataIds: item.masterDataIds,
          humanReviewIds: [],
          scopeStatus: "out_of_scope",
          documentPresence: "not_required",
          relevanceStatus: "not_applicable",
          contentCompliance: "not_evaluated",
          visualAssertions: [],
          finalDisposition: "not_applicable",
        };
      }

      const scoredMatches = sourceObjects
        .map((objectRef) => ({
          objectRef,
          score: getMatchScore(item, objectRef),
        }))
        .filter((match) => match.score > 0)
        .sort((left, right) => right.score - left.score);
      const bestScore = scoredMatches[0]?.score ?? 0;
      const topMatches = scoredMatches.filter((match) => match.score === bestScore).slice(0, 5);
      const ambiguous = topMatches.length > 1;
      const missing = topMatches.length === 0;
      const isResourceItem = isResourceChecklistItem(item);
      const authorizedMasterDataIds = getAuthorizedMasterDataIds(existingTask, item);
      const masterDataMissing = item.masterDataIds.some((masterDataId) => !authorizedMasterDataIds.includes(masterDataId));
      const masterDataAuthorizationMissing = isResourceItem
        ? item.masterDataIds.length === 0 || masterDataMissing
        : masterDataMissing;
      const itemEvidence = topMatches.map((match, matchIndex) => {
        const evidenceId = `ev-${item.id}-${matchIndex + 1}`;
        const evidenceRecord = {
          id: evidenceId,
          taskId,
          itemId: item.id,
          objectRef: match.objectRef,
          locator: "资料包文件清单",
          extractedValue: match.objectRef.summary ?? match.objectRef.fileName,
          confidence: ambiguous ? "medium" : "high",
          masterDataIds: item.masterDataIds,
        };
        evidence.push(evidenceRecord);
        return evidenceId;
      });
      const visualAssertions = buildVisualAssertions(item, topMatches, itemEvidence);
      const visualReviewRequired = visualAssertions.some((assertion) => assertion?.requiresHumanReview);
      const needsHumanReview = ambiguous || missing || masterDataAuthorizationMissing || visualReviewRequired;
      const documentPresence = missing ? "missing" : ambiguous ? "ambiguous" : "present";
      const relevanceStatus = missing ? "unconfirmed" : ambiguous ? "unconfirmed" : "matched";
      const contentCompliance = needsHumanReview
        ? masterDataAuthorizationMissing || visualReviewRequired || ambiguous
          ? "not_evaluated"
          : "non_compliant"
        : "compliant";
      const finalDisposition = needsHumanReview
        ? missing && item.required && !visualReviewRequired
          ? "fail"
          : masterDataAuthorizationMissing
            ? "blocked"
            : "needs_human_review"
        : "pass";
      const verdict =
        finalDisposition === "pass"
          ? "pass"
          : finalDisposition === "fail"
            ? "fail"
            : finalDisposition === "blocked"
              ? "blocked"
              : "needs_human_review";
      const humanReviewIds = [];
      if (needsHumanReview) {
        const reviewId = `hr-${item.id}`;
        humanReviewQueue.push({
          id: reviewId,
          taskId,
          targetType: "check_item",
          targetId: item.id,
          reason: missing
            ? "资料包中未找到稳定匹配文件。"
            : masterDataAuthorizationMissing
              ? isResourceItem
                ? "人员或设备资料已命中候选文件，但缺少合同边界下已发布或人工批准的项目主数据授权。"
                : "核查项引用的主数据尚未发布、人工批准或未绑定。"
              : visualReviewRequired
                ? "签名、盖章、勾选或日期等视觉要素存在性或清晰度不足，需要人工确认。"
                : "存在多个候选资料，需人工确认。",
          status: "open",
          evidenceIds: itemEvidence,
        });
        humanReviewIds.push(reviewId);
      }

      return {
        id: item.id,
        taskId,
        category: item.category,
        name: item.name,
        required: item.required,
        verdict,
        ruleExplanation: missing
          ? "确定性规则未在资料包文件名或摘要中命中所需资料。"
          : `确定性规则命中 ${topMatches.length} 个候选资料。`,
        semanticNote: buildSemanticNote(item, topMatches, verdict),
        basisVersionId: item.basisVersionId || basisVersionId,
        evidenceIds: itemEvidence,
        masterDataIds: item.masterDataIds,
        humanReviewIds,
        scopeStatus: "in_scope",
        documentPresence,
        relevanceStatus,
        contentCompliance,
        visualAssertions,
        finalDisposition,
      };
    });
    const finalState = humanReviewQueue.length > 0 ? "awaiting_human_review" : "report_ready";
    const startSequence = existingTask.events.length + 1;
    const events = [
      createMatchEvent(taskId, startSequence, "extraction.completed", "extracting", "资料包文件清单已归一化。", 35, {
        sourceObjectCount: sourceObjects.length,
      }),
      createMatchEvent(taskId, startSequence + 1, "matching.started", "matching", "开始按核查表执行确定性匹配。", 50, {
        checklistItemCount: checklistItems.length,
      }),
      createMatchEvent(
        taskId,
        startSequence + 2,
        finalState === "report_ready" ? "matching.completed" : "human_review.waiting",
        finalState,
        finalState === "report_ready" ? "核查项匹配完成，未发现阻塞人工复核项。" : "核查项匹配完成，存在待人工复核项。",
        finalState === "report_ready" ? 85 : 70,
        {
          checkItemCount: checkItems.length,
          evidenceCount: evidence.length,
          humanReviewCount: humanReviewQueue.length,
        },
      ),
    ];
    const nextTask = normalizeOpeningConditionPilotTask({
      ...existingTask,
      state: finalState,
      checkItems,
      evidence,
      humanReviewQueue,
      updatedAt: events[events.length - 1].occurredAt,
      events: [...existingTask.events, ...events],
    });
    const nextTasks = [...snapshot.tasks];
    nextTasks[index] = nextTask;

    return {
      snapshot: {
        ...snapshot,
        tasks: nextTasks,
      },
      value: {
        ok: true,
        task: nextTask,
        checkItems: nextTask.checkItems,
        evidence: nextTask.evidence,
        humanReviewQueue: nextTask.humanReviewQueue,
      },
    };
  }, options.storePath);
}

function isBlockingHumanReviewStatus(status) {
  return status === "open" || status === "deferred";
}

export async function listOpeningConditionPilotHumanReviewItems(taskId, options = {}) {
  const task = await getOpeningConditionPilotTask(taskId, options);
  if (!task) {
    return {
      ok: false,
      status: "not_found",
      message: "Opening-condition pilot task not found.",
    };
  }

  return {
    ok: true,
    taskId,
    workspaceId: task.context.workspaceId,
    humanReviewQueue: task.humanReviewQueue,
    blockingCount: task.humanReviewQueue.filter((item) => isBlockingHumanReviewStatus(item.status)).length,
  };
}

export async function decideOpeningConditionPilotHumanReviewItem(taskId, reviewId, input = {}, options = {}) {
  const allowedDecisions = new Set(["confirm", "correct", "reject", "defer"]);
  const decision = allowedDecisions.has(input.decision) ? input.decision : "";
  if (!decision) {
    return {
      ok: false,
      status: "invalid_input",
      message: "Human-review decision must be confirm, correct, reject, or defer.",
    };
  }

  return mutateSnapshot((snapshot) => {
    const taskIndex = snapshot.tasks.findIndex((task) => task.id === taskId);
    if (taskIndex < 0) {
      return {
        snapshot,
        value: {
          ok: false,
          status: "not_found",
          message: "Opening-condition pilot task not found.",
        },
      };
    }

    const existingTask = snapshot.tasks[taskIndex];
    const reviewIndex = existingTask.humanReviewQueue.findIndex((item) => item.id === reviewId);
    if (reviewIndex < 0) {
      return {
        snapshot,
        value: {
          ok: false,
          status: "not_found",
          message: "Opening-condition human-review item not found.",
        },
      };
    }

    const statusByDecision = {
      confirm: "confirmed",
      correct: "corrected",
      reject: "rejected",
      defer: "deferred",
    };
    const now = new Date().toISOString();
    const nextQueue = existingTask.humanReviewQueue.map((item, index) =>
      index === reviewIndex
        ? normalizeHumanReviewItem(
            {
              ...item,
              status: statusByDecision[decision],
              reviewerId: input.reviewerId ?? input.actorId ?? item.reviewerId,
              decidedAt: now,
              safeNote: input.safeNote ?? item.safeNote,
            },
            taskId,
          )
        : item,
    );
    const blockingCount = nextQueue.filter((item) => isBlockingHumanReviewStatus(item.status)).length;
    const nextState =
      existingTask.state === "awaiting_human_review" && blockingCount === 0 ? "report_ready" : existingTask.state;
    const sequence = existingTask.events.length + 1;
    const event = normalizeEvent(
      {
        id: `oc-event-${taskId}-${sequence}`,
        taskId,
        sequence,
        type: blockingCount === 0 ? "report.ready" : "human_review.waiting",
        state: nextState,
        occurredAt: now,
        message: blockingCount === 0 ? "阻塞人工复核项已处理，报告可生成。" : "人工复核决策已记录。",
        progress: blockingCount === 0 ? 85 : 75,
        safeDiagnostics: {
          reviewId,
          decision,
          blockingCount,
        },
      },
      taskId,
      sequence,
    );
    const nextTask = normalizeOpeningConditionPilotTask({
      ...existingTask,
      state: nextState,
      humanReviewQueue: nextQueue,
      updatedAt: now,
      events: [...existingTask.events, event],
    });
    const nextTasks = [...snapshot.tasks];
    nextTasks[taskIndex] = nextTask;

    return {
      snapshot: {
        ...snapshot,
        tasks: nextTasks,
      },
      value: {
        ok: true,
        task: nextTask,
        humanReviewItem: nextQueue[reviewIndex],
        blockingCount,
        event,
      },
    };
  }, options.storePath);
}

function summarizePilotCheckItems(checkItems) {
  return checkItems.reduce(
    (summary, item) => {
      summary.total += 1;
      if (item.verdict === "pass") summary.passed += 1;
      if (item.verdict === "fail") summary.failed += 1;
      if (item.verdict === "warning") summary.warnings += 1;
      if (item.verdict === "needs_human_review" || item.verdict === "blocked") summary.humanReview += 1;
      return summary;
    },
    {
      total: 0,
      passed: 0,
      failed: 0,
      warnings: 0,
      humanReview: 0,
    },
  );
}

export async function generateOpeningConditionPilotReport(taskId, input = {}, options = {}) {
  return mutateSnapshot((snapshot) => {
    const index = snapshot.tasks.findIndex((task) => task.id === taskId);
    if (index < 0) {
      return {
        snapshot,
        value: {
          ok: false,
          status: "not_found",
          message: "Opening-condition pilot task not found.",
        },
      };
    }

    const existingTask = snapshot.tasks[index];
    const blockingCount = existingTask.humanReviewQueue.filter((item) => isBlockingHumanReviewStatus(item.status)).length;
    if (blockingCount > 0) {
      return {
        snapshot,
        value: {
          ok: false,
          status: "human_review_blocking",
          message: "Blocking human-review items must be completed before report generation.",
          blockingCount,
        },
      };
    }

    if (!["report_ready", "archived"].includes(existingTask.state)) {
      return {
        snapshot,
        value: {
          ok: false,
          status: "invalid_state",
          message: `Cannot generate report while task is ${existingTask.state}.`,
        },
      };
    }

    const now = new Date().toISOString();
    const summary = summarizePilotCheckItems(existingTask.checkItems);
    const reportAsset = normalizeReportAsset(
      {
        id: input.id ?? `report-${taskId}`,
        taskId,
        title: input.title ?? "开工条件核查内部辅助意见",
        status: "ready",
        summary,
        objectRef: input.objectRef,
        disclaimer:
          input.disclaimer ??
          "本结果为平台智能辅助审查意见，不替代施工单位、监理单位及相关责任人的最终审核责任。",
        createdAt: now,
      },
      taskId,
    );
    const sequence = existingTask.events.length + 1;
    const event = normalizeEvent(
      {
        id: `oc-event-${taskId}-${sequence}`,
        taskId,
        sequence,
        type: "report.ready",
        state: "report_ready",
        occurredAt: now,
        message: "内部辅助报告摘要已生成。",
        progress: 90,
        safeDiagnostics: {
          reportId: reportAsset.id,
          summary,
          basisVersionId: existingTask.basisVersion?.id,
        },
      },
      taskId,
      sequence,
    );
    const nextTask = normalizeOpeningConditionPilotTask({
      ...existingTask,
      state: "report_ready",
      reportAsset,
      updatedAt: now,
      events: [...existingTask.events, event],
    });
    const nextTasks = [...snapshot.tasks];
    nextTasks[index] = nextTask;

    return {
      snapshot: {
        ...snapshot,
        tasks: nextTasks,
      },
      value: {
        ok: true,
        task: nextTask,
        reportAsset,
        event,
      },
    };
  }, options.storePath);
}

export async function archiveOpeningConditionPilotTask(taskId, input = {}, options = {}) {
  return mutateSnapshot((snapshot) => {
    const index = snapshot.tasks.findIndex((task) => task.id === taskId);
    if (index < 0) {
      return {
        snapshot,
        value: {
          ok: false,
          status: "not_found",
          message: "Opening-condition pilot task not found.",
        },
      };
    }

    const existingTask = snapshot.tasks[index];
    if (!existingTask.reportAsset) {
      return {
        snapshot,
        value: {
          ok: false,
          status: "missing_report",
          message: "A report asset is required before archiving.",
        },
      };
    }

    if (!canTransitionOpeningConditionPilotTask(existingTask.state, "archived")) {
      return {
        snapshot,
        value: {
          ok: false,
          status: "invalid_transition",
          message: `Cannot archive opening-condition pilot task from ${existingTask.state}.`,
        },
      };
    }

    const now = new Date().toISOString();
    const sequence = existingTask.events.length + 1;
    const archivedReport = normalizeReportAsset(
      {
        ...existingTask.reportAsset,
        status: "archived",
      },
      taskId,
    );
    const event = normalizeEvent(
      {
        id: `oc-event-${taskId}-${sequence}`,
        taskId,
        sequence,
        type: "task.archived",
        state: "archived",
        occurredAt: now,
        message: input.message ?? "开工条件核查试点任务已归档。",
        progress: 100,
        safeDiagnostics: {
          reportId: archivedReport.id,
          eventCount: existingTask.events.length + 1,
        },
      },
      taskId,
      sequence,
    );
    const nextTask = normalizeOpeningConditionPilotTask({
      ...existingTask,
      state: "archived",
      reportAsset: archivedReport,
      updatedAt: now,
      events: [...existingTask.events, event],
    });
    const nextTasks = [...snapshot.tasks];
    nextTasks[index] = nextTask;

    return {
      snapshot: {
        ...snapshot,
        tasks: nextTasks,
      },
      value: {
        ok: true,
        task: nextTask,
        reportAsset: archivedReport,
        event,
      },
    };
  }, options.storePath);
}

export function getOpeningConditionPilotStoreInfo() {
  return {
    schemaVersion: STORAGE_VERSION,
    maxTasks: MAX_TASKS,
    maxEventsPerTask: MAX_EVENTS_PER_TASK,
    store: "file-development",
  };
}
