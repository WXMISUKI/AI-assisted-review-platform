import type {
  DocumentParagraph,
  IssueCounts,
  IssueStatus,
  ReviewMode,
  ReviewIssue,
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
