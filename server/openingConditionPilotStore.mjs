import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { readDocumentObjectBuffer } from "./minioClient.mjs";
import { deriveOpeningConditionPilotChecklistDefinition } from "./openingConditionChecklistAdapter.mjs";
import { extractOpeningConditionZipManifestEntries } from "./openingConditionZipManifest.mjs";
import { normalizeProviderRefs } from "./providerContracts.mjs";

const STORAGE_VERSION = 1;
const MAX_TASKS = 100;
const MAX_EVENTS_PER_TASK = 300;
const MAX_OBJECTS_PER_PACKET = 200;
const MAX_PACKET_INVENTORY_ENTRIES = 500;
const MAX_CHECKLIST_ITEMS = 300;
const MAX_STRING_LENGTH = 2000;
const MAX_KNOWLEDGE_BASE_RECORDS = 300;
const MAX_KNOWLEDGE_BASE_ENTRIES = 200;
const MAX_BASIS_PREVIEW_TEXT_LENGTH = 4000;
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
const issueRiskLevelValues = new Set(["high", "medium", "low"]);
const visualAssertionTypes = new Set(["stamp", "signature", "checkbox", "handwritten_date", "seal", "other"]);
const visualAssertionStatuses = new Set(["detected", "missing", "uncertain", "confirmed", "rejected", "not_required"]);
const knowledgeBaseStatusValues = new Set(["draft", "ready", "needs_review", "archived"]);
const basisPreviewStatusValues = new Set(["needs_confirmation", "confirmed", "rejected", "published"]);

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

function normalizePacketInventoryEntry(value, index = 0, sourceObjectIds = new Set()) {
  if (!isPlainObject(value)) {
    return null;
  }

  const fileName = normalizeString(value.fileName ?? value.name, "", 240);
  if (!fileName) {
    return null;
  }

  const sourceObjectId = normalizeString(value.sourceObjectId, "", 180);
  return sanitizeOpeningConditionPilotValue({
    id: normalizeString(value.id, `packet-entry-${index + 1}`, 180),
    sourceObjectId: sourceObjectId && sourceObjectIds.has(sourceObjectId) ? sourceObjectId : undefined,
    fileName,
    relativePath: normalizeString(value.relativePath ?? value.path, "", 500) || undefined,
    summary: normalizeString(value.summary, "", 300) || undefined,
    sizeBytes: normalizeNumber(value.sizeBytes ?? value.size, 0, 1024 * 1024 * 1024) || undefined,
  });
}

function derivePacketInventoryEntryFromSourceObject(objectRef, index = 0) {
  return sanitizeOpeningConditionPilotValue({
    id: `packet-entry-${index + 1}`,
    sourceObjectId: objectRef.objectId,
    fileName: objectRef.fileName,
    relativePath: objectRef.fileName,
    summary: objectRef.summary,
    sizeBytes: objectRef.sizeBytes,
  });
}

function derivePacketInventoryEntriesFromSourceObjects(sourceObjects = []) {
  return sourceObjects.map((objectRef, index) => derivePacketInventoryEntryFromSourceObject(objectRef, index));
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
    ingestionPreview: normalizeBasisIngestionPreview(value.ingestionPreview, value) ?? undefined,
  });
}

function normalizeBasisPreviewFacts(value = {}) {
  if (!isPlainObject(value)) {
    return {};
  }

  return sanitizeOpeningConditionPilotValue({
    projectName: normalizeString(value.projectName, "", 240) || undefined,
    projectId: normalizeString(value.projectId, "", 180) || undefined,
    contractPackageId: normalizeString(value.contractPackageId, "", 180) || undefined,
    participatingOrganizationId: normalizeString(value.participatingOrganizationId, "", 180) || undefined,
    participantEntityName: normalizeString(value.participantEntityName, "", 240) || undefined,
    basisFileName: normalizeString(value.basisFileName, "", 240) || undefined,
    qualificationScope: normalizeString(value.qualificationScope, "", 500) || undefined,
    personnelScope: normalizeString(value.personnelScope, "", 500) || undefined,
    equipmentScope: normalizeString(value.equipmentScope, "", 500) || undefined,
    effectivePeriod: normalizeString(value.effectivePeriod, "", 240) || undefined,
    sourceSummary: normalizeString(value.sourceSummary, "", 500) || undefined,
  });
}

function normalizeBasisPreviewProvenance(value = {}, sourceObject = null) {
  if (!isPlainObject(value)) {
    return undefined;
  }

  return sanitizeOpeningConditionPilotValue({
    extractor: normalizeString(value.extractor, "deterministic_basis_preview_v1", 80),
    source: normalizeString(value.source, "metadata_only", 80),
    extractedAt: normalizeString(value.extractedAt, new Date().toISOString(), 80),
    sourceObjectId: normalizeString(value.sourceObjectId ?? sourceObject?.objectId, "", 180) || undefined,
    sourceFileName: normalizeString(value.sourceFileName ?? sourceObject?.fileName, "", 240) || undefined,
    sourceContentType: normalizeString(value.sourceContentType ?? sourceObject?.contentType, "", 120) || undefined,
    provider: normalizeString(value.provider, "", 80) || undefined,
    providerJobId: normalizeString(value.providerJobId ?? value.jobId, "", 180) || undefined,
    providerDocumentId: normalizeString(value.providerDocumentId ?? value.documentId, "", 180) || undefined,
    providerChunkId: normalizeString(value.providerChunkId ?? value.chunkId, "", 180) || undefined,
    providerScore: Number.isFinite(Number(value.providerScore ?? value.score))
      ? Math.max(0, Math.min(Number(value.providerScore ?? value.score), 1))
      : undefined,
    boundedTextLength: normalizeNumber(value.boundedTextLength, 0, MAX_BASIS_PREVIEW_TEXT_LENGTH),
    boundedTextExcerpt: normalizeString(value.boundedTextExcerpt, "", 500) || undefined,
    matchedSignals: normalizeStringList(value.matchedSignals, 20, 120),
  });
}

