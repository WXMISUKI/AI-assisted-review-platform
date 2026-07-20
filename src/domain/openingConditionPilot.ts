export type OpeningConditionPilotTaskState =
  | "draft"
  | "blocked_missing_basis"
  | "blocked_missing_master_data"
  | "ready_for_packet"
  | "packet_uploaded"
  | "extracting"
  | "matching"
  | "awaiting_human_review"
  | "report_ready"
  | "archived"
  | "failed"
  | "canceled";

export type OpeningConditionPilotEventType =
  | "task.created"
  | "task.intake_initialized"
  | "task.blocked"
  | "packet.uploaded"
  | "extraction.started"
  | "extraction.completed"
  | "matching.started"
  | "matching.completed"
  | "human_review.waiting"
  | "report.ready"
  | "task.archived"
  | "task.failed"
  | "task.canceled";

export type OpeningConditionObjectKind =
  | "source_archive"
  | "checklist"
  | "basis"
  | "master_data"
  | "evidence"
  | "report";

export interface OpeningConditionPilotWorkspaceContext {
  workspaceId: string;
  tenantId: string;
  projectId: string;
  contractPackageId: string;
  participatingOrganizationId: string;
}

export interface OpeningConditionObjectRef {
  objectId: string;
  kind: OpeningConditionObjectKind;
  fileName: string;
  storageKey?: string;
  contentType?: string;
  sizeBytes?: number;
  checksum?: string;
  summary?: string;
}

export interface OpeningConditionBasisVersionRef {
  id: string;
  workspaceId: string;
  version: string;
  status: "published";
  publishedAt: string;
  sourceObject?: OpeningConditionObjectRef;
  evidenceRefs?: OpeningConditionObjectRef[];
}

export interface OpeningConditionMasterDataRef {
  id: string;
  workspaceId: string;
  type: "personnel" | "equipment" | "certificate" | "company" | "system_document";
  status: "published" | "human_approved";
  label: string;
}

export interface OpeningConditionPilotKnowledgeBaseProviderRef {
  provider: "mock" | "ragflow" | "maxkb";
  id: string;
  datasetId: string;
  knowledgeId?: string;
  documentId?: string;
  chunkId?: string;
  syncStatus: "ready" | "provisional" | "stale" | "unreachable" | "disabled";
  summary?: string;
  lastSyncedAt?: string;
}

export interface OpeningConditionPilotKnowledgeBaseRef {
  id: string;
  workspaceId: string;
  organizationId: string;
  contractPackageId: string;
  subcontractTeamId: string;
  label: string;
  status: "draft" | "ready" | "needs_review" | "archived";
  summary: string;
  providerRefs?: OpeningConditionPilotKnowledgeBaseProviderRef[];
  providerSyncStatus?: "ready" | "provisional" | "stale" | "unreachable" | "disabled";
}

export interface OpeningConditionPilotPreflightReadiness {
  status: "ready" | "blocked" | "provisional";
  basis: "ready" | "missing";
  masterData: "ready" | "missing";
  knowledgeBase: "ready" | "missing" | "provisional" | "blocked" | "stale" | "unreachable";
  materialPacket: "ready" | "missing";
  blockingReasons: string[];
  nextAction: string;
}

export interface OpeningConditionPilotPacket {
  id: string;
  taskId: string;
  workspaceId: string;
  checklistObject: OpeningConditionObjectRef;
  sourceObjects: OpeningConditionObjectRef[];
  inventoryEntries: OpeningConditionPilotPacketInventoryEntry[];
  submittedAt: string;
  submittedBy: string;
}

export interface OpeningConditionPilotPacketInventoryEntry {
  id: string;
  sourceObjectId?: string;
  fileName: string;
  relativePath?: string;
  summary?: string;
  sizeBytes?: number;
}

export interface OpeningConditionPilotEvidence {
  id: string;
  taskId: string;
  itemId?: string;
  objectRef: OpeningConditionObjectRef;
  locator?: string;
  extractedValue?: string;
  confidence: "high" | "medium" | "low";
  masterDataIds: string[];
  providerHandoffs?: OpeningConditionPilotProviderHandoff[];
}

export interface OpeningConditionPilotProviderHandoff {
  provider: string;
  jobId?: string;
  state: string;
  summary?: string;
  documentRefId?: string;
  updatedAt: string;
}

