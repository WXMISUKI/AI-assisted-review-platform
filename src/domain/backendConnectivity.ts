import type {
  OpeningConditionObjectRef,
  OpeningConditionPilotChecklistDefinitionItem,
  OpeningConditionPilotIntakeDiagnostics,
  OpeningConditionPilotKnowledgeBaseRef,
  OpeningConditionPilotPreflightReadiness,
  OpeningConditionPilotTask,
} from "./openingConditionPilot";
import type {
  DocumentParagraph,
  IssueStatus,
  RecoveredDocumentSection,
  RecoveredDocumentStructure,
  ReviewDecisionActivity,
  ReviewDraftIssueGenerationResult,
  ReviewIssue,
  ReviewMode,
  ReviewPreparationPackage,
  ReviewResultAsset,
  ReviewStorageSnapshot,
  ReviewTask,
} from "./reviewTypes";

export interface BackendHealthResult {
  ok: boolean;
  service?: string;
  timestamp?: string;
  providers?: {
    openai?: {
      configured: boolean;
      hasBaseURL: boolean;
      model: string | null;
    };
    paddleocr?: {
      configured: boolean;
      hasToken: boolean;
      jobUrl: string;
      model: string;
    };
    minio?: {
      configured: boolean;
      hasEndpoint: boolean;
      hasPublicEndpoint: boolean;
      hasAccessKey: boolean;
      hasSecretKey: boolean;
      bucket: string | null;
      region: string;
    };
    ragflow?: {
      configured: boolean;
      enabled: boolean;
      hasBaseURL: boolean;
      hasApiKey: boolean;
      defaultDatasetId: string | null;
      healthPath: string;
      retrievalPath: string;
      status: "ready" | "degraded" | "failed" | "disabled" | "unconfigured" | "provisional" | "blocked";
      summary: string;
    };
    summary?: {
      total: number;
      ready: number;
      overall: "ready" | "degraded" | "unconfigured";
      optional?: {
        total: number;
        ready: number;
      };
    };
  };
  knowledgeBaseProvider?: ExternalProviderReadinessSummary;
  agentService?: AgentServiceReadinessSummary;
  queue?: ReviewQueueStatusResult;
  message?: string;
}

export interface ExternalProviderReadinessSummary {
  provider?: string;
  configured: boolean;
  ready: boolean;
  status: "ready" | "degraded" | "failed" | "disabled" | "unconfigured" | "provisional" | "blocked";
  source: string;
  summary: string;
  diagnostics?: Array<Record<string, unknown>>;
  metadata?: Record<string, unknown>;
}

export interface AgentServiceReadinessSummary {
  configured: boolean;
  ready: boolean;
  status: "ready" | "degraded" | "unavailable" | "disabled";
  source: "python-agent-service" | "local-fallback";
  summary: string;
  diagnostics?: Array<{
    status?: string;
    message?: string;
    statusCode?: number;
  }>;
}

export interface ReviewQueueStatusResult {
  ok: boolean;
  schemaVersion?: number;
  adapter?: string;
  ready?: boolean;
  counts?: Record<string, number>;
  total?: number;
  activeWorkerIds?: string[];
  activeJobCount?: number;
  oldestQueuedAgeMs?: number;
  maxJobs?: number;
  worker?: {
    started: boolean;
    workerId: string;
    busy: boolean;
    pollIntervalMs: number;
    leaseMs: number;
  };
  message?: string;
}

export interface ProviderCheckResult {
  ok: boolean;
  status?: string;
  configured?: boolean;
  model?: string;
  hasBaseURL?: boolean;
  preview?: string;
  message?: string;
}

export interface OcrStatusResult {
  ok: boolean;
  configured?: boolean;
  jobUrl: string;
  model: string;
  hasToken: boolean;
}

export interface OcrJobProgress {
  totalPages?: number;
  extractedPages?: number;
  startTime?: string;
  endTime?: string;
}

export interface OcrJobStatusResult {
  ok: boolean;
  state?: "submitted" | "pending" | "running" | "done" | "failed";
  progress?: OcrJobProgress | null;
  resultUrl?: {
    jsonUrl?: string;
  } | null;
  errorMsg?: string | null;
  message?: string;
  statusCode?: number;
}

