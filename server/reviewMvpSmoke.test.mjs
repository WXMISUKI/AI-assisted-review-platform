import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  listReviewTasks,
  getReviewTask,
  upsertReviewTask,
  replaceReviewTasks,
} from "./reviewTaskStore.mjs";
import {
  resolveReviewTaskIssue,
  addManualReviewTaskIssue,
  completeReviewTaskDecision,
  getReviewTaskDecisionActivities,
} from "./reviewTaskDecisionService.mjs";

const mockParagraphs = [
  { id: "p-001", section: "一、工程概况", text: "本工程为综合楼项目，地上十八层，地下两层。" },
  { id: "p-002", section: "二、脚手架工程", text: "外脚手架采用扣件式钢管脚手架，搭设高度24m，项目部计划按普通分项工程管理。" },
  { id: "p-003", section: "三、临时用电", text: "现场临时用电由专业电工负责，配电箱设置在材料堆场附近，雨季施工期间视现场积水情况决定是否增设防雨措施。" },
];

function createMockTask(id, overrides = {}) {
  return {
    id,
    name: "综合楼施工方案",
    project: "南京综合楼项目",
    uploader: "测试用户",
    updatedAt: "2026-07-24 10:00",
    status: "ready",
    issueCount: 0,
    mode: "review",
    paragraphs: mockParagraphs,
    issues: [],
    streamStageIndex: 0,
    ...overrides,
  };
}

function createMockIssue(id, paragraphId, overrides = {}) {
  return {
    id,
    source: "ai",
    status: "pending",
    severity: "high",
    anchor: {
      paragraphId,
      startOffset: 0,
      endOffset: 10,
      text: mockParagraphs.find((p) => p.id === paragraphId)?.text.slice(0, 10) ?? "测试文本",
    },
    finding: {
      title: `审查问题 ${id}`,
      reason: "测试原因",
      basis: "测试依据",
      suggestion: "测试整改建议",
    },
    resolution: { action: null, editedText: null, resolvedAt: null },
    ...overrides,
  };
}

let tempDir;

test.beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), "review-smoke-"));
});

test.afterEach(async () => {
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = null;
  }
});

test("smoke: create review task and list", async () => {
  const storePath = join(tempDir, "review-tasks.json");
  const task = createMockTask("smoke-task-1");

  const upsertResult = await upsertReviewTask("smoke-task-1", task, storePath);
  assert.equal(upsertResult.ok, true);
  assert.equal(upsertResult.task.id, "smoke-task-1");

  const listResult = await listReviewTasks(storePath);
  assert.equal(listResult.tasks.length, 1);
  assert.equal(listResult.tasks[0].id, "smoke-task-1");
});

test("smoke: resolve issues and complete review", async () => {
  const storePath = join(tempDir, "review-tasks.json");
  const issue1 = createMockIssue("issue-1", "p-002");
  const issue2 = createMockIssue("issue-2", "p-003");
  const task = createMockTask("smoke-task-2", {
    issues: [issue1, issue2],
    issueCount: 2,
  });

  await upsertReviewTask("smoke-task-2", task, storePath);

  const resolveResult1 = await resolveReviewTaskIssue("smoke-task-2", "issue-1", {
    status: "accepted",
    editedText: "整改后的文本",
  }, storePath);
  assert.equal(resolveResult1.ok, true);
  assert.equal(resolveResult1.issue.status, "accepted");

  const resolveResult2 = await resolveReviewTaskIssue("smoke-task-2", "issue-2", {
    status: "rejected",
  }, storePath);
  assert.equal(resolveResult2.ok, true);
  assert.equal(resolveResult2.issue.status, "rejected");

  const completeResult = await completeReviewTaskDecision("smoke-task-2", {
    mode: "review",
  }, storePath);
  assert.equal(completeResult.ok, true);
  assert.ok(completeResult.resultAsset);
  assert.equal(completeResult.resultAsset.type, "supervisor-report");
  assert.equal(completeResult.resultAsset.mode, "review");

  const storedTask = await getReviewTask("smoke-task-2", storePath);
  assert.equal(storedTask.status, "completed");
  assert.ok(storedTask.resultAsset);

  const activitiesResult = await getReviewTaskDecisionActivities("smoke-task-2", {}, storePath);
  assert.equal(activitiesResult.ok, true);
  assert.ok(activitiesResult.activities.length >= 3);
});

test("smoke: re-review preserves original task", async () => {
  const storePath = join(tempDir, "review-tasks.json");

  const originalIssue = createMockIssue("orig-issue-1", "p-002");
  const originalTask = createMockTask("original-task", {
    issues: [originalIssue],
    issueCount: 1,
    status: "completed",
    resultAsset: {
      id: "result-orig",
      type: "supervisor-report",
      documentName: "综合楼施工方案",
      projectName: "南京综合楼项目",
      mode: "review",
      createdAt: "2026-07-24 09:00",
      issueStats: { total: 1, pending: 0, accepted: 1, rejected: 0, modified: 0 },
      acceptedIssueIds: ["orig-issue-1"],
      rejectedIssueIds: [],
      summary: "测试报告",
      majorRisks: [],
      issueOpinions: [],
      rectificationSuggestions: [],
      conclusion: "测试结论",
    },
  });

  await upsertReviewTask("original-task", originalTask, storePath);

  const reReviewTask = createMockTask("re-review-task", {
    name: originalTask.name,
    project: originalTask.project,
    paragraphs: originalTask.paragraphs,
    previousTaskId: "original-task",
    status: "uploaded",
    issues: [],
    issueCount: 0,
  });
  await upsertReviewTask("re-review-task", reReviewTask, storePath);

  const originalAfter = await getReviewTask("original-task", storePath);
  assert.equal(originalAfter.status, "completed");
  assert.ok(originalAfter.resultAsset);
  assert.equal(originalAfter.resultAsset.type, "supervisor-report");

  const reReviewAfter = await getReviewTask("re-review-task", storePath);
  assert.equal(reReviewAfter.status, "uploaded");
  assert.equal(reReviewAfter.previousTaskId, "original-task");
  assert.equal(reReviewAfter.issues.length, 0);

  const newIssue = createMockIssue("new-issue-1", "p-003");
  await upsertReviewTask("re-review-task", {
    ...reReviewAfter,
    status: "ready",
    issues: [newIssue],
    issueCount: 1,
  }, storePath);

  await resolveReviewTaskIssue("re-review-task", "new-issue-1", {
    status: "accepted",
  }, storePath);

  const completeResult = await completeReviewTaskDecision("re-review-task", {
    mode: "review",
  }, storePath);
  assert.equal(completeResult.ok, true);
  assert.ok(completeResult.resultAsset);

  const finalOriginal = await getReviewTask("original-task", storePath);
  assert.equal(finalOriginal.status, "completed");
  assert.equal(finalOriginal.resultAsset.id, "result-orig");

  const finalReReview = await getReviewTask("re-review-task", storePath);
  assert.equal(finalReReview.status, "completed");
  assert.ok(finalReReview.resultAsset);
  assert.notEqual(finalReReview.resultAsset.id, "result-orig");
});

test("smoke: data isolation does not pollute default store", async () => {
  const storePath = join(tempDir, "review-tasks-isolated.json");
  await upsertReviewTask("isolated-task", createMockTask("isolated-task"), storePath);

  const isolatedList = await listReviewTasks(storePath);
  assert.equal(isolatedList.tasks.length, 1);

  const defaultList = await listReviewTasks();
  const hasIsolated = defaultList.tasks.some((t) => t.id === "isolated-task");
  assert.equal(hasIsolated, false, "Smoke test must not pollute the default store.");
});
