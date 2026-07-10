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
  };
  message?: string;
}

export interface ProviderCheckResult {
  ok: boolean;
  status?: string;
  model?: string;
  preview?: string;
  message?: string;
}

export interface OcrStatusResult {
  ok: boolean;
  jobUrl: string;
  model: string;
  hasToken: boolean;
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
}

export interface MinioUploadResult {
  ok: boolean;
  object?: {
    bucket: string;
    key: string;
    originalFilename: string;
    contentType: string;
    size: number;
  };
  message?: string;
}

export interface ReviewStreamEvent {
  type: string;
  stageId: string;
  title: string;
  detail: string;
  progress: number;
  issueSummaries: string[];
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

export function runReviewStreamConnectivityCheck(timeoutMs = 5000) {
  return new Promise<ReviewStreamEvent[]>((resolve, reject) => {
    const events: ReviewStreamEvent[] = [];
    const eventSource = new EventSource("/api/review-agent/stream");
    const timer = window.setTimeout(() => {
      eventSource.close();
      resolve(events);
    }, timeoutMs);

    eventSource.addEventListener("review-event", (event) => {
      const payload = JSON.parse(event.data) as ReviewStreamEvent;
      events.push(payload);
      if (payload.type === "review.complete") {
        window.clearTimeout(timer);
        eventSource.close();
        resolve(events);
      }
    });

    eventSource.onerror = () => {
      window.clearTimeout(timer);
      eventSource.close();
      if (events.length > 0) {
        resolve(events);
        return;
      }
      reject(new Error("Review stream connectivity check failed."));
    };
  });
}