export type OpeningConditionPilotScopeStatus = "in_scope" | "out_of_scope";

export type OpeningConditionPilotDocumentPresence = "present" | "missing" | "ambiguous" | "not_required";

export type OpeningConditionPilotRelevanceStatus =
  | "matched"
  | "wrong_subject"
  | "wrong_project"
  | "unconfirmed"
  | "not_applicable";

export type OpeningConditionPilotContentCompliance =
  | "compliant"
  | "non_compliant"
  | "partially_compliant"
  | "not_evaluated";

export type OpeningConditionPilotFinalDisposition =
  | "pass"
  | "fail"
  | "needs_human_review"
  | "blocked"
  | "not_applicable";

export interface OpeningConditionPilotVisualAssertion {
  type: "stamp" | "signature" | "checkbox" | "handwritten_date" | "seal" | "other";
  status: "detected" | "missing" | "uncertain" | "confirmed" | "rejected" | "not_required";
  confidence: "high" | "medium" | "low";
  locator?: string;
  evidenceIds: string[];
  requiresHumanReview: boolean;
  note?: string;
}

export interface OpeningConditionPilotChecklistDefinitionItem {
  id: string;
  category: string;
  subCategory?: string;
  name: string;
  required: boolean;
  expectedEvidenceHints: string[];
  basisVersionId: string;
  masterDataIds: string[];
  scopeStatus?: OpeningConditionPilotScopeStatus;
  visualAssertions?: OpeningConditionPilotVisualAssertion[];
}

export interface OpeningConditionPilotCheckItem {
  id: string;
  taskId: string;
  category: string;
  name: string;
  required: boolean;
  verdict: "pass" | "fail" | "warning" | "needs_human_review" | "blocked";
  ruleExplanation: string;
  semanticNote?: string;
  basisVersionId: string;
  evidenceIds: string[];
  masterDataIds: string[];
  humanReviewIds: string[];
  scopeStatus?: OpeningConditionPilotScopeStatus;
  documentPresence?: OpeningConditionPilotDocumentPresence;
  relevanceStatus?: OpeningConditionPilotRelevanceStatus;
  contentCompliance?: OpeningConditionPilotContentCompliance;
  visualAssertions?: OpeningConditionPilotVisualAssertion[];
  finalDisposition?: OpeningConditionPilotFinalDisposition;
}

export interface OpeningConditionPilotHumanReviewItem {
  id: string;
  taskId: string;
  targetType: "basis" | "master_data" | "check_item" | "report";
  targetId: string;
  reason: string;
  status: "open" | "confirmed" | "corrected" | "rejected" | "deferred";
  evidenceIds: string[];
  reviewerId?: string;
  decidedAt?: string;
  safeNote?: string;
}

export interface OpeningConditionPilotTaskEvent {
  id: string;
  taskId: string;
  sequence: number;
  type: OpeningConditionPilotEventType;
  state: OpeningConditionPilotTaskState;
  occurredAt: string;
  message: string;
  progress?: number;
  safeDiagnostics?: Record<string, unknown>;
}

export interface OpeningConditionPilotReportAsset {
  id: string;
  taskId: string;
  title: string;
  status: "draft" | "ready" | "archived";
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
    humanReview: number;
  };
  objectRef?: OpeningConditionObjectRef;
  packageDiagnostics?: OpeningConditionPilotReportPackageDiagnostics;
  disclaimer: string;
  createdAt: string;
}

export interface OpeningConditionPilotTrialPackageInputObjects {
  basisFileName?: string;
  checklistFileName?: string;
  sourceFileNames: string[];
  sourceCount: number;
}

export interface OpeningConditionPilotTrialPackageDiagnostics {
  checklistDefinitionResolution?: string;
  checklistDefinitionCount: number;
  inventoryResolution?: string;
  inventoryEntryCount: number;
  inventoryFallbackReason?: string;
  manifestSampleNames: string[];
}

export interface OpeningConditionPilotProviderReadinessSummary {
  provider?: string;
  status: string;
  summary?: string;
}

export interface OpeningConditionPilotMatchingSummary {
  total: number;
  passed: number;
  failed: number;
  warnings: number;
  humanReview: number;
  evidenceCount: number;
}

