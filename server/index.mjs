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
import { generateDraftIssues } from "./reviewDraftIssueAdapter.mjs";
import { writeReviewAgentStream } from "./reviewAgentStream.mjs";
import { getAgentServiceReadiness } from "./reviewAgentServiceAdapter.mjs";
import {
  addManualReviewTaskIssue,
  completeReviewTaskDecision,
  deleteManualReviewTaskIssue,
  getReviewTaskDecisionActivities,
  resolveReviewTaskIssue,
  updateReviewTaskIssueDraft,
} from "./reviewTaskDecisionService.mjs";
import {
  createReviewGenerationRun,
  getReviewGenerationRunEvents,
  getReviewGenerationRunStatus,
  writeReviewGenerationRunStream,
} from "./reviewGenerationRunBridge.mjs";
import {
  archiveOpeningConditionPilotTask,
  decideOpeningConditionPilotMasterDataRecord,
  decideOpeningConditionPilotHumanReviewItem,
  generateOpeningConditionPilotReport,
  getOpeningConditionPilotStoreInfo,
  getOpeningConditionPilotTask,
  intakeOpeningConditionPilotPacket,
  listOpeningConditionPilotHumanReviewItems,
  listOpeningConditionPilotBasisVersions,
  listOpeningConditionPilotMasterData,
  listOpeningConditionPilotTasks,
  publishOpeningConditionPilotBasisVersion,
  runOpeningConditionPilotChecklistMatch,
  transitionOpeningConditionPilotTask,
  upsertOpeningConditionPilotBasisVersion,
  upsertOpeningConditionPilotMasterDataRecord,
  upsertOpeningConditionPilotTask,
} from "./openingConditionPilotStore.mjs";
import {
  getReviewTask,
  getReviewTaskStoreInfo,
  listReviewTasks,
  replaceReviewTasks,
  upsertReviewTask,
} from "./reviewTaskStore.mjs";
import { getQueueJob, getQueueStatus } from "./reviewWorkerQueue.mjs";
import {
  getReviewWorkerLoopInfo,
  startReviewWorkerLoop,
} from "./reviewWorkerLoop.mjs";

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
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
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
          "GET /api/review-tasks",
          "GET /api/opening-condition/pilot-tasks",
          "GET /api/opening-condition/pilot-tasks/:taskId",
          "PUT /api/opening-condition/pilot-tasks/:taskId",
          "POST /api/opening-condition/pilot-tasks/:taskId/packet",
          "POST /api/opening-condition/pilot-tasks/:taskId/match",
          "GET /api/opening-condition/pilot-tasks/:taskId/human-review",
          "POST /api/opening-condition/pilot-tasks/:taskId/human-review/:reviewId/decision",
          "POST /api/opening-condition/pilot-tasks/:taskId/report",
          "POST /api/opening-condition/pilot-tasks/:taskId/archive",
          "POST /api/opening-condition/pilot-tasks/:taskId/transition",
          "GET /api/opening-condition/workspaces/:workspaceId/basis",
          "PUT /api/opening-condition/workspaces/:workspaceId/basis/:basisId",
          "POST /api/opening-condition/workspaces/:workspaceId/basis/:basisId/publish",
          "GET /api/opening-condition/workspaces/:workspaceId/master-data",
          "PUT /api/opening-condition/workspaces/:workspaceId/master-data/:recordId",
          "POST /api/opening-condition/workspaces/:workspaceId/master-data/:recordId/decision",
          "GET /api/review-tasks/:taskId",
          "PUT /api/review-tasks/:taskId",
          "POST /api/review-tasks/bulk",
          "POST /api/review-tasks/:taskId/issues/:issueId/resolve",
          "PATCH /api/review-tasks/:taskId/issues/:issueId/draft",
          "POST /api/review-tasks/:taskId/issues/manual",
          "DELETE /api/review-tasks/:taskId/issues/:issueId",
          "POST /api/review-tasks/:taskId/complete",
          "GET /api/review-tasks/:taskId/activities",
          "POST /api/ocr/jobs/url",
          "POST /api/ocr/jobs/object",
          "GET /api/ocr/jobs/:id",
          "POST /api/ocr/results/hydrate",
          "POST /api/review-agent/generation-runs",
          "GET /api/review-agent/service/status",
          "GET /api/review-agent/generation-runs/:runId",
          "GET /api/review-agent/generation-runs/:runId/events",
          "GET /api/review-agent/generation-runs/:runId/stream",
          "GET /api/review-agent/queue/status",
          "GET /api/review-agent/queue/jobs/:jobId",
          "POST /api/review-agent/draft-issues",
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
        agentService: await getAgentServiceReadiness(),
        queue: {
          ...(await getQueueStatus()),
          worker: getReviewWorkerLoopInfo(),
        },
        openingConditionPilot: getOpeningConditionPilotStoreInfo(),
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

    if (request.method === "GET" && url.pathname === "/api/review-tasks") {
      sendJson(response, 200, {
        ok: true,
        ...(await listReviewTasks()),
        store: getReviewTaskStoreInfo(),
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/review-tasks/bulk") {
      const body = await readJson(request);
      const result = await replaceReviewTasks(Array.isArray(body.tasks) ? body.tasks : []);
      sendJson(response, 200, result);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/opening-condition/pilot-tasks") {
      sendJson(response, 200, {
        ok: true,
        ...(await listOpeningConditionPilotTasks()),
        store: getOpeningConditionPilotStoreInfo(),
      });
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

    if (request.method === "POST" && url.pathname === "/api/review-agent/draft-issues") {
      const body = await readJson(request);
      sendJson(response, 200, await generateDraftIssues(body));
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/review-agent/service/status") {
      sendJson(response, 200, {
        ok: true,
        agentService: await getAgentServiceReadiness(),
      });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/review-agent/generation-runs") {
      const body = await readJson(request);
      const result = await createReviewGenerationRun(body);
      sendJson(response, result.ok ? 200 : 400, result);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/review-agent/queue/status") {
      sendJson(response, 200, {
        ...(await getQueueStatus()),
        worker: getReviewWorkerLoopInfo(),
      });
      return;
    }

    const queueJobMatch = url.pathname.match(/^\/api\/review-agent\/queue\/jobs\/([^/]+)$/);
    if (request.method === "GET" && queueJobMatch) {
      const job = await getQueueJob(decodeURIComponent(queueJobMatch[1]));
      sendJson(response, job ? 200 : 404, job
        ? {
            ok: true,
            job,
          }
        : {
            ok: false,
            status: "not_found",
            message: "Review queue job not found.",
          });
      return;
    }

    const ocrJobMatch = url.pathname.match(/^\/api\/ocr\/jobs\/([^/]+)$/);
    if (request.method === "GET" && ocrJobMatch) {
      sendJson(response, 200, await getOcrJobStatus(ocrJobMatch[1]));
      return;
    }

    const openingConditionPilotTaskMatch = url.pathname.match(/^\/api\/opening-condition\/pilot-tasks\/([^/]+)$/);
    if (openingConditionPilotTaskMatch) {
      const taskId = decodeURIComponent(openingConditionPilotTaskMatch[1]);
      if (request.method === "GET") {
        const task = await getOpeningConditionPilotTask(taskId);
        sendJson(response, task ? 200 : 404, task
          ? {
              ok: true,
              task,
            }
          : {
              ok: false,
              status: "not_found",
              message: "Opening-condition pilot task not found.",
            });
        return;
      }

      if (request.method === "PUT") {
        const body = await readJson(request);
        const result = await upsertOpeningConditionPilotTask(taskId, body.task ?? body);
        sendJson(response, result.ok ? 200 : 400, result);
        return;
      }
    }

    const openingConditionPilotTaskTransitionMatch = url.pathname.match(
      /^\/api\/opening-condition\/pilot-tasks\/([^/]+)\/transition$/,
    );
    if (request.method === "POST" && openingConditionPilotTaskTransitionMatch) {
      const body = await readJson(request);
      const result = await transitionOpeningConditionPilotTask(
        decodeURIComponent(openingConditionPilotTaskTransitionMatch[1]),
        body.toState,
        body.event ?? {},
      );
      sendJson(response, result.ok ? 200 : result.status === "not_found" ? 404 : 400, result);
      return;
    }

    const openingConditionPilotTaskPacketMatch = url.pathname.match(
      /^\/api\/opening-condition\/pilot-tasks\/([^/]+)\/packet$/,
    );
    if (request.method === "POST" && openingConditionPilotTaskPacketMatch) {
      const body = await readJson(request);
      const result = await intakeOpeningConditionPilotPacket(
        decodeURIComponent(openingConditionPilotTaskPacketMatch[1]),
        body,
      );
      sendJson(response, result.ok ? 200 : result.status === "not_found" ? 404 : 400, result);
      return;
    }

    const openingConditionPilotTaskMatchRunMatch = url.pathname.match(
      /^\/api\/opening-condition\/pilot-tasks\/([^/]+)\/match$/,
    );
    if (request.method === "POST" && openingConditionPilotTaskMatchRunMatch) {
      const body = await readJson(request);
      const result = await runOpeningConditionPilotChecklistMatch(
        decodeURIComponent(openingConditionPilotTaskMatchRunMatch[1]),
        body,
      );
      sendJson(response, result.ok ? 200 : result.status === "not_found" ? 404 : 400, result);
      return;
    }

    const openingConditionPilotHumanReviewListMatch = url.pathname.match(
      /^\/api\/opening-condition\/pilot-tasks\/([^/]+)\/human-review$/,
    );
    if (request.method === "GET" && openingConditionPilotHumanReviewListMatch) {
      const result = await listOpeningConditionPilotHumanReviewItems(
        decodeURIComponent(openingConditionPilotHumanReviewListMatch[1]),
      );
      sendJson(response, result.ok ? 200 : result.status === "not_found" ? 404 : 400, result);
      return;
    }

    const openingConditionPilotHumanReviewDecisionMatch = url.pathname.match(
      /^\/api\/opening-condition\/pilot-tasks\/([^/]+)\/human-review\/([^/]+)\/decision$/,
    );
    if (request.method === "POST" && openingConditionPilotHumanReviewDecisionMatch) {
      const body = await readJson(request);
      const result = await decideOpeningConditionPilotHumanReviewItem(
        decodeURIComponent(openingConditionPilotHumanReviewDecisionMatch[1]),
        decodeURIComponent(openingConditionPilotHumanReviewDecisionMatch[2]),
        body,
      );
      sendJson(response, result.ok ? 200 : result.status === "not_found" ? 404 : 400, result);
      return;
    }

    const openingConditionPilotReportMatch = url.pathname.match(
      /^\/api\/opening-condition\/pilot-tasks\/([^/]+)\/report$/,
    );
    if (request.method === "POST" && openingConditionPilotReportMatch) {
      const body = await readJson(request);
      const result = await generateOpeningConditionPilotReport(
        decodeURIComponent(openingConditionPilotReportMatch[1]),
        body,
      );
      sendJson(response, result.ok ? 200 : result.status === "not_found" ? 404 : 400, result);
      return;
    }

    const openingConditionPilotArchiveMatch = url.pathname.match(
      /^\/api\/opening-condition\/pilot-tasks\/([^/]+)\/archive$/,
    );
    if (request.method === "POST" && openingConditionPilotArchiveMatch) {
      const body = await readJson(request);
      const result = await archiveOpeningConditionPilotTask(
        decodeURIComponent(openingConditionPilotArchiveMatch[1]),
        body,
      );
      sendJson(response, result.ok ? 200 : result.status === "not_found" ? 404 : 400, result);
      return;
    }

    const openingConditionBasisMatch = url.pathname.match(
      /^\/api\/opening-condition\/workspaces\/([^/]+)\/basis(?:\/([^/]+)(?:\/([^/]+))?)?$/,
    );
    if (openingConditionBasisMatch) {
      const workspaceId = decodeURIComponent(openingConditionBasisMatch[1]);
      const basisId = openingConditionBasisMatch[2] ? decodeURIComponent(openingConditionBasisMatch[2]) : "";
      const action = openingConditionBasisMatch[3];

      if (request.method === "GET" && !basisId) {
        sendJson(response, 200, await listOpeningConditionPilotBasisVersions(workspaceId));
        return;
      }

      if (request.method === "PUT" && basisId && !action) {
        const body = await readJson(request);
        const result = await upsertOpeningConditionPilotBasisVersion(workspaceId, basisId, body.basisVersion ?? body);
        sendJson(response, result.ok ? 200 : 400, result);
        return;
      }

      if (request.method === "POST" && basisId && action === "publish") {
        const body = await readJson(request);
        const result = await publishOpeningConditionPilotBasisVersion(workspaceId, basisId, body);
        sendJson(response, result.ok ? 200 : result.status === "not_found" ? 404 : 400, result);
        return;
      }
    }

    const openingConditionMasterDataMatch = url.pathname.match(
      /^\/api\/opening-condition\/workspaces\/([^/]+)\/master-data(?:\/([^/]+)(?:\/([^/]+))?)?$/,
    );
    if (openingConditionMasterDataMatch) {
      const workspaceId = decodeURIComponent(openingConditionMasterDataMatch[1]);
      const recordId = openingConditionMasterDataMatch[2] ? decodeURIComponent(openingConditionMasterDataMatch[2]) : "";
      const action = openingConditionMasterDataMatch[3];

      if (request.method === "GET" && !recordId) {
        sendJson(response, 200, await listOpeningConditionPilotMasterData(workspaceId));
        return;
      }

      if (request.method === "PUT" && recordId && !action) {
        const body = await readJson(request);
        const result = await upsertOpeningConditionPilotMasterDataRecord(workspaceId, recordId, body.masterDataRecord ?? body);
        sendJson(response, result.ok ? 200 : 400, result);
        return;
      }

      if (request.method === "POST" && recordId && action === "decision") {
        const body = await readJson(request);
        const result = await decideOpeningConditionPilotMasterDataRecord(workspaceId, recordId, body);
        sendJson(response, result.ok ? 200 : result.status === "not_found" ? 404 : 400, result);
        return;
      }
    }

    const reviewTaskMatch = url.pathname.match(/^\/api\/review-tasks\/([^/]+)$/);
    if (reviewTaskMatch) {
      const taskId = decodeURIComponent(reviewTaskMatch[1]);
      if (request.method === "GET") {
        const task = await getReviewTask(taskId);
        sendJson(response, task ? 200 : 404, task
          ? {
              ok: true,
              task,
            }
          : {
              ok: false,
              status: "not_found",
              message: "Review task not found.",
            });
        return;
      }

      if (request.method === "PUT") {
        const body = await readJson(request);
        const result = await upsertReviewTask(taskId, body.task ?? body);
        sendJson(response, result.ok ? 200 : 400, result);
        return;
      }
    }

    const reviewTaskIssueResolveMatch = url.pathname.match(
      /^\/api\/review-tasks\/([^/]+)\/issues\/([^/]+)\/resolve$/,
    );
    if (request.method === "POST" && reviewTaskIssueResolveMatch) {
      const body = await readJson(request);
      const result = await resolveReviewTaskIssue(
        decodeURIComponent(reviewTaskIssueResolveMatch[1]),
        decodeURIComponent(reviewTaskIssueResolveMatch[2]),
        body,
      );
      sendJson(response, result.ok ? 200 : result.status === "not_found" ? 404 : 400, result);
      return;
    }

    const reviewTaskIssueDraftMatch = url.pathname.match(
      /^\/api\/review-tasks\/([^/]+)\/issues\/([^/]+)\/draft$/,
    );
    if (request.method === "PATCH" && reviewTaskIssueDraftMatch) {
      const body = await readJson(request);
      const result = await updateReviewTaskIssueDraft(
        decodeURIComponent(reviewTaskIssueDraftMatch[1]),
        decodeURIComponent(reviewTaskIssueDraftMatch[2]),
        body,
      );
      sendJson(response, result.ok ? 200 : result.status === "not_found" ? 404 : 400, result);
      return;
    }

    const reviewTaskManualIssueMatch = url.pathname.match(
      /^\/api\/review-tasks\/([^/]+)\/issues\/manual$/,
    );
    if (request.method === "POST" && reviewTaskManualIssueMatch) {
      const body = await readJson(request);
      const result = await addManualReviewTaskIssue(
        decodeURIComponent(reviewTaskManualIssueMatch[1]),
        body,
      );
      sendJson(response, result.ok ? 200 : result.status === "not_found" ? 404 : 400, result);
      return;
    }

    const reviewTaskIssueDeleteMatch = url.pathname.match(
      /^\/api\/review-tasks\/([^/]+)\/issues\/([^/]+)$/,
    );
    if (request.method === "DELETE" && reviewTaskIssueDeleteMatch) {
      const result = await deleteManualReviewTaskIssue(
        decodeURIComponent(reviewTaskIssueDeleteMatch[1]),
        decodeURIComponent(reviewTaskIssueDeleteMatch[2]),
      );
      sendJson(
        response,
        result.ok ? 200 : result.status === "not_found" ? 404 : result.status === "not_allowed" ? 403 : 400,
        result,
      );
      return;
    }

    const reviewTaskCompleteMatch = url.pathname.match(/^\/api\/review-tasks\/([^/]+)\/complete$/);
    if (request.method === "POST" && reviewTaskCompleteMatch) {
      const body = await readJson(request);
      const result = await completeReviewTaskDecision(decodeURIComponent(reviewTaskCompleteMatch[1]), body);
      sendJson(
        response,
        result.ok ? 200 : result.status === "not_found" ? 404 : result.status === "incomplete_review" ? 409 : 400,
        result,
      );
      return;
    }

    const reviewTaskActivitiesMatch = url.pathname.match(/^\/api\/review-tasks\/([^/]+)\/activities$/);
    if (request.method === "GET" && reviewTaskActivitiesMatch) {
      const result = await getReviewTaskDecisionActivities(decodeURIComponent(reviewTaskActivitiesMatch[1]), {
        limit: readPositiveIntegerParam(url, "limit") || 50,
      });
      sendJson(response, result.ok ? 200 : result.status === "not_found" ? 404 : 400, result);
      return;
    }

    const generationRunMatch = url.pathname.match(/^\/api\/review-agent\/generation-runs\/([^/]+)(?:\/([^/]+))?$/);
    if (request.method === "GET" && generationRunMatch && generationRunMatch[2] === undefined) {
      const result = await getReviewGenerationRunStatus(decodeURIComponent(generationRunMatch[1]));
      sendJson(response, result.ok ? 200 : 404, result);
      return;
    }

    if (request.method === "GET" && generationRunMatch && generationRunMatch[2] === "events") {
      const result = await getReviewGenerationRunEvents(decodeURIComponent(generationRunMatch[1]), {
        afterSequence: readPositiveIntegerParam(url, "after"),
      });
      sendJson(response, result.ok ? 200 : 404, result);
      return;
    }

    const generationRunStreamMatch = url.pathname.match(
      /^\/api\/review-agent\/generation-runs\/([^/]+)\/stream$/,
    );
    if (request.method === "GET" && generationRunStreamMatch) {
      response.writeHead(200, {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      });
      await writeReviewGenerationRunStream(response, decodeURIComponent(generationRunStreamMatch[1]), {
        afterSequence: readPositiveIntegerParam(url, "after"),
      });
      response.end();
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
          currentParagraphLabel: url.searchParams.get("currentParagraphLabel") || "",
          currentParagraphIndex: readPositiveIntegerParam(url, "currentParagraphIndex"),
          currentParagraphTotal: readPositiveIntegerParam(url, "currentParagraphTotal"),
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

startReviewWorkerLoop();

server.listen(config.port, "127.0.0.1", () => {
  console.log(`AI-assisted review backend listening on http://127.0.0.1:${config.port}`);
});
