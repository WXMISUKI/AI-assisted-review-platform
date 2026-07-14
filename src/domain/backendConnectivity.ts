import type {
  DocumentParagraph,
  RecoveredDocumentSection,
  RecoveredDocumentStructure,
  ReviewDraftIssueGenerationResult,
  ReviewMode,
  ReviewPreparationPackage,
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
    summary?: {
      total: number;
      ready: number;
      overall: "ready" | "degraded" | "unconfigured";
    };
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
  type: string;
  stageId: string;
  stageType?: string;
  title: string;
  detail: string;
  progress: number;
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

async function readJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

export async function fetchBackendHealth() {
  const response = await fetch("/api/health");
  return readJson<BackendHealthResult>(response);
}

export async function runLlmConnectivityCheck() {
  const response = await fetch("/api/llm/check", { method: "POST" });
  return readJson<ProviderCheckResult>(response);
}

export async function fetchOcrStatus() {
  const response = await fetch("/api/ocr/status");
  return readJson<OcrStatusResult>(response);
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
