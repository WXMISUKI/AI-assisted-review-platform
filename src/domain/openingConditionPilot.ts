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
}

export interface OpeningConditionMasterDataRef {
  id: string;
  workspaceId: string;
  type: "personnel" | "equipment" | "certificate" | "company" | "system_document";
  status: "published" | "human_approved";
  label: string;
}

export interface OpeningConditionPilotPacket {
  id: string;
  taskId: string;
  workspaceId: string;
  checklistObject: OpeningConditionObjectRef;
  sourceObjects: OpeningConditionObjectRef[];
  submittedAt: string;
  submittedBy: string;
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
  disclaimer: string;
  createdAt: string;
}

export interface OpeningConditionPilotTask {
  id: string;
  context: OpeningConditionPilotWorkspaceContext;
  state: OpeningConditionPilotTaskState;
  basisVersion?: OpeningConditionBasisVersionRef;
  requiredMasterData: OpeningConditionMasterDataRef[];
  packet?: OpeningConditionPilotPacket;
  checkItems: OpeningConditionPilotCheckItem[];
  evidence: OpeningConditionPilotEvidence[];
  humanReviewQueue: OpeningConditionPilotHumanReviewItem[];
  reportAsset?: OpeningConditionPilotReportAsset;
  events: OpeningConditionPilotTaskEvent[];
  createdAt: string;
  updatedAt: string;
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

