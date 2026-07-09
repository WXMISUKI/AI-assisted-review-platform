export type IssueSource = "ai" | "manual";

export type IssueStatus = "pending" | "accepted" | "rejected" | "modified";

export type IssueSeverity = "critical" | "high" | "medium" | "low";

export type StatusFilter = "all" | IssueStatus;

export interface DocumentParagraph {
  id: string;
  section: string;
  text: string;
}

export interface ReviewAnchor {
  paragraphId: string;
  startOffset: number;
  endOffset: number;
  text: string;
}

export interface ReviewFinding {
  title: string;
  reason: string;
  basis: string;
  suggestion: string;
}

export interface ReviewResolution {
  action: IssueStatus | null;
  editedText: string | null;
  resolvedAt: string | null;
}

export interface ReviewIssue {
  id: string;
  source: IssueSource;
  status: IssueStatus;
  severity: IssueSeverity;
  anchor: ReviewAnchor;
  finding: ReviewFinding;
  resolution: ReviewResolution;
}

export interface IssueCounts {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  modified: number;
}
