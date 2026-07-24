import { getReviewTask, mutateReviewTask } from "./reviewTaskStore.mjs";

const MAX_TEXT_LENGTH = 4000;
const MAX_TITLE_LENGTH = 240;
const MAX_BASIS_LENGTH = 2000;
const MAX_REASON_LENGTH = 2000;
const MAX_ISSUES = 1000;
const MAX_DECISION_ACTIVITIES = 200;

function nowIsoString() {
  return new Date().toISOString();
}

function nowDisplayString() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeString(value, fallback = "", maxLength = MAX_TEXT_LENGTH) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maxLength) : fallback;
}

function sanitizeActivityMessage(message) {
  const value = normalizeString(message, "", 240);
  if (!value || /https?:\/\/|api[_-]?key|token|secret|password|authorization|credential/i.test(value)) {
    return undefined;
  }
  return value;
}

function normalizeNumber(value, fallback = 0) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue >= 0 ? Math.floor(numberValue) : fallback;
}

function getIssueCounts(issues) {
  return (Array.isArray(issues) ? issues : []).reduce(
    (counts, issue) => {
      counts.total += 1;
      if (issue.status in counts) {
        counts[issue.status] += 1;
      }
      return counts;
    },
    { total: 0, pending: 0, accepted: 0, rejected: 0, modified: 0 },
  );
}

function findIssue(task, issueId) {
  const issues = Array.isArray(task.issues) ? task.issues : [];
  return issues.find((issue) => issue.id === issueId);
}

function issueNotFoundResult() {
  return {
    ok: false,
    status: "not_found",
    message: "Review issue not found.",
  };
}

function invalidInputResult(message) {
  return {
    ok: false,
    status: "invalid_input",
    message,
  };
}