export interface MinioStatusResult {
  ok: boolean;
  configured: boolean;
  hasEndpoint: boolean;
  hasPublicEndpoint: boolean;
  hasAccessKey: boolean;
  hasSecretKey: boolean;
  bucket: string | null;
  region: string;
  status?: string;
  message?: string;
  summary?: string;
}

export interface MinioUploadResult {
  ok: boolean;
  object?: {
    bucket: string;
    key: string;
    originalFilename: string;
    contentType: string;
    size: number;
    summary?: string;
  };
  message?: string;
}

export interface StoredObjectOcrSubmitResult {
  ok: boolean;
  configured?: boolean;
  jobId?: string;
  status?: string;
  message?: string;
  statusCode?: number;
  sourceObject?: {
    bucket: string;
    key: string;
    expiresIn: number;
  };
}

export interface OcrRecoveredStructureHydrationResult {
  ok: boolean;
  recoveredStructure?: RecoveredDocumentStructure;
  message?: string;
}

export interface ReviewStreamEvent {
  sequence?: number;
  type: string;
  stageId: string;
  stageType?: string;
  title: string;
  detail: string;
  progress: number;
  runId?: string;
  status?: "running" | "ready" | "degraded" | "failed";
  agentKey?: string;
  agentLabel?: string;
  currentSection?: string;
  currentParagraphId?: string;
  currentParagraphIndex?: number;
  currentParagraphTotal?: number;
  currentParagraphLabel?: string;
  issueSummaries: string[];
  providers?: BackendHealthResult["providers"];
  completedAt?: string;
  diagnostics?: {
    status: string;
    message: string;
    candidateCount?: number;
  };
  agentExecution?: {
    source?: "python-agent-service" | "local-fallback" | string;
    status?: "ready" | "degraded" | "failed" | string;
    diagnostics?: Array<{
      status?: string;
      message?: string;
      statusCode?: number;
    }>;
  };
  preparationPackage?: Pick<
    ReviewPreparationPackage,
    | "packageId"
    | "source"
    | "status"
    | "structureSummary"
    | "issueSummaries"
    | "providerSummary"
    | "message"
  > & {
    stageEvents?: Array<Omit<ReviewStreamEvent, "preparationPackage" | "providers">>;
  };
  draftIssueGeneration?: ReviewDraftIssueGenerationResult & {
    runId?: string;
    startedAt?: string;
    completedAt?: string;
  };
}

export interface ReviewStreamStructureSummary {
  sectionCount?: number;
  paragraphCount?: number;
  currentSection?: string;
  currentParagraphLabel?: string;
  currentParagraphIndex?: number;
  currentParagraphTotal?: number;
}

export interface ReviewStreamSubscriptionHandlers {
  onEvent?: (event: ReviewStreamEvent) => void;
  onComplete?: (events: ReviewStreamEvent[]) => void;
  onError?: (error: Error) => void;
  onTimeout?: (events: ReviewStreamEvent[]) => void;
}

export interface ReviewGenerationRunCreateResult {
  ok: boolean;
  runId?: string;
  jobId?: string;
  queueStatus?: ReviewQueueStatusResult;
  status?: string;
  statusUrl?: string;
  eventsUrl?: string;
  streamUrl?: string;
  createdAt?: string;
  expiresAt?: string;
  acceptedParagraphCount?: number;
  message?: string;
}

