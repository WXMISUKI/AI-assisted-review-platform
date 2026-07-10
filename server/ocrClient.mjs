import { config } from "./config.mjs";

const defaultOptionalPayload = {
  useDocOrientationClassify: false,
  useDocUnwarping: false,
  useChartRecognition: false,
};

export function getOcrStatus() {
  return {
    ok: Boolean(config.paddleocr.token && config.paddleocr.jobUrl && config.paddleocr.model),
    jobUrl: config.paddleocr.jobUrl,
    model: config.paddleocr.model,
    hasToken: Boolean(config.paddleocr.token),
  };
}

export async function submitOcrUrlJob({ fileUrl, optionalPayload = defaultOptionalPayload }) {
  if (!config.paddleocr.token) {
    return {
      ok: false,
      status: "not_configured",
      message: "PADDLEOCR_TOKEN is required on the backend.",
    };
  }

  const response = await fetch(config.paddleocr.jobUrl, {
    method: "POST",
    headers: {
      Authorization: `bearer ${config.paddleocr.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fileUrl,
      model: config.paddleocr.model,
      optionalPayload,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      ok: false,
      status: "failed",
      statusCode: response.status,
      message: payload?.message || payload?.error || "PaddleOCR job submit failed.",
    };
  }

  return {
    ok: true,
    jobId: payload?.data?.jobId,
  };
}

export async function getOcrJobStatus(jobId) {
  if (!config.paddleocr.token) {
    return {
      ok: false,
      status: "not_configured",
      message: "PADDLEOCR_TOKEN is required on the backend.",
    };
  }

  const response = await fetch(`${config.paddleocr.jobUrl}/${encodeURIComponent(jobId)}`, {
    headers: {
      Authorization: `bearer ${config.paddleocr.token}`,
    },
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      status: "failed",
      statusCode: response.status,
      message: payload?.message || payload?.error || "PaddleOCR job status check failed.",
    };
  }

  const data = payload?.data || {};
  return {
    ok: true,
    state: data.state,
    progress: data.extractProgress || null,
    resultUrl: data.resultUrl || null,
    errorMsg: data.errorMsg || null,
  };
}