export interface OpeningConditionPilotHumanReviewSummary {
  total: number;
  blockingCount: number;
  confirmed: number;
  corrected: number;
  rejected: number;
  deferred: number;
}

export interface OpeningConditionPilotTrialPackage {
  taskId: string;
  workspaceId: string;
  status: OpeningConditionPilotTaskState;
  submittedBy?: string;
  inputObjects: OpeningConditionPilotTrialPackageInputObjects;
  diagnostics: OpeningConditionPilotTrialPackageDiagnostics;
  providerReadiness?: OpeningConditionPilotProviderReadinessSummary;
  matching: OpeningConditionPilotMatchingSummary;
  humanReview: OpeningConditionPilotHumanReviewSummary;
  blockingReasons: string[];
  reportStatus: "missing" | "draft" | "ready" | "archived";
  archiveStatus: "pending" | "archived";
  updatedAt: string;
}

export interface OpeningConditionPilotReportPackageDiagnostics {
  inputObjects: OpeningConditionPilotTrialPackageInputObjects;
  matching: OpeningConditionPilotMatchingSummary;
  humanReview: OpeningConditionPilotHumanReviewSummary;
  providerReadiness?: OpeningConditionPilotProviderReadinessSummary;
  blockingReasons: string[];
  archiveStatus: "pending" | "ready" | "archived";
  generatedAt: string;
}

export interface OpeningConditionPilotTask {
  id: string;
  context: OpeningConditionPilotWorkspaceContext;
  state: OpeningConditionPilotTaskState;
  basisVersion?: OpeningConditionBasisVersionRef;
  requiredMasterData: OpeningConditionMasterDataRef[];
  knowledgeBaseRef?: OpeningConditionPilotKnowledgeBaseRef;
  preflightReadiness?: OpeningConditionPilotPreflightReadiness;
  packet?: OpeningConditionPilotPacket;
  checklistDefinition: OpeningConditionPilotChecklistDefinitionItem[];
  checkItems: OpeningConditionPilotCheckItem[];
  evidence: OpeningConditionPilotEvidence[];
  humanReviewQueue: OpeningConditionPilotHumanReviewItem[];
  reportAsset?: OpeningConditionPilotReportAsset;
  trialPackage?: OpeningConditionPilotTrialPackage;
  events: OpeningConditionPilotTaskEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface OpeningConditionPilotIntakeDiagnostics {
  basisResolution:
    | "bound_from_workspace"
    | "bound_from_existing_task"
    | "basis_not_found"
    | "basis_not_published"
    | "basis_missing";
  selectedBasisVersionId?: string;
  boundBasisSourceObject?: boolean;
  masterDataResolution: {
    requestedIds: string[];
    approvedWorkspaceCount: number;
    boundCount: number;
    missingIds: string[];
  };
  knowledgeBaseResolution:
    | "bound_from_input"
    | "bound_from_existing_task"
    | "auto_bound_single_ready"
    | "knowledge_base_not_found"
    | "multiple_ready_candidates"
    | "no_ready_candidate"
    | "not_requested";
  selectedKnowledgeBaseId?: string;
  packetObjectCount: number;
  inventoryResolution?: "direct_input" | "derived_from_zip_manifest" | "derived_from_source_objects";
  inventoryEntryCount?: number;
  inventoryFallbackReason?: "zip_storage_key_missing" | "zip_manifest_extract_failed" | "zip_manifest_empty";
  checklistDefinitionCount?: number;
  checklistDefinitionResolution?:
    | "direct_input"
    | "derived_from_template"
    | "reused_existing_task"
    | "manual_definition_required";
  selectedChecklistTemplateId?: string;
}

export const openingConditionPilotStateLabels: Record<OpeningConditionPilotTaskState, string> = {
  draft: "草稿",
  blocked_missing_basis: "缺少已发布依据",
  blocked_missing_master_data: "缺少已发布主数据",
  ready_for_packet: "待上传资料包",
  packet_uploaded: "资料包已上传",
  extracting: "资料提取中",
  matching: "核查匹配中",
  awaiting_human_review: "等待人工复核",
  report_ready: "报告已生成",
  archived: "已归档",
  failed: "失败",
  canceled: "已取消",
};
