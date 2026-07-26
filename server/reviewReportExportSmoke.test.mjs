import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";

import { buildReviewReportHtml, buildReviewResultHtml } from "./reviewReportHtml.mjs";

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.off("error", reject);
      resolve(`http://127.0.0.1:${server.address().port}`);
    });
  });
}

function close(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function requestJson(baseUrl, method, path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  return {
    statusCode: response.status,
    payload: await response.json(),
  };
}

async function writeReviewStore(tempDir, tasks) {
  const storePath = join(tempDir, ".local-data", "review-tasks.json");
  await mkdir(dirname(storePath), { recursive: true });
  await writeFile(
    storePath,
    `${JSON.stringify({ schemaVersion: 1, tasks }, null, 2)}\n`,
    "utf8",
  );
}

async function importFreshBackendServer(tempDir, envOverrides = {}) {
  const previousCwd = process.cwd();
  const previousEnv = {
    HTTP_TOOLS_BASE_URL: process.env.HTTP_TOOLS_BASE_URL,
    HTTP_TOOLS_TIMEOUT_MS: process.env.HTTP_TOOLS_TIMEOUT_MS,
  };

  process.chdir(tempDir);
  if ("HTTP_TOOLS_BASE_URL" in envOverrides) {
    process.env.HTTP_TOOLS_BASE_URL = envOverrides.HTTP_TOOLS_BASE_URL;
  }
  if ("HTTP_TOOLS_TIMEOUT_MS" in envOverrides) {
    process.env.HTTP_TOOLS_TIMEOUT_MS = envOverrides.HTTP_TOOLS_TIMEOUT_MS;
  }

  const moduleUrl = new URL(
    `./index.mjs?review-report-export-smoke=${Date.now()}-${Math.random().toString(36).slice(2)}`,
    import.meta.url,
  );
  const imported = await import(moduleUrl.href);

  return {
    createBackendServer: imported.createBackendServer,
    restore() {
      process.chdir(previousCwd);
      if (previousEnv.HTTP_TOOLS_BASE_URL === undefined) {
        delete process.env.HTTP_TOOLS_BASE_URL;
      } else {
        process.env.HTTP_TOOLS_BASE_URL = previousEnv.HTTP_TOOLS_BASE_URL;
      }
      if (previousEnv.HTTP_TOOLS_TIMEOUT_MS === undefined) {
        delete process.env.HTTP_TOOLS_TIMEOUT_MS;
      } else {
        process.env.HTTP_TOOLS_TIMEOUT_MS = previousEnv.HTTP_TOOLS_TIMEOUT_MS;
      }
    },
  };
}

function createSupervisorReportAsset(overrides = {}) {
  return {
    id: "result-export-1",
    type: "supervisor-report",
    documentName: "G15-10标承台施工方案",
    projectName: "测试项目1",
    mode: "review",
    createdAt: "2026-07-26 10:00",
    issueStats: { total: 2, pending: 0, accepted: 1, rejected: 1, modified: 0 },
    acceptedIssueIds: ["issue-1"],
    rejectedIssueIds: ["issue-2"],
    summary: "报告摘要<script>alert(1)</script>",
    majorRisks: ["高风险基坑支护问题"],
    issueOpinions: [
      {
        issueId: "issue-1",
        title: "深基坑方案需要补充",
        severity: "high",
        decision: "accepted",
        opinion: "补充监测与应急预案<script>alert(2)</script>",
        basis: "JGJ120",
      },
    ],
    rectificationSuggestions: ["补充监测方案"],
    conclusion: "请按审查意见修订后再次报审。",
    ...overrides,
  };
}

function createRevisedPlanSnapshotAsset(overrides = {}) {
  return {
    id: "result-snapshot-1",
    type: "revised-plan-snapshot",
    documentName: "G15-10标承台施工方案",
    projectName: "测试项目1",
    mode: "review",
    createdAt: "2026-07-26 10:10",
    issueStats: { total: 3, pending: 0, accepted: 2, rejected: 1, modified: 0 },
    acceptedIssueIds: ["issue-1", "issue-3"],
    rejectedIssueIds: ["issue-2"],
    processingSummary: "已根据采纳意见生成整改后快照<script>alert(3)</script>",
    acceptedChanges: [
      {
        issueId: "issue-1",
        originalText: "原文段落A",
        revisedText: "整改后段落A<script>alert(4)</script>",
      },
    ],
    rejectedItems: [
      {
        issueId: "issue-2",
        title: "保留原文标题",
        reason: "现场条件暂不满足修改",
      },
    ],
    processedParagraphs: [
      {
        id: "p-1",
        index: 0,
        page: 1,
        section: "4.3.1 基坑开挖技术措施",
        type: "body",
        text: "整改后文本快照第一段<script>alert(5)</script>",
      },
    ],
    ...overrides,
  };
}

function createTask(taskId, overrides = {}) {
  return {
    id: taskId,
    name: "G15-10标承台施工方案",
    project: "测试项目1",
    uploader: "测试用户",
    updatedAt: "2026-07-26 10:00",
    status: "completed",
    issueCount: 2,
    mode: "review",
    paragraphs: [],
    issues: [],
    streamStageIndex: 0,
    ...overrides,
  };
}

let tempDir;

test.before(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "review-report-export-"));
});

