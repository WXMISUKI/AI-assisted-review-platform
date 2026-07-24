export interface StatusDisplay {
  label: string;
  tone: "neutral" | "info" | "warning" | "danger" | "success";
  operatorAction?: string;
}

export const constructionPlanStatusDisplay: Record<string, StatusDisplay> = {
  uploaded: { label: "Uploaded", tone: "neutral", operatorAction: "Start review" },
  parsing: { label: "Parsing", tone: "warning", operatorAction: "View progress" },
  reviewing: { label: "Reviewing", tone: "info", operatorAction: "Open workbench" },
  ready: { label: "Ready", tone: "success", operatorAction: "Open review" },
  completed: { label: "Completed", tone: "success", operatorAction: "View result" },
  failed: { label: "Failed", tone: "danger", operatorAction: "Review diagnostics" },
};

export const openingConditionStatusDisplay: Record<string, StatusDisplay> = {
  packet_uploaded: {
    label: "Packet uploaded",
    tone: "info",
    operatorAction: "Check readiness",
  },
  awaiting_human_review: {
    label: "Awaiting human review",
    tone: "warning",
    operatorAction: "Open review queue",
  },
  report_ready: { label: "Report ready", tone: "success", operatorAction: "Generate report" },
  archived: { label: "Archived",
    tone: "neutral",
    operatorAction: "View history",
  },
  blocked_missing_basis: {
    label: "Blocked by preflight",
    tone: "danger",
    operatorAction: "Resolve preflight",
  },
};

export function getStatusDisplay(
  displayMap: Record<string, StatusDisplay>,
  status: string,
): StatusDisplay {
  return displayMap[status] ?? { label: status, tone: "neutral" };
}