function getProviderPayloadValue(payload, aliases = []) {
  if (!isPlainObject(payload)) {
    return "";
  }

  for (const key of aliases) {
    const value = payload[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
    if (isPlainObject(value) && typeof value.value === "string" && value.value.trim()) {
      return value.value;
    }
  }

  const fields = Array.isArray(payload.fields) ? payload.fields : [];
  for (const field of fields) {
    if (!isPlainObject(field)) {
      continue;
    }
    const key = normalizeString(field.key ?? field.name ?? field.label ?? field.type, "", 120);
    if (aliases.some((alias) => key.toLowerCase() === alias.toLowerCase())) {
      return normalizeString(field.value ?? field.text ?? field.content, "", 500);
    }
  }

  const entities = Array.isArray(payload.entities) ? payload.entities : [];
  for (const entity of entities) {
    if (!isPlainObject(entity)) {
      continue;
    }
    const key = normalizeString(entity.key ?? entity.name ?? entity.label ?? entity.type, "", 120);
    if (aliases.some((alias) => key.toLowerCase() === alias.toLowerCase())) {
      return normalizeString(entity.value ?? entity.text ?? entity.content, "", 500);
    }
  }

  return "";
}

function normalizeProviderStructuredPreview(input = {}, sourceObject = null, context = {}) {
  const providerOutput = isPlainObject(input.providerOutput) ? input.providerOutput : isPlainObject(input.provider) ? input.provider : input;
  const factsPayload = isPlainObject(providerOutput.facts) ? providerOutput.facts : providerOutput;
  const summary =
    normalizeString(providerOutput.summary ?? providerOutput.safeSummary ?? providerOutput.excerpt, "", 500) ||
    normalizeString(sourceObject?.summary ?? sourceObject?.fileName, "", 500);
  const snippets = normalizeStringList(
    Array.isArray(providerOutput.snippets)
      ? providerOutput.snippets.map((item) => (isPlainObject(item) ? item.text ?? item.content ?? item.summary : item))
      : [providerOutput.snippet ?? providerOutput.safeSnippet ?? providerOutput.boundedText],
    5,
    240,
  );
  const safeExcerpt = snippets.join(" / ").slice(0, 500);

  const facts = normalizeBasisPreviewFacts({
    projectName: getProviderPayloadValue(factsPayload, ["projectName", "project_name", "工程名称", "项目名称"]),
    projectId:
      getProviderPayloadValue(factsPayload, ["projectId", "project_id", "projectCode", "project_code"]) ||
      context.projectId,
    contractPackageId:
      getProviderPayloadValue(factsPayload, [
        "contractPackageId",
        "contract_package_id",
        "contractPackage",
        "contract_package",
        "标段",
        "合同段",
      ]) || context.contractPackageId,
    participatingOrganizationId:
      getProviderPayloadValue(factsPayload, [
        "participatingOrganizationId",
        "participating_organization_id",
        "organizationId",
        "organization_id",
      ]) || context.participatingOrganizationId,
    participantEntityName: getProviderPayloadValue(factsPayload, [
      "participantEntityName",
      "participant_entity_name",
      "contractorName",
      "contractor_name",
      "subcontractorName",
      "subcontractor_name",
      "施工单位",
      "分包单位",
    ]),
    basisFileName: sourceObject?.fileName,
    qualificationScope: getProviderPayloadValue(factsPayload, [
      "qualificationScope",
      "qualification_scope",
      "contractScope",
      "contract_scope",
      "资质范围",
      "资质边界",
      "承包范围",
    ]),
    personnelScope: getProviderPayloadValue(factsPayload, [
      "personnelScope",
      "personnel_scope",
      "人员范围",
      "人员配置",
    ]),
    equipmentScope: getProviderPayloadValue(factsPayload, [
      "equipmentScope",
      "equipment_scope",
      "设备范围",
      "机械设备",
    ]),
    effectivePeriod: getProviderPayloadValue(factsPayload, [
      "effectivePeriod",
      "effective_period",
      "validity",
      "validUntil",
      "有效期",
      "有效期限",
    ]),
    sourceSummary: summary,
  });

  const missingFields = [];
  if (!facts.projectId) missingFields.push("projectId");
  if (!facts.contractPackageId) missingFields.push("contractPackageId");
  if (!facts.participatingOrganizationId) missingFields.push("participatingOrganizationId");
  if (!facts.participantEntityName) missingFields.push("participantEntityName");
  if (!facts.qualificationScope) missingFields.push("qualificationScope");
  if (!facts.personnelScope) missingFields.push("personnelScope");
  if (!facts.equipmentScope) missingFields.push("equipmentScope");
  if (!facts.effectivePeriod) missingFields.push("effectivePeriod");

  const providerScore = Number(providerOutput.score ?? providerOutput.confidenceScore);
  const confidence = ["high", "medium", "low"].includes(providerOutput.confidence)
    ? providerOutput.confidence
    : Number.isFinite(providerScore)
      ? providerScore >= 0.8
        ? "high"
        : providerScore >= 0.5
          ? "medium"
          : "low"
      : missingFields.length > 2
        ? "medium"
        : "high";
  const matchedSignals = Object.entries(facts)
    .filter(([, value]) => typeof value === "string" && value.trim())
    .map(([key]) => key)
    .slice(0, 20);

  return {
    facts,
    missingFields,
    confidence,
    factSummary:
      normalizeString(input.factSummary ?? providerOutput.factSummary, "", 600) ||
      `Provider preview derived from ${normalizeString(providerOutput.provider, "provider", 80)} output for ${sourceObject?.fileName ?? "basis source"}.`,
    provenance: normalizeBasisPreviewProvenance(
      {
        extractor: normalizeString(providerOutput.extractor, "provider_structured_preview_v1", 80),
        source: "provider_structured_output",
        provider: providerOutput.provider ?? input.providerName,
        providerJobId: providerOutput.jobId ?? input.providerJobId,
        providerDocumentId: providerOutput.documentId ?? input.providerDocumentId,
        providerChunkId: providerOutput.chunkId ?? input.providerChunkId,
        providerScore,
        sourceObjectId: sourceObject?.objectId,
        sourceFileName: sourceObject?.fileName,
        sourceContentType: sourceObject?.contentType,
        extractedAt: normalizeString(providerOutput.extractedAt ?? input.extractedAt, new Date().toISOString(), 80),
        boundedTextLength: safeExcerpt.length,
        boundedTextExcerpt: safeExcerpt,
        matchedSignals,
      },
      sourceObject,
    ),
  };
}

function escapeRegExp(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function firstTextMatch(text, patterns = []) {
  const source = normalizeString(text, "", MAX_BASIS_PREVIEW_TEXT_LENGTH);
  if (!source) {
    return "";
  }

  for (const pattern of patterns) {
    const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern, "i");
    const match = source.match(regex);
    if (match?.[1]) {
      return normalizeString(match[1], "", 240);
    }
  }

  return "";
}

function deriveBasisPreviewFactsFromSourceObject(sourceObject, context = {}, input = {}) {
  const safeText = normalizeString(
    input.previewText ?? input.boundedText ?? input.textSnippet ?? "",
    "",
    MAX_BASIS_PREVIEW_TEXT_LENGTH,
  );
  const sourceSummary = normalizeString(sourceObject?.summary, "", 500) || normalizeString(sourceObject?.fileName, "", 240);
  const projectName =
    firstTextMatch(safeText, [
      /项目名称[：:\s]+([^\n\r;；。]{2,80})/,
      /工程名称[：:\s]+([^\n\r;；。]{2,80})/,
      /项目[：:\s]+([^\n\r;；。]{2,80})/,
    ]) ||
    normalizeString(context.projectName, "", 240) ||
    normalizeString(context.projectId, "", 180) ||
    sourceSummary;
  const participantEntityName =
    firstTextMatch(safeText, [
      /施工单位[：:\s]+([^\n\r;；。]{2,80})/,
      /分包单位[：:\s]+([^\n\r;；。]{2,80})/,
      /参建单位[：:\s]+([^\n\r;；。]{2,80})/,
      /单位名称[：:\s]+([^\n\r;；。]{2,80})/,
    ]) ||
    normalizeString(context.participatingOrganizationName, "", 240) ||
    normalizeString(context.participatingOrganizationId, "", 180);
  const qualificationScope =
    firstTextMatch(safeText, [
      /资质边界[：:\s]+([^\n\r;；。]{2,120})/,
      /资质范围[：:\s]+([^\n\r;；。]{2,120})/,
      /合同主体[：:\s]+([^\n\r;；。]{2,120})/,
      /承包范围[：:\s]+([^\n\r;；。]{2,120})/,
    ]) ||
    normalizeString(input.qualificationScope, "", 500);
  const personnelScope =
    firstTextMatch(safeText, [
      /人员范围[：:\s]+([^\n\r;；。]{2,120})/,
      /人员配置[：:\s]+([^\n\r;；。]{2,120})/,
      /项目管理人员[：:\s]+([^\n\r;；。]{2,120})/,
    ]) ||
    normalizeString(input.personnelScope, "", 500);
  const equipmentScope =
    firstTextMatch(safeText, [
      /设备范围[：:\s]+([^\n\r;；。]{2,120})/,
      /机械设备[：:\s]+([^\n\r;；。]{2,120})/,
      /起重设备[：:\s]+([^\n\r;；。]{2,120})/,
    ]) ||
    normalizeString(input.equipmentScope, "", 500);
  const effectivePeriod =
    firstTextMatch(safeText, [
      /有效期[：:\s]+([^\n\r;；。]{2,80})/,
      /起止时间[：:\s]+([^\n\r;；。]{2,80})/,
      /有效期限[：:\s]+([^\n\r;；。]{2,80})/,
    ]) ||
    normalizeString(input.effectivePeriod, "", 240);

  const facts = normalizeBasisPreviewFacts({
    projectId: normalizeString(context.projectId, "", 180) || undefined,
    contractPackageId: normalizeString(context.contractPackageId, "", 180) || undefined,
    participatingOrganizationId: normalizeString(context.participatingOrganizationId, "", 180) || undefined,
    participantEntityName: participantEntityName || undefined,
    basisFileName: sourceObject?.fileName,
    qualificationScope: qualificationScope || undefined,
    personnelScope: personnelScope || undefined,
    equipmentScope: equipmentScope || undefined,
    effectivePeriod: effectivePeriod || undefined,
    sourceSummary,
  });

  const missingFields = [];
  if (!facts.projectId) missingFields.push("projectId");
  if (!facts.contractPackageId) missingFields.push("contractPackageId");
  if (!facts.participatingOrganizationId) missingFields.push("participatingOrganizationId");
  if (!facts.participantEntityName) missingFields.push("participantEntityName");
  if (!facts.qualificationScope) missingFields.push("qualificationScope");
  if (!facts.personnelScope) missingFields.push("personnelScope");
  if (!facts.equipmentScope) missingFields.push("equipmentScope");
  if (!facts.effectivePeriod) missingFields.push("effectivePeriod");

  const provenance = normalizeBasisPreviewProvenance(
    {
      extractor: "deterministic_basis_preview_v1",
      source: safeText ? "metadata_and_text" : "metadata_only",
      sourceObjectId: sourceObject?.objectId,
      sourceFileName: sourceObject?.fileName,
      sourceContentType: sourceObject?.contentType,
      extractedAt: new Date().toISOString(),
      boundedTextLength: safeText.length,
      boundedTextExcerpt: safeText.slice(0, 240),
      matchedSignals: [
        projectName && projectName !== sourceSummary ? "project_name" : "",
        participantEntityName ? "participant_entity" : "",
        qualificationScope ? "qualification_scope" : "",
        personnelScope ? "personnel_scope" : "",
        equipmentScope ? "equipment_scope" : "",
        effectivePeriod ? "effective_period" : "",
      ].filter(Boolean),
    },
    sourceObject,
  );

  return {
    facts,
    missingFields,
    confidence: safeText ? (missingFields.length > 2 ? "medium" : "high") : "medium",
    factSummary:
      normalizeString(
        input.previewFactSummary,
        "",
        600,
      ) ||
      `Basis preview derived from ${sourceObject?.fileName || "uploaded basis object"}${safeText ? " and bounded text" : ""}.`,
    provenance,
  };
}

function normalizeBasisIngestionPreview(value, basisRecord = {}) {
  const fallbackConfirmed = basisRecord.status === "confirmed" || basisRecord.status === "published";
  const preview = isPlainObject(value) ? value : {};
  const status = basisPreviewStatusValues.has(preview.status)
    ? preview.status
    : fallbackConfirmed
      ? basisRecord.status === "published"
        ? "published"
        : "confirmed"
      : "needs_confirmation";
  const sourceObject = normalizeObjectRef(preview.sourceObject ?? basisRecord.sourceObject);
  const facts = normalizeBasisPreviewFacts({
    ...(isPlainObject(preview.facts) ? preview.facts : {}),
    basisFileName: preview.facts?.basisFileName ?? sourceObject?.fileName,
  });
  const missingFields = normalizeStringList(preview.missingFields, 30, 120);
  const confidence = ["high", "medium", "low"].includes(preview.confidence)
    ? preview.confidence
    : ["high", "medium", "low"].includes(basisRecord.confidence)
      ? basisRecord.confidence
      : "medium";
  const factSummary = normalizeString(
    preview.factSummary,
    basisRecord.applicability || sourceObject?.summary || "Basis preview awaits human confirmation.",
    600,
  );
  const nextAction = normalizeString(
    preview.nextAction,
    status === "needs_confirmation"
      ? "Human-confirm the basis preview before publication."
      : status === "rejected"
        ? "Upload or correct the basis source before it can be published."
        : status === "published"
          ? "Basis preview has been published for formal matching."
          : "Publish the confirmed basis version before formal matching.",
    500,
  );
  const provenance = normalizeBasisPreviewProvenance(preview.provenance ?? basisRecord.ingestionPreview?.provenance, sourceObject);

  return sanitizeOpeningConditionPilotValue({
    status,
    source: normalizeString(preview.source, "operator_input", 80),
    sourceObject: sourceObject ?? undefined,
    facts,
    factSummary,
    missingFields,
    confidence,
    provenance,
    confirmedBy: normalizeString(preview.confirmedBy ?? basisRecord.confirmedBy, "", 160) || undefined,
    confirmedAt: normalizeString(preview.confirmedAt ?? basisRecord.confirmedAt, "", 80) || undefined,
    publishedBy: normalizeString(preview.publishedBy ?? basisRecord.publishedBy, "", 160) || undefined,
    publishedAt: normalizeString(preview.publishedAt ?? basisRecord.publishedAt, "", 80) || undefined,
    safeNote: normalizeString(preview.safeNote ?? basisRecord.safeNote, "", 500) || undefined,
    nextAction,
  });
}

function buildBasisIngestionPreviewFromSourceObject(sourceObject, context = {}, input = {}) {
  const extraction = deriveBasisPreviewFactsFromSourceObject(sourceObject, context, input);
  const facts =
    input.previewConfirmed === false
      ? extraction.facts
      : normalizeBasisPreviewFacts({
          ...extraction.facts,
          qualificationScope:
            extraction.facts.qualificationScope ??
            input.qualificationScope ??
            "Trial preview: qualification scope requires operator confirmation.",
          personnelScope:
            extraction.facts.personnelScope ??
            input.personnelScope ??
            "Trial preview: personnel scope requires operator confirmation.",
          equipmentScope:
            extraction.facts.equipmentScope ??
            input.equipmentScope ??
            "Trial preview: equipment scope requires operator confirmation.",
          effectivePeriod:
            extraction.facts.effectivePeriod ??
            input.effectivePeriod ??
            "Trial preview: effective period requires operator confirmation.",
        });

  return normalizeBasisIngestionPreview({
    status: input.previewConfirmed === false ? "needs_confirmation" : "confirmed",
    source: input.previewSource ?? (input.previewText ? "metadata_and_text" : "metadata_derived"),
    sourceObject,
    facts,
    factSummary:
      input.previewFactSummary ??
      extraction.factSummary ??
      `Basis preview derived from ${sourceObject?.fileName || "uploaded basis object"} for ${context.contractPackageId || "the current contract package"}.`,
    missingFields:
      input.previewConfirmed === false
        ? Array.isArray(input.previewMissingFields)
          ? input.previewMissingFields
          : extraction.missingFields
        : Array.isArray(input.previewMissingFields)
          ? input.previewMissingFields
          : [],
    confidence: input.previewConfidence ?? extraction.confidence ?? "medium",
    confirmedBy: input.previewConfirmed === false ? undefined : input.submittedBy,
    confirmedAt: input.previewConfirmed === false ? undefined : new Date().toISOString(),
    safeNote:
      input.previewSafeNote ??
      "Trial metadata preview. Production should replace this with OCR/provider extraction plus human confirmation.",
    provenance: extraction.provenance,
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
    ingestionPreview: normalizeBasisIngestionPreview(value.ingestionPreview, value),
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

function normalizePacket(value, taskId, workspaceId, options = {}) {
  if (!isPlainObject(value)) {
    return undefined;
  }

  const id = normalizeString(value.id, `${taskId}-packet`, 180);
  const checklistObject = normalizeObjectRef(value.checklistObject);
  const sourceObjects = Array.isArray(value.sourceObjects)
    ? value.sourceObjects.map(normalizeObjectRef).filter(Boolean).slice(0, MAX_OBJECTS_PER_PACKET)
    : [];
  const sourceObjectIds = new Set(sourceObjects.map((item) => item.objectId));
  const inventoryEntries = Array.isArray(value.inventoryEntries)
    ? value.inventoryEntries
        .map((item, index) => normalizePacketInventoryEntry(item, index, sourceObjectIds))
        .filter(Boolean)
        .slice(0, MAX_PACKET_INVENTORY_ENTRIES)
    : options.skipDefaultInventoryResolution
      ? []
      : derivePacketInventoryEntriesFromSourceObjects(sourceObjects).slice(0, MAX_PACKET_INVENTORY_ENTRIES);

  if (!id || !checklistObject) {
    return undefined;
  }

  return {
    id,
    taskId,
    workspaceId,
    checklistObject,
    sourceObjects,
    inventoryEntries,
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
    providerHandoffs: Array.isArray(value.providerHandoffs)
      ? value.providerHandoffs
          .map((item) => normalizeProviderHandoff(item))
          .filter(Boolean)
          .slice(0, 20)
      : [],
  });
}

function normalizeProviderHandoff(value) {
  if (!isPlainObject(value)) {
    return null;
  }

  const provider = normalizeString(value.provider, "", 80);
  const state = normalizeString(value.state, "", 80);
  if (!provider || !state) {
    return null;
  }

  return sanitizeOpeningConditionPilotValue({
    provider,
    jobId: normalizeString(value.jobId, "", 180) || undefined,
    state,
    summary: normalizeString(value.summary, "", 500) || undefined,
    documentRefId: normalizeString(value.documentRefId, "", 180) || undefined,
    updatedAt: normalizeString(value.updatedAt, new Date().toISOString(), 80),
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
    targetLabel: normalizeString(value.targetLabel, "", 240) || undefined,
    category: normalizeString(value.category, "", 160) || undefined,
    subCategory: normalizeString(value.subCategory, "", 120) || undefined,
    ruleExplanation: normalizeString(value.ruleExplanation, "", 500) || undefined,
    expectedEvidenceHints: Array.isArray(value.expectedEvidenceHints)
      ? value.expectedEvidenceHints
          .map((item) => normalizeString(item, "", 120))
          .filter(Boolean)
          .slice(0, 20)
      : [],
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
    subCategory: normalizeString(value.subCategory, "", 120) || undefined,
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
    issueTypeId: normalizeString(value.issueTypeId, "", 160) || undefined,
    issueTypeLabel: normalizeString(value.issueTypeLabel, "", 240) || undefined,
    issueTypeGroup: normalizeString(value.issueTypeGroup, "", 160) || undefined,
    riskLevel: issueRiskLevelValues.has(value.riskLevel) ? value.riskLevel : undefined,
    legalBasis: normalizeLegalBasisReferences(value.legalBasis),
    rectificationRequirement: normalizeString(value.rectificationRequirement, "", 500) || undefined,
    verificationGuidance: normalizeString(value.verificationGuidance, "", 500) || undefined,
    agentAssetId: normalizeString(value.agentAssetId, "", 180) || undefined,
    promptAssetId: normalizeString(value.promptAssetId, "", 180) || undefined,
    templateId: normalizeString(value.templateId, "", 180) || undefined,
  });
}

function normalizeLegalBasisReference(value) {
  if (!isPlainObject(value) && typeof value !== "string") {
    return null;
  }

  if (typeof value === "string") {
    const title = normalizeString(value, "", 240);
    return title ? { title } : null;
  }

  const title = normalizeString(value.title ?? value.name ?? value.source, "", 240);
  if (!title) {
    return null;
  }

  return sanitizeOpeningConditionPilotValue({
    title,
    clause: normalizeString(value.clause ?? value.article, "", 160) || undefined,
    summary: normalizeString(value.summary ?? value.note, "", 300) || undefined,
  });
}

function normalizeLegalBasisReferences(value) {
  return Array.isArray(value) ? value.map(normalizeLegalBasisReference).filter(Boolean).slice(0, 10) : [];
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

function buildPacketMatchCandidates(packet) {
  const sourceObjectMap = new Map((packet?.sourceObjects ?? []).map((item) => [item.objectId, item]));
  const inventoryEntries =
    Array.isArray(packet?.inventoryEntries) && packet.inventoryEntries.length > 0
      ? packet.inventoryEntries
      : derivePacketInventoryEntriesFromSourceObjects(packet?.sourceObjects ?? []);

  return inventoryEntries.map((entry) => {
    const sourceObject = entry.sourceObjectId ? sourceObjectMap.get(entry.sourceObjectId) : null;
    return {
      entry,
      objectRef: sanitizeOpeningConditionPilotValue({
        ...(sourceObject ?? {
          objectId: `${packet?.id ?? "packet"}:${entry.id}`,
          kind: "evidence",
        }),
        fileName: entry.fileName,
        summary: entry.summary ?? entry.relativePath ?? sourceObject?.summary,
        sizeBytes: entry.sizeBytes ?? sourceObject?.sizeBytes,
      }),
    };
  });
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
    packageDiagnostics: normalizeReportPackageDiagnostics(value.packageDiagnostics),
    disclaimer: normalizeString(
      value.disclaimer,
      "本结果为平台智能辅助审查意见，不替代施工单位、监理单位及相关责任人的最终审核责任。",
      500,
    ),
    createdAt: normalizeString(value.createdAt, new Date().toISOString(), 80),
  });
}

function normalizeReportPackageDiagnostics(value) {
  if (!isPlainObject(value)) {
    return undefined;
  }

  return sanitizeOpeningConditionPilotValue({
    inputObjects: normalizeTrialPackageInputObjects(value.inputObjects),
    matching: {
      total: normalizeNumber(value.matching?.total, 0, 10000),
      passed: normalizeNumber(value.matching?.passed, 0, 10000),
      failed: normalizeNumber(value.matching?.failed, 0, 10000),
      warnings: normalizeNumber(value.matching?.warnings, 0, 10000),
      humanReview: normalizeNumber(value.matching?.humanReview, 0, 10000),
      evidenceCount: normalizeNumber(value.matching?.evidenceCount, 0, 10000),
    },
    humanReview: {
      total: normalizeNumber(value.humanReview?.total, 0, 10000),
      blockingCount: normalizeNumber(value.humanReview?.blockingCount, 0, 10000),
      confirmed: normalizeNumber(value.humanReview?.confirmed, 0, 10000),
      corrected: normalizeNumber(value.humanReview?.corrected, 0, 10000),
      rejected: normalizeNumber(value.humanReview?.rejected, 0, 10000),
      deferred: normalizeNumber(value.humanReview?.deferred, 0, 10000),
    },
    decisionLedger: Array.isArray(value.decisionLedger)
      ? value.decisionLedger.map(normalizeHumanReviewDecisionLedgerItem).filter(Boolean).slice(0, 50)
      : [],
    findings: Array.isArray(value.findings) ? value.findings.map(normalizeReportFinding).filter(Boolean).slice(0, 200) : [],
    summaryByIssueType: Array.isArray(value.summaryByIssueType)
      ? value.summaryByIssueType.map(normalizeReportIssueTypeSummary).filter(Boolean).slice(0, 50)
      : [],
    nextRectificationAdvice: normalizeNextRectificationAdvice(value.nextRectificationAdvice),
    exportHandoff: normalizeReportExportHandoff(value.exportHandoff),
    providerReadiness: normalizeTrialPackageProviderReadiness(value.providerReadiness),
    blockingReasons: normalizeStringList(value.blockingReasons, 30, 240),
    archiveStatus: ["pending", "ready", "archived"].includes(value.archiveStatus) ? value.archiveStatus : "pending",
    generatedAt: normalizeString(value.generatedAt, new Date().toISOString(), 80),
  });
}

function normalizeReportExportHandoff(value) {
  if (!isPlainObject(value)) {
    return undefined;
  }

  const adapterId = normalizeString(value.adapterId, "", 180);
  const adapterLabel = normalizeString(value.adapterLabel, "", 240);
  const deliveryKind = ["docx_backfill", "docx_export", "html_preview"].includes(value.deliveryKind)
    ? value.deliveryKind
    : "";
  const status = ["draft", "pending_adapter", "ready_for_adapter", "adapter_connected", "exported"].includes(value.status)
    ? value.status
    : "";
  const nextAction = normalizeString(value.nextAction, "", 500);
  if (!adapterId || !adapterLabel || !deliveryKind || !status || !nextAction) {
    return undefined;
  }

  return sanitizeOpeningConditionPilotValue({
    adapterId,
    adapterLabel,
    deliveryKind,
    status,
    templateId: normalizeString(value.templateId, "", 180) || undefined,
    templateLabel: normalizeString(value.templateLabel, "", 240) || undefined,
    generatedObject: normalizeObjectRef(value.generatedObject) ?? undefined,
    inputSummary: {
      basisFileName: normalizeString(value.inputSummary?.basisFileName, "", 240) || undefined,
      checklistFileName: normalizeString(value.inputSummary?.checklistFileName, "", 240) || undefined,
      sourceCount: normalizeNumber(value.inputSummary?.sourceCount, 0, MAX_OBJECTS_PER_PACKET),
      findingCount: normalizeNumber(value.inputSummary?.findingCount, 0, MAX_CHECKLIST_ITEMS),
    },
    safeDiagnostics: normalizeStringList(value.safeDiagnostics, 20, 300),
    nextAction,
  });
}

function normalizeReportFinding(value) {
  if (!isPlainObject(value)) {
    return null;
  }

  const id = normalizeString(value.id, "", 180);
  const checkItemId = normalizeString(value.checkItemId, "", 180);
  const title = normalizeString(value.title, "", 240);
  const category = normalizeString(value.category, "", 160);
  const disposition = normalizeString(value.disposition, "", 80);
  const rectificationRequirement = normalizeString(value.rectificationRequirement, "", 500);
  const description = normalizeString(value.description, "", 500);
  if (!id || !checkItemId || !title || !category || !disposition || !rectificationRequirement || !description) {
    return null;
  }

  return sanitizeOpeningConditionPilotValue({
    id,
    checkItemId,
    title,
    category,
    subCategory: normalizeString(value.subCategory, "", 120) || undefined,
    required: value.required !== false,
    disposition,
    issueTypeId: normalizeString(value.issueTypeId, "", 160) || undefined,
    issueTypeLabel: normalizeString(value.issueTypeLabel, "", 240) || undefined,
    issueTypeGroup: normalizeString(value.issueTypeGroup, "", 160) || undefined,
    riskLevel: issueRiskLevelValues.has(value.riskLevel) ? value.riskLevel : "medium",
    legalBasis: normalizeLegalBasisReferences(value.legalBasis),
    rectificationRequirement,
    verificationGuidance: normalizeString(value.verificationGuidance, "", 500) || undefined,
    basisVersionId: normalizeString(value.basisVersionId, "", 180) || undefined,
    description,
    evidenceIds: normalizeStringList(value.evidenceIds, 20, 180),
    evidenceLabels: normalizeStringList(value.evidenceLabels, 20, 300),
    humanReviewIds: normalizeStringList(value.humanReviewIds, 20, 180),
    humanReviewLabels: normalizeStringList(value.humanReviewLabels, 20, 300),
    latestHumanReviewStatus: normalizeString(value.latestHumanReviewStatus, "", 80) || undefined,
    latestHumanReviewNote: normalizeString(value.latestHumanReviewNote, "", 500) || undefined,
  });
}

function normalizeReportIssueTypeSummary(value) {
  if (!isPlainObject(value)) {
    return null;
  }

  const issueTypeId = normalizeString(value.issueTypeId, "", 160);
  const issueTypeLabel = normalizeString(value.issueTypeLabel, "", 240);
  if (!issueTypeId || !issueTypeLabel) {
    return null;
  }

  return sanitizeOpeningConditionPilotValue({
    issueTypeId,
    issueTypeLabel,
    issueTypeGroup: normalizeString(value.issueTypeGroup, "", 160) || undefined,
    riskLevel: issueRiskLevelValues.has(value.riskLevel) ? value.riskLevel : "medium",
    count: normalizeNumber(value.count, 0, 10000),
  });
}

function normalizeNextRectificationAdvice(value) {
  if (!isPlainObject(value)) {
    return undefined;
  }

  const headline = normalizeString(value.headline, "", 300);
  if (!headline) {
    return undefined;
  }

  return sanitizeOpeningConditionPilotValue({
    headline,
    actions: normalizeStringList(value.actions, 10, 300),
  });
}

function normalizeHumanReviewDecisionLedgerItem(value) {
  if (!isPlainObject(value)) {
    return null;
  }

  const reviewId = normalizeString(value.reviewId, "", 180);
  const targetId = normalizeString(value.targetId, "", 180);
  const reason = normalizeString(value.reason, "", 500);
  const targetType = ["basis", "master_data", "check_item", "report"].includes(value.targetType) ? value.targetType : "";
  const status = ["confirmed", "corrected", "rejected", "deferred"].includes(value.status) ? value.status : "";
  if (!reviewId || !targetId || !reason || !targetType || !status) {
    return null;
  }

  return sanitizeOpeningConditionPilotValue({
    reviewId,
    targetType,
    targetId,
    targetLabel: normalizeString(value.targetLabel, "", 240) || undefined,
    category: normalizeString(value.category, "", 160) || undefined,
    subCategory: normalizeString(value.subCategory, "", 120) || undefined,
    ruleExplanation: normalizeString(value.ruleExplanation, "", 500) || undefined,
    expectedEvidenceHints: normalizeStringList(value.expectedEvidenceHints, 20, 120),
    status,
    reason,
    evidenceIds: normalizeStringList(value.evidenceIds, 20, 180),
    reviewerId: normalizeString(value.reviewerId, "", 160) || undefined,
    decidedAt: normalizeString(value.decidedAt, "", 80) || undefined,
    safeNote: normalizeString(value.safeNote, "", 500) || undefined,
  });
}

function normalizeTrialPackageInputObjects(value) {
  const sourceFileNames = normalizeStringList(value?.sourceFileNames, 30, 240);
  return sanitizeOpeningConditionPilotValue({
    basisFileName: normalizeString(value?.basisFileName, "", 240) || undefined,
    checklistFileName: normalizeString(value?.checklistFileName, "", 240) || undefined,
    sourceFileNames,
    sourceCount: normalizeNumber(value?.sourceCount, sourceFileNames.length, MAX_OBJECTS_PER_PACKET),
  });
}

function normalizeTrialPackageProviderReadiness(value) {
  if (!isPlainObject(value)) {
    return undefined;
  }

  return sanitizeOpeningConditionPilotValue({
    provider: normalizeString(value.provider, "", 80) || undefined,
    status: normalizeString(value.status, "missing", 80),
    summary: normalizeString(value.summary, "", 500) || undefined,
  });
}

function normalizeTrialPackageSummary(value) {
  if (!isPlainObject(value)) {
    return undefined;
  }

  return sanitizeOpeningConditionPilotValue({
    taskId: normalizeString(value.taskId, "", 180),
    workspaceId: normalizeString(value.workspaceId, "", 160),
    status: normalizeState(value.status, "draft"),
    submittedBy: normalizeString(value.submittedBy, "", 160) || undefined,
    inputObjects: normalizeTrialPackageInputObjects(value.inputObjects),
    diagnostics: {
      checklistDefinitionResolution: normalizeString(value.diagnostics?.checklistDefinitionResolution, "", 120) || undefined,
      checklistDefinitionCount: normalizeNumber(value.diagnostics?.checklistDefinitionCount, 0, MAX_CHECKLIST_ITEMS),
      inventoryResolution: normalizeString(value.diagnostics?.inventoryResolution, "", 120) || undefined,
      inventoryEntryCount: normalizeNumber(value.diagnostics?.inventoryEntryCount, 0, MAX_PACKET_INVENTORY_ENTRIES),
      inventoryFallbackReason: normalizeString(value.diagnostics?.inventoryFallbackReason, "", 160) || undefined,
      manifestSampleNames: normalizeStringList(value.diagnostics?.manifestSampleNames, 30, 240),
    },
    providerReadiness: normalizeTrialPackageProviderReadiness(value.providerReadiness),
    matching: {
      total: normalizeNumber(value.matching?.total, 0, 10000),
      passed: normalizeNumber(value.matching?.passed, 0, 10000),
      failed: normalizeNumber(value.matching?.failed, 0, 10000),
      warnings: normalizeNumber(value.matching?.warnings, 0, 10000),
      humanReview: normalizeNumber(value.matching?.humanReview, 0, 10000),
      evidenceCount: normalizeNumber(value.matching?.evidenceCount, 0, 10000),
    },
    humanReview: {
      total: normalizeNumber(value.humanReview?.total, 0, 10000),
      blockingCount: normalizeNumber(value.humanReview?.blockingCount, 0, 10000),
      confirmed: normalizeNumber(value.humanReview?.confirmed, 0, 10000),
      corrected: normalizeNumber(value.humanReview?.corrected, 0, 10000),
      rejected: normalizeNumber(value.humanReview?.rejected, 0, 10000),
      deferred: normalizeNumber(value.humanReview?.deferred, 0, 10000),
    },
    blockingReasons: normalizeStringList(value.blockingReasons, 30, 240),
    reportStatus: ["missing", "draft", "ready", "archived"].includes(value.reportStatus) ? value.reportStatus : "missing",
    archiveStatus: ["pending", "archived"].includes(value.archiveStatus) ? value.archiveStatus : "pending",
    updatedAt: normalizeString(value.updatedAt, new Date().toISOString(), 80),
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

function findLatestEventDiagnostics(task, type) {
  const event = [...(task.events ?? [])].reverse().find((item) => item.type === type);
  return isPlainObject(event?.safeDiagnostics) ? event.safeDiagnostics : {};
}

function summarizeHumanReviewQueue(queue = []) {
  return queue.reduce(
    (summary, item) => {
      summary.total += 1;
      if (isBlockingHumanReviewStatus(item.status)) summary.blockingCount += 1;
      if (item.status === "confirmed") summary.confirmed += 1;
      if (item.status === "corrected") summary.corrected += 1;
      if (item.status === "rejected") summary.rejected += 1;
      if (item.status === "deferred") summary.deferred += 1;
      return summary;
    },
    {
      total: 0,
      blockingCount: 0,
      confirmed: 0,
      corrected: 0,
      rejected: 0,
      deferred: 0,
    },
  );
}

function deriveTrialPackageProviderReadiness(task) {
  const providerRefs = task.knowledgeBaseRef?.providerRefs ?? [];
  const primaryRef = providerRefs[0];
  const status =
    task.preflightReadiness?.knowledgeBase ??
    task.knowledgeBaseRef?.providerSyncStatus ??
    (task.knowledgeBaseRef?.status === "ready" ? "ready" : "missing");

  return normalizeTrialPackageProviderReadiness({
    provider: primaryRef?.provider ?? "platform",
    status,
    summary: primaryRef?.summary ?? task.knowledgeBaseRef?.summary ?? task.preflightReadiness?.nextAction,
  });
}

function deriveTrialPackageSummary(task) {
  const intakeDiagnostics = findLatestEventDiagnostics(task, "task.intake_initialized");
  const createdDiagnostics = findLatestEventDiagnostics(task, "task.created");
  const packetDiagnostics = findLatestEventDiagnostics(task, "packet.uploaded");
  const diagnosticsSource = {
    ...createdDiagnostics,
    ...intakeDiagnostics,
    ...packetDiagnostics,
  };
  const matching = summarizePilotCheckItems(task.checkItems ?? []);
  const humanReview = summarizeHumanReviewQueue(task.humanReviewQueue ?? []);
  const preflightReadiness = task.preflightReadiness ?? deriveOpeningConditionPilotPreflightReadiness(task);

  return normalizeTrialPackageSummary({
    taskId: task.id,
    workspaceId: task.context?.workspaceId,
    status: task.state,
    submittedBy: task.packet?.submittedBy,
    inputObjects: {
      basisFileName: task.basisVersion?.sourceObject?.fileName,
      checklistFileName: task.packet?.checklistObject?.fileName,
      sourceFileNames: task.packet?.sourceObjects?.map((item) => item.fileName) ?? [],
      sourceCount: task.packet?.sourceObjects?.length ?? 0,
    },
    diagnostics: {
      checklistDefinitionResolution: diagnosticsSource.checklistDefinitionResolution,
      checklistDefinitionCount: diagnosticsSource.checklistDefinitionCount ?? task.checklistDefinition?.length ?? 0,
      inventoryResolution: diagnosticsSource.inventoryResolution,
      inventoryEntryCount: diagnosticsSource.inventoryEntryCount ?? task.packet?.inventoryEntries?.length ?? 0,
      inventoryFallbackReason: diagnosticsSource.inventoryFallbackReason,
      manifestSampleNames: diagnosticsSource.inventoryFileNames ?? task.packet?.inventoryEntries?.map((item) => item.fileName) ?? [],
    },
    providerReadiness: deriveTrialPackageProviderReadiness({
      ...task,
      preflightReadiness,
    }),
    matching: {
      ...matching,
      evidenceCount: task.evidence?.length ?? 0,
    },
    humanReview,
    blockingReasons: preflightReadiness.blockingReasons ?? [],
    reportStatus: task.reportAsset?.status ?? "missing",
    archiveStatus: task.state === "archived" ? "archived" : "pending",
    updatedAt: task.updatedAt,
  });
}

function deriveReportPackageDiagnostics(task, summary, archiveStatus = "ready") {
  const trialPackage = task.trialPackage ?? deriveTrialPackageSummary(task);
  const findings = deriveReportPackageFindings(task);
  return normalizeReportPackageDiagnostics({
    inputObjects: {
      ...trialPackage.inputObjects,
      basisFileName: trialPackage.inputObjects?.basisFileName ?? task.basisVersion?.sourceObject?.fileName,
      checklistFileName: trialPackage.inputObjects?.checklistFileName ?? task.packet?.checklistObject?.fileName,
      sourceFileNames:
        trialPackage.inputObjects?.sourceFileNames?.length > 0
          ? trialPackage.inputObjects.sourceFileNames
          : task.packet?.sourceObjects?.map((item) => item.fileName) ?? [],
      sourceCount: trialPackage.inputObjects?.sourceCount || task.packet?.sourceObjects?.length || 0,
    },
    matching: {
      ...summary,
      evidenceCount: task.evidence?.length ?? 0,
    },
    humanReview: summarizeHumanReviewQueue(task.humanReviewQueue ?? []),
    decisionLedger: deriveHumanReviewDecisionLedger(task),
    findings,
    summaryByIssueType: deriveReportIssueTypeSummary(findings),
    nextRectificationAdvice: deriveNextRectificationAdvice(findings, trialPackage.blockingReasons ?? []),
    exportHandoff: deriveReportExportHandoff(task, findings, trialPackage, archiveStatus),
    providerReadiness: trialPackage.providerReadiness,
    blockingReasons: trialPackage.blockingReasons,
    archiveStatus,
    generatedAt: new Date().toISOString(),
  });
}

function deriveReportExportHandoff(task, findings = [], trialPackage = null, archiveStatus = "ready") {
  const checklistFileName = trialPackage?.inputObjects?.checklistFileName ?? task.packet?.checklistObject?.fileName;
  const basisFileName = trialPackage?.inputObjects?.basisFileName ?? task.basisVersion?.sourceObject?.fileName;
  const sourceCount = trialPackage?.inputObjects?.sourceCount ?? task.packet?.sourceObjects?.length ?? 0;
  const checklistLooksDocx = /\.docx?$/i.test(checklistFileName ?? "");
  const basisLooksDocx = /\.docx?$/i.test(basisFileName ?? "");
  const deliveryKind = checklistLooksDocx || basisLooksDocx ? "docx_backfill" : "docx_export";
  const status = archiveStatus === "archived" ? "ready_for_adapter" : task.reportAsset?.objectRef ? "exported" : "pending_adapter";
  const safeDiagnostics = [
    checklistFileName ? `checklist:${checklistFileName}` : "",
    basisFileName ? `basis:${basisFileName}` : "",
    `findings:${findings.length}`,
    `archive:${archiveStatus}`,
  ].filter(Boolean);

  return {
    adapterId: "opening-condition-docx-html-bridge",
    adapterLabel: "原表回填 / 文档导出适配器",
    deliveryKind,
    status,
    templateId: checklistLooksDocx ? "opening-condition-original-form-template-v1" : "opening-condition-report-package-template-v1",
    templateLabel: checklistLooksDocx ? "原表回填模板 v1" : "辅助报告模板 v1",
    generatedObject: task.reportAsset?.objectRef,
    inputSummary: {
      basisFileName,
      checklistFileName,
      sourceCount,
      findingCount: findings.length,
    },
    safeDiagnostics,
    nextAction:
      status === "exported"
        ? "报告导出结果已记录；如需回填原表，请校验生成文件与本轮 findings 是否一致。"
        : checklistLooksDocx
          ? "待接入 docxToHtml / htmlToDocx 适配服务后，可基于当前 handoff 执行原表回填。"
          : "待接入导出适配器后，可基于当前 handoff 生成正式文档交付件。",
  };
}

function escapeReportHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function reportHtmlText(value, maxLength = 1200) {
  return escapeReportHtml(String(value ?? "").slice(0, maxLength));
}

function getReportFindingLabel(finding) {
  if (finding.disposition === "pass") {
    return "符合";
  }
  if (finding.disposition === "not_applicable") {
    return "不适用";
  }
  if (finding.disposition === "blocked") {
    return "阻塞";
  }
  if (finding.disposition === "needs_human_review") {
    return "待人工复核";
  }
  return "不符合";
}

function getReportRiskLabel(riskLevel) {
  return riskLevel === "high" ? "高风险" : riskLevel === "medium" ? "中风险" : "低风险";
}

export function buildOpeningConditionPilotReportHtml(task) {
  const reportAsset = task?.reportAsset;
  if (!reportAsset) {
    return null;
  }

  const packageDiagnostics = reportAsset.packageDiagnostics ?? {};
  const findings = Array.isArray(packageDiagnostics.findings) ? packageDiagnostics.findings.slice(0, 120) : [];
  const issueTypeSummary = Array.isArray(packageDiagnostics.summaryByIssueType)
    ? packageDiagnostics.summaryByIssueType.slice(0, 40)
    : [];
  const summary = reportAsset.summary ?? {};
  const sourceNames = packageDiagnostics.inputObjects?.sourceFileNames?.slice(0, 30) ?? [];
  const title = reportHtmlText(reportAsset.title || "开工条件核查报告", 240);
  const projectName = reportHtmlText(task.context?.projectId || task.context?.reviewObjectId || "未记录项目", 240);
  const findingRows = findings
    .map(
      (finding, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${reportHtmlText(finding.category)}</td>
          <td>${reportHtmlText(finding.title, 300)}</td>
          <td>${getReportRiskLabel(finding.riskLevel)}</td>
          <td>${getReportFindingLabel(finding)}</td>
          <td>${reportHtmlText(finding.description, 800)}</td>
          <td>${reportHtmlText(finding.rectificationRequirement, 800)}</td>
        </tr>`,
    )
    .join("");
  const issueRows = issueTypeSummary
    .map(
      (item) => `
        <tr>
          <td>${reportHtmlText(item.issueTypeLabel, 240)}</td>
          <td>${reportHtmlText(item.issueTypeGroup, 180)}</td>
          <td>${getReportRiskLabel(item.riskLevel)}</td>
          <td>${Number(item.count) || 0}</td>
        </tr>`,
    )
    .join("");
  const sourceList = sourceNames.map((name) => `<li>${reportHtmlText(name, 240)}</li>`).join("");
  const nextActions = packageDiagnostics.nextRectificationAdvice?.actions ?? [];
  const nextActionList = nextActions
    .slice(0, 20)
    .map((action, index) => `<li>${index + 1}. ${reportHtmlText(action, 800)}</li>`)
    .join("");

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <style>
      body { font-family: "SimSun", "宋体", serif; color: #20242a; font-size: 10pt; line-height: 1.5; }
      h1 { text-align: center; font-size: 18pt; margin: 0 0 12pt; }
      h2 { font-size: 13pt; margin: 18pt 0 8pt; border-bottom: 1px solid #c9ced6; padding-bottom: 4pt; }
      p { margin: 4pt 0; }
      table { width: 100%; border-collapse: collapse; table-layout: fixed; }
      th, td { border: 1px solid #8c949e; padding: 5pt; vertical-align: top; word-break: break-word; }
      th { background: #eef1f4; }
      .summary td { width: 20%; text-align: center; }
      .metric { font-size: 16pt; font-weight: bold; display: block; }
      .muted { color: #66707d; }
      ul { margin: 4pt 0 8pt 18pt; padding: 0; }
    </style>
  </head>
  <body>
    <h1>${title}</h1>
    <p><strong>项目：</strong>${projectName}</p>
    <p><strong>任务：</strong>${reportHtmlText(task.id, 180)}</p>
    <p class="muted">本报告为平台智能辅助审查意见，不替代施工单位、监理单位及相关责任人的最终审核责任。</p>

    <h2>一、核查总体情况</h2>
    <table class="summary">
      <tr>
        <td><span class="metric">${Number(summary.total) || 0}</span>核查项</td>
        <td><span class="metric">${Number(summary.passed) || 0}</span>符合</td>
        <td><span class="metric">${Number(summary.failed) || 0}</span>不符合</td>
        <td><span class="metric">${Number(summary.humanReview) || 0}</span>待复核</td>
        <td><span class="metric">${Number(summary.warnings) || 0}</span>提示</td>
      </tr>
    </table>

    <h2>二、问题与整改项</h2>
    <table>
      <tr>
        <th style="width: 5%;">序号</th>
        <th style="width: 11%;">分类</th>
        <th style="width: 18%;">核查项目</th>
        <th style="width: 9%;">风险</th>
        <th style="width: 10%;">结论</th>
        <th style="width: 23%;">问题描述</th>
        <th style="width: 24%;">整改要求</th>
      </tr>
      ${findingRows || "<tr><td colspan=\"7\">当前没有结构化问题项。</td></tr>"}
    </table>

    <h2>三、问题类型汇总</h2>
    <table>
      <tr><th>问题类型</th><th>问题组</th><th>风险等级</th><th>数量</th></tr>
      ${issueRows || "<tr><td colspan=\"4\">当前没有问题类型汇总。</td></tr>"}
    </table>

    <h2>四、后续动作</h2>
    <p>${reportHtmlText(packageDiagnostics.nextRectificationAdvice?.headline || "请根据核查结论完成资料补充、整改和复审。", 500)}</p>
    <ul>${nextActionList || "<li>请由监理人员结合现场和原始资料完成最终判断。</li>"}</ul>

    <h2>五、本轮输入资料</h2>
    <p><strong>依据：</strong>${reportHtmlText(packageDiagnostics.inputObjects?.basisFileName || "未记录")}</p>
    <p><strong>核查表：</strong>${reportHtmlText(packageDiagnostics.inputObjects?.checklistFileName || "未记录")}</p>
    <ul>${sourceList || "<li>未记录资料包文件。</li>"}</ul>
  </body>
</html>`;
}

function deriveIssueTaxonomyForChecklistItem(checklistItem, finalDisposition = "needs_human_review") {
  const reviewText = getChecklistReviewText(checklistItem);
  const required = checklistItem.required !== false;
  const isBlocked = finalDisposition === "blocked";
  const highRisk = isBlocked || (required && ["fail", "reject"].includes(finalDisposition));

  if (/审批|签章|签字|日期|盖章/.test(reviewText)) {
    return {
      issueTypeId: "approval_signature_gap",
      issueTypeLabel: "审批签章缺失或不完整",
      issueTypeGroup: "审批签章",
      riskLevel: highRisk ? "high" : "medium",
      legalBasis: [
        {
          title: "建设工程监理规范",
          summary: "关键审批表单应具备完整签字、签章和日期。",
        },
      ],
      rectificationRequirement: "补齐审批表签字、签章和日期后重新提交复审。",
      verificationGuidance: "核验签章页是否完整、签字日期是否闭合并与当前申报轮次一致。",
      templateId: "opening-condition-approval-gap-v1",
    };
  }

  if (/人员|安全员|特种作业|管理人员|资格证/.test(reviewText)) {
    return {
      issueTypeId: "personnel_qualification_gap",
      issueTypeLabel: "人员资质资料缺失或待核验",
      issueTypeGroup: "人员资料",
      riskLevel: highRisk ? "high" : "medium",
      legalBasis: [
        {
          title: "建设工程安全生产管理条例",
          summary: "现场关键岗位和特种作业人员应具备有效资格和持证资料。",
        },
      ],
      rectificationRequirement: "补齐岗位人员资格、持证或实名制资料后重新提交复审。",
      verificationGuidance: "核验人员身份、岗位、证件有效期和所属单位是否与当前合同边界一致。",
      agentAssetId: "opening-condition-personnel-review-agent",
      templateId: "opening-condition-personnel-gap-v1",
    };
  }

  if (/设备|起重|汽车吊|泵车|仪器|检验报告|检测报告/.test(reviewText)) {
    return {
      issueTypeId: "equipment_compliance_gap",
      issueTypeLabel: "设备资料缺失或合规性待确认",
      issueTypeGroup: "设备器具",
      riskLevel: highRisk ? "high" : "medium",
      legalBasis: [
        {
          title: "公路工程施工安全技术规范",
          summary: "起重、运输、检测等设备应具备有效检验和准入资料。",
        },
      ],
      rectificationRequirement: "补齐设备检验、检测、年审或租赁安全资料后重新提交复审。",
      verificationGuidance: "核验设备名称、编号、检测有效期和当前施工对象是否一致。",
      agentAssetId: "opening-condition-equipment-review-agent",
      templateId: "opening-condition-equipment-gap-v1",
    };
  }

  if (/依据|合同|规范|制度|边界|核查表/.test(reviewText)) {
    return {
      issueTypeId: "basis_coverage_gap",
      issueTypeLabel: "核查依据覆盖不足",
      issueTypeGroup: "依据完整性",
      riskLevel: isBlocked ? "high" : "medium",
      legalBasis: [
        {
          title: "项目核查依据治理要求",
          summary: "正式核查前应绑定已发布依据、主数据和项目知识库。",
        },
      ],
      rectificationRequirement: "补齐并发布对应依据、制度或合同边界后重新发起正式核查。",
      verificationGuidance: "确认当前 run 已绑定正式依据版本、主数据和可用知识库。",
      promptAssetId: "opening-condition-basis-governance-prompt",
      templateId: "opening-condition-basis-gap-v1",
    };
  }

  return {
    issueTypeId: "material_packet_gap",
    issueTypeLabel: "资料包匹配缺失或待补件",
    issueTypeGroup: checklistItem.category || "资料核查",
    riskLevel: highRisk ? "high" : finalDisposition === "warning" ? "low" : "medium",
    legalBasis: [
      {
        title: "开工条件资料核查要求",
        summary: "开工前应确保核查资料齐全、可追溯并满足复审要求。",
      },
    ],
    rectificationRequirement:
      finalDisposition === "blocked"
        ? "先解决前置门禁或授权边界，再补齐资料后重新发起复审。"
        : "补齐对应资料或说明文件后重新提交复审。",
    verificationGuidance: "结合核查项名称、资料包文件和人工说明确认是否已满足本轮核查要求。",
    templateId: "opening-condition-material-gap-v1",
  };
}

function applyIssueTaxonomyToCheckItem(checkItem, finalDisposition) {
  const derived = deriveIssueTaxonomyForChecklistItem(checkItem, finalDisposition);
  return {
    ...checkItem,
    ...derived,
  };
}

function deriveReportPackageFindings(task) {
  const evidenceById = new Map((task.evidence ?? []).map((item) => [item.id, item]));
  const reviewByTargetId = new Map();
  const latestReviewByTargetId = new Map();

  for (const review of task.humanReviewQueue ?? []) {
    const current = reviewByTargetId.get(review.targetId) ?? [];
    current.push(review);
    reviewByTargetId.set(review.targetId, current);

    const currentLatest = latestReviewByTargetId.get(review.targetId);
    const currentRank = Date.parse(currentLatest?.decidedAt || "");
    const nextRank = Date.parse(review.decidedAt || "");
    if (!currentLatest || (Number.isNaN(currentRank) ? -1 : currentRank) <= (Number.isNaN(nextRank) ? -1 : nextRank)) {
      latestReviewByTargetId.set(review.targetId, review);
    }
  }

  return (task.checkItems ?? [])
    .map((item) => {
      const latestReview = latestReviewByTargetId.get(item.id);
      const disposition =
        latestReview?.status === "confirmed"
          ? "confirm"
          : latestReview?.status === "corrected"
            ? "correct"
            : latestReview?.status === "rejected"
              ? "reject"
              : latestReview?.status === "deferred" || latestReview?.status === "open"
                ? "needs_human_review"
                : item.finalDisposition ?? item.verdict;

      if (disposition === "pass" || disposition === "not_applicable") {
        return null;
      }

      const taxonomy = {
        issueTypeId: item.issueTypeId,
        issueTypeLabel: item.issueTypeLabel,
        issueTypeGroup: item.issueTypeGroup,
        riskLevel: item.riskLevel,
        legalBasis: item.legalBasis,
        rectificationRequirement: item.rectificationRequirement,
        verificationGuidance: item.verificationGuidance,
      };
      const derivedTaxonomy =
        taxonomy.issueTypeId && taxonomy.issueTypeLabel && taxonomy.rectificationRequirement
          ? taxonomy
          : deriveIssueTaxonomyForChecklistItem(item, disposition);
      const humanReviews = reviewByTargetId.get(item.id) ?? [];

      return {
        id: `finding-${task.id}-${item.id}`,
        checkItemId: item.id,
        title: item.name,
        category: item.category,
        subCategory: item.subCategory,
        required: item.required !== false,
        disposition,
        issueTypeId: derivedTaxonomy.issueTypeId,
        issueTypeLabel: derivedTaxonomy.issueTypeLabel,
        issueTypeGroup: derivedTaxonomy.issueTypeGroup,
        riskLevel: derivedTaxonomy.riskLevel ?? "medium",
        legalBasis: derivedTaxonomy.legalBasis ?? [],
        rectificationRequirement: derivedTaxonomy.rectificationRequirement,
        verificationGuidance: derivedTaxonomy.verificationGuidance,
        basisVersionId: item.basisVersionId,
        description: item.semanticNote || item.ruleExplanation || "Opening-condition finding derived from pilot checklist matching.",
        evidenceIds: Array.isArray(item.evidenceIds) ? item.evidenceIds : [],
        evidenceLabels: (item.evidenceIds ?? [])
          .map((evidenceId) => {
            const evidence = evidenceById.get(evidenceId);
            return evidence ? `${evidence.objectRef.fileName}${evidence.locator ? ` @ ${evidence.locator}` : ""}` : evidenceId;
          })
          .slice(0, 5),
        humanReviewIds: humanReviews.map((review) => review.id).slice(0, 10),
        humanReviewLabels: humanReviews
          .map((review) => `${review.status}${review.reason ? `: ${review.reason}` : ""}${review.safeNote ? ` / ${review.safeNote}` : ""}`)
          .slice(0, 10),
        latestHumanReviewStatus: latestReview?.status,
        latestHumanReviewNote: latestReview?.safeNote || latestReview?.reason,
      };
    })
    .filter(Boolean);
}

function deriveReportIssueTypeSummary(findings = []) {
  const summaryByType = new Map();
  for (const finding of findings) {
    const issueTypeId = normalizeString(finding.issueTypeId, "uncategorized", 160);
    const current = summaryByType.get(issueTypeId) ?? {
      issueTypeId,
      issueTypeLabel: finding.issueTypeLabel ?? "未分类问题",
      issueTypeGroup: finding.issueTypeGroup,
      riskLevel: finding.riskLevel ?? "medium",
      count: 0,
    };
    current.count += 1;
    if (finding.riskLevel === "high") {
      current.riskLevel = "high";
    } else if (finding.riskLevel === "medium" && current.riskLevel === "low") {
      current.riskLevel = "medium";
    }
    summaryByType.set(issueTypeId, current);
  }

  return [...summaryByType.values()].sort((left, right) => right.count - left.count);
}

function deriveNextRectificationAdvice(findings = [], blockingReasons = []) {
  const actions = [];
  const blockedCount = findings.filter((item) => item.disposition === "blocked").length;
  const rejectedCount = findings.filter((item) => item.disposition === "reject").length;
  const pendingHumanCount = findings.filter((item) => item.disposition === "needs_human_review").length;

  if (blockedCount > 0) {
    actions.push(`优先解除 ${blockedCount} 项前置门禁或授权边界阻塞，再进入下一轮正式核查。`);
  }
  if (rejectedCount > 0) {
    actions.push(`针对 ${rejectedCount} 项人工驳回项补齐资料或说明后重新提交复审。`);
  }
  if (pendingHumanCount > 0) {
    actions.push(`安排监理继续处理 ${pendingHumanCount} 项待人工判断事项，避免报告结论悬空。`);
  }
  if (actions.length === 0 && findings.length > 0) {
    actions.push("结合当前问题清单补件并发起下一轮整改复审。");
  }
  if (blockingReasons.length > 0) {
    actions.push(`当前前置门禁提示：${blockingReasons.join(" / ")}`);
  }

  return actions.length > 0
    ? {
        headline: "下一轮整改复审建议",
        actions: actions.slice(0, 5),
      }
    : undefined;
}

function deriveHumanReviewDecisionLedger(taskOrQueue = []) {
  const queue = Array.isArray(taskOrQueue) ? taskOrQueue : taskOrQueue.humanReviewQueue ?? [];
  const checklistContextById = Array.isArray(taskOrQueue)
    ? new Map()
    : new Map(
        [...(taskOrQueue.checkItems ?? []), ...(taskOrQueue.checklistDefinition ?? [])].map((item) => [
          item.id,
          {
            targetLabel: item.name,
            category: item.category,
            subCategory: item.subCategory,
            ruleExplanation: item.ruleExplanation,
            expectedEvidenceHints: item.expectedEvidenceHints,
          },
        ]),
      );
  return queue
    .filter((item) => item && item.status && item.status !== "open")
    .map((item) => {
      const context = item.targetType === "check_item" ? checklistContextById.get(item.targetId) : null;
      return {
        reviewId: item.id,
        targetType: item.targetType,
        targetId: item.targetId,
        targetLabel: item.targetLabel ?? context?.targetLabel,
        category: item.category ?? context?.category,
        subCategory: item.subCategory ?? context?.subCategory,
        ruleExplanation: item.ruleExplanation ?? context?.ruleExplanation,
        expectedEvidenceHints:
          item.expectedEvidenceHints?.length > 0 ? item.expectedEvidenceHints : context?.expectedEvidenceHints ?? [],
        status: item.status,
        reason: item.reason,
        evidenceIds: Array.isArray(item.evidenceIds) ? item.evidenceIds : [],
        reviewerId: item.reviewerId,
        decidedAt: item.decidedAt,
        safeNote: item.safeNote,
      };
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
    checklistDefinition: Array.isArray(value.checklistDefinition)
      ? value.checklistDefinition.map((item, index) => normalizeChecklistItem(item, index)).filter(Boolean)
      : [],
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
  const checklistContextById = new Map(
    [...normalizedTask.checkItems, ...normalizedTask.checklistDefinition].map((item) => [
      item.id,
      {
        targetLabel: item.name,
        category: item.category,
        subCategory: item.subCategory,
        ruleExplanation: item.ruleExplanation,
        expectedEvidenceHints: item.expectedEvidenceHints,
      },
    ]),
  );
  normalizedTask.humanReviewQueue = normalizedTask.humanReviewQueue.map((item) => {
    if (item.targetType !== "check_item") {
      return item;
    }
    const context = checklistContextById.get(item.targetId);
    if (!context) {
      return item;
    }
    return normalizeHumanReviewItem(
      {
        ...item,
        targetLabel: item.targetLabel ?? context.targetLabel,
        category: item.category ?? context.category,
        subCategory: item.subCategory ?? context.subCategory,
        ruleExplanation: item.ruleExplanation ?? context.ruleExplanation,
        expectedEvidenceHints:
          item.expectedEvidenceHints?.length > 0 ? item.expectedEvidenceHints : context.expectedEvidenceHints,
      },
      id,
    );
  });
  const preflightReadiness = deriveOpeningConditionPilotPreflightReadiness(normalizedTask);
  const taskWithReadiness = {
    ...normalizedTask,
    preflightReadiness,
  };

  return sanitizeOpeningConditionPilotValue({
    ...taskWithReadiness,
    trialPackage: deriveTrialPackageSummary(taskWithReadiness),
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

    const existingBasis = normalizeBasisRecord(snapshot.basisVersions[index], workspaceId);
    const preview = existingBasis?.ingestionPreview;
    if (!preview || preview.status !== "confirmed" || preview.missingFields.length > 0) {
      return {
        snapshot,
        value: {
          ok: false,
          status: "basis_preview_confirmation_required",
          message: "Basis preview must be human-confirmed before publication.",
          basisVersion: existingBasis,
          nextAction: preview?.nextAction ?? "Human-confirm the basis preview before publication.",
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
          ingestionPreview: {
            ...item.ingestionPreview,
            status: "published",
            publishedBy: input.publishedBy ?? input.actorId ?? item.publishedBy,
            publishedAt: now,
            safeNote: input.safeNote ?? item.ingestionPreview?.safeNote ?? item.safeNote,
            nextAction: "Basis preview has been published for formal matching.",
          },
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

export async function refreshOpeningConditionPilotBasisPreview(workspaceId, basisId, input = {}, options = {}) {
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

    const existingBasis = normalizeBasisRecord(snapshot.basisVersions[index], workspaceId);
    const sourceObject = normalizeObjectRef(input.sourceObject ?? existingBasis.sourceObject);
    if (!sourceObject) {
      return {
        snapshot,
        value: {
          ok: false,
          status: "missing_source_object",
          message: "Basis preview extraction requires a basis source object.",
          basisVersion: existingBasis,
        },
      };
    }

    const extraction = buildBasisIngestionPreviewFromSourceObject(
      sourceObject,
      {
        workspaceId,
        projectId: input.projectId ?? input.context?.projectId,
        contractPackageId: input.contractPackageId ?? input.context?.contractPackageId,
        participatingOrganizationId: input.participatingOrganizationId ?? input.context?.participatingOrganizationId,
        participatingOrganizationName:
          input.participatingOrganizationName ?? input.context?.participatingOrganizationName,
      },
      {
        ...input,
        previewConfirmed: false,
        previewSource: input.previewText || input.boundedText || input.textSnippet ? "metadata_and_text" : "metadata_derived",
        previewSafeNote:
          input.safeNote ??
          "Deterministic extraction preview. Human confirmation is required before this basis can be published.",
      },
    );
    const nextPreview = normalizeBasisIngestionPreview(
      {
        ...extraction,
        status: "needs_confirmation",
        nextAction: extraction.missingFields.length > 0
          ? "Review extracted basis facts, fill missing fields, then confirm the preview."
          : "Review and human-confirm the extracted basis preview before publication.",
      },
      existingBasis,
    );
    const now = new Date().toISOString();
    const nextBasis = normalizeBasisRecord(
      {
        ...existingBasis,
        status: "pending_confirmation",
        sourceObject,
        confidence: nextPreview.confidence,
        safeNote: input.safeNote ?? existingBasis.safeNote,
        ingestionPreview: nextPreview,
        updatedAt: now,
      },
      workspaceId,
    );
    const nextBasisVersions = [...snapshot.basisVersions];
    nextBasisVersions[index] = nextBasis;

    return {
      snapshot: {
        ...snapshot,
        basisVersions: nextBasisVersions,
      },
      value: {
        ok: true,
        basisVersion: nextBasis,
      },
    };
  }, options.storePath);
}

export async function ingestOpeningConditionPilotBasisProviderPreview(workspaceId, basisId, input = {}, options = {}) {
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

    const existingBasis = normalizeBasisRecord(snapshot.basisVersions[index], workspaceId);
    const sourceObject = normalizeObjectRef(input.sourceObject ?? existingBasis.sourceObject);
    if (!sourceObject) {
      return {
        snapshot,
        value: {
          ok: false,
          status: "missing_source_object",
          message: "Provider preview ingestion requires a basis source object.",
          basisVersion: existingBasis,
        },
      };
    }

    const providerPreview = normalizeProviderStructuredPreview(input, sourceObject, {
      workspaceId,
      projectId: input.projectId ?? input.context?.projectId,
      contractPackageId: input.contractPackageId ?? input.context?.contractPackageId,
      participatingOrganizationId: input.participatingOrganizationId ?? input.context?.participatingOrganizationId,
    });
    const nextPreview = normalizeBasisIngestionPreview(
      {
        status: "needs_confirmation",
        source: "provider_structured_output",
        sourceObject,
        facts: providerPreview.facts,
        factSummary: providerPreview.factSummary,
        missingFields: providerPreview.missingFields,
        confidence: providerPreview.confidence,
        provenance: providerPreview.provenance,
        safeNote:
          input.safeNote ??
          "Provider structured preview. Human confirmation is required before this basis can be published.",
        nextAction:
          providerPreview.missingFields.length > 0
            ? "Review provider-derived basis facts, fill missing fields, then confirm the preview."
            : "Review and human-confirm the provider-derived basis preview before publication.",
      },
      existingBasis,
    );
    const now = new Date().toISOString();
    const nextBasis = normalizeBasisRecord(
      {
        ...existingBasis,
        status: "pending_confirmation",
        sourceObject,
        confidence: nextPreview.confidence,
        safeNote: input.safeNote ?? existingBasis.safeNote,
        ingestionPreview: nextPreview,
        updatedAt: now,
      },
      workspaceId,
    );
    const nextBasisVersions = [...snapshot.basisVersions];
    nextBasisVersions[index] = nextBasis;

    return {
      snapshot: {
        ...snapshot,
        basisVersions: nextBasisVersions,
      },
      value: {
        ok: true,
        basisVersion: nextBasis,
      },
    };
  }, options.storePath);
}

export async function decideOpeningConditionPilotBasisPreview(workspaceId, basisId, input = {}, options = {}) {
  const allowedDecisions = new Set(["confirm", "reject"]);
  const decision = allowedDecisions.has(input.decision) ? input.decision : "";
  if (!decision) {
    return {
      ok: false,
      status: "invalid_input",
      message: "Basis preview decision must be confirm or reject.",
    };
  }

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
    const existingBasis = normalizeBasisRecord(snapshot.basisVersions[index], workspaceId);
    const nextPreview = normalizeBasisIngestionPreview(
      {
        ...existingBasis.ingestionPreview,
        facts: input.facts ?? existingBasis.ingestionPreview?.facts,
        factSummary: input.factSummary ?? existingBasis.ingestionPreview?.factSummary,
        missingFields: input.missingFields ?? existingBasis.ingestionPreview?.missingFields,
        confidence: input.confidence ?? existingBasis.ingestionPreview?.confidence,
        status: decision === "confirm" ? "confirmed" : "rejected",
        confirmedBy: input.actorId ?? input.reviewerId ?? existingBasis.confirmedBy,
        confirmedAt: decision === "confirm" ? now : existingBasis.confirmedAt,
        safeNote: input.safeNote ?? existingBasis.safeNote,
        nextAction:
          decision === "confirm"
            ? "Publish the confirmed basis version before formal matching."
            : "Upload or correct the basis source before it can be published.",
      },
      existingBasis,
    );
    const nextBasis = normalizeBasisRecord(
      {
        ...existingBasis,
        status: decision === "confirm" ? "confirmed" : "rejected",
        confirmedBy: decision === "confirm" ? input.actorId ?? input.reviewerId ?? existingBasis.confirmedBy : existingBasis.confirmedBy,
        confirmedAt: decision === "confirm" ? now : existingBasis.confirmedAt,
        safeNote: input.safeNote ?? existingBasis.safeNote,
        ingestionPreview: nextPreview,
      },
      workspaceId,
    );
    const nextBasisVersions = [...snapshot.basisVersions];
    nextBasisVersions[index] = nextBasis;

    return {
      snapshot: {
        ...snapshot,
        basisVersions: nextBasisVersions,
      },
      value: {
        ok: true,
        basisVersion: nextBasis,
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
    if (existing && isKnowledgeBaseReadyForFormalReview(existing)) {
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

  if (existingKnowledgeBaseId) {
    const existing = workspaceKnowledgeBases.find((item) => item.id === existingKnowledgeBaseId);
    if (existing) {
      return {
        knowledgeBaseRef: normalizeKnowledgeBaseRef(existing, workspaceId),
        resolution: "reused_existing_provisional",
        selectedKnowledgeBaseId: existing.id,
      };
    }
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

function resolveChecklistDefinitionForIntake(input, packet, basisVersion, requiredMasterData = [], existingTask = null) {
  const explicitChecklistDefinition =
    Array.isArray(input.checklistItems) && input.checklistItems.length > 0
      ? input.checklistItems
          .map((item, index) => normalizeChecklistItem(item, index))
          .filter(Boolean)
          .slice(0, MAX_CHECKLIST_ITEMS)
      : [];
  if (explicitChecklistDefinition.length > 0) {
    return {
      checklistDefinition: explicitChecklistDefinition,
      resolution: "direct_input",
    };
  }

  const derivedChecklist = deriveOpeningConditionPilotChecklistDefinition({
    checklistObject: packet?.checklistObject,
    basisVersionId: basisVersion?.id ?? "",
    requiredMasterData,
  });
  const derivedChecklistDefinition = Array.isArray(derivedChecklist.checklistItems)
    ? derivedChecklist.checklistItems
        .map((item, index) => normalizeChecklistItem(item, index))
        .filter(Boolean)
        .slice(0, MAX_CHECKLIST_ITEMS)
    : [];
  if (derivedChecklistDefinition.length > 0) {
    return {
      checklistDefinition: derivedChecklistDefinition,
      resolution: derivedChecklist.resolution,
      templateId: derivedChecklist.templateId,
    };
  }

  const existingChecklistDefinition = Array.isArray(existingTask?.checklistDefinition)
    ? existingTask.checklistDefinition
        .map((item, index) => normalizeChecklistItem(item, index))
        .filter(Boolean)
        .slice(0, MAX_CHECKLIST_ITEMS)
    : [];
  if (existingChecklistDefinition.length > 0) {
    return {
      checklistDefinition: existingChecklistDefinition,
      resolution: "reused_existing_task",
    };
  }

  return {
    checklistDefinition: [],
    resolution: "manual_definition_required",
  };
}

function isZipSourceObject(objectRef) {
  const fileName = String(objectRef?.fileName ?? "").toLowerCase();
  const contentType = String(objectRef?.contentType ?? "").toLowerCase();
  return fileName.endsWith(".zip") || contentType.includes("zip") || contentType.includes("compressed");
}

async function resolvePacketInventoryFromSourceObjects(sourceObjects = [], options = {}) {
  const maxEntries = normalizeNumber(options.maxEntries, MAX_PACKET_INVENTORY_ENTRIES, MAX_PACKET_INVENTORY_ENTRIES);
  const readObjectBuffer = options.readObjectBuffer ?? readDocumentObjectBuffer;
  const inventoryEntries = [];
  let usedZipManifest = false;
  let fallbackReason;

  for (const sourceObject of sourceObjects) {
    if (inventoryEntries.length >= maxEntries) {
      break;
    }

    if (!isZipSourceObject(sourceObject)) {
      inventoryEntries.push(derivePacketInventoryEntryFromSourceObject(sourceObject, inventoryEntries.length));
      continue;
    }

    if (!sourceObject.storageKey) {
      fallbackReason ||= "zip_storage_key_missing";
      inventoryEntries.push(derivePacketInventoryEntryFromSourceObject(sourceObject, inventoryEntries.length));
      continue;
    }

    try {
      const loadedObject = await readObjectBuffer(sourceObject.storageKey);
      const remainingSlots = maxEntries - inventoryEntries.length;
      const zipEntries = await extractOpeningConditionZipManifestEntries(loadedObject.buffer, {
        sourceObjectId: sourceObject.objectId,
        maxEntries: remainingSlots,
      });

      if (zipEntries.length > 0) {
        inventoryEntries.push(...zipEntries);
        usedZipManifest = true;
        continue;
      }

      fallbackReason ||= "zip_manifest_empty";
    } catch (error) {
      fallbackReason ||= "zip_manifest_extract_failed";
    }

    inventoryEntries.push(derivePacketInventoryEntryFromSourceObject(sourceObject, inventoryEntries.length));
  }

  return {
    inventoryEntries: inventoryEntries.slice(0, maxEntries),
    inventoryResolution: usedZipManifest ? "derived_from_zip_manifest" : "derived_from_source_objects",
    inventoryFallbackReason: usedZipManifest ? undefined : fallbackReason,
  };
}

async function buildPilotPacketFromIntakeInput(taskId, context, input = {}, options = {}) {
  const rawPacket = {
    id: input.packetId ?? `${taskId}-packet`,
    checklistObject: input.checklistObject,
    sourceObjects: Array.isArray(input.sourceObjects) ? input.sourceObjects : [],
    submittedBy: input.submittedBy,
    submittedAt: input.submittedAt,
  };
  const basePacket = normalizePacket(rawPacket, taskId, context.workspaceId, { skipDefaultInventoryResolution: true });
  if (!basePacket) {
    return {
      packet: undefined,
      inventoryResolution: "derived_from_source_objects",
      inventoryFallbackReason: undefined,
    };
  }

  const resolvedInventory = Array.isArray(input.inventoryEntries)
    ? {
        inventoryEntries: input.inventoryEntries,
        inventoryResolution: "direct_input",
        inventoryFallbackReason: undefined,
      }
    : await resolvePacketInventoryFromSourceObjects(basePacket.sourceObjects, options);

  return {
    packet: normalizePacket(
      {
        ...rawPacket,
        inventoryEntries: resolvedInventory.inventoryEntries,
      },
      taskId,
      context.workspaceId,
      { skipDefaultInventoryResolution: true },
    ),
    inventoryResolution: resolvedInventory.inventoryResolution,
    inventoryFallbackReason: resolvedInventory.inventoryFallbackReason,
  };
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

function normalizeTrialMasterDataRecord(value, context, index = 0) {
  if (!isPlainObject(value)) {
    return null;
  }

  const id = normalizeString(value.id, `trial-master-data-${index + 1}`, 180);
  return {
    id,
    workspaceId: context.workspaceId,
    type: normalizeString(value.type, index === 1 ? "equipment" : "personnel", 100),
    label: normalizeString(value.label, id, 240),
    normalizedFields: sanitizeOpeningConditionPilotValue(value.normalizedFields ?? {
      source: "single_project_trial_bootstrap",
      projectId: context.projectId,
      contractPackageId: context.contractPackageId,
      participatingOrganizationId: context.participatingOrganizationId,
    }),
    status: ["published", "human_approved"].includes(value.status) ? value.status : "human_approved",
    validity: normalizeString(value.validity, "试点操作员确认，生产环境需由 OCR/人工正式确认后发布。", 300),
    confidence: ["high", "medium", "low"].includes(value.confidence) ? value.confidence : "medium",
    safeNote: normalizeString(
      value.safeNote,
      "单项目试点初始化生成的主数据，用于跑通人员/设备授权门禁；生产环境需替换为正式主数据确认流程。",
      500,
    ),
  };
}

function buildDefaultTrialMasterDataRecords(context, basisObject) {
  const basisFileName = basisObject?.fileName ?? "合同依据";
  return [
    {
      id: `${context.workspaceId}-trial-personnel`,
      type: "personnel",
      label: "试点人员范围：项目管理人员、专职安全员、特种作业人员",
      validity: `依据 ${basisFileName} 由操作员试点确认。`,
    },
    {
      id: `${context.workspaceId}-trial-equipment`,
      type: "equipment",
      label: "试点设备范围：汽车吊、起重设备、泵车、检测仪器",
      validity: `依据 ${basisFileName} 由操作员试点确认。`,
    },
    {
      id: `${context.workspaceId}-trial-approval-document`,
      type: "system_document",
      label: "试点制度资料：开工申请审批表、签章文件",
      validity: `依据 ${basisFileName} 由操作员试点确认。`,
    },
  ];
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

  const packetResolution = context ? await buildPilotPacketFromIntakeInput(taskId, context, input, options) : undefined;
  const packet = packetResolution?.packet;
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
    const checklistResolution = resolveChecklistDefinitionForIntake(
      input,
      packet,
      basisVersion,
      masterDataResolution.boundRefs,
      existingTask,
    );
    const checklistDefinition = checklistResolution.checklistDefinition;
    const inventoryResolution = packetResolution?.inventoryResolution ?? "derived_from_source_objects";
    const inventoryFallbackReason = packetResolution?.inventoryFallbackReason;

    const nextTaskState = deriveInitialState(
      {
        context,
        basisVersion,
        requiredMasterData: masterDataResolution.boundRefs,
        knowledgeBaseRef: knowledgeBaseResolution.knowledgeBaseRef,
        packet,
        checklistDefinition,
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
      inventoryResolution,
      inventoryEntryCount: packet.inventoryEntries.length,
      inventoryFallbackReason,
      checklistDefinitionCount: checklistDefinition.length,
      checklistDefinitionResolution: checklistResolution.resolution,
      selectedChecklistTemplateId: checklistResolution.templateId,
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
        inventoryResolution,
        inventoryEntryCount: packet.inventoryEntries.length,
        inventoryFallbackReason,
        checklistDefinitionCount: checklistDefinition.length,
        checklistDefinitionResolution: checklistResolution.resolution,
        checklistTemplateId: checklistResolution.templateId,
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
        inventoryResolution,
        inventoryEntryCount: packet.inventoryEntries.length,
        inventoryFallbackReason,
        inventoryFileNames: packet.inventoryEntries.map((item) => item.fileName).slice(0, 30),
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
      checklistDefinition,
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

export async function bootstrapOpeningConditionPilotTrial(input = {}, options = {}) {
  const context = normalizeWorkspaceContext(input.context);
  const basisObject = normalizeObjectRef(input.basisObject);
  const checklistObject = normalizeObjectRef(input.checklistObject);
  const sourceObjects = Array.isArray(input.sourceObjects)
    ? input.sourceObjects.map(normalizeObjectRef).filter(Boolean).slice(0, MAX_OBJECTS_PER_PACKET)
    : [];
  const errors = [];

  if (!context) {
    errors.push("workspace context with workspaceId, tenantId, projectId, contractPackageId, and participatingOrganizationId is required");
  }
  if (!basisObject) {
    errors.push("basisObject with objectId and fileName is required");
  }
  if (!checklistObject) {
    errors.push("checklistObject with objectId and fileName is required");
  }
  if (sourceObjects.length === 0) {
    errors.push("at least one material-packet source object is required");
  }

  if (errors.length > 0) {
    return {
      ok: false,
      status: "invalid_input",
      message: "A valid single-project trial bootstrap request is required.",
      errors,
    };
  }

  const taskId = normalizeString(input.taskId, `oc-pilot-${context.workspaceId}`, 180);
  const basisId = normalizeString(input.basisId, `${context.workspaceId}-basis-contract`, 180);
  const explicitKnowledgeBaseId = normalizeString(input.knowledgeBaseId, "", 180);
  const defaultKnowledgeBaseId = normalizeString(input.defaultKnowledgeBaseId, `${context.workspaceId}-subcontract-kb`, 180);
  const submittedBy = normalizeString(input.submittedBy, "pilot-user", 160);
  const basisIngestionPreview = buildBasisIngestionPreviewFromSourceObject(basisObject, context, {
    ...input,
    submittedBy,
  });
  const masterDataRecords = (
    Array.isArray(input.masterDataRecords) && input.masterDataRecords.length > 0
      ? input.masterDataRecords
      : buildDefaultTrialMasterDataRecords(context, basisObject)
  )
    .map((item, index) => normalizeTrialMasterDataRecord(item, context, index))
    .filter(Boolean)
    .slice(0, 20);

  const upsertedBasis = await upsertOpeningConditionPilotBasisVersion(
    context.workspaceId,
    basisId,
    {
      title: normalizeString(input.basisTitle, "单项目试点合同与资质依据", 240),
      componentType: "contract_basis",
      version: normalizeString(input.basisVersion, "trial-published", 120),
      status: "confirmed",
      sourceObject: basisObject,
      applicability: normalizeString(
        input.basisApplicability,
        "用于确认本次开工条件试点的合同主体、资质边界、人员设备范围和资料核查依据。",
        500,
      ),
      confidence: "medium",
      ingestionPreview: basisIngestionPreview,
      safeNote: "由单项目试点初始化入口写入，生产环境需经过正式依据确认流程。",
    },
    options,
  );
  if (!upsertedBasis.ok) {
    return upsertedBasis;
  }

  const publishedBasis = await publishOpeningConditionPilotBasisVersion(
    context.workspaceId,
    basisId,
    { actorId: submittedBy },
    options,
  );
  if (!publishedBasis.ok) {
    return publishedBasis;
  }

  const savedMasterData = [];
  for (const record of masterDataRecords) {
    const result = await upsertOpeningConditionPilotMasterDataRecord(context.workspaceId, record.id, record, options);
    if (!result.ok) {
      return result;
    }
    savedMasterData.push(result.masterDataRecord);
  }

  const providerRefs = normalizeProviderRefs(
    Array.isArray(input.knowledgeBaseProviderRefs)
      ? input.knowledgeBaseProviderRefs
      : input.knowledgeBaseProviderRef
        ? [input.knowledgeBaseProviderRef]
        : [],
  );
  const snapshot = await readSnapshot(options.storePath);
  const reusableKnowledgeBaseResolution = resolveKnowledgeBaseForIntake(
    snapshot,
    context.workspaceId,
    explicitKnowledgeBaseId,
    "",
  );
  const reusableKnowledgeBase =
    providerRefs.length === 0 &&
    isKnowledgeBaseReadyForFormalReview(reusableKnowledgeBaseResolution.knowledgeBaseRef)
      ? reusableKnowledgeBaseResolution.knowledgeBaseRef
      : undefined;
  const knowledgeBaseId = (reusableKnowledgeBase?.id ?? explicitKnowledgeBaseId) || defaultKnowledgeBaseId;
  const knowledgeBase = reusableKnowledgeBase
    ? {
        ok: true,
        knowledgeBase: reusableKnowledgeBase,
      }
    : await upsertOpeningConditionPilotKnowledgeBase(
    context.workspaceId,
    knowledgeBaseId,
    {
      workspaceId: context.workspaceId,
      organizationId: context.participatingOrganizationId,
      contractPackageId: context.contractPackageId,
      subcontractTeamId: normalizeString(input.subcontractTeamId, context.participatingOrganizationId, 160),
      label: normalizeString(input.knowledgeBaseLabel, "单项目试点分包队伍知识库", 240),
      status: providerRefs.some((item) => item.syncStatus === "ready") ? "ready" : "needs_review",
      summary: normalizeString(
        input.knowledgeBaseSummary,
        "保存本次试点资料模板、证据摘要、人工修正和 MaxKB 检索支撑引用。",
        500,
      ),
      providerRefs,
    },
    options,
  );
  if (!knowledgeBase.ok) {
    return knowledgeBase;
  }

  const intake = await initializeOpeningConditionPilotTaskIntake(
    {
      taskId,
      context,
      basisVersionId: basisId,
      knowledgeBaseId,
      requiredMasterDataIds: savedMasterData.map((item) => item.id),
      checklistObject,
      sourceObjects,
      submittedBy,
    },
    options,
  );

  return {
    ...intake,
    bootstrap: sanitizeOpeningConditionPilotValue({
      taskId,
      workspaceId: context.workspaceId,
      basisId,
      knowledgeBaseId,
      masterDataIds: savedMasterData.map((item) => item.id),
      sourceObjectCount: sourceObjects.length,
      providerRefCount: providerRefs.length,
      knowledgeBaseResolution: reusableKnowledgeBase ? "reused_ready_workspace_kb" : "upserted_trial_kb",
      nextHandoff: "OCR Worker batch ingestion and MaxKB retrieval-check can be attached to this task in the next slice.",
    }),
  };
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
  return mutateSnapshot(async (snapshot) => {
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
    const packetResolution = await buildPilotPacketFromIntakeInput(
      taskId,
      existingTask.context,
      input.packet ?? input,
      options,
    );
    const packet = packetResolution.packet;
    const inventoryResolution = packetResolution.inventoryResolution;
    const inventoryFallbackReason = packetResolution.inventoryFallbackReason;
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
          inventoryResolution,
          inventoryEntryCount: packet.inventoryEntries.length,
          inventoryFallbackReason,
          inventoryFileNames: packet.inventoryEntries.map((item) => item.fileName).slice(0, 30),
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
      ? input.checklistItems.map((item, index) => normalizeChecklistItem(item, index)).filter(Boolean).slice(0, MAX_CHECKLIST_ITEMS)
      : existingTask.checklistDefinition ?? [];
    if (checklistItems.length === 0) {
      return {
        snapshot,
        value: {
          ok: false,
          status: "invalid_input",
          message: "A stored or request-level checklist definition is required for deterministic matching.",
        },
      };
    }

    const basisVersionId = existingTask.basisVersion?.id ?? "";
    const packetCandidates = buildPacketMatchCandidates(existingTask.packet);
    const evidence = [];
    const humanReviewQueue = [];
    const checkItems = checklistItems.map((item, itemIndex) => {
      if (isOutOfScopeChecklistItem(item)) {
        return applyIssueTaxonomyToCheckItem({
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
        }, "not_applicable");
      }

      const scoredMatches = packetCandidates
        .map((candidate) => ({
          ...candidate,
          score: getMatchScore(item, candidate.objectRef),
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
          locator: match.entry.relativePath || "资料包文件清单",
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
          targetLabel: item.name,
          category: item.category,
          subCategory: item.subCategory,
          ruleExplanation: item.ruleExplanation ?? `正式核查项：${item.name}`,
          expectedEvidenceHints: item.expectedEvidenceHints,
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

      return applyIssueTaxonomyToCheckItem({
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
      }, finalDisposition);
    });
    const finalState = humanReviewQueue.length > 0 ? "awaiting_human_review" : "report_ready";
    const startSequence = existingTask.events.length + 1;
    const events = [
      createMatchEvent(taskId, startSequence, "extraction.completed", "extracting", "资料包文件清单已归一化。", 35, {
        sourceObjectCount: existingTask.packet.sourceObjects.length,
        inventoryEntryCount: existingTask.packet.inventoryEntries.length,
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
      checklistDefinition: checklistItems,
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

    if (existingTask.state !== "report_ready") {
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
    const reportTask = normalizeOpeningConditionPilotTask(existingTask) ?? existingTask;
    const summary = summarizePilotCheckItems(reportTask.checkItems);
    const reportAsset = normalizeReportAsset(
      {
        id: input.id ?? `report-${taskId}`,
        taskId,
        title: input.title ?? "开工条件核查内部辅助意见",
        status: "ready",
        summary,
        objectRef: input.objectRef,
        packageDiagnostics: input.packageDiagnostics ?? deriveReportPackageDiagnostics(reportTask, summary, "ready"),
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
          basisVersionId: reportTask.basisVersion?.id,
        },
      },
      taskId,
      sequence,
    );
    const nextTask = normalizeOpeningConditionPilotTask({
      ...reportTask,
      state: "report_ready",
      reportAsset,
      updatedAt: now,
      events: [...reportTask.events, event],
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

export async function recordOpeningConditionPilotReportDocumentExport(taskId, input = {}, options = {}) {
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
          message: "A report asset is required before exporting a DOCX report.",
        },
      };
    }

    const generatedObject = normalizeObjectRef({
      objectId: input.objectId ?? input.fileKey ?? `report-docx-${taskId}`,
      kind: "report",
      fileName: input.fileName ?? `${taskId}.docx`,
      storageKey: input.fileKey,
      contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      sizeBytes: input.fileSize,
      summary: "DOCX report generated by the configured HTTP tools adapter.",
    });
    if (!generatedObject) {
      return {
        snapshot,
        value: {
          ok: false,
          status: "invalid_export_result",
          message: "DOCX export result did not include a valid generated file reference.",
        },
      };
    }

    const now = new Date().toISOString();
    const currentDiagnostics =
      existingTask.reportAsset.packageDiagnostics ??
      deriveReportPackageDiagnostics(existingTask, existingTask.reportAsset.summary, existingTask.state === "archived" ? "archived" : "ready");
    const currentHandoff =
      currentDiagnostics.exportHandoff ??
      deriveReportExportHandoff(
        existingTask,
        currentDiagnostics.findings ?? [],
        existingTask.trialPackage,
        existingTask.state === "archived" ? "archived" : "ready",
      );
    const safeDiagnostics = [
      ...(currentHandoff?.safeDiagnostics ?? []),
      ...(Array.isArray(input.safeDiagnostics) ? input.safeDiagnostics : []),
      `exportedAt:${now}`,
    ]
      .filter(Boolean)
      .slice(-20);
    const exportHandoff = normalizeReportExportHandoff({
      ...currentHandoff,
      deliveryKind: "docx_export",
      status: "exported",
      generatedObject,
      safeDiagnostics,
      nextAction: "DOCX 报告已生成，可通过本次导出的下载链接交付；原表回填仍需单独适配。",
    });
    const reportAsset = normalizeReportAsset(
      {
        ...existingTask.reportAsset,
        objectRef: generatedObject,
        packageDiagnostics: {
          ...currentDiagnostics,
          exportHandoff,
        },
      },
      taskId,
    );
    const sequence = existingTask.events.length + 1;
    const event = normalizeEvent(
      {
        id: `oc-event-${taskId}-${sequence}`,
        taskId,
        sequence,
        type: "report.exported",
        state: existingTask.state,
        occurredAt: now,
        message: "DOCX report export completed.",
        progress: existingTask.state === "archived" ? 100 : 95,
        safeDiagnostics: {
          reportId: reportAsset.id,
          fileKey: generatedObject.storageKey,
          fileName: generatedObject.fileName,
          fileSize: generatedObject.sizeBytes,
        },
      },
      taskId,
      sequence,
    );
    const nextTask = normalizeOpeningConditionPilotTask({
      ...existingTask,
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
        exportHandoff,
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
        packageDiagnostics: {
          ...existingTask.reportAsset.packageDiagnostics,
          archiveStatus: "archived",
        },
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