test.after(async () => {
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = null;
  }
});

test("review report html builder escapes unsafe text and includes required sections", async () => {
  const html = buildReviewReportHtml(createSupervisorReportAsset());

  assert.ok(html);
  assert.match(html, /审查报告|瀹℃煡鎶ュ憡/);
  assert.match(html, /majorRisks|主要风险|涓昏椋庨櫓/);
  assert.match(html, /issueOpinions|审查意见明细|瀹℃煡鎰忚鏄庣粏/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /&lt;script&gt;alert\(2\)&lt;\/script&gt;/);
});

test("revised plan snapshot html builder escapes unsafe text and includes required sections", async () => {
  const html = buildReviewResultHtml(createRevisedPlanSnapshotAsset());

  assert.ok(html);
  assert.match(html, /整改后方案快照|鏁存敼鍚庢柟妗堝揩鐓?/);
  assert.match(html, /处理概况|澶勭悊姒傚喌/);
  assert.match(html, /已采纳修改|宸查噰绾充慨鏀?/);
  assert.match(html, /&lt;script&gt;alert\(3\)&lt;\/script&gt;/);
  assert.match(html, /&lt;script&gt;alert\(4\)&lt;\/script&gt;/);
  assert.match(html, /&lt;script&gt;alert\(5\)&lt;\/script&gt;/);
});

test("report export endpoint returns missing_report when result asset is absent", async () => {
  await writeReviewStore(tempDir, [createTask("task-no-report", { resultAsset: undefined })]);
  const backend = await importFreshBackendServer(tempDir, { HTTP_TOOLS_BASE_URL: "" });
  const server = backend.createBackendServer();

  try {
    const baseUrl = await listen(server);
    const response = await requestJson(baseUrl, "POST", "/api/review-tasks/task-no-report/report/export-docx", {});

    assert.equal(response.statusCode, 400);
    assert.equal(response.payload.ok, false);
    assert.equal(response.payload.status, "missing_report");
  } finally {
    await close(server);
    backend.restore();
  }
});

test("report export endpoint returns safe export_failed diagnostics when http tools are not configured", async () => {
  await writeReviewStore(tempDir, [
    createTask("task-export-fallback", {
      resultAsset: createSupervisorReportAsset(),
    }),
  ]);
  const backend = await importFreshBackendServer(tempDir, { HTTP_TOOLS_BASE_URL: "", HTTP_TOOLS_TIMEOUT_MS: "1500" });
  const server = backend.createBackendServer();

  try {
    const baseUrl = await listen(server);
    const response = await requestJson(
      baseUrl,
      "POST",
      "/api/review-tasks/task-export-fallback/report/export-docx",
      {},
    );

    assert.equal(response.statusCode, 503);
    assert.equal(response.payload.ok, false);
    assert.equal(response.payload.status, "export_failed");
    assert.equal(response.payload.adapterStatus, "not_configured");
    assert.equal(response.payload.fallback, "html");
    assert.ok(Array.isArray(response.payload.safeDiagnostics));
    assert.ok(response.payload.safeDiagnostics.includes("capability:html2docx"));
  } finally {
    await close(server);
    backend.restore();
  }
});

test("revised snapshot export returns safe export_failed diagnostics when http tools are not configured", async () => {
  await writeReviewStore(tempDir, [
    createTask("task-snapshot-export-fallback", {
      resultAsset: createRevisedPlanSnapshotAsset(),
    }),
  ]);
  const backend = await importFreshBackendServer(tempDir, { HTTP_TOOLS_BASE_URL: "", HTTP_TOOLS_TIMEOUT_MS: "1500" });
  const server = backend.createBackendServer();

  try {
    const baseUrl = await listen(server);
    const response = await requestJson(
      baseUrl,
      "POST",
      "/api/review-tasks/task-snapshot-export-fallback/report/export-docx",
      {},
    );

    assert.equal(response.statusCode, 503);
    assert.equal(response.payload.ok, false);
    assert.equal(response.payload.status, "export_failed");
    assert.equal(response.payload.adapterStatus, "not_configured");
    assert.equal(response.payload.fallback, "html");
    assert.ok(Array.isArray(response.payload.safeDiagnostics));
    assert.ok(response.payload.safeDiagnostics.includes("capability:html2docx"));
  } finally {
    await close(server);
    backend.restore();
  }
});
