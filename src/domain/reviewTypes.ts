export type IssueSource = "ai" | "manual";

export type IssueStatus = "pending" | "accepted" | "rejected" | "modified";

export type IssueSeverity = "critical" | "high" | "medium" | "low";

export type StatusFilter = "all" | IssueStatus;

export type ReviewMode = "review" | "revise";

export type DocumentStatus = "uploaded" | "parsing" | "reviewing" | "ready" | "completed" | "failed";

export type ReviewEngineSource = "rule" | "semantic" | "hybrid";

export type ReviewCheckDomain =
  | "preparation-content"
  | "procedure-compliance"
  | "professional-technical"
  | "implementation-consistency";

export type ReviewOutputScenario =
  | "contractor-self-check"
  | "supervisor-formal-review"
  | "expert-review-assistance";

export type ComplianceCategory = "mandatory-clause" | "general-norm" | "optimization";

export type BasisReferenceType =
  | "normative-standard"
  | "law-regulation"
  | "local-requirement"
  | "project-document"
  | "bid-commitment"
  | "contract"
  | "drawing"
  | "safety-risk-assessment";

export type BasisPriority = "primary" | "supporting" | "project-overrides";

export interface DocumentParagraph {
  id: string;
  section: string;
  text: string;
}

export interface ReviewAnchor {
  paragraphId: string;
  startOffset: number;
  endOffset: number;
  text: string;
}

export interface ReviewFinding {
  title: string;
  reason: string;
  basis: string;
  suggestion: string;
}

export interface BasisReference {
  type: BasisReferenceType;
  sourceTitle: string;
  version?: string;
  clauseNumber?: string;
  locator?: string;
  summary: string;
  priority: BasisPriority;
}

export interface RectificationLoop {
  requirement: string;
  verificationStandard: string;
  deadline: string;
  recheckProcess: string;
}

export interface ExpertReviewAssistance {
  points: string[];
  expertQualification: string;
  participantRequirement: string;
  conclusionHandling: string;
  modificationVerification: string;
}

export interface ReviewKernelMetadata {
  engineSource: ReviewEngineSource;
  checkDomain: ReviewCheckDomain;
  checkItem: string;
  outputScenario: ReviewOutputScenario;
  complianceCategory: ComplianceCategory;
  basisPriority: BasisPriority;
  schemaVersion: string;
  basisReferences: BasisReference[];
  rectification?: RectificationLoop;
  expertReview?: ExpertReviewAssistance;
}

export interface ReviewResolution {
  action: IssueStatus | null;
  editedText: string | null;
  resolvedAt: string | null;
}

export interface ReviewIssue {
  id: string;
  source: IssueSource;
  status: IssueStatus;
  severity: IssueSeverity;
  anchor: ReviewAnchor;
  finding: ReviewFinding;
  resolution: ReviewResolution;
  kernel?: ReviewKernelMetadata;
}

export interface IssueCounts {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  modified: number;
}

export type ReviewResultType = "supervisor-report" | "revised-plan-snapshot";

export interface ReviewCompletionPayload {
  mode: ReviewMode;
  documentName: string;
  projectName: string;
  issues: ReviewIssue[];
  processedParagraphs: DocumentParagraph[];
}

export interface ReviewResultBase {
  id: string;
  type: ReviewResultType;
  documentName: string;
  projectName: string;
  mode: ReviewMode;
  createdAt: string;
  issueStats: IssueCounts;
  acceptedIssueIds: string[];
  rejectedIssueIds: string[];
}

export interface SupervisorReportAsset extends ReviewResultBase {
  type: "supervisor-report";
  summary: string;
  majorRisks: string[];
  issueOpinions: Array<{
    issueId: string;
    title: string;
    severity: IssueSeverity;
    decision: Extract<IssueStatus, "accepted" | "rejected">;
    opinion: string;
    basis: string;
  }>;
  rectificationSuggestions: string[];
  conclusion: string;
}

export interface RevisedPlanSnapshotAsset extends ReviewResultBase {
  type: "revised-plan-snapshot";
  processingSummary: string;
  acceptedChanges: Array<{
    issueId: string;
    originalText: string;
    revisedText: string;
  }>;
  rejectedItems: Array<{
    issueId: string;
    title: string;
    reason: string;
  }>;
  processedParagraphs: DocumentParagraph[];
}

export type ReviewResultAsset = SupervisorReportAsset | RevisedPlanSnapshotAsset;

export interface ReviewStreamingStage {
  id: string;
  title: string;
  detail: string;
  progress: number;
  outlineItems: string[];
  documentSnippets: string[];
  issueSummaries: string[];
  hazardLabel?: string;
  basisTrace?: {
    complete: number;
    partial: number;
    missing: number;
  };
}

export interface ReviewTaskSourceObject {
  bucket: string;
  key: string;
  originalFilename: string;
  contentType: string;
  size: number;
}

export type OcrJobState = "submitted" | "pending" | "running" | "done" | "failed";

export interface ReviewTaskOcrJob {
  jobId: string | null;
  state: OcrJobState;
  submittedAt: string;
  sourceObjectKey?: string;
  message?: string;
}

export interface ReviewTask {
  id: string;
  name: string;
  project: string;
  uploader: string;
  updatedAt: string;
  status: DocumentStatus;
  issueCount: number;
  mode: ReviewMode;
  paragraphs: DocumentParagraph[];
  issues: ReviewIssue[];
  streamStageIndex: number;
  sourceObject?: ReviewTaskSourceObject;
  ocrJob?: ReviewTaskOcrJob;
  resultAsset?: ReviewResultAsset;
}

export interface ReviewSession {
  task: ReviewTask;
  paragraphs: DocumentParagraph[];
  issues: ReviewIssue[];
  processedParagraphs: DocumentParagraph[];
}

export interface ReviewStorageSnapshot {
  schemaVersion: number;
  tasks: ReviewTask[];
}

export interface CreateReviewTaskInput {
  name: string;
  project: string;
  uploader: string;
  mode: ReviewMode;
  status?: DocumentStatus;
  sourceObject?: ReviewTaskSourceObject;
  ocrJob?: ReviewTaskOcrJob;
}
