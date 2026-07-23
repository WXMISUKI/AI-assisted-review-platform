import type { OpeningConditionPortalPage } from "./appShellTypes";
import type { OpeningConditionPilotReadinessResult } from "./domain/backendConnectivity";
import type { OpeningConditionPilotTask } from "./domain/openingConditionPilot";

export type OpeningPilotIntakeMode = "default" | "rectification_rerun";

export type OpeningConditionRunDueState = "on_track" | "due_soon" | "overdue" | "readonly";

export type OpeningConditionRunActionOwnership = {
  currentOwner: string;
  nextAction: string;
  dueState: OpeningConditionRunDueState;
  dueStateLabel: string;
  dueWindowLabel: string;
  actionReason: string;
  stageLabel: string;
  activeReviewCount: number;
  blockingCount: number;
  recommendedPage: OpeningConditionPortalPage;
  recommendedPageLabel: string;
  primaryActionLabel: string;
  readOnly: boolean;
};

export type OpeningConditionPortalViewState = {
  archivedTask: boolean;
  rerunUploadEnabled: boolean;
  intakeReadOnly: boolean;
  currentRunMutationLocked: boolean;
  canInitializeCurrentRun: boolean;
  canMutateCurrentRun: boolean;
  canUploadNewRun: boolean;
  readinessStatus: "ready" | "blocked" | "provisional";
  actionOwnership: OpeningConditionRunActionOwnership | null;
};

const activeHumanReviewStatuses = new Set(["open", "deferred"]);
const recommendedPageLabels: Record<OpeningConditionPortalPage, string> = {
  "workspace-context": "工作台概览",
  "material-intake": "资料接入",
  "basis-sets": "依据与主数据",
  "master-data": "依据与主数据",
  "check-tasks": "资料核查",
  "human-review": "人工复核",
  reports: "报告归档",
};

const dueStateLabels: Record<OpeningConditionRunDueState, string> = {
  on_track: "正常推进",
  due_soon: "即将超时",
  overdue: "已拖期",
  readonly: "历史只读",
};

function getStageWindowHours(state: OpeningConditionPilotTask["state"]) {
  switch (state) {
    case "blocked_missing_basis":
    case "blocked_missing_master_data":
    case "ready_for_packet":
    case "packet_uploaded":
    case "draft":
      return 24;
    case "extracting":
    case "matching":
      return 4;
    case "awaiting_human_review":
      return 24;
    case "report_ready":
      return 8;
    case "failed":
    case "canceled":
      return 12;
    default:
      return null;
  }
}

function deriveDueState(updatedAt?: string, state?: OpeningConditionPilotTask["state"]): {
  dueState: OpeningConditionRunDueState;
  dueWindowLabel: string;
} {
  if (!state || state === "archived") {
    return {
      dueState: "readonly",
      dueWindowLabel: "历史轮次不再计时",
    };
  }

  const windowHours = getStageWindowHours(state);
  if (!windowHours) {
    return {
      dueState: "on_track",
      dueWindowLabel: "当前阶段未设置试点时限",
    };
  }

  const updatedAtMs = Date.parse(updatedAt ?? "");
  if (Number.isNaN(updatedAtMs)) {
    return {
      dueState: "on_track",
      dueWindowLabel: `${windowHours} 小时试点窗口`,
    };
  }

  const elapsedHours = (Date.now() - updatedAtMs) / (1000 * 60 * 60);
  const dueState: OpeningConditionRunDueState =
    elapsedHours >= windowHours ? "overdue" : elapsedHours >= windowHours * 0.75 ? "due_soon" : "on_track";

  return {
    dueState,
    dueWindowLabel: `${windowHours} 小时试点窗口`,
  };
}

