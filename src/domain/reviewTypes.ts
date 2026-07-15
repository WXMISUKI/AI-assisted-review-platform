export type IssueSource = "ai" | "manual";

export type IssueStatus = "pending" | "accepted" | "rejected" | "modified";

export type IssueSeverity = "critical" | "high" | "medium" | "low";

export type StatusFilter = "all" | IssueStatus;

export type ReviewMode = "review" | "revise";

export type ReviewPipelineStageType =
  | "ocr"
  | "structure-restoration"
  | "basis-binding"
  | "rule-review"
  | "semantic-review"
  | "issue-structuring"
  | "result-packaging";

export type ReviewAgentKey =
  | "structure-restoration"
  | "construction-review"
  | "opening-condition-review"
  | "report-generation";

export type DocumentStatus =
  | "uploading"
  | "uploaded"
  | "parsing"
  | "reviewing"
  | "ready"
  | "completed"
  | "failed";

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

export interface RecoveredDocumentSection {
  id: string;
  title: string;
  paragraphIds: string[];
}

export type StructureRecoveryStatus = "idle" | "recovering" | "done" | "failed";

export interface StructureRecoveryProgress {
  totalParagraphs: number;
  recoveredParagraphs: number;
  currentParagraphId?: string;
  currentSection?: string;
}

