import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadDotEnv() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) {
    return;
  }

  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split("=");
    if (!key || process.env[key] != null) {
      continue;
    }

    process.env[key] = valueParts.join("=").replace(/^["']|["']$/g, "");
  }
}

loadDotEnv();

function normalizeOpenAIBaseURL(value) {
  const trimmedValue = value.trim().replace(/\/$/, "");
  if (!trimmedValue) {
    return "";
  }

  return /\/v\d+$/.test(trimmedValue) ? trimmedValue : `${trimmedValue}/v1`;
}

export const config = {
  port: Number(process.env.BACKEND_PORT || 8787),
  openai: {
    apiKey: process.env.OPENAI_API_KEY || "",
    baseURL: normalizeOpenAIBaseURL(process.env.OPENAI_BASE_URL || ""),
    model: process.env.OPENAI_MODEL || "",
  },
  paddleocr: {
    token: process.env.PADDLEOCR_TOKEN || "",
    jobUrl: process.env.PADDLEOCR_JOB_URL || "https://paddleocr.aistudio-app.com/api/v2/ocr/jobs",
    model: process.env.PADDLEOCR_MODEL || "PaddleOCR-VL-1.6",
  },
  minio: {
    endpoint: (process.env.MINIO_ENDPOINT || "").replace(/\/$/, ""),
    publicEndpoint: (process.env.MINIO_PUBLIC_ENDPOINT || "").replace(/\/$/, ""),
    accessKey: process.env.MINIO_ACCESS_KEY || "",
    secretKey: process.env.MINIO_SECRET_KEY || "",
    bucket: process.env.MINIO_BUCKET || "construction-review-docs",
    region: process.env.MINIO_REGION || "us-east-1",
  },
};

export function getSafeProviderStatus() {
  return {
    openai: {
      configured: Boolean(config.openai.apiKey && config.openai.model),
      hasBaseURL: Boolean(config.openai.baseURL),
      model: config.openai.model || null,
    },
    paddleocr: {
      configured: Boolean(config.paddleocr.token && config.paddleocr.jobUrl && config.paddleocr.model),
      hasToken: Boolean(config.paddleocr.token),
      jobUrl: config.paddleocr.jobUrl,
      model: config.paddleocr.model,
    },
    minio: {
      configured: Boolean(
        config.minio.endpoint && config.minio.accessKey && config.minio.secretKey && config.minio.bucket,
      ),
      hasEndpoint: Boolean(config.minio.endpoint),
      hasPublicEndpoint: Boolean(config.minio.publicEndpoint),
      hasAccessKey: Boolean(config.minio.accessKey),
      hasSecretKey: Boolean(config.minio.secretKey),
      bucket: config.minio.bucket || null,
      region: config.minio.region,
    },
  };
}