export interface ReviewGenerationRunStatusResult {
  ok: boolean;
  schemaVersion?: number;
  runId?: string;
  taskId?: string;
  mode?: ReviewMode;
  status?: "created" | "running" | "ready" | "degraded" | "failed" | "expired" | "not_found";
  createdAt?: string;
  updatedAt?: string;
  startedAt?: string;
  completedAt?: string;
  expiresAt?: string;
  progress?: number;
  activeStage?: {
    stageId?: string;
    stageType?: string;
    title?: string;
    detail?: string;
    progress?: number;
    currentSection?: string;
    currentParagraphId?: string;
    currentParagraphIndex?: number;
    currentParagraphTotal?: number;
    currentParagraphLabel?: string;
    agentKey?: string;
    agentLabel?: string;
  };
  structureSummary?: ReviewStreamStructureSummary;
  acceptedParagraphCount?: number;
  maxIssues?: number;
  preparationPackageSummary?: unknown;
  draftIssueGenerationSummary?: unknown;
  agentExecutionSummary?: {
    source?: "python-agent-service" | "local-fallback" | string;
    status?: "ready" | "degraded" | "failed" | string;
    completedAt?: string;
    diagnostics?: Array<{
      status?: string;
      message?: string;
      statusCode?: number;
    }>;
  };
  diagnostics?: {
    status?: string;
    message?: string;
    candidateCount?: number;
  };
  lastSequence?: number;
  statusUrl?: string;
  eventsUrl?: string;
  streamUrl?: string;
  message?: string;
}

export interface ReviewGenerationRunEventsResult {
  ok: boolean;
  schemaVersion?: number;
  runId?: string;
  taskId?: string;
  status?: string;
  events: ReviewStreamEvent[];
  lastSequence?: number;
  message?: string;
}

export interface ReviewTasksListResult extends ReviewStorageSnapshot {
  ok: boolean;
  message?: string;
}

export interface ReviewTasksBulkSyncResult {
  ok: boolean;
  schemaVersion?: number;
  savedCount?: number;
  tasks?: ReviewTask[];
  message?: string;
}

export interface ReviewTaskMutationResult {
  ok: boolean;
  status?: string;
  task?: ReviewTask;
  issue?: ReviewIssue;
  resultAsset?: ReviewResultAsset;
  message?: string;
}

export interface ReviewTaskActivitiesResult {
  ok: boolean;
  status?: string;
  taskId?: string;
  activities?: ReviewDecisionActivity[];
  message?: string;
}

export interface OpeningConditionPilotTaskResult {
  ok: boolean;
  status?: string;
  task?: OpeningConditionPilotTask;
  message?: string;
  errors?: string[];
}

export interface OpeningConditionPilotTasksResult {
  ok: boolean;
  tasks: OpeningConditionPilotTask[];
  message?: string;
}

export interface OpeningConditionPilotReadinessResult {
  ok: boolean;
  taskId?: string;
  workspaceId?: string;
  state?: OpeningConditionPilotTask["state"];
  preflightReadiness?: OpeningConditionPilotPreflightReadiness;
  knowledgeBaseRef?: OpeningConditionPilotKnowledgeBaseRef;
  status?: string;
  message?: string;
}

export interface OpeningConditionPilotBasisRecord {
  id: string;
  workspaceId: string;
  title: string;
  componentType: string;
  version: string;
  status: "draft" | "pending_confirmation" | "confirmed" | "published" | "superseded" | "rejected";
  applicability?: string;
  confidence?: "high" | "medium" | "low";
  confirmedBy?: string;
  confirmedAt?: string;
  publishedBy?: string;
  publishedAt?: string;
  safeNote?: string;
}

export interface OpeningConditionPilotBasisResult {
  ok: boolean;
  workspaceId: string;
  basisVersions: OpeningConditionPilotBasisRecord[];
  basisVersion?: OpeningConditionPilotBasisRecord;
  status?: string;
  message?: string;
}

export interface OpeningConditionPilotMasterDataRecord {
  id: string;
  workspaceId: string;
  type: string;
  label: string;
  normalizedFields?: Record<string, unknown>;
  status: "provisional" | "confirmed" | "published" | "human_approved" | "rejected" | "expired";
  validity?: string;
  confidence?: "high" | "medium" | "low";
  confirmedBy?: string;
  confirmedAt?: string;
  publishedBy?: string;
  publishedAt?: string;
  rejectionReason?: string;
  safeNote?: string;
}

export interface OpeningConditionPilotMasterDataResult {
  ok: boolean;
  workspaceId: string;
  masterDataRecords: OpeningConditionPilotMasterDataRecord[];
  masterDataRecord?: OpeningConditionPilotMasterDataRecord;
  status?: string;
  message?: string;
}