export function deriveOpeningConditionRunActionOwnership(args: {
  pilotTask?: OpeningConditionPilotTask | null;
  readiness?: OpeningConditionPilotReadinessResult | null;
}): OpeningConditionRunActionOwnership | null {
  const pilotTask = args.pilotTask;
  if (!pilotTask) {
    return null;
  }

  const readiness = args.readiness?.preflightReadiness ?? pilotTask.preflightReadiness;
  const activeReviewCount = pilotTask.humanReviewQueue.filter((item) => activeHumanReviewStatuses.has(item.status)).length;
  const blockingCount = (readiness?.blockingReasons?.length ?? 0) + activeReviewCount;

  if (pilotTask.state === "archived") {
    return {
      currentOwner: "无活动责任人",
      nextAction: "如需继续补件，请从报告归档页发起下一轮整改复审。",
      dueState: "readonly",
      dueStateLabel: dueStateLabels.readonly,
      dueWindowLabel: "历史轮次不再计时",
      actionReason: "当前 run 已归档，只保留历史留痕、报告和处理过程，不再允许直接变更。",
      stageLabel: "归档历史",
      activeReviewCount,
      blockingCount: 0,
      recommendedPage: "reports",
      recommendedPageLabel: recommendedPageLabels.reports,
      primaryActionLabel: "查看归档与复审入口",
      readOnly: true,
    };
  }

  if (pilotTask.state === "failed" || pilotTask.state === "canceled") {
    const due = deriveDueState(pilotTask.updatedAt, pilotTask.state);
    return {
      currentOwner: "资料接入责任人",
      nextAction: "检查失败原因并重新初始化本轮资料接入，再重新推进正式核查。",
      dueState: due.dueState,
      dueStateLabel: dueStateLabels[due.dueState],
      dueWindowLabel: due.dueWindowLabel,
      actionReason: "当前 run 未处于可继续流转状态，需要先恢复到可执行链路。",
      stageLabel: pilotTask.state === "failed" ? "异常恢复" : "已取消待重启",
      activeReviewCount,
      blockingCount,
      recommendedPage: "material-intake",
      recommendedPageLabel: recommendedPageLabels["material-intake"],
      primaryActionLabel: "回到资料接入恢复本轮",
      readOnly: false,
    };
  }

  if (activeReviewCount > 0 || pilotTask.state === "awaiting_human_review") {
    const due = deriveDueState(pilotTask.updatedAt, "awaiting_human_review");
    return {
      currentOwner: "监理人工复核",
      nextAction: `关闭 ${activeReviewCount} 项待处理人工复核项，再进入报告生成与归档。`,
      dueState: due.dueState,
      dueStateLabel: dueStateLabels[due.dueState],
      dueWindowLabel: due.dueWindowLabel,
      actionReason:
        activeReviewCount > 0
          ? "当前仍存在 open 或 deferred 的人工复核项，报告链路应等待监理明确处理结论。"
          : "当前 run 已进入人工复核阶段，需要监理完成最终判断。",
      stageLabel: "人工复核",
      activeReviewCount,
      blockingCount: activeReviewCount,
      recommendedPage: "human-review",
      recommendedPageLabel: recommendedPageLabels["human-review"],
      primaryActionLabel: "去处理人工复核",
      readOnly: false,
    };
  }

  if (pilotTask.state === "report_ready" || pilotTask.reportAsset?.status === "ready") {
    const due = deriveDueState(pilotTask.updatedAt, "report_ready");
    return {
      currentOwner: "报告交付责任人",
      nextAction: pilotTask.reportAsset?.status === "ready" ? "确认报告结论后执行归档，或发起下一轮整改复审。" : "生成报告摘要并完成本轮归档。",
      dueState: due.dueState,
      dueStateLabel: dueStateLabels[due.dueState],
      dueWindowLabel: due.dueWindowLabel,
      actionReason: "正式核查与人工复核已收敛到可交付状态，当前重点转为报告输出和结果留痕。",
      stageLabel: "报告交付",
      activeReviewCount,
      blockingCount,
      recommendedPage: "reports",
      recommendedPageLabel: recommendedPageLabels.reports,
      primaryActionLabel: pilotTask.reportAsset?.status === "ready" ? "去报告归档完成交付" : "去生成报告",
      readOnly: false,
    };
  }

  if (pilotTask.state === "extracting" || pilotTask.state === "matching") {
    const due = deriveDueState(pilotTask.updatedAt, pilotTask.state);
    return {
      currentOwner: "平台自动核查",
      nextAction: "等待系统完成资料提取与匹配，随后检查是否进入人工复核或报告交付阶段。",
      dueState: due.dueState,
      dueStateLabel: dueStateLabels[due.dueState],
      dueWindowLabel: due.dueWindowLabel,
      actionReason: "当前 run 已进入自动处理阶段，操作者主要负责观察结果与异常。",
      stageLabel: pilotTask.state === "extracting" ? "资料提取" : "正式核查匹配",
      activeReviewCount,
      blockingCount,
      recommendedPage: "check-tasks",
      recommendedPageLabel: recommendedPageLabels["check-tasks"],
      primaryActionLabel: "去看核查进度",
      readOnly: false,
    };
  }

  const due = deriveDueState(pilotTask.updatedAt, pilotTask.state);
  const blockingReasons = readiness?.blockingReasons ?? [];
  return {
    currentOwner: "资料接入责任人",
    nextAction:
      readiness?.nextAction ??
      "补齐依据、主数据、知识库和资料包门禁后，再执行正式核查。",
    dueState: due.dueState,
    dueStateLabel: dueStateLabels[due.dueState],
    dueWindowLabel: due.dueWindowLabel,
    actionReason:
      blockingReasons.length > 0
        ? `当前门禁仍未放行：${blockingReasons.join(" / ")}。`
        : "当前 run 仍处于资料接入和门禁确认阶段，需要先完成前置条件。",
    stageLabel: "资料接入门禁",
    activeReviewCount,
    blockingCount,
    recommendedPage: "material-intake",
    recommendedPageLabel: recommendedPageLabels["material-intake"],
    primaryActionLabel: "去完成资料接入",
    readOnly: false,
  };
}

export function deriveOpeningConditionPortalViewState(args: {
  pilotTask?: OpeningConditionPilotTask | null;
  intakeMode: OpeningPilotIntakeMode;
  readiness?: OpeningConditionPilotReadinessResult | null;
}): OpeningConditionPortalViewState {
  const archivedTask = args.pilotTask?.state === "archived";
  const rerunUploadEnabled = archivedTask && args.intakeMode === "rectification_rerun";
  const intakeReadOnly = archivedTask && !rerunUploadEnabled;
  const currentRunMutationLocked = archivedTask;
  const canInitializeCurrentRun = !currentRunMutationLocked;
  const canMutateCurrentRun = Boolean(args.pilotTask) && !currentRunMutationLocked;
  const canUploadNewRun = !archivedTask || rerunUploadEnabled;
  const readinessStatus = args.readiness?.preflightReadiness?.status ?? "provisional";
  const actionOwnership = deriveOpeningConditionRunActionOwnership(args);

  return {
    archivedTask,
    rerunUploadEnabled,
    intakeReadOnly,
    currentRunMutationLocked,
    canInitializeCurrentRun,
    canMutateCurrentRun,
    canUploadNewRun,
    readinessStatus,
    actionOwnership,
  };
}
