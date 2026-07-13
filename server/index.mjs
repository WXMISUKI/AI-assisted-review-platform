import { createServer } from "node:http";
import Busboy from "busboy";
import { config, getSafeProviderStatus } from "./config.mjs";
import { checkLlmConnectivity } from "./llmClient.mjs";
import {
  checkMinioBucket,
  createPresignedDocumentUrl,
  uploadDocumentObject,
} from "./minioClient.mjs";
import { getOcrJobStatus, getOcrStatus, submitOcrUrlJob } from "./ocrClient.mjs";
import { hydrateOcrResultStructure } from "./ocrResultRecovery.mjs";
import { writeReviewAgentStream } from "./reviewAgentStream.mjs";

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function readMultipartUpload(request) {
  return new Promise((resolve, reject) => {
    const contentType = request.headers["content-type"] || "";
    if (!contentType.includes("multipart/form-data")) {
      reject(new Error("Content-Type must be multipart/form-data."));
      return;
    }

    const busboy = Busboy({
      headers: request.headers,
      defParamCharset: "utf8",
      limits: {
        files: 1,
        fileSize: 100 * 1024 * 1024,
      },
    });
    const chunks = [];
    let upload = null;
    let limitReached = false;

    busboy.on("file", (fieldName, file, info) => {
      if (fieldName !== "file") {
        file.resume();
        return;
      }

      upload = {
        filename: info.filename || "document",
        contentType: info.mimeType || "application/octet-stream",
      };
      file.on("data", (chunk) => chunks.push(chunk));
      file.on("limit", () => {
        limitReached = true;
        file.resume();
      });
    });

    busboy.on("error", reject);
    busboy.on("finish", () => {
      if (limitReached) {
        reject(new Error("Uploaded file exceeds the 100MB limit."));
        return;
      }

      if (!upload) {
        reject(new Error("Multipart field `file` is required."));
        return;
      }

      resolve({
        ...upload,
        buffer: Buffer.concat(chunks),
      });
    });

    request.pipe(busboy);
  });
}

function notFound(response) {
  sendJson(response, 404, {
    ok: false,
    message: "API route not found.",
  });
}

function readPositiveIntegerParam(url, name) {
  const rawValue = url.searchParams.get(name);
  if (!rawValue) {
    return 0;
  }

  const value = Number.parseInt(rawValue, 10);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || "127.0.0.1"}`);

  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    });
    response.end();
    return;
  }

  try {
    if (request.method === "GET" && url.pathname === "/") {
      sendJson(response, 200, {
        ok: true,
        service: "ai-assisted-review-backend",
        message: "Backend is running. Use /api/health for connectivity status.",
        routes: [
          "GET /api/health",
          "POST /api/llm/check",
          "GET /api/ocr/status",
          "POST /api/ocr/jobs/url",
          "POST /api/ocr/jobs/object",
          "GET /api/ocr/jobs/:id",
          "POST /api/ocr/results/hydrate",
          "GET /api/minio/status",
          "POST /api/minio/upload",
          "POST /api/minio/presign",
          "GET /api/review-agent/stream",
        ],
      });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/health") {
      sendJson(response, 200, {
        ok: true,
        service: "ai-assisted-review-backend",
        timestamp: new Date().toISOString(),
        providers: getSafeProviderStatus(),
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/llm/check") {
      sendJson(response, 200, await checkLlmConnectivity());
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/ocr/status") {
      sendJson(response, 200, getOcrStatus());
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/minio/status") {
      sendJson(response, 200, await checkMinioBucket());
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/minio/upload") {
      const upload = await readMultipartUpload(request);
      sendJson(response, 200, {
        ok: true,
        object: await uploadDocumentObject(upload),
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/minio/presign") {
      const body = await readJson(request);
      sendJson(response, 200, {
        ok: true,
        presigned: await createPresignedDocumentUrl(body.key, body.expiresIn),
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/ocr/jobs/url") {
      const body = await readJson(request);
      if (!body.fileUrl || typeof body.fileUrl !== "string") {
        sendJson(response, 400, {
          ok: false,
          message: "fileUrl is required.",
        });
        return;
      }

      sendJson(response, 200, await submitOcrUrlJob(body));
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/ocr/jobs/object") {
      const body = await readJson(request);
      const presigned = await createPresignedDocumentUrl(body.key, body.expiresIn);
      sendJson(response, 200, {
        ...(await submitOcrUrlJob({
          fileUrl: presigned.url,
          optionalPayload: body.optionalPayload,
        })),
        sourceObject: {
          bucket: presigned.bucket,
          key: presigned.key,
          expiresIn: presigned.expiresIn,
        },
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/ocr/results/hydrate") {
      const body = await readJson(request);
      sendJson(response, 200, await hydrateOcrResultStructure(body));
      return;
    }

    const ocrJobMatch = url.pathname.match(/^\/api\/ocr\/jobs\/([^/]+)$/);
    if (request.method === "GET" && ocrJobMatch) {
      sendJson(response, 200, await getOcrJobStatus(ocrJobMatch[1]));
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/review-agent/stream") {
      response.writeHead(200, {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      });
      await writeReviewAgentStream(response, {
        structureSummary: {
          sectionCount: readPositiveIntegerParam(url, "sectionCount"),
          paragraphCount: readPositiveIntegerParam(url, "paragraphCount"),
          currentSection: url.searchParams.get("currentSection") || "",
        },
      });
      response.end();
      return;
    }

    notFound(response);
  } catch (error) {
    sendJson(response, 500, {
      ok: false,
      message: error instanceof Error ? error.message : "Unexpected backend error.",
    });
  }
});

server.listen(config.port, "127.0.0.1", () => {
  console.log(`AI-assisted review backend listening on http://127.0.0.1:${config.port}`);
});