export interface OpeningConditionPilotKnowledgeBaseResult {
  ok: boolean;
  workspaceId?: string;
  knowledgeBases?: OpeningConditionPilotKnowledgeBaseRef[];
  knowledgeBase?: OpeningConditionPilotKnowledgeBaseRef;
  task?: OpeningConditionPilotTask;
  preflightReadiness?: OpeningConditionPilotPreflightReadiness;
  status?: string;
  message?: string;
}

export interface OpeningConditionPilotHumanReviewResult {
  ok: boolean;
  taskId?: string;
  workspaceId?: string;
  humanReviewQueue?: OpeningConditionPilotTask["humanReviewQueue"];
  humanReviewItem?: OpeningConditionPilotTask["humanReviewQueue"][number];
  blockingCount?: number;
  task?: OpeningConditionPilotTask;
  status?: string;
  message?: string;
}

export interface OpeningConditionPilotReportResult {
  ok: boolean;
  task?: OpeningConditionPilotTask;
  reportAsset?: OpeningConditionPilotTask["reportAsset"];
  status?: string;
  message?: string;
}

export interface OpeningConditionPilotIntakeInitResult {
  ok: boolean;
  status?: string;
  task?: OpeningConditionPilotTask;
  packet?: OpeningConditionPilotTask["packet"];
  preflightReadiness?: OpeningConditionPilotPreflightReadiness;
  intake?: OpeningConditionPilotIntakeDiagnostics;
  message?: string;
  errors?: string[];
}

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

export async function fetchBackendHealth() {
  const response = await fetch("/api/health");
  return readJson<BackendHealthResult>(response);
}

export async function fetchKnowledgeBaseProviderStatus() {
  const response = await fetch("/api/knowledge-base/provider/status");
  return readJson<ExternalProviderReadinessSummary>(response);
}

export async function runLlmConnectivityCheck() {
  const response = await fetch("/api/llm/check", { method: "POST" });
  return readJson<ProviderCheckResult>(response);
}

export async function fetchOcrStatus() {
  const response = await fetch("/api/ocr/status");
  return readJson<OcrStatusResult>(response);
}

export async function fetchPersistedReviewTasks() {
  const response = await fetch("/api/review-tasks");
  return readJson<ReviewTasksListResult>(response);
}

export async function fetchReviewQueueStatus() {
  const response = await fetch("/api/review-agent/queue/status");
  return readJson<ReviewQueueStatusResult>(response);
}

export async function syncPersistedReviewTasks(tasks: ReviewTask[]) {
  const response = await fetch("/api/review-tasks/bulk", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tasks }),
  });
  return readJson<ReviewTasksBulkSyncResult>(response);
}

export async function resolvePersistedReviewTaskIssue(input: {
  taskId: string;
  issueId: string;
  status: Extract<IssueStatus, "accepted" | "rejected">;
  editedText?: string;
}) {
  const response = await fetch(
    `/api/review-tasks/${encodeURIComponent(input.taskId)}/issues/${encodeURIComponent(input.issueId)}/resolve`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: input.status,
        editedText: input.editedText,
      }),
    },
  );
  return readJson<ReviewTaskMutationResult>(response);
}

export async function updatePersistedReviewTaskIssueDraft(input: {
  taskId: string;
  issueId: string;
  suggestion: string;
}) {
  const response = await fetch(
    `/api/review-tasks/${encodeURIComponent(input.taskId)}/issues/${encodeURIComponent(input.issueId)}/draft`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        suggestion: input.suggestion,
      }),
    },
  );
  return readJson<ReviewTaskMutationResult>(response);
}

export async function addPersistedManualReviewTaskIssue(input: {
  taskId: string;
  issue: ReviewIssue;
}) {
  const response = await fetch(`/api/review-tasks/${encodeURIComponent(input.taskId)}/issues/manual`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      issue: input.issue,
    }),
  });
  return readJson<ReviewTaskMutationResult>(response);
}

export async function deletePersistedManualReviewTaskIssue(input: {
  taskId: string;
  issueId: string;
}) {
  const response = await fetch(
    `/api/review-tasks/${encodeURIComponent(input.taskId)}/issues/${encodeURIComponent(input.issueId)}`,
    {
      method: "DELETE",
    },
  );
  return readJson<ReviewTaskMutationResult>(response);
}

