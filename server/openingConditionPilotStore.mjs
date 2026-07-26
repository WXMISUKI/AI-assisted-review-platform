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
    projectName: getProviderPayloadValue(factsPayload, ["projectName", "project_name", "瀹搞儳鈻奸崥宥囆?, "妞ゅ湱娲伴崥宥囆?]),
    projectId:
      getProviderPayloadValue(factsPayload, ["projectId", "project_id", "projectCode", "project_code"]) ||
      context.projectId,
    contractPackageId:
      getProviderPayloadValue(factsPayload, [
        "contractPackageId",
        "contract_package_id",
        "contractPackage",
        "contract_package",
        "閺嶅洦顔?,
        "閸氬牆鎮?,
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
      "閺傝棄浼愰崡鏇氱秴",
      "閸掑棗瀵橀崡鏇氱秴",
    ]),
    basisFileName: sourceObject?.fileName,
    qualificationScope: getProviderPayloadValue(factsPayload, [
      "qualificationScope",
      "qualification_scope",
      "contractScope",
      "contract_scope",
      "鐠у嫯宸濋懠鍐ㄦ纯",
      "鐠у嫯宸濇潏鍦櫕",
      "閹靛灝瀵橀懠鍐ㄦ纯",
    ]),
    personnelScope: getProviderPayloadValue(factsPayload, [
      "personnelScope",
      "personnel_scope",
      "娴滃搫鎲抽懠鍐ㄦ纯",
      "娴滃搫鎲抽柊宥囩枂",
    ]),
    equipmentScope: getProviderPayloadValue(factsPayload, [
      "equipmentScope",
      "equipment_scope",
      "鐠佹儳顦懠鍐ㄦ纯",
      "閺堢儤顫拋鎯ь槵",
    ]),
    effectivePeriod: getProviderPayloadValue(factsPayload, [
      "effectivePeriod",
      "effective_period",
      "validity",
      "validUntil",
      "閺堝鏅?,
      "閺堝鏅ラ張鐔兼",
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
      /项目名称[:：\s]+([^\n\r;；。]{2,80})/,
      /工程名称[:：\s]+([^\n\r;；。]{2,80})/,
      /项目[:：\s]+([^\n\r;；。]{2,80})/,
    ]) ||
    normalizeString(context.projectName, "", 240) ||
    normalizeString(context.projectId, "", 180) ||
    sourceSummary;
  const participantEntityName =
    firstTextMatch(safeText, [
      /施工单位[:：\s]+([^\n\r;；。]{2,80})/,
      /分包单位[:：\s]+([^\n\r;；。]{2,80})/,
      /参建单位[:：\s]+([^\n\r;；。]{2,80})/,
      /单位名称[:：\s]+([^\n\r;；。]{2,80})/,
    ]) ||
    normalizeString(context.participatingOrganizationName, "", 240) ||
    normalizeString(context.participatingOrganizationId, "", 180);
  const qualificationScope =
    firstTextMatch(safeText, [
      /资质边界[:：\s]+([^\n\r;；。]{2,120})/,
      /资质范围[:：\s]+([^\n\r;；。]{2,120})/,
      /合同主体[:：\s]+([^\n\r;；。]{2,120})/,
      /承包范围[:：\s]+([^\n\r;；。]{2,120})/,
    ]) ||
    normalizeString(input.qualificationScope, "", 500);
  const personnelScope =
    firstTextMatch(safeText, [
      /人员范围[:：\s]+([^\n\r;；。]{2,120})/,
      /人员配置[:：\s]+([^\n\r;；。]{2,120})/,
      /项目管理人员[:：\s]+([^\n\r;；。]{2,120})/,
    ]) ||
    normalizeString(input.personnelScope, "", 500);
  const equipmentScope =
    firstTextMatch(safeText, [
      /设备范围[:：\s]+([^\n\r;；。]{2,120})/,
      /机械设备[:：\s]+([^\n\r;；。]{2,120})/,
      /起重设备[:：\s]+([^\n\r;；。]{2,120})/,
    ]) ||
    normalizeString(input.equipmentScope, "", 500);
  const effectivePeriod =
    firstTextMatch(safeText, [
      /有效期[:：\s]+([^\n\r;；。]{2,80})/,
      /起止时间[:：\s]+([^\n\r;；。]{2,80})/,
      /有效期限[:：\s]+([^\n\r;；。]{2,80})/,
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
    title: normalizeString(value.title, "閺堫亜鎳￠崥宥勭贩", 240),
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

function deriveMasterDataLifecycle(status) {
  switch (status) {
    case "published":
      return {
        lifecycleLabel: "Published reusable workspace fact",
        readinessGroup: "published",
        nextAction: "Use this record as reusable master data for future runs in this workspace.",
      };
    case "human_approved":
      return {
        lifecycleLabel: "Confirmed for current pilot run",
        readinessGroup: "current_run_confirmed",
        nextAction: "Formal matching can use this run-scoped confirmation; publish later if it should become reusable.",
      };
    case "confirmed":
      return {
        lifecycleLabel: "Confirmed, waiting for publication",
        readinessGroup: "ready_to_publish",
        nextAction: "Publish this confirmed record to the reusable workspace catalog.",
      };
    case "rejected":
      return {
        lifecycleLabel: "Rejected candidate",
        readinessGroup: "exception",
        nextAction: "Exclude this candidate and upload or extract a corrected source if the fact is still required.",
      };
    case "expired":
      return {
        lifecycleLabel: "Expired or invalid candidate",
        readinessGroup: "exception",
        nextAction: "Upload current evidence and create a corrected candidate before formal reuse.",
      };
    default:
      return {
        lifecycleLabel: "Candidate awaiting confirmation",
        readinessGroup: "pending_confirmation",
        nextAction: "Review the candidate facts, then confirm, publish, or reject this record.",
      };
  }
}

function normalizeMasterDataPreviewFact(value, fallbackIndex = 0) {
  if (isPlainObject(value)) {
    const label = normalizeString(value.label ?? value.name ?? value.key, `fact-${fallbackIndex + 1}`, 120);
    const factValue = normalizeString(value.value ?? value.text ?? value.summary, "", 240);
    if (!label && !factValue) {
      return null;
    }
    return {
      label,
      value: factValue || label,
      confidence: ["high", "medium", "low"].includes(value.confidence) ? value.confidence : undefined,
      source: normalizeString(value.source, "", 180) || undefined,
    };
  }

  const factValue = normalizeString(value, "", 240);
  return factValue
    ? {
        label: `fact-${fallbackIndex + 1}`,
        value: factValue,
      }
    : null;
}

function deriveMasterDataFacts(normalizedFields) {
  if (!isPlainObject(normalizedFields)) {
    return [];
  }

  return Object.entries(normalizedFields)
    .filter(([, value]) => typeof value === "string" || typeof value === "number" || typeof value === "boolean")
    .map(([key, value]) =>
      normalizeMasterDataPreviewFact({
        label: key,
        value: String(value),
      }),
    )
    .filter(Boolean)
    .slice(0, 12);
}

function normalizeMasterDataSourceEvidence(value, fallbackEvidenceRefs = []) {
  const explicitSources = Array.isArray(value)
    ? value
        .map((item) => {
          if (isPlainObject(item)) {
            return (
              normalizeString(item.fileName ?? item.objectName ?? item.id ?? item.summary, "", 180) ||
              normalizeString(item.safeLabel, "", 180)
            );
          }
          return normalizeString(item, "", 180);
        })
        .filter(Boolean)
    : [];

  if (explicitSources.length > 0) {
    return explicitSources.slice(0, 8);
  }

  return fallbackEvidenceRefs
    .map((item) => normalizeString(item.fileName ?? item.objectName ?? item.id, "", 180))
    .filter(Boolean)
    .slice(0, 8);
}

function normalizeMasterDataPreview(value, fallback = {}) {
  const preview = isPlainObject(value) ? value : {};
  const lifecycle = deriveMasterDataLifecycle(fallback.status);
  const facts = Array.isArray(preview.facts)
    ? preview.facts.map(normalizeMasterDataPreviewFact).filter(Boolean).slice(0, 12)
    : deriveMasterDataFacts(fallback.normalizedFields);
  const sourceEvidence = normalizeMasterDataSourceEvidence(preview.sourceEvidence, fallback.evidenceRefs);
  const missingFields = Array.isArray(preview.missingFields)
    ? preview.missingFields.map((item) => normalizeString(item, "", 120)).filter(Boolean).slice(0, 20)
    : facts.length === 0
      ? ["structured_fact_summary"]
      : [];

  return sanitizeOpeningConditionPilotValue({
    status: normalizeString(preview.status, fallback.status ?? "provisional", 80),
    lifecycleLabel: lifecycle.lifecycleLabel,
    readinessGroup: lifecycle.readinessGroup,
    sourceEvidence,
    facts,
    missingFields,
    confidence: ["high", "medium", "low"].includes(preview.confidence) ? preview.confidence : fallback.confidence ?? "medium",
    nextAction: lifecycle.nextAction,
    safeNote: normalizeString(preview.safeNote, fallback.safeNote ?? fallback.rejectionReason ?? "", 500) || undefined,
    provenance: sanitizeOpeningConditionPilotValue(preview.provenance ?? {
      extractor: "opening-condition-pilot-store",
      source: facts.length > 0 ? "normalized_fields" : "record_metadata",
    }),
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
  const confidence = ["high", "medium", "low"].includes(value.confidence) ? value.confidence : "medium";
  const normalizedFields = sanitizeOpeningConditionPilotValue(value.normalizedFields ?? {});
  const evidenceRefs = Array.isArray(value.evidenceRefs)
    ? value.evidenceRefs.map(normalizeObjectRef).filter(Boolean).slice(0, 50)
    : [];
  const validity = normalizeString(value.validity, "", 300);
  const safeNote = normalizeString(value.safeNote, "", 500) || undefined;
  const rejectionReason = normalizeString(value.rejectionReason, "", 500) || undefined;
  const preview = normalizeMasterDataPreview(value.preview, {
    status,
    type: value.type,
    label: value.label,
    normalizedFields,
    evidenceRefs,
    validity,
    confidence,
    safeNote,
    rejectionReason,
  });

  return sanitizeOpeningConditionPilotValue({
    id,
    workspaceId: resolvedWorkspaceId,
    type: normalizeString(value.type, "system_document", 100),
    label: normalizeString(value.label, id, 240),
    normalizedFields,
    status,
    evidenceRefs,
    validity,
    confidence,
    confirmedBy: normalizeString(value.confirmedBy, "", 160) || undefined,
    confirmedAt: normalizeString(value.confirmedAt, "", 80) || undefined,
    publishedBy: normalizeString(value.publishedBy, "", 160) || undefined,
    publishedAt: normalizeString(value.publishedAt, "", 80) || undefined,
    rejectionReason,
    safeNote,
    preview,
    lifecycleLabel: preview.lifecycleLabel,
    readinessGroup: preview.readinessGroup,
    nextAction: preview.nextAction,
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
    category: normalizeString(source.category, "鐠у嫭鏋￠弽鍛婄叀", 160),
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
    category: normalizeString(value.category, "鐠у嫭鏋￠弽鍛婄叀", 160),
    subCategory: normalizeString(value.subCategory, "", 120) || undefined,
    name: normalizeString(value.name ?? value.content, "閺堫亜鎳￠崥宥嗙壋閺屻儵銆?, 240),
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
  return /閻滄澘婧€閺嶅憡鐓閻滄澘婧€濡偓閺岊殏閻滄澘婧€绾喛顓粅鎼存梹鈧儱鎼锋惔鏀熸惔鏃€鈧儲绱ㄧ紒鍎勬惔鏃€鈧儱顦╃純鐣栭悳鏉挎簚鐟欏倹绁?.test(text);
}

function isResourceChecklistItem(checklistItem) {
  const text = getChecklistReviewText(checklistItem);
  return /娴滃搫鎲硘鐎瑰鍙忛崨姒洪悧鍦潚娴ｆ粈绗焲娴ｆ粈绗熸禍鍝勬喅|缁狅紕鎮婃禍鍝勬喅|鐠佹儳顦瑋閺堢儤顫珅鐠х兘鍣竱濮瑰€熸簠閸氬Α濞変絻婧厊娴狀亜娅?.test(text);
}

function getAuthorizedMasterDataIds(task, checklistItem) {
  const authorizedIds = new Set(task.requiredMasterData.map((record) => record.id));
  return checklistItem.masterDataIds.filter((masterDataId) => authorizedIds.has(masterDataId));
}

/*
function getVisualAssertionType(checklistItem) {
  const text = getChecklistReviewText(checklistItem);
  if (/閻╂牜鐝穦閸忣剛鐝穦閸楁壆鐝穦/.test(text)) return "stamp";
  if (/缁涙儳鐡缁涙儳鎮?.test(text)) return "signature";
  if (/閸曢箖鈧閹垫挸瀣€|閸曠窏婢?.test(text)) return "checkbox";
  if (/閹靛鍟撻弮銉︽埂|閺冦儲婀?.test(text)) return "handwritten_date";
  if (/缁涘墽鐝穦閻╂牕宓?.test(text)) return "seal";
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
  const stable = /濞撳懏娅殀鐎瑰本鏆瀹歌尙鈥樼拋顦㈢粵鍓х彿鐎瑰本鏆閻╂牜鐝风€瑰本鏆缁涙儳鐡х€瑰本鏆閸曢箖鈧鐣?.test(normalizedEvidenceText);
  const uncertain = matches.length === 0 || /閻ゆ垳鎶€|娑撳秵绔婚弲鐨樺Ο锛勭ˇ|娴ｅ海鐤嗘穱顢傞弮鐘崇《绾喛顓粅瀵板懐鈥?.test(normalizedEvidenceText);
  const status = stable && !uncertain ? "detected" : matches.length === 0 ? "missing" : "uncertain";
  const confidence = status === "detected" ? "high" : matches.length > 0 ? "low" : "low";

  return [
    normalizeVisualAssertion(
      {
        type,
        status,
        confidence,
        locator: matches.length > 0 ? "鐠у嫭鏋￠崠鍛瀮娴犺埖绔婚敓?/ 鐟欏棜顫庣憰浣虹閹芥顩? : "閺堫亜鎳℃稉顓犌旂€规俺顫嬬憴澶庮洣缁辩姾绁?,
        evidenceIds,
        requiresHumanReview: status !== "detected",
        note:
          status === "detected"
            ? "濡偓濞村鍩屾潏鍐旂€规氨娈戠憴鍡氼潕鐟曚胶绀岀€涙ê婀幀褝绱濇禒宥勭瑝娴狅綀銆冪€圭偘缍嬬粵鍓х彿閹存牜顒烽崥宥囨埂鐎圭偞婀侀弫鍫嫹?
            : "鐟欏棜顫庣憰浣虹鐎涙ê婀幀褎鍨ㄥ〒鍛珰鎼达缚绗夌搾绛圭礉闂団偓鐟曚椒姹夊銉р€樼拋?,
      },
      evidenceIds,
    ),
  ];
}

function buildSemanticNote(checklistItem, matches, verdict) {
  if (matches.length > 1) {
    return `鐎涙ê婀?${matches.length} 娑擃亜鈧瑩鈧绁弬娆欑礉闂団偓鐟曚椒姹夊銉р€樼拋銈嗘付閸戝棛鈥樼拠浣瑰祦閵嗕繖;
  }

  if (matches.length === 1) {
    return `鐠у嫭鏋￠崥宥囆炴稉?{checklistItem.name}閳ユ繂鐡ㄩ崷銊ュ讲鐟欙綁鍣撮崠褰掑帳閿涘奔绮涙禒銉潐閸掓瑨鐦夐幑顔昏礋閸戝棎鈧繖;
  }

  if (verdict === "fail" || verdict === "warning") {
    return `閺堫亜婀挧鍕灐閸栧懏绔婚崡鏇氳厬閹垫儳鍩?{checklistItem.name}閳ユ繄娈戠粙鍐茬暰閸栧綊鍘ら弬鍥︽閵嗕繖;
  }

  return "";
}

*/

function getVisualAssertionType(checklistItem) {
  const text = getChecklistReviewText(checklistItem);
  if (/閻╂牜鐝穦閸忣剛鐝穦閸楁壆鐝穦缁涘墽鐝?.test(text)) return "stamp";
  if (/缁涙儳鐡缁涙儳鎮?.test(text)) return "signature";
  if (/閸曢箖鈧閹垫挸瀣€|婢跺秹鈧?.test(text)) return "checkbox";
  if (/閹靛鍟撻弮銉︽埂|閺冦儲婀?.test(text)) return "handwritten_date";
  if (/缁涘墽鐝穦閻╂牕宓?.test(text)) return "seal";
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
  const stable = /濞撳懏娅殀鐎瑰本鏆瀹歌尙鈥樼拋顦㈢粵鍓х彿鐎瑰本鏆閻╂牜鐝风€瑰本鏆缁涙儳鐡х€瑰本鏆閸曢箖鈧鐣弫?.test(normalizedEvidenceText);
  const uncertain = matches.length === 0 || /閻ゆ垳鎶€|娑撳秵绔婚弲鐨樺Ο锛勭ˇ|娴ｅ海鐤嗘穱顢傞弮鐘崇《绾喛顓粅瀵板懐鈥樼拋?.test(normalizedEvidenceText);
  const status = stable && !uncertain ? "detected" : matches.length === 0 ? "missing" : "uncertain";
  const confidence = status === "detected" ? "high" : matches.length > 0 ? "low" : "low";

  return [
    normalizeVisualAssertion(
      {
        type,
        status,
        confidence,
        locator: matches.length > 0 ? "鐠у嫭鏋￠崠鍛瀮娴犺埖绔婚崡?/ 鐟欏棜顫庣憰浣虹閹芥顩? : "閺堫亜鎳℃稉顓犌旂€规俺顫嬬憴澶庮洣缁辩姾绁弬?,
        evidenceIds,
        requiresHumanReview: status !== "detected",
        note:
          status === "detected"
            ? "濡偓濞村鍩屾潏鍐旂€规氨娈戠憴鍡氼潕鐟曚胶绀岀€涙ê婀幀褝绱濇禒宥勭瑝娴狅綀銆冪€圭偘缍嬬粵鍓х彿閹存牜顒烽崥宥囨埂鐎圭偞婀侀弫鍫涒偓?
            : "鐟欏棜顫庣憰浣虹鐎涙ê婀幀褎鍨ㄥ〒鍛珰鎼达缚绗夌搾绛圭礉闂団偓鐟曚椒姹夊銉р€樼拋銈冣偓?,
      },
      evidenceIds,
    ),
  ];
}

function buildSemanticNote(checklistItem, matches, verdict) {
  if (matches.length > 1) {
    return `鐎涙ê婀?${matches.length} 娑擃亜鈧瑩鈧绁弬娆欑礉闂団偓鐟曚椒姹夊銉р€樼拋銈嗘付閸戝棛鈥樼拠浣瑰祦閵嗕繖;
  }

  if (matches.length === 1) {
    return `鐠у嫭鏋￠崥宥囆炴稉搴樷偓?{checklistItem.name}閳ユ繂鐡ㄩ崷銊ュ讲鐟欙綁鍣撮崠褰掑帳閿涘奔绮涙禒銉潐閸掓瑨鐦夐幑顔昏礋閸戝棎鈧繖;
  }

  if (verdict === "fail" || verdict === "warning") {
    return `閺堫亜婀挧鍕灐閸栧懏绔婚崡鏇氳厬閹垫儳鍩岄垾?{checklistItem.name}閳ユ繄娈戠粙鍐茬暰閸栧綊鍘ら弬鍥︽閵嗕繖;
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
    title: normalizeString(value.title, "瀵偓瀹搞儲娼禒鑸电壋閺屻儱鍞撮柈銊ㄧ窡閸斺晜鍓?, 240),
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
      "閺堫剛绮ㄩ弸婊€璐熼獮鍐插酱閺呴缚鍏樻潏鍛И鐎光剝鐓￠幇蹇氼潌閿涘奔绗夐弴澶稿敩閺傝棄浼愰崡鏇氱秴閵嗕胶娲冮悶鍡楀礋娴ｅ秴寮烽惄绋垮彠鐠愶絼鎹㈡禍铏规畱閺堚偓缂佸牆顓搁弽姝岀煑娴?,
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
    deliveryHandoff: normalizeReportDeliveryHandoff(value.deliveryHandoff),
    exportHandoff: normalizeReportExportHandoff(value.exportHandoff),
    deliveryPackage: normalizeReportDeliveryPackage(value.deliveryPackage),
    providerReadiness: normalizeTrialPackageProviderReadiness(value.providerReadiness),
    blockingReasons: normalizeStringList(value.blockingReasons, 30, 240),
    archiveStatus: ["pending", "ready", "archived"].includes(value.archiveStatus) ? value.archiveStatus : "pending",
    generatedAt: normalizeString(value.generatedAt, new Date().toISOString(), 80),
  });
}

function normalizeReportDeliveryPackageRow(value, index = 0) {
  if (!isPlainObject(value)) {
    return null;
  }

  const id = normalizeString(value.id, "", 180);
  const checkItem = normalizeString(value.checkItem, "", 240);
  const category = normalizeString(value.category, "", 180);
  const issueDescription = normalizeString(value.issueDescription, "", 500);
  const riskLabel = normalizeString(value.riskLabel, "", 120);
  const dispositionLabel = normalizeString(value.dispositionLabel, "", 160);
  const basis = normalizeString(value.basis, "", 500);
  const rectification = normalizeString(value.rectification, "", 500);
  if (!id || !checkItem || !category || !issueDescription || !riskLabel || !dispositionLabel || !basis || !rectification) {
    return null;
  }

  return sanitizeOpeningConditionPilotValue({
    sequence: normalizeNumber(value.sequence, index + 1, 10000),
    id,
    checkItem,
    category,
    issueDescription,
    riskLabel,
    dispositionLabel,
    basis,
    rectification,
    notes: normalizeStringList(value.notes, 8, 300),
  });
}

function normalizeReportDeliveryPackage(value) {
  if (!isPlainObject(value)) {
    return undefined;
  }

  const schemaVersion = normalizeString(value.schemaVersion, "", 120);
  const packageId = normalizeString(value.packageId, "", 220);
  const taskId = normalizeString(value.taskId, "", 180);
  const status = normalizeString(value.status, "", 80);
  const statusLabel = normalizeString(value.statusLabel, "", 180);
  const nextAction = normalizeString(value.nextAction, "", 500);
  const allowedStatuses = new Set(["empty", "blocked_by_review", "ready_for_handoff", "archived_ready"]);
  const rows = Array.isArray(value.rows)
    ? value.rows.map((row, index) => normalizeReportDeliveryPackageRow(row, index)).filter(Boolean).slice(0, 200)
    : [];

  if (schemaVersion !== "opening-condition-report-delivery-package.v1" || !packageId || !taskId || !allowedStatuses.has(status) || !statusLabel || !nextAction) {
    return undefined;
  }

  return sanitizeOpeningConditionPilotValue({
    schemaVersion,
    packageId,
    taskId,
    status,
    statusLabel,
    generatedAt: normalizeString(value.generatedAt, new Date().toISOString(), 80),
    readOnly: Boolean(value.readOnly),
    rowCount: normalizeNumber(value.rowCount, rows.length, MAX_CHECKLIST_ITEMS),
    blockingCount: normalizeNumber(value.blockingCount, 0, MAX_CHECKLIST_ITEMS),
    pendingHumanReviewCount: normalizeNumber(value.pendingHumanReviewCount, 0, MAX_CHECKLIST_ITEMS),
    adapterStatus: normalizeString(value.adapterStatus, "", 120) || undefined,
    nextAction,
    rows,
    safeDiagnostics: normalizeStringList(value.safeDiagnostics, 20, 300),
  });
}

function normalizeReportDeliveryHandoff(value) {
  if (!isPlainObject(value)) {
    return undefined;
  }

  const status = normalizeString(value.status, "", 80);
  const allowedStatuses = new Set([
    "blocked",
    "awaiting_human_review",
    "ready_for_report",
    "ready_for_archive",
    "archived",
    "failed",
  ]);
  const recommendedPage = normalizeString(value.recommendedPage, "", 80);
  const allowedPages = new Set(["material-intake", "check-tasks", "human-review", "reports"]);
  const statusLabel = normalizeString(value.statusLabel, "", 160);
  const currentOwner = normalizeString(value.currentOwner, "", 160);
  const nextAction = normalizeString(value.nextAction, "", 500);
  const actionReason = normalizeString(value.actionReason, "", 500);

  if (!allowedStatuses.has(status) || !statusLabel || !currentOwner || !nextAction || !actionReason) {
    return undefined;
  }

  return sanitizeOpeningConditionPilotValue({
    status,
    statusLabel,
    currentOwner,
    nextAction,
    recommendedPage: allowedPages.has(recommendedPage) ? recommendedPage : "reports",
    readOnly: Boolean(value.readOnly),
    blockingCount: normalizeNumber(value.blockingCount, 0, 10000),
    actionReason,
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
    ? "纭骞跺彂甯冨垽瀹氫緷鎹増鏈€?
    : !masterDataReady
      ? "纭骞跺彂甯冮」鐩汉鍛樸€佽澶囥€佽瘉鐓с€佸崟浣嶆垨鍒跺害璧勬枡涓绘暟鎹€?
      : !knowledgeBaseReady
        ? providerSyncStatus === "stale"
          ? "鍒锋柊缁勭粐/鍒嗗寘闃熶紞涓撳睘鐭ヨ瘑搴撳閮ㄧ储寮曘€?
          : providerSyncStatus === "unreachable"
            ? "鎭㈠鐭ヨ瘑搴?provider 杩為€氭€у悗鍐嶆墽琛屾寮忚祫鏂欐牳鏌ャ€?
            : "缁戝畾缁勭粐/鍒嗗寘闃熶紞涓撳睘鐭ヨ瘑搴撱€?
        : packetReady
          ? "鍙互鎵ц姝ｅ紡璧勬枡鏍告煡銆?
          : "涓婁紶寮€宸ユ潯浠舵牳鏌ヨ〃鍜岃祫鏂欏寘銆?;

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
  const humanReview = summarizeHumanReviewQueue(task.humanReviewQueue ?? []);
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
    humanReview,
    decisionLedger: deriveHumanReviewDecisionLedger(task),
    findings,
    summaryByIssueType: deriveReportIssueTypeSummary(findings),
    nextRectificationAdvice: deriveNextRectificationAdvice(findings, trialPackage.blockingReasons ?? []),
    deliveryHandoff: deriveReportDeliveryHandoff(task, findings, humanReview, archiveStatus),
    exportHandoff: deriveReportExportHandoff(task, findings, trialPackage, archiveStatus),
    deliveryPackage: deriveReportDeliveryPackage(task, findings, humanReview, archiveStatus),
    providerReadiness: trialPackage.providerReadiness,
    blockingReasons: trialPackage.blockingReasons,
    archiveStatus,
    generatedAt: new Date().toISOString(),
  });
}

const reportDeliveryPackageDispositions = new Set(["blocked", "fail", "reject", "needs_human_review", "warning"]);

function getReportFindingRiskLabel(finding) {
  switch (finding?.riskLevel) {
    case "high":
      return "妤傛﹢顥?;
    case "low":
      return "閹绘劗銇?;
    default:
      return "娑擃參顥?;
  }
}

function getReportFindingDispositionLabel(finding) {
  switch (finding?.disposition) {
    case "blocked":
      return "闂冭顢?;
    case "fail":
      return "娑撳秹鈧俺绻?;
    case "needs_human_review":
      return "瀵板懍姹夊銉ュ灲";
    case "warning":
      return "閹绘劗銇氶崗铏暈";
    case "reject":
      return "娴滃搫浼愭す鍐叉礀";
    case "confirm":
      return "娴滃搫浼愮涵顔款吇";
    case "correct":
      return "娴滃搫浼愭穱顔筋劀";
    case "defer":
      return "瀵よ埖婀℃径鍕倞";
    case "pass":
      return "闁俺绻?;
    case "not_applicable":
      return "娑撳秹鈧倻鏁?;
    default:
      return normalizeString(finding?.disposition, "瀵板懐鈥?, 120);
  }
}

function summarizeReportFindingLegalBasis(finding) {
  const legalBasis = Array.isArray(finding?.legalBasis) ? finding.legalBasis : [];
  const summary = legalBasis
    .map((item) => [item.title, item.clause].filter(Boolean).join(" "))
    .filter(Boolean)
    .join(" / ");
  return summary || finding?.basisVersionId || "閺堫亣顔囪ぐ鏇熸绾喕绶?;
}

function deriveReportDeliveryPackage(task, findings = [], humanReview = summarizeHumanReviewQueue(task.humanReviewQueue ?? []), archiveStatus = "ready") {
  const rows = findings
    .filter((finding) => reportDeliveryPackageDispositions.has(finding.disposition))
    .map((finding, index) => ({
      sequence: index + 1,
      id: finding.id,
      checkItem: finding.title,
      category: finding.subCategory ? `${finding.category} / ${finding.subCategory}` : finding.category,
      issueDescription: finding.description || getReportFindingDispositionLabel(finding),
      riskLabel: getReportFindingRiskLabel(finding),
      dispositionLabel: getReportFindingDispositionLabel(finding),
      basis: summarizeReportFindingLegalBasis(finding),
      rectification: finding.rectificationRequirement || "鐞涖儵缍堢€电懓绨茬挧鍕灐閸氬酣鍣搁弬鐗堝絹娴溿倕顦茬€?,
      notes: [...(finding.evidenceLabels ?? []), ...(finding.humanReviewLabels ?? [])].slice(0, 8),
    }));
  const pendingHumanReviewCount = findings.filter((finding) => finding.disposition === "needs_human_review").length;
  const blockingFindingCount = findings.filter((finding) =>
    ["blocked", "fail", "reject", "needs_human_review"].includes(finding.disposition),
  ).length;
  const blockingCount = humanReview.blockingCount + blockingFindingCount;
  const archived = archiveStatus === "archived" || task.state === "archived";
  const status =
    rows.length === 0
      ? "empty"
      : pendingHumanReviewCount > 0 || humanReview.blockingCount > 0
        ? "blocked_by_review"
        : archived
          ? "archived_ready"
          : "ready_for_handoff";
  const statusLabels = {
    empty: "閺嗗倹妫ら弫瀛樻暭娴溿倓绮?,
    blocked_by_review: "娴滃搫浼愭径宥嗙壋闂冭顢ｆ禍銈勭帛",
    ready_for_handoff: "閸欘垯姘︽禒妯肩舶鐎电厧鍤?閸ョ偛锝?,
    archived_ready: "閸樺棗褰惰ぐ鎺撱€傞崣顖氼槻",
  };
  const nextActions = {
    empty: "瑜版挸澧犻幎銉ユ啞濞屸剝婀侀棁鈧憰浣割嚤閸戣櫣绮伴弫瀛樻暭闂傤厾骞嗛惃鍕攽閿涘奔绻氶悾娆愬Г閸涘﹥鎲崇憰浣稿祮閸?,
    blocked_by_review: "閸忓牆鍙ч梻顓濇眽瀹搞儱顦查弽鍛婂灗闂冭顢ｆい鐧哥礉閸愬秵濡哥紒鎾寸€崠鏍攽娴溿倓绮敓?DOCX閵嗕礁甯悰銊ユ礀婵夘偅鍨ㄩ弲楦垮厴娴?,
    ready_for_handoff: "閸欘垰顦查悽銊ㄧ箹娴滄稓绮ㄩ弸鍕鐞涘瞼鏁撻敓?DOCX閵嗕礁娲栨繅顐㈠斧閺嶅憡鐓＄悰顭掔礉閹存牔姘︾紒娆愮《鐟欏嫭鏆ｉ弨瑙勬閼虫垝缍嬬紒褏鐢绘径鍕倞",
    archived_ready: "鐠囥儱宸婚崣鑼剁枂濞嗏€冲涧鐠囦紮绱濋崣顖欑稊娑撳搫顦查惄妯糕偓浣割嚠濮ｆ柨鎷伴崘宥嗩偧鐎电厧鍤惃鍕旂€规俺绶崗?,
  };

  return normalizeReportDeliveryPackage({
    schemaVersion: "opening-condition-report-delivery-package.v1",
    packageId: `oc-report-delivery-${task.id}`,
    taskId: task.id,
    status,
    statusLabel: statusLabels[status],
    generatedAt: new Date().toISOString(),
    readOnly: archived,
    rowCount: rows.length,
    blockingCount,
    pendingHumanReviewCount,
    adapterStatus: task.reportAsset?.packageDiagnostics?.exportHandoff?.status,
    nextAction: nextActions[status],
    rows,
    safeDiagnostics: [
      `rows=${rows.length}`,
      `blocking=${blockingCount}`,
      `pendingHumanReview=${pendingHumanReviewCount}`,
      `readOnly=${archived}`,
    ],
  });
}

function deriveReportDeliveryHandoff(task, findings = [], humanReview = summarizeHumanReviewQueue(task.humanReviewQueue ?? []), archiveStatus = "ready") {
  const blockingFindingCount = findings.filter((finding) =>
    ["blocked", "fail", "reject", "needs_human_review"].includes(finding.disposition),
  ).length;
  const blockingCount = humanReview.blockingCount + blockingFindingCount;

  if (archiveStatus === "archived" || task.state === "archived") {
    return {
      status: "archived",
      statusLabel: "瀹告彃缍婂锝忕礉閸欘亣顕伴崢鍡楀蕉",
      currentOwner: "閺冪姵妞块崝銊ㄧ煑娴犺姹?,
      nextAction: "婵″倿娓剁紒褏鐢荤悰銉ゆ閿涘矁顕禒搴㈠Г閸涘﹤缍婂锝夈€夐崣鎴ｆ崳娑撳绔存潪顔芥殻閺€鐟邦槻鐎光槄绱濋崚娑樼紦閺傛壆娈?run",
      recommendedPage: "reports",
      readOnly: true,
      blockingCount,
      actionReason: "瑜版挸澧?run 瀹告彃缍婂锝忕礉楠炲啿褰存禒鍛箽閻ｆ瑦濮ら崨濞库偓渚€妫舵０妯荤閸楁洏鈧椒姹夊銉ュ枀缁涙牕鎷扮€电厧鍤拋鏉跨秿閿涘奔绗夐崗浣筋啅閻╁瓨甯存穱顔芥暭閸樺棗褰?,
      generatedAt: new Date().toISOString(),
    };
  }

  if (task.state === "awaiting_human_review" || humanReview.blockingCount > 0) {
    return {
      status: "awaiting_human_review",
      statusLabel: "瀵板懍姹夊銉ヮ槻",
      currentOwner: "閻╂垹鎮婃禍鍝勪紣婢跺秵鐗?,
      nextAction: `閸忔娊妫?${humanReview.blockingCount} 妞ょ懓绶熸径鍕倞閹存牕娆㈤張鐔烘畱娴滃搫浼愭径宥嗙壋妞ょ櫢绱濋崘宥囨晸閹存劖濮ら崨濠傝嫙瑜版帗銆傞妴淇?
      recommendedPage: "human-review",
      readOnly: false,
      blockingCount,
      actionReason: "娴犲秴鐡ㄩ敓?open 閿?deferred 閻ㄥ嫪姹夊銉ヮ槻閺嶆悂銆嶉敍灞惧Г閸涘﹣姘︽禒妯圭瑝閼崇晫绮潻鍥︽眽瀹搞儳绮ㄧ拋?,
      generatedAt: new Date().toISOString(),
    };
  }

  if (archiveStatus === "ready" || task.reportAsset?.status === "ready") {
    return {
      status: "ready_for_archive",
      statusLabel: "閹躲儱鎲″鑼晸閹存劧绱濆鍛秺",
      currentOwner: "閹躲儱鎲℃禍銈勭帛鐠愶絼鎹?,
      nextAction: "绾喛顓婚幎銉ユ啞闂傤噣顣藉〒鍛礋閵嗕椒姹夊銉ュ枀缁涙牕鎷扮€电厧鍤紒鎾寸亯閸氬函绱濊ぐ鎺撱€傞張顒冪枂娴犺濮熼敍娑㈡付鐟曚浇藟娴犺埖妞傞崘宥呭絺鐠ц渹绗呮稉鈧潪顔芥殻閺€鐟邦槻鐎?,
      recommendedPage: "reports",
      readOnly: false,
      blockingCount,
      actionReason: "閺堫剝鐤嗗鎻掕埌閹存劕閽╅崣鐗堝Г閸涘﹨绁禍褝绱濊ぐ鎾冲闁插秶鍋ｉ弰顖欐唉娴犳鈥樼拋銈冣偓浣割嚤閸戝搫鎷拌ぐ鎺撱€傞悾娆戞",
      generatedAt: new Date().toISOString(),
    };
  }

  if (task.state === "report_ready") {
    return {
      status: "ready_for_report",
      statusLabel: "閸欘垳鏁撻幋鎰Г",
      currentOwner: "閹躲儱鎲℃禍銈勭帛鐠愶絼鎹?,
      nextAction: "閻㈢喐鍨氶幎銉ユ啞鐠у嫪楠囬敍宀€鈥樼拋銈勭瑝缁楋箑鎮庢い骞库偓浣规殻閺€鐟扮紦鐠侇喖鎷版禍鍝勪紣閸愬磭鐡ョ拹锔芥拱閸氬骸鍟€瑜版帗銆?,
      recommendedPage: "reports",
      readOnly: false,
      blockingCount,
      actionReason: "濮濓絽绱￠弽鍛婄叀閸滃奔姹夊銉ヮ槻閺嶇鍑￠弨鑸垫殐閿涘苯褰叉禒銉ㄧ箻閸忋儲濮ら崨濠佹唉娴?,
      generatedAt: new Date().toISOString(),
    };
  }

  if (task.state === "failed" || task.state === "canceled") {
    return {
      status: "failed",
      statusLabel: task.state === "failed" ? "瀵倸鐖跺鍛划閿? : "瀹告彃褰囧☉鍫濈窡闁插秴鎯?,
      currentOwner: "鐠у嫭鏋￠幒銉ュ弳鐠愶絼鎹?,
      nextAction: "濡偓閺屻儱銇戠拹銉﹀灗閸欐牗绉烽崢鐔锋礈閿涘苯娲栭崚鎷岀カ閺傛瑦甯撮崗銉︿划婢跺秵婀版潪顔藉灗闁插秵鏌婇崚娑樼紦娑撳绔撮敓?run",
      recommendedPage: "material-intake",
      readOnly: false,
      blockingCount,
      actionReason: "瑜版挸澧?run 閺堫亜鑸伴幋鎰讲娴溿倓绮幎銉ユ啞閿涘矂娓剁憰浣稿帥閹垹顦查崚鏉垮讲閹笛嗩攽闁炬崘鐭?,
      generatedAt: new Date().toISOString(),
    };
  }

  return {
    status: "blocked",
    statusLabel: "鐏忔碍婀崚鎷屾彧閹躲儱鎲℃禍銈勭帛",
    currentOwner: "鐠у嫭鏋￠幒銉ュ弳鐠愶絼鎹?,
    nextAction: task.preflightReadiness?.nextAction ?? "鐞涖儵缍堟笟婵囧祦閵嗕椒瀵岄弫鐗堝祦閵嗕胶鐓＄拠鍡楃氨閸滃矁绁弬娆忓瘶闂傘劎顩﹂崥搴礉閸愬秵澧界悰灞绢劀瀵繑鐗抽弻?,
    recommendedPage: task.state === "matching" || task.state === "extracting" ? "check-tasks" : "material-intake",
    readOnly: false,
    blockingCount,
    actionReason: "瑜版挸澧?run 娴犲秴顦╂禍搴ょカ閺傛瑦甯撮崗銉ｂ偓渚€妫粋浣衡€樼拋銈嗗灗濮濓絽绱￠弽鍛婄叀闂冭埖顔岄敍灞惧Г閸涘﹣姘︽禒妯虹毣閺堫亜鑸伴幋?,
    generatedAt: new Date().toISOString(),
  };
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
    adapterLabel: "閸樼喕銆冮崶鐐诧綖 / 閺傚洦銆傜€电厧鍤柅鍌炲帳",
    deliveryKind,
    status,
    templateId: checklistLooksDocx ? "opening-condition-original-form-template-v1" : "opening-condition-report-package-template-v1",
    templateLabel: checklistLooksDocx ? "閸樼喕銆冮崶鐐诧綖濡剝婢?v1" : "鏉堝懎濮幎銉ユ啞濡剝婢?v1",
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
        ? "閹躲儱鎲＄€电厧鍤紒鎾寸亯瀹歌尪顔囪ぐ鏇幢婵″倿娓堕崶鐐诧綖閸樼喕銆冮敍宀冾嚞閺嶏繝鐛欓悽鐔稿灇閺傚洣娆㈡稉搴㈡拱閿?findings 閺勵垰鎯佹稉鈧懛杈炬嫹?
        : checklistLooksDocx
          ? "瀵板懏甯撮敓?docxToHtml / htmlToDocx 闁倿鍘ら張宥呭閸氬函绱濋崣顖氱唨娴滃骸缍嬮敓?handoff 閹笛嗩攽閸樼喕銆冮崶鐐诧綖閿?
          : "瀵板懏甯撮崗銉ヮ嚤閸戞椽鈧倿鍘ら崳銊ユ倵閿涘苯褰查崺杞扮艾瑜版挸澧?handoff 閻㈢喐鍨氬锝呯础閺傚洦銆傛禍銈勭帛娴?,
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
    return "缁楋箑鎮?;
  }
  if (finding.disposition === "not_applicable") {
    return "娑撳秹鈧倻鏁?;
  }
  if (finding.disposition === "blocked") {
    return "闂冭顢?;
  }
  if (finding.disposition === "needs_human_review") {
    return "瀵板懍姹夊銉ヮ槻";
  }
  return "娑撳秶顑?;
}

function getReportRiskLabel(riskLevel) {
  return riskLevel === "high" ? "妤傛﹢顥撻敓? : riskLevel === "medium" ? "娑擃參顥撻敓? : "娴ｅ酣顥?;
}

function buildReportExportRowsFromDeliveryPackage(deliveryPackage) {
  const rows = Array.isArray(deliveryPackage?.rows) ? deliveryPackage.rows : [];
  return rows.slice(0, 120).map((row, index) => ({
    sequence: row.sequence ?? index + 1,
    category: row.category,
    checkItem: row.checkItem,
    risk: row.riskLabel,
    disposition: row.dispositionLabel,
    issueDescription: row.issueDescription,
    basis: row.basis,
    rectification: row.rectification,
  }));
}

function buildReportExportRowsFromFindings(findings = []) {
  return findings.slice(0, 120).map((finding, index) => ({
    sequence: index + 1,
    category: finding.category,
    checkItem: finding.title,
    risk: getReportRiskLabel(finding.riskLevel),
    disposition: getReportFindingLabel(finding),
    issueDescription: finding.description,
    basis: summarizeReportFindingLegalBasis(finding),
    rectification: finding.rectificationRequirement,
  }));
}

export function buildOpeningConditionPilotReportHtml(task) {
  const reportAsset = task?.reportAsset;
  if (!reportAsset) {
    return null;
  }

  const packageDiagnostics = reportAsset.packageDiagnostics ?? {};
  const findings = Array.isArray(packageDiagnostics.findings) ? packageDiagnostics.findings.slice(0, 120) : [];
  const deliveryRows = buildReportExportRowsFromDeliveryPackage(packageDiagnostics.deliveryPackage);
  const exportRows = deliveryRows.length > 0 ? deliveryRows : buildReportExportRowsFromFindings(findings);
  const issueTypeSummary = Array.isArray(packageDiagnostics.summaryByIssueType)
    ? packageDiagnostics.summaryByIssueType.slice(0, 40)
    : [];
  const summary = reportAsset.summary ?? {};
  const sourceNames = packageDiagnostics.inputObjects?.sourceFileNames?.slice(0, 30) ?? [];
  const title = reportHtmlText(reportAsset.title || "瀵偓瀹搞儲娼禒鑸电壋閺屻儲濮?, 240);
  const projectName = reportHtmlText(task.context?.projectId || task.context?.reviewObjectId || "閺堫亣顔囪ぐ鏇€?, 240);
  const findingRows = exportRows
    .map(
      (row) => `
        <tr>
          <td>${row.sequence}</td>
          <td>${reportHtmlText(row.category)}</td>
          <td>${reportHtmlText(row.checkItem, 300)}</td>
          <td>${reportHtmlText(row.risk, 120)}</td>
          <td>${reportHtmlText(row.disposition, 160)}</td>
          <td>${reportHtmlText(row.issueDescription, 800)}</td>
          <td>${reportHtmlText(row.basis, 800)}</td>
          <td>${reportHtmlText(row.rectification, 800)}</td>
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
      body { font-family: "SimSun", "鐎瑰缍?, serif; color: #20242a; font-size: 10pt; line-height: 1.5; }
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
    <p><strong>妞ゅ湱娲伴敓?/strong>${projectName}</p>
    <p><strong>娴犺濮熼敓?/strong>${reportHtmlText(task.id, 180)}</p>
    <p class="muted">閺堫剚濮ら崨濠佽礋楠炲啿褰撮弲楦垮厴鏉堝懎濮€光剝鐓￠幇蹇氼潌閿涘奔绗夐弴澶稿敩閺傝棄浼愰崡鏇氱秴閵嗕胶娲冮悶鍡楀礋娴ｅ秴寮烽惄绋垮彠鐠愶絼鎹㈡禍铏规畱閺堚偓缂佸牆顓搁弽姝岀煑娴犱紮鎷?/p>

    <h2>娑撯偓閵嗕焦鐗抽弻銉︹偓璁崇秼閹懎鍠?/h2>
    <table class="summary">
      <tr>
        <td><span class="metric">${Number(summary.total) || 0}</span>閺嶅憡鐓￠敓?/td>
        <td><span class="metric">${Number(summary.passed) || 0}</span>缁楋箑鎮?/td>
        <td><span class="metric">${Number(summary.failed) || 0}</span>娑撳秶顑侀敓?/td>
        <td><span class="metric">${Number(summary.humanReview) || 0}</span>瀵板懎顦查敓?/td>
        <td><span class="metric">${Number(summary.warnings) || 0}</span>閹绘劗銇?/td>
      </tr>
    </table>

    <h2>娴滃被鈧線妫舵０妯圭瑢閺佸瓨鏁奸敓?/h2>
    <table>
      <tr>
        <th style="width: 5%;">鎼村繐褰?/th>
        <th style="width: 11%;">閸掑棛琚?/th>
        <th style="width: 16%;">閺嶅憡鐓℃い鍦窗</th>
        <th style="width: 8%;">妞嬪酣娅?/th>
        <th style="width: 9%;">缂佹捁顔?/th>
        <th style="width: 20%;">闂傤噣顣介幓蹇氬牚</th>
        <th style="width: 14%;">娓氭繃宓?/th>
        <th style="width: 17%;">閺佸瓨鏁肩憰浣圭湴</th>
      </tr>
      ${findingRows || "<tr><td colspan=\"8\">瑜版挸澧犲▽鈩冩箒缂佹挻鐎崠鏍６妫版﹢銆嶉敓?/td></tr>"}
    </table>

    <h2>娑撳鈧線妫舵０妯艰閸ㄥ鐪归敓?/h2>
    <table>
      <tr><th>闂傤噣顣界猾璇茬€?/th><th>闂傤噣顣介敓?/th><th>妞嬪酣娅撶粵澶岄獓</th><th>閺佷即鍣?/th></tr>
      ${issueRows || "<tr><td colspan=\"4\">瑜版挸澧犲▽鈩冩箒闂傤噣顣界猾璇茬€峰Ч鍥ㄢ偓浼欐嫹?/td></tr>"}
    </table>

    <h2>閸ユ稏鈧礁鎮楃紒顓炲З閿?/h2>
    <p>${reportHtmlText(packageDiagnostics.nextRectificationAdvice?.headline || "鐠囬攱鐗撮幑顔界壋閺屻儳绮ㄧ拋鍝勭暚閹存劘绁弬娆捤夐崗鍛偓浣规殻閺€鐟版嫲婢跺秴顓?, 500)}</p>
    <ul>${nextActionList || "<li>鐠囬鏁遍惄鎴犳倞娴滃搫鎲崇紒鎾虫値閻滄澘婧€閸滃苯甯慨瀣カ閺傛瑥鐣幋鎰付缂佸牆鍨介弬顓ㄦ嫹?/li>"}</ul>

    <h2>娴滄柣鈧焦婀版潪顔跨翻閸忋儴绁敓?/h2>
    <p><strong>娓氭繃宓侀敓?/strong>${reportHtmlText(packageDiagnostics.inputObjects?.basisFileName || "閺堫亣顔?)}</p>
    <p><strong>閺嶅憡鐓＄悰顭掔窗</strong>${reportHtmlText(packageDiagnostics.inputObjects?.checklistFileName || "閺堫亣顔?)}</p>
    <ul>${sourceList || "<li>閺堫亣顔囪ぐ鏇＄カ閺傛瑥瀵橀弬鍥︽閿?/li>"}</ul>
  </body>
</html>`;
}

function deriveIssueTaxonomyForChecklistItem(checklistItem, finalDisposition = "needs_human_review") {
  const reviewText = getChecklistReviewText(checklistItem);
  const required = checklistItem.required !== false;
  const isBlocked = finalDisposition === "blocked";
  const highRisk = isBlocked || (required && ["fail", "reject"].includes(finalDisposition));

  if (/鐎光剝澹抾缁涘墽鐝穦缁涙儳鐡閺冦儲婀閻╂牜鐝?.test(reviewText)) {
    return {
      issueTypeId: "approval_signature_gap",
      issueTypeLabel: "鐎光剝澹掔粵鍓х彿缂傚搫銇戦幋鏍︾瑝鐎瑰本鏆?,
      issueTypeGroup: "鐎光剝澹掔粵鍓х彿",
      riskLevel: highRisk ? "high" : "medium",
      legalBasis: [
        {
          title: "瀵ら缚顔曞銉р柤閻╂垹鎮婄憴鍕瘱",
          summary: "閸忔娊鏁€光剝澹掔悰銊ュ礋鎼存柨鍙挎径鍥х暚閺佸顒风€涙ぜ鈧胶顒风粩鐘叉嫲閺冦儲婀?,
        },
      ],
      rectificationRequirement: "鐞涖儵缍堢€光剝澹掔悰銊ь劮鐎涙ぜ鈧胶顒风粩鐘叉嫲閺冦儲婀￠崥搴ㄥ櫢閺傜増褰佹禍銈咁槻鐎?,
      verificationGuidance: "閺嶆悂鐛欑粵鍓х彿妞ゅ灚妲搁崥锕€鐣弫娣偓浣侯劮鐎涙妫╅張鐔告Ц閸氾箓妫撮崥鍫濊嫙娑撳骸缍嬮崜宥囨暤閹躲儴鐤嗗▎鈥茬閼?,
      templateId: "opening-condition-approval-gap-v1",
    };
  }

  if (/娴滃搫鎲硘鐎瑰鍙忛崨姒洪悧鍦潚娴ｆ粈绗焲缁狅紕鎮婃禍鍝勬喅|鐠у嫭鐗?.test(reviewText)) {
    return {
      issueTypeId: "personnel_qualification_gap",
      issueTypeLabel: "娴滃搫鎲崇挧鍕窛鐠у嫭鏋＄紓鍝勩亼閹存牕绶熼弽鎼佺崣",
      issueTypeGroup: "娴滃搫鎲崇挧鍕灐",
      riskLevel: highRisk ? "high" : "medium",
      legalBasis: [
        {
          title: "瀵ら缚顔曞銉р柤鐎瑰鍙忛悽鐔堕獓缁狅紕鎮婇弶鈥茬伐",
          summary: "閻滄澘婧€閸忔娊鏁畝妞剧秴閸滃瞼澹掔粔宥勭稊娑撴矮姹夐崨妯虹安閸忓嘲顦張澶嬫櫏鐠у嫭鐗搁崪灞惧瘮鐠囦浇绁弬?,
        },
      ],
      rectificationRequirement: "鐞涖儵缍堝畝妞剧秴娴滃搫鎲崇挧鍕壐閵嗕焦瀵旂拠浣瑰灗鐎圭偛鎮曢崚鎯扮カ閺傛瑥鎮楅柌宥嗘煀閹绘劒姘︽径宥咁吀",
      verificationGuidance: "閺嶆悂鐛欐禍鍝勬喅闊偂鍞ら妴浣哥煐娴ｅ秲鈧浇鐦夋禒鑸垫箒閺佸牊婀￠崪灞惧鐏炵偛宕熸担宥嗘Ц閸氾缚绗岃ぐ鎾冲閸氬牆鎮撴潏鍦櫕娑撯偓閼?,
      agentAssetId: "opening-condition-personnel-review-agent",
      templateId: "opening-condition-personnel-gap-v1",
    };
  }

  if (/鐠佹儳顦瑋鐠х兘鍣竱濮瑰€熸簠閸氬Α濞変絻婧厊娴狀亜娅抾濡偓妤犲本濮ら崨濡″Λ鈧ù瀣Г/.test(reviewText)) {
    return {
      issueTypeId: "equipment_compliance_gap",
      issueTypeLabel: "鐠佹儳顦挧鍕灐缂傚搫銇戦幋鏍ф値鐟欏嫭鈧冪窡绾喛顓?,
      issueTypeGroup: "鐠佹儳顦崳銊ュ徔",
      riskLevel: highRisk ? "high" : "medium",
      legalBasis: [
        {
          title: "閸忣剝鐭惧銉р柤閺傝棄浼愮€瑰鍙忛幎鈧張顖濐潐",
          summary: "鐠х兘鍣搁妴浣界箥鏉堟挶鈧焦顥呭ù瀣搼鐠佹儳顦惔鏂垮徔婢跺洦婀侀弫鍫燁梾妤犲苯鎷伴崙鍡楀弳鐠у嫭鏋?,
        },
      ],
      rectificationRequirement: "鐞涖儵缍堢拋鎯ь槵濡偓妤犲被鈧焦顥呭ù瀣ㄢ偓浣稿嬀鐎光剝鍨ㄧ粔鐔荤ウ鐎瑰鍙忕挧鍕灐閸氬酣鍣搁弬鐗堝絹娴溿倕顦茬€?,
      verificationGuidance: "閺嶆悂鐛欑拋鎯ь槵閸氬秶袨閵嗕胶绱崣鏋偓浣诡梾濞村婀侀弫鍫熸埂閸滃苯缍嬮崜宥嗘煢瀹搞儱顕挒鈩冩Ц閸氾缚绔撮懛?,
      agentAssetId: "opening-condition-equipment-review-agent",
      templateId: "opening-condition-equipment-gap-v1",
    };
  }

  if (/娓氭繃宓亅閸氬牆鎮搢鐟欏嫯瀵東閸掕泛瀹硘鏉堝湱鏅珅閺嶅憡鐓?.test(reviewText)) {
    return {
      issueTypeId: "basis_coverage_gap",
      issueTypeLabel: "閺嶅憡鐓℃笟婵囧祦鐟曞棛娲婃稉宥堝喕",
      issueTypeGroup: "娓氭繃宓佺€瑰本鏆?,
      riskLevel: isBlocked ? "high" : "medium",
      legalBasis: [
        {
          title: "妞ゅ湱娲伴弽鍛婄叀娓氭繃宓佸▽鑽ゆ倞鐟曚焦鐪?,
          summary: "濮濓絽绱￠弽鍛婄叀閸撳秴绨茬紒鎴濈暰瀹告彃褰傜敮鍐х贩閹诡喓鈧椒瀵岄弫鐗堝祦閸滃矂銆嶉惄顔剧叀鐠囧棗绨?,
        },
      ],
      rectificationRequirement: "鐞涖儵缍堥獮璺哄絺鐢啫顕惔鏂剧贩閹诡喓鈧礁鍩楁惔锔藉灗閸氬牆鎮撴潏鍦櫕閸氬酣鍣搁弬鏉垮絺鐠ч攱顒滃蹇旂壋閺?,
      verificationGuidance: "绾喛顓昏ぐ鎾冲 run 瀹歌尙绮︾€规碍顒滃蹇庣贩閹诡喚澧楅張顑锯偓浣峰瘜閺佺増宓侀崪灞藉讲閻劎鐓＄拠鍡楃氨",
      promptAssetId: "opening-condition-basis-governance-prompt",
      templateId: "opening-condition-basis-gap-v1",
    };
  }

  return {
    issueTypeId: "material_packet_gap",
    issueTypeLabel: "鐠у嫭鏋￠崠鍛爱闁板秶宸辨径杈ㄥ灗瀵板懓藟",
    issueTypeGroup: checklistItem.category || "鐠у嫭鏋￠弽鍛婄叀",
    riskLevel: highRisk ? "high" : finalDisposition === "warning" ? "low" : "medium",
    legalBasis: [
      {
        title: "瀵偓瀹搞儲娼禒鎯扮カ閺傛瑦鐗抽弻銉洣",
        summary: "瀵偓瀹搞儱澧犳惔鏃傗€樻穱婵囩壋閺屻儴绁弬娆撶秷閸忋劊鈧礁褰叉潻鑺ュ嚱楠炶埖寮х搾鍐差槻鐎孤ゎ洣濮?,
      },
    ],
    rectificationRequirement:
      finalDisposition === "blocked"
        ? "閸忓牐袙閸愬啿澧犵純顕€妫粋浣瑰灗閹哄牊娼堟潏鍦櫕閿涘苯鍟€鐞涖儵缍堢挧鍕灐閸氬酣鍣搁弬鏉垮絺鐠у嘲顦茬€光槄鎷?
        : "鐞涖儵缍堢€电懓绨茬挧鍕灐閹存牞顕╅弰搴㈡瀮娴犺泛鎮楅柌宥嗘煀閹绘劒姘︽径宥咁吀",
    verificationGuidance: "缂佹挸鎮庨弽鍛婄叀妞ょ懓鎮曠粔鑸偓浣界カ閺傛瑥瀵橀弬鍥︽閸滃奔姹夊銉嚛閺勫海鈥樼拋銈嗘Ц閸氾箑鍑″陇鍐婚張顒冪枂閺嶅憡鐓＄憰浣圭湴",
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
      issueTypeLabel: finding.issueTypeLabel ?? "閺堫亜鍨庣猾濠氭６",
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
    actions.push(`娴兼ê鍘涚憴锝夋珟 ${blockedCount} 妞ょ懓澧犵純顕€妫粋浣瑰灗閹哄牊娼堟潏鍦櫕闂冭顢ｉ敍灞藉晙鏉╂稑鍙嗘稉瀣╃鏉烆喗顒滃蹇旂壋閺屻儯鈧繖);
  }
  if (rejectedCount > 0) {
    actions.push(`闁藉牆顕?${rejectedCount} 妞ら€涙眽瀹搞儵鈹忛崶鐐恒€嶇悰銉╃秷鐠у嫭鏋￠幋鏍嚛閺勫骸鎮楅柌宥嗘煀閹绘劒姘︽径宥咁吀閵嗕繖);
  }
  if (pendingHumanCount > 0) {
    actions.push(`鐎瑰甯撻惄鎴犳倞缂佈呯敾婢跺嫮鎮?${pendingHumanCount} 妞ょ懓绶熸禍鍝勪紣閸掋倖鏌囨禍瀣€嶉敍宀勪缉閸忓秵濮ら崨濠勭波鐠佺儤鍋撶粚鎭掆偓淇?;
  }
  if (actions.length === 0 && findings.length > 0) {
    actions.push("缂佹挸鎮庤ぐ鎾冲闂傤噣顣藉〒鍛礋鐞涖儰娆㈤獮璺哄絺鐠ц渹绗呮稉鈧潪顔芥殻閺€鐟邦槻鐎?);
  }
  if (blockingReasons.length > 0) {
    actions.push(`瑜版挸澧犻崜宥囩枂闂傘劎顩﹂幓鎰仛${blockingReasons.join(" / ")}`);
  }

  return actions.length > 0
    ? {
        headline: "娑撳绔存潪顔芥殻閺€鐟邦槻鐎光€崇紦",
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
  const decision = normalizeString(input.decision, "confirm", 40);
  const nextStatus =
    decision === "reject"
      ? "rejected"
      : decision === "publish"
        ? "published"
        : decision === "approve" || decision === "confirm"
          ? "human_approved"
          : "human_approved";
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
      publishedAt: nextStatus === "published" ? now : snapshot.masterDataRecords[index].publishedAt,
      rejectionReason: nextStatus === "rejected" ? input.safeNote ?? input.rejectionReason : undefined,
      safeNote: input.safeNote ?? snapshot.masterDataRecords[index].safeNote,
      preview: {
        ...snapshot.masterDataRecords[index].preview,
        safeNote: input.safeNote ?? snapshot.masterDataRecords[index].preview?.safeNote,
      },
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
    validity: normalizeString(value.validity, "鐠囨洜鍋ｉ幙宥勭稊閸涙鈥樼拋銈忕礉閻㈢喍楠囬悳顖氼暔闂団偓閿?OCR/娴滃搫浼愬锝呯础绾喛顓婚崥搴″絺鐢?, 300),
    confidence: ["high", "medium", "low"].includes(value.confidence) ? value.confidence : "medium",
    safeNote: normalizeString(
      value.safeNote,
      "閸楁洟銆嶉惄顔跨槸閻愮懓鍨垫慨瀣閻㈢喐鍨氶惃鍕瘜閺佺増宓侀敍宀€鏁ゆ禍搴ょ獓闁矮姹夐敓?鐠佹儳顦幒鍫熸綀闂傘劎顩﹂敍娑氭晸娴溠呭箚婢у啴娓堕弴鎸庡床娑撶儤顒滃蹇庡瘜閺佺増宓佺涵顔款吇濞翠胶鈻?,
      500,
    ),
  };
}

function buildDefaultTrialMasterDataRecords(context, basisObject) {
  const basisFileName = basisObject?.fileName ?? "閸氬牆鎮撴笟婵囧祦";
  return [
    {
      id: `${context.workspaceId}-trial-personnel`,
      type: "personnel",
      label: "鐠囨洜鍋ｆ禍鍝勬喅閼煎啫娲块敍姘躲€嶉惄顔绢吀閻炲棔姹夐崨妯糕偓浣风瑩閼卞苯鐣ㄩ崗銊ユ喅閵嗕胶澹掔粔宥勭稊娑撴矮姹?,
      validity: `娓氭繃宓?${basisFileName} 閻㈣鲸鎼锋担婊冩喅鐠囨洜鍋ｇ涵顔款吇閵嗕繖,
    },
    {
      id: `${context.workspaceId}-trial-equipment`,
      type: "equipment",
      label: "鐠囨洜鍋ｇ拋鎯ь槵閼煎啫娲块敍姘嫰鏉烇箑鎮愰妴浣芥崳闁插秷顔曟径鍥モ偓浣硅溅鏉烇负鈧焦顥呭ù瀣╁崕",
      validity: `娓氭繃宓?${basisFileName} 閻㈣鲸鎼锋担婊冩喅鐠囨洜鍋ｇ涵顔款吇閵嗕繖,
    },
    {
      id: `${context.workspaceId}-trial-approval-document`,
      type: "system_document",
      label: "鐠囨洜鍋ｉ崚璺哄鐠у嫭鏋￠敍姘磻瀹搞儳鏁电拠宄邦吀閹电銆冮妴浣侯劮缁旂姵鏋?,
      validity: `娓氭繃宓?${basisFileName} 閻㈣鲸鎼锋担婊冩喅鐠囨洜鍋ｇ涵顔款吇閵嗕繖,
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
      existingTask ? "瀵偓瀹搞儲娼禒鎯扮槸閻愰€涙崲閸斺€冲嚒闁插秵鏌婇崚婵嗩潗閸栨牭鎷? : "瀵偓瀹搞儲娼禒鎯扮槸閻愰€涙崲閸斺€冲嚒閸掓繂顫愰崠?,
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
      `鐠у嫭鏋￠崠鍛嚒閹恒儲鏁归敍灞藉瘶閿?${packet.sourceObjects.length} 娑擃亣绁弬娆忣嚠鐠灺扳偓淇?
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
      title: normalizeString(input.basisTitle, "閸楁洟銆嶉惄顔跨槸閻愮懓鎮庨崥灞肩瑢鐠у嫯宸濇笟婵囧祦", 240),
      componentType: "contract_basis",
      version: normalizeString(input.basisVersion, "trial-published", 120),
      status: "confirmed",
      sourceObject: basisObject,
      applicability: normalizeString(
        input.basisApplicability,
        "閻劋绨涵顔款吇閺堫剚顐煎鈧銉︽蒋娴犳儼鐦悙鍦畱閸氬牆鎮撴稉璁崇秼閵嗕浇绁拹銊ㄧ珶閻ｅ被鈧椒姹夐崨妯款啎婢跺洩瀵栭崶鏉戞嫲鐠у嫭鏋￠弽鍛婄叀娓氭繃宓?,
        500,
      ),
      confidence: "medium",
      ingestionPreview: basisIngestionPreview,
      safeNote: "閻㈠崬宕熸い鍦窗鐠囨洜鍋ｉ崚婵嗩潗閸栨牕鍙嗛崣锝呭晸閸忋儻绱濋悽鐔堕獓閻滎垰顣ㄩ棁鈧紒蹇氱箖濮濓絽绱℃笟婵囧祦绾喛顓诲ù浣衡柤",
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
      label: normalizeString(input.knowledgeBaseLabel, "閸楁洟銆嶉惄顔跨槸閻愮懓鍨庨崠鍛存Е娴煎秶鐓＄拠鍡楃氨", 240),
      status: providerRefs.some((item) => item.syncStatus === "ready") ? "ready" : "needs_review",
      summary: normalizeString(
        input.knowledgeBaseSummary,
        "娣囨繂鐡ㄩ張顒侇偧鐠囨洜鍋ｇ挧鍕灐濡剝婢橀妴浣界槈閹诡喗鎲崇憰浣碘偓浣锋眽瀹搞儰鎱ㄥ锝呮嫲 MaxKB 濡偓缁便垺鏁幘鎴濈穿閻?,
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
        message: input.message ?? `鐠у嫭鏋￠崠鍛嚒閹恒儲鏁归敍灞藉瘶閿?${packet.sourceObjects.length} 娑擃亣绁弬娆忣嚠鐠灺扳偓淇?
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
          ruleExplanation: "鐠囥儲鐗抽弻銉┿€嶇仦鐐扮艾瑜版挸澧犵拠鏇犲仯娑撳秴顦╅悶鍡欐畱閻滄澘婧€閵嗕礁绨查幀銉﹀灗闂堢偠绁弬娆愮壋閺屻儴瀵栭崶杈剧礉閺堫亣顓搁崗銉ㄧカ閺傛瑧宸辨径?,
          semanticNote: "瑜版挸澧犲鈧銉︽蒋娴犳儼鐦悙鐟板涧婢跺嫮鎮婇崣顖滄暠鐠у嫭鏋￠崠鍛嫲瀹告彃褰傜敮鍐у瘜閺佺増宓侀弨顖涙嫼閻ㄥ嫯绁弬娆愮壋閺屻儵銆?,
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
          locator: match.entry.relativePath || "鐠у嫭鏋￠崠鍛瀮娴犺埖绔?,
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
          ruleExplanation: item.ruleExplanation ?? `濮濓絽绱￠弽鍛婄叀妞ょ櫢绱?{item.name}`,
          expectedEvidenceHints: item.expectedEvidenceHints,
          reason: missing
            ? "鐠у嫭鏋￠崠鍛厬閺堫亝澹橀崚鎵旂€规艾灏柊宥嗘瀮娴犺鎷?
            : masterDataAuthorizationMissing
              ? isResourceItem
                ? "娴滃搫鎲抽幋鏍啎婢跺洩绁弬娆忓嚒閸涙垝鑵戦崐娆撯偓澶嬫瀮娴犺绱濇担鍡欏繁鐏忔垵鎮庨崥宀冪珶閻ｅ奔绗呭鎻掑絺鐢啯鍨ㄦ禍鍝勪紣閹电懓鍣惃鍕€嶉惄顔诲瘜閺佺増宓侀幒鍫熸綀閿?
                : "閺嶅憡鐓℃い鐟扮穿閻劎娈戞稉缁樻殶閹诡喖鐨婚張顏勫絺鐢啨鈧椒姹夊銉﹀閸戝棙鍨ㄩ張顏嗙拨鐎规熬鎷?
              : visualReviewRequired
                ? "缁涙儳鎮曢妴浣烘磰缁旂姰鈧礁瀣€闁鍨ㄩ弮銉︽埂缁涘顫嬬憴澶庮洣缁辩姴鐡ㄩ崷銊︹偓褎鍨ㄥ〒鍛珰鎼达缚绗夌搾绛圭礉闂団偓鐟曚椒姹夊銉р€樼拋銈忔嫹?
                : "鐎涙ê婀径姘嚋閸婃瑩鈧绁弬娆欑礉闂団偓娴滃搫浼愮涵顔款吇",
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
          ? "绾喖鐣鹃幀褑顫夐崚娆愭弓閸︺劏绁弬娆忓瘶閺傚洣娆㈤崥宥嗗灗閹芥顩︽稉顓炴嚒娑擃厽澧嶉棁鈧挧鍕灐閿?
          : `绾喖鐣鹃幀褑顫夐崚娆忔嚒閿?${topMatches.length} 娑擃亜鈧瑩鈧绁弬娆嶁偓淇?
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
      createMatchEvent(taskId, startSequence, "extraction.completed", "extracting", "鐠у嫭鏋￠崠鍛瀮娴犺埖绔婚崡鏇炲嚒瑜版帊绔撮崠?, 35, {
        sourceObjectCount: existingTask.packet.sourceObjects.length,
        inventoryEntryCount: existingTask.packet.inventoryEntries.length,
      }),
      createMatchEvent(taskId, startSequence + 1, "matching.started", "matching", "瀵偓婵瀵滈弽鍛婄叀鐞涖劍澧界悰宀€鈥樼€规碍鈧冨爱闁?, 50, {
        checklistItemCount: checklistItems.length,
      }),
      createMatchEvent(
        taskId,
        startSequence + 2,
        finalState === "report_ready" ? "matching.completed" : "human_review.waiting",
        finalState,
        finalState === "report_ready" ? "閺嶅憡鐓℃い鐟板爱闁板秴鐣幋鎰剁礉閺堫亜褰傞悳浼存▎婵夌偘姹夊銉ヮ槻閺嶆悂銆嶉敓? : "閺嶅憡鐓℃い鐟板爱闁板秴鐣幋鎰剁礉鐎涙ê婀鍛眽瀹搞儱顦查弽鎼併€?,
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
        message: blockingCount === 0 ? "闂冭顢ｆ禍鍝勪紣婢跺秵鐗虫い鐟板嚒婢跺嫮鎮婇敍灞惧Г閸涘﹤褰查悽鐔稿灇閿? : "娴滃搫浼愭径宥嗙壋閸愬磭鐡ュ鑼额唶瑜?,
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
        title: input.title ?? "瀵偓瀹搞儲娼禒鑸电壋閺屻儱鍞撮柈銊ㄧ窡閸斺晜鍓?,
        status: "ready",
        summary,
        objectRef: input.objectRef,
        packageDiagnostics: input.packageDiagnostics ?? deriveReportPackageDiagnostics(reportTask, summary, "ready"),
        disclaimer:
          input.disclaimer ??
          "閺堫剛绮ㄩ弸婊€璐熼獮鍐插酱閺呴缚鍏樻潏鍛И鐎光剝鐓￠幇蹇氼潌閿涘奔绗夐弴澶稿敩閺傝棄浼愰崡鏇氱秴閵嗕胶娲冮悶鍡楀礋娴ｅ秴寮烽惄绋垮彠鐠愶絼鎹㈡禍铏规畱閺堚偓缂佸牆顓搁弽姝岀煑娴?,
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
        message: "閸愬懘鍎存潏鍛И閹躲儱鎲￠幗妯款洣瀹歌尙鏁撻幋?,
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
      nextAction: "DOCX 閹躲儱鎲″鑼晸閹存劧绱濋崣顖炩偓姘崇箖閺堫剚顐肩€电厧鍤惃鍕瑓鏉炰粙鎽奸幒銉ゆ唉娴犳﹫绱遍崢鐔汇€冮崶鐐诧綖娴犲秹娓堕崡鏇犲闁倿鍘?,
    });
    const deliveryPackage = deriveReportDeliveryPackage(
      {
        ...existingTask,
        reportAsset: {
          ...existingTask.reportAsset,
          packageDiagnostics: {
            ...currentDiagnostics,
            exportHandoff,
          },
        },
      },
      currentDiagnostics.findings ?? deriveReportPackageFindings(existingTask),
      currentDiagnostics.humanReview ?? summarizeHumanReviewQueue(existingTask.humanReviewQueue ?? []),
      existingTask.state === "archived" ? "archived" : "ready",
    );
    const reportAsset = normalizeReportAsset(
      {
        ...existingTask.reportAsset,
        objectRef: generatedObject,
        packageDiagnostics: {
          ...currentDiagnostics,
          exportHandoff,
          deliveryPackage,
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
    const archivedTaskForDiagnostics = {
      ...existingTask,
      state: "archived",
      reportAsset: {
        ...existingTask.reportAsset,
        status: "archived",
      },
    };
    const archivedFindings = existingTask.reportAsset.packageDiagnostics?.findings ?? deriveReportPackageFindings(existingTask);
    const archivedHumanReview =
      existingTask.reportAsset.packageDiagnostics?.humanReview ?? summarizeHumanReviewQueue(existingTask.humanReviewQueue ?? []);
    const archivedReport = normalizeReportAsset(
      {
        ...existingTask.reportAsset,
        status: "archived",
        packageDiagnostics: {
          ...existingTask.reportAsset.packageDiagnostics,
          archiveStatus: "archived",
          deliveryHandoff: deriveReportDeliveryHandoff(archivedTaskForDiagnostics, archivedFindings, archivedHumanReview, "archived"),
          deliveryPackage: deriveReportDeliveryPackage(archivedTaskForDiagnostics, archivedFindings, archivedHumanReview, "archived"),
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
        message: input.message ?? "瀵偓瀹搞儲娼禒鑸电壋閺屻儴鐦悙閫涙崲閸斺€冲嚒瑜版帗銆?,
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