export interface RecoveredDocumentStructure {
  status: StructureRecoveryStatus;
  sourceFormat: "mock" | "ocr-markdown" | "ocr-jsonl" | "ocr-text";
  recoveredAt: string | null;
  progress: StructureRecoveryProgress;
  sections: RecoveredDocumentSection[];
  paragraphs: DocumentParagraph[];
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

export type ReviewDraftIssueGenerationSource = "llm" | "deterministic-fallback";

export type ReviewDraftIssueGenerationStatus = "ready" | "fallback" | "failed";

export interface ReviewDraftIssueGenerationDiagnostics {
  status: string;
  message: string;
  candidateCount?: number;
}

export interface ReviewIssueGenerationProvenance {
  generationRunId: string;
  generationSource: ReviewDraftIssueGenerationSource;
  generatedAt: string;
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
  generation?: ReviewIssueGenerationProvenance;
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
  stageType?: ReviewPipelineStageType;
  title: string;
  detail: string;
  progress: number;
  agentKey?: ReviewAgentKey;
  agentLabel?: string;
  currentParagraphId?: string;
  currentParagraphIndex?: number;
  currentParagraphTotal?: number;
  currentParagraphLabel?: string;
  currentSection?: string;
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

export type ReviewPreparationPackageSource = "backend-sse" | "local-fallback";

export type ReviewPreparationPackageStatus = "ready" | "fallback" | "failed";

export interface ReviewPreparationStructureSummary {
  sectionCount: number;
  paragraphCount: number;
  currentSection?: string;
  currentParagraphId?: string;
  currentParagraphLabel?: string;
  currentParagraphIndex?: number;
  currentParagraphTotal?: number;
  sourceFormat?: RecoveredDocumentStructure["sourceFormat"];
}

export interface ReviewPreparationProviderSummary {
  total: number;
  ready: number;
  overall: "ready" | "degraded" | "unconfigured";
}

export interface ReviewPreparationPackage {
  packageId: string;
  source: ReviewPreparationPackageSource;
  status: ReviewPreparationPackageStatus;
  createdAt: string;
  completedAt?: string;
  structureSummary: ReviewPreparationStructureSummary;
  stageEvents: ReviewStreamingStage[];
  issueSummaries: string[];
  providerSummary?: ReviewPreparationProviderSummary;
  message?: string;
}

export interface ReviewDraftIssueGenerationResult {
  ok: boolean;
  source: ReviewDraftIssueGenerationSource;
  status: ReviewDraftIssueGenerationStatus;
  issues: ReviewIssue[];
  diagnostics?: ReviewDraftIssueGenerationDiagnostics;
}

export interface ReviewDraftIssueGenerationSnapshot {
  runId: string;
  source: ReviewDraftIssueGenerationSource;
  status: ReviewDraftIssueGenerationStatus;
  startedAt: string;
  completedAt: string;
  issueIds: string[];
  candidateCount: number;
  diagnostics?: ReviewDraftIssueGenerationDiagnostics;
  preparationPackageId?: string;
}

export type ReviewGenerationRunStatus = "idle" | "running" | "ready" | "degraded" | "failed";

export type ReviewGenerationActivityType =
  | "run-started"
  | "stage-updated"
  | "package-persisted"
  | "draft-issues-generated"
  | "run-ready"
  | "run-degraded"
  | "run-failed"
  | "run-retried";

export interface ReviewGenerationRunActiveStage {
  stageIndex: number;
  stageType?: ReviewPipelineStageType;
  agentKey?: ReviewAgentKey;
  paragraphIndex?: number;
  paragraphTotal?: number;
  currentParagraphId?: string;
  paragraphLabel?: string;
  currentSection?: string;
}

export interface ReviewGenerationRunDiagnostics {
  status: string;
  message: string;
  source?: "review-preparation" | "draft-issue-generation" | "ocr-hydration" | "local-fallback";
}

export interface ReviewGenerationRunSnapshot {
  runId: string;
  status: ReviewGenerationRunStatus;
  startedAt: string;
  updatedAt: string;
  completedAt?: string;
  activeStage?: ReviewGenerationRunActiveStage;
  preparationPackageId?: string;
  draftIssueGenerationRunId?: string;
  generatedIssueCount: number;
  diagnostics?: ReviewGenerationRunDiagnostics;
}

export interface ReviewGenerationActivity {
  id: string;
  type: ReviewGenerationActivityType;
  occurredAt: string;
  runId: string;
  stage?: ReviewGenerationRunActiveStage;
  status?: ReviewGenerationRunStatus | ReviewPreparationPackageStatus | ReviewDraftIssueGenerationStatus;
  message?: string;
  preparationPackageId?: string;
  draftIssueGenerationRunId?: string;
  issueCount?: number;
}

export type ReviewDecisionActivityType =
  | "issue-resolved"
  | "issue-draft-updated"
  | "manual-issue-added"
  | "manual-issue-deleted"
  | "review-completed";

export interface ReviewDecisionActivity {
  id: string;
  type: ReviewDecisionActivityType;
  occurredAt: string;
  actor: {
    id: string;
    label: string;
    role?: string;
  };
  issueId?: string;
  issueTitle?: string;
  decision?: Extract<IssueStatus, "accepted" | "rejected">;
  mode?: ReviewMode;
  resultAssetId?: string;
  message?: string;
}

export interface ReviewTaskSourceObject {
  bucket: string;
  key: string;
  originalFilename: string;
  contentType: string;
  size: number;
}

export type OcrJobState = "submitted" | "pending" | "running" | "done" | "failed";

export interface OcrJobProgress {
  totalPages?: number;
  extractedPages?: number;
  startTime?: string;
  endTime?: string;
}

export interface ReviewTaskOcrJob {
  jobId: string | null;
  state: OcrJobState;
  submittedAt: string;
  sourceObjectKey?: string;
  message?: string;
  progress?: OcrJobProgress | null;
}

export interface ReviewPipelineSnapshot {
  stageIndex: number;
  stageType?: ReviewPipelineStageType;
  agentKey?: ReviewAgentKey;
  paragraphIndex?: number;
  paragraphTotal?: number;
  currentParagraphId?: string;
  paragraphLabel?: string;
  currentSection?: string;
  updatedAt: string;
}

export interface ReviewViewContext {
  activeSectionTitle?: string;
  activeParagraphId?: string;
  activeIssueId?: string;
}

export interface ReviewTaskFailure {
  message: string;
  failedAt: string;
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
  recoveredStructure?: RecoveredDocumentStructure;
  issues: ReviewIssue[];
  streamStageIndex: number;
  streamStageType?: ReviewPipelineStageType;
  streamAgentKey?: ReviewAgentKey;
  streamParagraphIndex?: number;
  streamParagraphTotal?: number;
  streamCurrentParagraphId?: string;
  streamParagraphLabel?: string;
  pipelineSnapshot?: ReviewPipelineSnapshot;
  reviewViewContext?: ReviewViewContext;
  preparationPackage?: ReviewPreparationPackage;
  draftIssueGenerationSnapshot?: ReviewDraftIssueGenerationSnapshot;
  reviewGenerationRun?: ReviewGenerationRunSnapshot;
  reviewGenerationActivities?: ReviewGenerationActivity[];
  reviewDecisionActivities?: ReviewDecisionActivity[];
  sourceObject?: ReviewTaskSourceObject;
  ocrJob?: ReviewTaskOcrJob;
  failure?: ReviewTaskFailure;
  resultAsset?: ReviewResultAsset;
}

export interface ReviewSession {
  task: ReviewTask;
  paragraphs: DocumentParagraph[];
  recoveredStructure?: RecoveredDocumentStructure;
  issues: ReviewIssue[];
  processedParagraphs: DocumentParagraph[];
  pipelineSnapshot?: ReviewPipelineSnapshot;
  reviewViewContext?: ReviewViewContext;
  preparationPackage?: ReviewPreparationPackage;
  draftIssueGenerationSnapshot?: ReviewDraftIssueGenerationSnapshot;
  reviewGenerationRun?: ReviewGenerationRunSnapshot;
  reviewGenerationActivities?: ReviewGenerationActivity[];
  reviewDecisionActivities?: ReviewDecisionActivity[];
  resultAsset?: ReviewResultAsset;
  lifecycle?: import("./reviewTaskOrchestration").ReviewTaskOrchestrationSnapshot;
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
  failure?: ReviewTaskFailure;
  recoveredStructure?: RecoveredDocumentStructure;
}