export async function completePersistedReviewTask(input: {
  taskId: string;
  mode: ReviewMode;
}) {
  const response = await fetch(`/api/review-tasks/${encodeURIComponent(input.taskId)}/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mode: input.mode,
    }),
  });
  return readJson<ReviewTaskMutationResult>(response);
}

export async function fetchReviewTaskDecisionActivities(taskId: string, limit = 50) {
  const searchParams = new URLSearchParams();
  if (limit > 0) {
    searchParams.set("limit", String(limit));
  }
  const queryString = searchParams.toString();
  const response = await fetch(
    `/api/review-tasks/${encodeURIComponent(taskId)}/activities${queryString ? `?${queryString}` : ""}`,
  );
  return readJson<ReviewTaskActivitiesResult>(response);
}

export async function upsertOpeningConditionPilotTask(taskId: string, task: Partial<OpeningConditionPilotTask>) {
  const response = await fetch(`/api/opening-condition/pilot-tasks/${encodeURIComponent(taskId)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ task }),
  });
  return readJson<OpeningConditionPilotTaskResult>(response);
}

export async function fetchOpeningConditionPilotTask(taskId: string) {
  const response = await fetch(`/api/opening-condition/pilot-tasks/${encodeURIComponent(taskId)}`);
  return readJson<OpeningConditionPilotTaskResult>(response);
}

export async function fetchOpeningConditionPilotTaskReadiness(taskId: string) {
  const response = await fetch(`/api/opening-condition/pilot-tasks/${encodeURIComponent(taskId)}/readiness`);
  return readJson<OpeningConditionPilotReadinessResult>(response);
}

export async function fetchOpeningConditionPilotKnowledgeBases(workspaceId: string) {
  const response = await fetch(`/api/opening-condition/workspaces/${encodeURIComponent(workspaceId)}/knowledge-bases`);
  return readJson<OpeningConditionPilotKnowledgeBaseResult>(response);
}

export async function upsertOpeningConditionPilotKnowledgeBase(
  workspaceId: string,
  knowledgeBaseId: string,
  knowledgeBase: Partial<OpeningConditionPilotKnowledgeBaseRef>,
) {
  const response = await fetch(
    `/api/opening-condition/workspaces/${encodeURIComponent(workspaceId)}/knowledge-bases/${encodeURIComponent(knowledgeBaseId)}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ knowledgeBase }),
    },
  );
  return readJson<OpeningConditionPilotKnowledgeBaseResult>(response);
}

export async function bindOpeningConditionPilotKnowledgeBase(taskId: string, knowledgeBaseId: string) {
  const response = await fetch(
    `/api/opening-condition/pilot-tasks/${encodeURIComponent(taskId)}/knowledge-base/${encodeURIComponent(knowledgeBaseId)}/bind`,
    {
      method: "POST",
    },
  );
  return readJson<OpeningConditionPilotKnowledgeBaseResult>(response);
}

export async function intakeOpeningConditionPilotPacket(taskId: string, packet: {
  checklistObject: OpeningConditionObjectRef;
  sourceObjects: OpeningConditionObjectRef[];
  submittedBy?: string;
}) {
  const response = await fetch(`/api/opening-condition/pilot-tasks/${encodeURIComponent(taskId)}/packet`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(packet),
  });
  return readJson<OpeningConditionPilotTaskResult>(response);
}

export async function initializeOpeningConditionPilotIntake(input: {
  taskId: string;
  context: OpeningConditionPilotTask["context"];
  checklistObject: OpeningConditionObjectRef;
  sourceObjects: OpeningConditionObjectRef[];
  checklistItems?: OpeningConditionPilotChecklistDefinitionItem[];
  basisVersionId?: string;
  knowledgeBaseId?: string;
  requiredMasterDataIds?: string[];
  submittedBy?: string;
}) {
  const response = await fetch("/api/opening-condition/pilot-tasks/intake-init", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  return readJson<OpeningConditionPilotIntakeInitResult>(response);
}

export async function runOpeningConditionPilotMatch(taskId: string, checklistItems?: Array<{
  id: string;
  name: string;
  category?: string;
  subCategory?: string;
  required?: boolean;
  expectedEvidenceHints?: string[];
  basisVersionId?: string;
  masterDataIds?: string[];
}>) {
  const response = await fetch(`/api/opening-condition/pilot-tasks/${encodeURIComponent(taskId)}/match`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(checklistItems ? { checklistItems } : {}),
  });
  return readJson<OpeningConditionPilotTaskResult>(response);
}

export async function fetchOpeningConditionPilotBasis(workspaceId: string) {
  const response = await fetch(`/api/opening-condition/workspaces/${encodeURIComponent(workspaceId)}/basis`);
  return readJson<OpeningConditionPilotBasisResult>(response);
}

export async function upsertOpeningConditionPilotBasis(
  workspaceId: string,
  basisId: string,
  basisVersion: Partial<OpeningConditionPilotBasisRecord>,
) {
  const response = await fetch(
    `/api/opening-condition/workspaces/${encodeURIComponent(workspaceId)}/basis/${encodeURIComponent(basisId)}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ basisVersion }),
    },
  );
  return readJson<OpeningConditionPilotBasisResult>(response);
}