function createDecisionActivityId(type) {
  return `review-decision-${type}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function normalizeActor(value) {
  const actor = isPlainObject(value) ? value : {};
  return {
    id: normalizeString(actor.id, "system-reviewer", 120),
    label: normalizeString(actor.label, "System reviewer", 120),
    role: normalizeString(actor.role, "", 80) || undefined,
  };
}

function appendDecisionActivity(task, input) {
  const activity = {
    id: createDecisionActivityId(input.type),
    type: input.type,
    occurredAt: nowIsoString(),
    actor: normalizeActor(input.actor),
    issueId: normalizeString(input.issueId, "", 160) || undefined,
    issueTitle: normalizeString(input.issueTitle, "", MAX_TITLE_LENGTH) || undefined,
    decision: input.decision === "accepted" || input.decision === "rejected" ? input.decision : undefined,
    mode: input.mode === "review" || input.mode === "revise" ? input.mode : undefined,
    resultAssetId: normalizeString(input.resultAssetId, "", 180) || undefined,
    message: sanitizeActivityMessage(input.message),
  };

  return {
    ...task,
    reviewDecisionActivities: [...(task.reviewDecisionActivities ?? []), activity].slice(
      -MAX_DECISION_ACTIVITIES,
    ),
  };
}

function resolveIssue(issue, status, editedText) {
  const suggestion = normalizeString(issue.finding?.suggestion, "", MAX_TEXT_LENGTH);
  return {
    ...issue,
    status,
    resolution: {
      action: status,
      editedText: status === "accepted" ? normalizeString(editedText, suggestion, MAX_TEXT_LENGTH) : null,
      resolvedAt: nowIsoString(),
    },
  };
}

function normalizeAnchor(value) {
  const anchor = isPlainObject(value) ? value : {};
  const paragraphId = normalizeString(anchor.paragraphId, "", 180);
  const text = normalizeString(anchor.text, "", MAX_TEXT_LENGTH);
  const startOffset = normalizeNumber(anchor.startOffset, 0);
  const endOffset = Math.max(startOffset, normalizeNumber(anchor.endOffset, startOffset + text.length));

  if (!paragraphId || !text) {
    return null;
  }

  return {
    paragraphId,
    startOffset,
    endOffset,
    text,
  };
}

function normalizeManualIssue(value) {
  if (!isPlainObject(value)) {
    return null;
  }

  const anchor = normalizeAnchor(value.anchor);
  if (!anchor) {
    return null;
  }

  const title = normalizeString(value.finding?.title, "Manual review finding", MAX_TITLE_LENGTH);
  const suggestion = normalizeString(value.finding?.suggestion, "Review and revise this selected text.");

  return {
    ...value,
    id: normalizeString(value.id, `manual-${Date.now().toString(36)}`, 180),
    source: "manual",
    status: ["pending", "accepted", "rejected", "modified"].includes(value.status) ? value.status : "pending",
    severity: ["critical", "high", "medium", "low"].includes(value.severity) ? value.severity : "medium",
    anchor,
    finding: {
      title,
      reason: normalizeString(value.finding?.reason, "Manual reviewer annotation.", MAX_REASON_LENGTH),
      basis: normalizeString(value.finding?.basis, "Manual review basis.", MAX_BASIS_LENGTH),
      suggestion,
    },
    resolution: isPlainObject(value.resolution)
      ? {
          action: value.resolution.action ?? null,
          editedText: value.resolution.editedText ?? null,
          resolvedAt: value.resolution.resolvedAt ?? null,
        }
      : {
          action: null,
          editedText: null,
          resolvedAt: null,
        },
    kernel: value.kernel,
  };
}

function getReplacementText(issue) {
  if (issue.status !== "accepted") {
    return null;
  }

  return normalizeString(issue.resolution?.editedText, issue.finding?.suggestion ?? "", MAX_TEXT_LENGTH);
}

function buildProcessedParagraphs(paragraphs, issues, mode) {
  const sourceParagraphs = Array.isArray(paragraphs) ? paragraphs : [];
  if (mode === "review") {
    return sourceParagraphs;
  }

  return sourceParagraphs.map((paragraph) => {
    const paragraphIssues = (Array.isArray(issues) ? issues : [])
      .filter((issue) => issue.anchor?.paragraphId === paragraph.id)
      .filter((issue) => issue.status === "accepted")
      .sort((a, b) => normalizeNumber(b.anchor?.startOffset, 0) - normalizeNumber(a.anchor?.startOffset, 0));

    const text = paragraphIssues.reduce((currentText, issue) => {
      const replacement = getReplacementText(issue);
      if (!replacement) {
        return currentText;
      }

      const startOffset = normalizeNumber(issue.anchor?.startOffset, 0);
      const endOffset = normalizeNumber(issue.anchor?.endOffset, startOffset);
      return `${currentText.slice(0, startOffset)}${replacement}${currentText.slice(endOffset)}`;
    }, paragraph.text ?? "");

    return { ...paragraph, text };
  });
}

function createReviewResultAsset(task, mode, createdAt = nowIsoString()) {
  const issues = Array.isArray(task.issues) ? task.issues : [];
  const issueStats = getIssueCounts(issues);
  const acceptedIssues = issues.filter((issue) => issue.status === "accepted");
  const rejectedIssues = issues.filter((issue) => issue.status === "rejected");
  const resultBase = {
    id: `result-${Date.now().toString(36)}`,
    documentName: normalizeString(task.name, "Untitled review task", 240),
    projectName: normalizeString(task.project, "Unspecified project", 240),
    mode,
    createdAt,
    issueStats,
    acceptedIssueIds: acceptedIssues.map((issue) => issue.id),
    rejectedIssueIds: rejectedIssues.map((issue) => issue.id),
  };

  if (mode === "review") {
    const majorRisks = issues
      .filter((issue) => issue.severity === "critical" || issue.severity === "high")
      .map((issue) => `${issue.id} ${normalizeString(issue.finding?.title, "Review finding", 240)}`);

    return {
      ...resultBase,
      type: "supervisor-report",
      summary: `Supervisor review completed for ${resultBase.documentName}: ${issueStats.total} issues, ${issueStats.accepted} accepted, ${issueStats.rejected} rejected.`,
      majorRisks: majorRisks.length > 0 ? majorRisks : ["No critical or high-risk accepted issue was identified."],
      issueOpinions: issues.map((issue) => ({
        issueId: issue.id,
        title: normalizeString(issue.finding?.title, "Review finding", 240),
        severity: ["critical", "high", "medium", "low"].includes(issue.severity) ? issue.severity : "medium",
        decision: issue.status === "rejected" ? "rejected" : "accepted",
        opinion:
          issue.status === "rejected"
            ? `Rejected after review: ${normalizeString(issue.finding?.reason, "No reason provided.", 360)}`
            : `Accepted as review opinion: ${normalizeString(issue.finding?.reason, "No reason provided.", 360)}`,
        basis: normalizeString(issue.finding?.basis, "No basis provided.", MAX_BASIS_LENGTH),
      })),
      rectificationSuggestions: acceptedIssues.map(
        (issue) => issue.kernel?.rectification?.requirement ?? normalizeString(issue.finding?.suggestion),
      ),
      conclusion:
        acceptedIssues.length > 0
          ? "The contractor should revise the plan according to accepted review opinions and submit for follow-up verification."
          : "No issue was accepted in this review. Archive the review record after supervisor confirmation.",
    };
  }

  return {
    ...resultBase,
    type: "revised-plan-snapshot",
    processingSummary: `Revised plan snapshot generated: ${acceptedIssues.length} accepted changes, ${rejectedIssues.length} rejected items.`,
    acceptedChanges: acceptedIssues.map((issue) => ({
      issueId: issue.id,
      originalText: normalizeString(issue.anchor?.text),
      revisedText: normalizeString(issue.resolution?.editedText, issue.finding?.suggestion ?? ""),
    })),
    rejectedItems: rejectedIssues.map((issue) => ({
      issueId: issue.id,
      title: normalizeString(issue.finding?.title, "Review finding", 240),
      reason: "Reviewer rejected this change, so the original text is preserved.",
    })),
    processedParagraphs: buildProcessedParagraphs(task.paragraphs, issues, mode),
  };
}

export async function resolveReviewTaskIssue(taskId, issueId, input = {}, storePath) {
  const status = input.status;
  if (status !== "accepted" && status !== "rejected") {
    return invalidInputResult("Issue status must be accepted or rejected.");
  }

  let resolvedIssue = null;
  const result = await mutateReviewTask(taskId, (task) => {
    const issue = findIssue(task, issueId);
    if (!issue) {
      return task;
    }

    resolvedIssue = resolveIssue(issue, status, input.editedText);
    return appendDecisionActivity({
      ...task,
      issues: task.issues.map((item) => (item.id === issueId ? resolvedIssue : item)),
      updatedAt: nowDisplayString(),
    }, {
      type: "issue-resolved",
      actor: input.actor,
      issueId,
      issueTitle: issue.finding?.title,
      decision: status,
      message: status === "accepted" ? "Issue accepted by reviewer." : "Issue rejected by reviewer.",
    });
  }, storePath);

  if (!result.ok || !resolvedIssue) {
    return result.ok ? issueNotFoundResult() : result;
  }

  return {
    ok: true,
    task: result.task,
    issue: resolvedIssue,
  };
}

export async function updateReviewTaskIssueDraft(taskId, issueId, input = {}, storePath) {
  const suggestion = normalizeString(input.suggestion, "", MAX_TEXT_LENGTH);
  if (!suggestion) {
    return invalidInputResult("Issue suggestion is required.");
  }

  let updatedIssue = null;
  const result = await mutateReviewTask(taskId, (task) => {
    const issue = findIssue(task, issueId);
    if (!issue) {
      return task;
    }

    updatedIssue = {
      ...issue,
      finding: {
        ...issue.finding,
        suggestion,
      },
    };

    return appendDecisionActivity({
      ...task,
      issues: task.issues.map((item) => (item.id === issueId ? updatedIssue : item)),
      updatedAt: nowDisplayString(),
    }, {
      type: "issue-draft-updated",
      actor: input.actor,
      issueId,
      issueTitle: issue.finding?.title,
      message: "Issue suggestion draft updated.",
    });
  }, storePath);

  if (!result.ok || !updatedIssue) {
    return result.ok ? issueNotFoundResult() : result;
  }

  return {
    ok: true,
    task: result.task,
    issue: updatedIssue,
  };
}

export async function addManualReviewTaskIssue(taskId, input = {}, storePath) {
  const manualIssue = normalizeManualIssue(input.issue ?? input);
  if (!manualIssue) {
    return invalidInputResult("A valid manual review issue is required.");
  }

  const result = await mutateReviewTask(taskId, (task) => {
    const issues = [...(Array.isArray(task.issues) ? task.issues : []), manualIssue].slice(0, MAX_ISSUES);
    return appendDecisionActivity({
      ...task,
      issues,
      issueCount: getIssueCounts(issues).total,
      updatedAt: nowDisplayString(),
    }, {
      type: "manual-issue-added",
      actor: input.actor,
      issueId: manualIssue.id,
      issueTitle: manualIssue.finding?.title,
      message: "Manual review issue added.",
    });
  }, storePath);

  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    task: result.task,
    issue: manualIssue,
  };
}

export async function deleteManualReviewTaskIssue(taskId, issueId, storePath) {
  let deletedIssue = null;
  let blocked = false;
  const result = await mutateReviewTask(taskId, (task) => {
    const issue = findIssue(task, issueId);
    if (!issue) {
      return task;
    }

    if (issue.source !== "manual") {
      blocked = true;
      return task;
    }

    deletedIssue = issue;
    const issues = task.issues.filter((item) => item.id !== issueId);
    return appendDecisionActivity({
      ...task,
      issues,
      issueCount: getIssueCounts(issues).total,
      updatedAt: nowDisplayString(),
    }, {
      type: "manual-issue-deleted",
      actor: undefined,
      issueId,
      issueTitle: issue.finding?.title,
      message: "Manual review issue deleted.",
    });
  }, storePath);

  if (!result.ok) {
    return result;
  }

  if (blocked) {
    return {
      ok: false,
      status: "not_allowed",
      message: "Only manual review issues can be deleted.",
    };
  }

  if (!deletedIssue) {
    return issueNotFoundResult();
  }

  return {
    ok: true,
    task: result.task,
    issue: deletedIssue,
  };
}

export async function completeReviewTaskDecision(taskId, input = {}, storePath) {
  let resultAsset = null;
  let pendingCount = 0;
  let issueCount = 0;
  const result = await mutateReviewTask(taskId, (task) => {
    const issues = Array.isArray(task.issues) ? task.issues : [];
    const counts = getIssueCounts(issues);
    issueCount = counts.total;
    pendingCount = counts.pending;
    if (counts.total === 0 || counts.pending > 0) {
      return task;
    }

    const mode = input.mode === "review" || input.mode === "revise" ? input.mode : task.mode === "revise" ? "revise" : "review";
    resultAsset = createReviewResultAsset(task, mode);

    return appendDecisionActivity({
      ...task,
      status: "completed",
      mode,
      issueCount: resultAsset.issueStats.total,
      resultAsset,
      updatedAt: nowDisplayString(),
    }, {
      type: "review-completed",
      actor: input.actor,
      mode,
      resultAssetId: resultAsset.id,
      message: "Review task completed.",
    });
  }, storePath);

  if (!result.ok) {
    return result;
  }

  if (!resultAsset) {
    return {
      ok: false,
      status: "incomplete_review",
      message:
        issueCount === 0
          ? "At least one review issue is required before completion."
          : `${pendingCount} review issue(s) are still pending.`,
    };
  }

  return {
    ok: true,
    task: result.task,
    resultAsset,
  };
}

export async function getReviewTaskDecisionActivities(taskId, options = {}, storePath) {
  const task = await getReviewTask(taskId, storePath);
  if (!task) {
    return {
      ok: false,
      status: "not_found",
      message: "Review task not found.",
    };
  }

  const limit = Math.min(Math.max(normalizeNumber(options.limit, 50), 1), MAX_DECISION_ACTIVITIES);
  const activities = Array.isArray(task.reviewDecisionActivities)
    ? task.reviewDecisionActivities.slice(-limit)
    : [];

  return {
    ok: true,
    taskId,
    activities,
  };
}
