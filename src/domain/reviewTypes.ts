export type IssueSource = "ai" | "manual";

export type IssueStatus = "pending" | "accepted" | "rejected" | "modified";

export type IssueSeverity = "critical" | "high" | "medium" | "low";

export type StatusFilter = "all" | IssueStatus;

export type ReviewMode = "review" | "revise";

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