export async function publishOpeningConditionPilotBasis(workspaceId: string, basisId: string, actorId: string) {
  const response = await fetch(
    `/api/opening-condition/workspaces/${encodeURIComponent(workspaceId)}/basis/${encodeURIComponent(basisId)}/publish`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ actorId }),
    },
  );
  return readJson<OpeningConditionPilotBasisResult>(response);
}

export async function fetchOpeningConditionPilotMasterData(workspaceId: string) {
  const response = await fetch(`/api/opening-condition/workspaces/${encodeURIComponent(workspaceId)}/master-data`);
  return readJson<OpeningConditionPilotMasterDataResult>(response);
}

export async function upsertOpeningConditionPilotMasterData(
  workspaceId: string,
  recordId: string,
  masterDataRecord: Partial<OpeningConditionPilotMasterDataRecord>,
) {
  const response = await fetch(
    `/api/opening-condition/workspaces/${encodeURIComponent(workspaceId)}/master-data/${encodeURIComponent(recordId)}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ masterDataRecord }),
    },
  );
  return readJson<OpeningConditionPilotMasterDataResult>(response);
}

export async function decideOpeningConditionPilotMasterData(
  workspaceId: string,
  recordId: string,
  decision: "publish" | "approve" | "reject",
  actorId: string,
  safeNote?: string,
) {
  const response = await fetch(
    `/api/opening-condition/workspaces/${encodeURIComponent(workspaceId)}/master-data/${encodeURIComponent(recordId)}/decision`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ decision, actorId, safeNote }),
    },
  );
  return readJson<OpeningConditionPilotMasterDataResult>(response);
}

export async function fetchOpeningConditionPilotHumanReview(taskId: string) {
  const response = await fetch(`/api/opening-condition/pilot-tasks/${encodeURIComponent(taskId)}/human-review`);
  return readJson<OpeningConditionPilotHumanReviewResult>(response);
}

export async function decideOpeningConditionPilotHumanReview(
  taskId: string,
  reviewId: string,
  decision: "confirm" | "correct" | "reject" | "defer",
  actorId: string,
  safeNote?: string,
) {
  const response = await fetch(
    `/api/opening-condition/pilot-tasks/${encodeURIComponent(taskId)}/human-review/${encodeURIComponent(reviewId)}/decision`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ decision, actorId, safeNote }),
    },
  );
  return readJson<OpeningConditionPilotHumanReviewResult>(response);
}

export async function generateOpeningConditionPilotReport(taskId: string, objectRef?: OpeningConditionObjectRef) {
  const response = await fetch(`/api/opening-condition/pilot-tasks/${encodeURIComponent(taskId)}/report`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ objectRef }),
  });
  return readJson<OpeningConditionPilotReportResult>(response);
}

export async function archiveOpeningConditionPilotTask(taskId: string) {
  const response = await fetch(`/api/opening-condition/pilot-tasks/${encodeURIComponent(taskId)}/archive`, {
    method: "POST",
  });
  return readJson<OpeningConditionPilotReportResult>(response);
}

export async function fetchOcrJobStatus(jobId: string): Promise<OcrJobStatusResult> {
  const response = await fetch(`/api/ocr/jobs/${encodeURIComponent(jobId)}`);
  const payload = (await response.json().catch(() => ({}))) as OcrJobStatusResult & {
    data?: OcrJobStatusResult;
  };

  const normalized = "data" in payload && payload.data ? payload.data : payload;
  if (!response.ok || normalized.ok === false) {
    return {
      ok: false,
      state: "failed",
      message: normalized.message || normalized.errorMsg || "PaddleOCR job status check failed.",
      errorMsg: normalized.errorMsg || normalized.message || "PaddleOCR job status check failed.",
    } as OcrJobStatusResult;
  }

  return normalized as OcrJobStatusResult;
}

export async function fetchMinioStatus() {
  const response = await fetch("/api/minio/status");
  return readJson<MinioStatusResult>(response);
}

export async function uploadMinioDocument(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/minio/upload", {
    method: "POST",
    body: formData,
  });
  return readJson<MinioUploadResult>(response);
}

export async function submitStoredObjectOcrJob(key: string) {
  const response = await fetch("/api/ocr/jobs/object", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ key }),
  });
  return readJson<StoredObjectOcrSubmitResult>(response);
}

export async function hydrateOcrResultStructure(input: {
  jsonUrl?: string;
  jsonText?: string;
}) {
  const response = await fetch("/api/ocr/results/hydrate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  return readJson<OcrRecoveredStructureHydrationResult>(response);
}

export function subscribeReviewStreamEvents(
  handlers: ReviewStreamSubscriptionHandlers = {},
  structureSummary?: ReviewStreamStructureSummary,
  timeoutMs = 5000,
) {
  const events: ReviewStreamEvent[] = [];
  const searchParams = new URLSearchParams();
  if (structureSummary?.sectionCount) {
    searchParams.set("sectionCount", String(structureSummary.sectionCount));
  }
  if (structureSummary?.paragraphCount) {
    searchParams.set("paragraphCount", String(structureSummary.paragraphCount));
  }
  if (structureSummary?.currentSection) {
    searchParams.set("currentSection", structureSummary.currentSection);
  }
  if (structureSummary?.currentParagraphLabel) {
    searchParams.set("currentParagraphLabel", structureSummary.currentParagraphLabel);
  }
  if (structureSummary?.currentParagraphIndex) {
    searchParams.set("currentParagraphIndex", String(structureSummary.currentParagraphIndex));
  }
  if (structureSummary?.currentParagraphTotal) {
    searchParams.set("currentParagraphTotal", String(structureSummary.currentParagraphTotal));
  }

  const queryString = searchParams.toString();
  const streamUrl = queryString ? `/api/review-agent/stream?${queryString}` : "/api/review-agent/stream";
  const eventSource = new EventSource(streamUrl);
  const timer = timeoutMs > 0 ? window.setTimeout(() => {
    eventSource.close();
    handlers.onTimeout?.(events);
  }, timeoutMs) : null;

  const close = () => {
    if (timer != null) {
      window.clearTimeout(timer);
    }
    eventSource.close();
  };

  eventSource.addEventListener("review-event", (event) => {
    const payload = JSON.parse(event.data) as ReviewStreamEvent;
    events.push(payload);
    handlers.onEvent?.(payload);
    if (payload.type === "review.complete") {
      close();
      handlers.onComplete?.(events);
    }
  });

  eventSource.onerror = () => {
    close();
    handlers.onError?.(new Error("Review stream connectivity check failed."));
  };

  return {
    close,
  };
}

function subscribeReviewEventsFromUrl(
  streamUrl: string,
  handlers: ReviewStreamSubscriptionHandlers = {},
  timeoutMs = 10000,
) {
  const events: ReviewStreamEvent[] = [];
  const eventSource = new EventSource(streamUrl);
  const timer = timeoutMs > 0 ? window.setTimeout(() => {
    eventSource.close();
    handlers.onTimeout?.(events);
  }, timeoutMs) : null;

  const close = () => {
    if (timer != null) {
      window.clearTimeout(timer);
    }
    eventSource.close();
  };

  eventSource.addEventListener("review-event", (event) => {
    const payload = JSON.parse(event.data) as ReviewStreamEvent;
    events.push(payload);
    handlers.onEvent?.(payload);
    if (payload.type === "review.complete" || payload.type === "review.failed") {
      close();
      handlers.onComplete?.(events);
    }
  });

  eventSource.onerror = () => {
    close();
    handlers.onError?.(new Error("Review generation run stream failed."));
  };

  return {
    close,
  };
}

export async function createReviewGenerationRun(input: {
  taskId: string;
  structureSummary: ReviewStreamStructureSummary;
  paragraphs: DocumentParagraph[];
  mode: ReviewMode;
  maxIssues?: number;
}) {
  const response = await fetch("/api/review-agent/generation-runs", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      taskId: input.taskId,
      structureSummary: input.structureSummary,
      paragraphs: input.paragraphs.slice(0, 12).map((paragraph) => ({
        id: paragraph.id,
        section: paragraph.section,
        text: paragraph.text.slice(0, 1600),
      })),
      mode: input.mode,
      maxIssues: input.maxIssues ?? 6,
    }),
  });

  return readJson<ReviewGenerationRunCreateResult>(response);
}

export async function fetchReviewGenerationRunStatus(runId: string) {
  const response = await fetch(`/api/review-agent/generation-runs/${encodeURIComponent(runId)}`);
  return readJson<ReviewGenerationRunStatusResult>(response);
}

export async function fetchReviewGenerationRunEvents(runId: string, afterSequence = 0) {
  const searchParams = new URLSearchParams();
  if (afterSequence > 0) {
    searchParams.set("after", String(afterSequence));
  }
  const queryString = searchParams.toString();
  const response = await fetch(
    `/api/review-agent/generation-runs/${encodeURIComponent(runId)}/events${queryString ? `?${queryString}` : ""}`,
  );
  return readJson<ReviewGenerationRunEventsResult>(response);
}

export function subscribeReviewGenerationRunEvents(
  streamUrl: string,
  handlers: ReviewStreamSubscriptionHandlers = {},
  timeoutMs = 10000,
) {
  return subscribeReviewEventsFromUrl(streamUrl, handlers, timeoutMs);
}

export function runReviewStreamConnectivityCheck(
  timeoutMs = 5000,
  structureSummary?: ReviewStreamStructureSummary,
) {
  return new Promise<ReviewStreamEvent[]>((resolve, reject) => {
    let settled = false;
    const events: ReviewStreamEvent[] = [];
    let subscription: { close: () => void } | null = null;

    const settle = (callback: (events: ReviewStreamEvent[]) => void) => {
      if (settled) {
        return;
      }
      settled = true;
      subscription?.close();
      callback(events);
    };

    subscription = subscribeReviewStreamEvents(
      {
        onEvent: (event) => {
          events.push(event);
        },
        onComplete: () => settle(resolve),
        onTimeout: () => settle(resolve),
        onError: () => {
          if (events.length > 0) {
            settle(resolve);
            return;
          }
          reject(new Error("Review stream connectivity check failed."));
        },
      },
      structureSummary,
      timeoutMs,
    );
  });
}

export async function requestDraftIssueGeneration(input: {
  taskId: string;
  preparationPackage: ReviewPreparationPackage;
  paragraphs: DocumentParagraph[];
  mode: ReviewMode;
  maxIssues?: number;
}) {
  const response = await fetch("/api/review-agent/draft-issues", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      taskId: input.taskId,
      preparationPackage: input.preparationPackage,
      paragraphs: input.paragraphs.slice(0, 12).map((paragraph) => ({
        id: paragraph.id,
        section: paragraph.section,
        text: paragraph.text.slice(0, 1600),
      })),
      mode: input.mode,
      maxIssues: input.maxIssues ?? 6,
    }),
  });

  return readJson<ReviewDraftIssueGenerationResult>(response);
}
