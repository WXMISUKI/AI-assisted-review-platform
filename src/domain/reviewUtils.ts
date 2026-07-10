import type {
  DocumentParagraph,
  IssueCounts,
  IssueStatus,
  ReviewCompletionPayload,
  ReviewMode,
  ReviewIssue,
  ReviewResultAsset,
  StatusFilter,
} from "./reviewTypes";

export function getIssueCounts(issues: ReviewIssue[]): IssueCounts {
  return issues.reduce<IssueCounts>(
    (counts, issue) => {
      counts.total += 1;
      counts[issue.status] += 1;
      return counts;
    },
    { total: 0, pending: 0, accepted: 0, rejected: 0, modified: 0 },
  );
}

export function matchesFilter(issue: ReviewIssue, filter: StatusFilter): boolean {
  return filter === "all" || issue.status === filter;
}

export function getReplacementText(issue: ReviewIssue): string | null {
  if (issue.status === "accepted") {
    return issue.resolution.editedText || issue.finding.suggestion;
  }

  return null;
}

export function applyIssueToText(text: string, issue: ReviewIssue): string {
  const replacement = getReplacementText(issue);

  if (!replacement) {
    return text;
  }

  return `${text.slice(0, issue.anchor.startOffset)}${replacement}${text.slice(
    issue.anchor.endOffset,
  )}`;
}

export function buildProcessedParagraphs(
  paragraphs: DocumentParagraph[],
  issues: ReviewIssue[],
  mode: ReviewMode,
): DocumentParagraph[] {
  if (mode === "review") {
    return paragraphs;
  }

  return paragraphs.map((paragraph) => {
    const paragraphIssues = issues
      .filter((issue) => issue.anchor.paragraphId === paragraph.id)
      .filter((issue) => issue.status === "accepted")
      .sort((a, b) => b.anchor.startOffset - a.anchor.startOffset);

    const text = paragraphIssues.reduce(
      (currentText, issue) => applyIssueToText(currentText, issue),
      paragraph.text,
    );

    return { ...paragraph, text };
  });
}

export function resolveIssue(
  issue: ReviewIssue,
  status: Extract<IssueStatus, "accepted" | "rejected">,
  editedText?: string,
): ReviewIssue {
  return {
    ...issue,
    status,
    resolution: {
      action: status,
      editedText: status === "accepted" ? editedText || issue.finding.suggestion : null,
      resolvedAt: new Date().toISOString(),
    },
  };
}

export function isReviewComplete(issues: ReviewIssue[]): boolean {
  return issues.length > 0 && issues.every((issue) => issue.status !== "pending");
}

export function createReviewResultAsset(
  payload: ReviewCompletionPayload,
  createdAt = new Date().toISOString(),
): ReviewResultAsset {
  const issueStats = getIssueCounts(payload.issues);
  const acceptedIssues = payload.issues.filter((issue) => issue.status === "accepted");
  const rejectedIssues = payload.issues.filter((issue) => issue.status === "rejected");
  const acceptedIssueIds = acceptedIssues.map((issue) => issue.id);
  const rejectedIssueIds = rejectedIssues.map((issue) => issue.id);
  const resultBase = {
    id: `result-${Date.now()}`,
    documentName: payload.documentName,
    projectName: payload.projectName,
    mode: payload.mode,
    createdAt,
    issueStats,
    acceptedIssueIds,
    rejectedIssueIds,
  };

  if (payload.mode === "review") {
    const majorRisks = payload.issues
      .filter((issue) => issue.severity === "critical" || issue.severity === "high")
      .map((issue) => `${issue.id} ${issue.finding.title}`);

    return {
      ...resultBase,
      type: "supervisor-report",
      summary: `本次针对“${payload.documentName}”形成监理审查意见 ${issueStats.total} 项，其中采纳 ${issueStats.accepted} 项、拒绝 ${issueStats.rejected} 项。`,
      majorRisks:
        majorRisks.length > 0
          ? majorRisks
          : ["未识别到重大或高风险问题，建议按一般审查意见闭环复核。"],
      issueOpinions: payload.issues.map((issue) => ({
        issueId: issue.id,
        title: issue.finding.title,
        severity: issue.severity,
        decision: issue.status === "rejected" ? "rejected" : "accepted",
        opinion:
          issue.status === "rejected"
            ? `经复核暂不采纳：${issue.finding.reason}`
            : `同意作为审查意见纳入报告：${issue.finding.reason}`,
        basis: issue.finding.basis,
      })),
      rectificationSuggestions: acceptedIssues.map(
        (issue) => issue.kernel?.rectification?.requirement ?? issue.finding.suggestion,
      ),
      conclusion:
        acceptedIssues.length > 0
          ? "建议施工单位按已采纳审查意见补充完善专项方案，并在监理复核通过后进入后续审批流程。"
          : "本次审查意见均未采纳，建议由监理工程师补充复核说明后归档。",
    };
  }

  return {
    ...resultBase,
    type: "revised-plan-snapshot",
    processingSummary: `已基于审查修改模式生成处理后方案快照：采纳 ${acceptedIssues.length} 项修改，保留 ${rejectedIssues.length} 项原文。`,
    acceptedChanges: acceptedIssues.map((issue) => ({
      issueId: issue.id,
      originalText: issue.anchor.text,
      revisedText: issue.resolution.editedText || issue.finding.suggestion,
    })),
    rejectedItems: rejectedIssues.map((issue) => ({
      issueId: issue.id,
      title: issue.finding.title,
      reason: "用户选择拒绝该项修改，处理后方案保留对应原文。",
    })),
    processedParagraphs: payload.processedParagraphs,
  };
}
