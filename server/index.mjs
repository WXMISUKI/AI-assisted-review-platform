import { createServer } from "node:http";
import { config, getSafeProviderStatus } from "./config.mjs";
import { checkLlmConnectivity } from "./llmClient.mjs";
import { getOcrJobStatus, getOcrStatus, submitOcrUrlJob } from "./ocrClient.mjs";
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

function notFound(response) {
  sendJson(response, 404, {
    ok: false,
    message: "API route not found.",
  });
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
          "GET /api/ocr/jobs/:id",
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
      await writeReviewAgentStream(response);
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
