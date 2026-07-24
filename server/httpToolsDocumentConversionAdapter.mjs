import { config } from "./config.mjs";
import { normalizeProviderStatus, normalizeProviderString, sanitizeProviderValue } from "./providerContracts.mjs";

function joinEndpoint(baseURL, path) {
  const normalizedPath = String(path || "").trim();
  if (!baseURL || !normalizedPath) {
    return "";
  }

  return `${baseURL}${normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`}`;
}

function normalizeFileSize(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0 ? Math.floor(numberValue) : undefined;
}

function normalizeHttpToolsMessage(value, fallback) {
  return normalizeProviderString(value, fallback, 500);
}

async function readJsonSafe(response) {
  return response.json().catch(() => ({}));
}

export function getHttpToolsDocumentConversionStatus() {
  const configured = Boolean(config.httpTools.baseURL);
  return sanitizeProviderValue({
    provider: "http-tools-document-conversion",
    configured,
    ready: configured,
    status: normalizeProviderStatus(configured ? "ready" : "unconfigured", "unconfigured"),
    source: configured ? "configured-http-tools" : "not-configured",
    summary: configured
      ? "HTTP tools endpoints are configured for backend-owned document conversion."
      : "HTTP tools are not configured. Set HTTP_TOOLS_BASE_URL to enable DOCX export.",
    metadata: {
      hasBaseURL: configured,
      docx2htmlPath: config.httpTools.docx2htmlPath,
      html2docxPath: config.httpTools.html2docxPath,
      timeoutMs: config.httpTools.timeoutMs,
    },
  });
}

export async function exportHtmlToDocxUrl({ html, filename }) {
  const endpoint = joinEndpoint(config.httpTools.baseURL, config.httpTools.html2docxPath);
  if (!endpoint) {
    return {
      ok: false,
      status: "not_configured",
      message: "HTTP tools are not configured. Set HTTP_TOOLS_BASE_URL before exporting DOCX reports.",
      safeDiagnostics: ["http_tools:not_configured", "capability:html2docx"],
    };
  }

  const boundedHtml = typeof html === "string" ? html.slice(0, 500_000) : "";
  if (!boundedHtml.trim()) {
    return {
      ok: false,
      status: "invalid_input",
      message: "Report HTML is empty; DOCX export cannot run.",
      safeDiagnostics: ["html:empty", "capability:html2docx"],
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.httpTools.timeoutMs);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        html: boundedHtml,
        mode: "url",
        filename: normalizeProviderString(filename, "opening-condition-report.docx", 180),
      }),
      signal: controller.signal,
    });
    const payload = await readJsonSafe(response);
    const success = response.ok && payload?.success !== false && typeof payload?.downloadUrl === "string";

    if (!success) {
      return {
        ok: false,
        status: response.ok ? "invalid_response" : "adapter_rejected",
        statusCode: response.status,
        message: normalizeHttpToolsMessage(
          payload?.message ?? payload?.error,
          response.ok ? "HTTP tools returned an invalid html2docx response." : "HTTP tools rejected the html2docx request.",
        ),
        safeDiagnostics: [
          `http_status:${response.status}`,
          "capability:html2docx",
          payload?.error ? `adapter_error:${normalizeProviderString(payload.error, "unknown", 180)}` : "",
        ].filter(Boolean),
      };
    }

    return {
      ok: true,
      status: "exported",
      message: normalizeHttpToolsMessage(payload.message, "HTML converted to DOCX successfully."),
      downloadUrl: payload.downloadUrl,
      fileKey: normalizeProviderString(payload.fileKey, "", 500) || undefined,
      fileName: normalizeProviderString(payload.fileName ?? filename, "opening-condition-report.docx", 180),
      fileSize: normalizeFileSize(payload.fileSize),
      safeDiagnostics: [
        "capability:html2docx",
        "mode:url",
        payload.fileKey ? `fileKey:${normalizeProviderString(payload.fileKey, "", 240)}` : "",
        Number.isFinite(Number(payload.fileSize)) ? `fileSize:${Math.floor(Number(payload.fileSize))}` : "",
      ].filter(Boolean),
    };
  } catch (error) {
    const aborted = error instanceof Error && error.name === "AbortError";
    return {
      ok: false,
      status: aborted ? "timeout" : "adapter_unreachable",
      message: aborted
        ? `HTTP tools html2docx request timed out after ${config.httpTools.timeoutMs}ms.`
        : "HTTP tools html2docx endpoint is unreachable.",
      safeDiagnostics: [
        aborted ? "timeout" : "unreachable",
        "capability:html2docx",
        `timeoutMs:${config.httpTools.timeoutMs}`,
      ],
    };
  } finally {
    clearTimeout(timeout);
  }
}
