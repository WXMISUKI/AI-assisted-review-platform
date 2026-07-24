import type { OpeningConditionPilotHumanReviewItem, OpeningConditionPilotTask } from "./domain/openingConditionPilot";

export type FinalReviewDisposition =
  | "blocked"
  | "fail"
  | "warning"
  | "needs_human_review"
  | "pass"
  | "not_applicable"
  | "missing_in_current_run"
  | "confirm"
  | "correct"
  | "reject";

export type RectificationClosureCategory = "rectified" | "carried_over" | "newly_added" | "pending_human_review";

export type RectificationClosureItem = {
  id: string;
  title: string;
  category: string;
  closureCategory: RectificationClosureCategory;
  previousStatus: string;
  currentStatus: string;
  nextAction: string;
};

export type RectificationClosureDiff = {
  previousTask: OpeningConditionPilotTask;
  selectedTask: OpeningConditionPilotTask;
  items: RectificationClosureItem[];
  summary: Record<RectificationClosureCategory, number>;
};

export type PreviousRunSummary = {
  previousFailed: number;
  currentFailed: number;
  carried: number;
};

export type OpeningConditionRunSnapshot = {
  historyTasks: OpeningConditionPilotTask[];
  selectedTask: OpeningConditionPilotTask | null;
  runRoundMap: Map<string, number>;
  currentRound?: number;
  isCurrentRun: boolean;
  currentRunArchived: boolean;
  blockingReviewCount: number;
  previousRun: PreviousRunSummary | null;
  closureDiff: RectificationClosureDiff | null;
  canStartRectificationRerun: boolean;
};

type PilotCheckItem = OpeningConditionPilotTask["checkItems"][number];

const activeHumanReviewStatuses = new Set(["open", "deferred"]);
const problemVerdicts = new Set<FinalReviewDisposition>(["fail", "warning", "needs_human_review", "blocked", "reject"]);

export function compareTaskByUpdatedAtDesc(left: OpeningConditionPilotTask, right: OpeningConditionPilotTask) {
  return Date.parse(right.updatedAt || right.createdAt || "") - Date.parse(left.updatedAt || left.createdAt || "");
}

export function buildRunRoundMap(tasks: OpeningConditionPilotTask[]) {
  const ordered = [...tasks].sort((left, right) => Date.parse(left.createdAt || "") - Date.parse(right.createdAt || ""));
  return new Map(ordered.map((task, index) => [task.id, index + 1]));
}

export function buildHumanReviewMap(queue: OpeningConditionPilotHumanReviewItem[]) {
  const reviewByTargetId = new Map<string, OpeningConditionPilotHumanReviewItem[]>();
  queue.forEach((item) => {
    const current = reviewByTargetId.get(item.targetId) ?? [];
    current.push(item);
    reviewByTargetId.set(item.targetId, current);
  });
  return reviewByTargetId;
}

export function buildLatestHumanReviewMap(queue: OpeningConditionPilotHumanReviewItem[]) {
  const latestByTargetId = new Map<string, OpeningConditionPilotHumanReviewItem>();
  queue.forEach((item, index) => {
    const current = latestByTargetId.get(item.targetId);
    const currentTime = Date.parse(current?.decidedAt || "");
    const nextTime = Date.parse(item.decidedAt || "");
    const currentRank = Number.isNaN(currentTime) ? -1 : currentTime;
    const nextRank = Number.isNaN(nextTime) ? -1 : nextTime;
    if (!current || nextRank > currentRank || (nextRank === currentRank && index >= queue.indexOf(current))) {
      latestByTargetId.set(item.targetId, item);
    }
  });
  return latestByTargetId;
}

export function getCheckItemDisposition(
  item?: PilotCheckItem | null,
  latestReview?: OpeningConditionPilotHumanReviewItem | null,
): FinalReviewDisposition {
  if (!item) {
    return "missing_in_current_run";
  }

  switch (latestReview?.status) {
    case "confirmed":
      return "confirm";
    case "corrected":
      return "correct";
    case "rejected":
      return "reject";
    case "open":
    case "deferred":
      return "needs_human_review";
    default:
      return (item.finalDisposition ?? item.verdict) as FinalReviewDisposition;
  }
}

export function isProblemCheckItem(
  item?: PilotCheckItem | null,
  latestReview?: OpeningConditionPilotHumanReviewItem | null,
) {
  if (!item) {
    return false;
  }
  return problemVerdicts.has(getCheckItemDisposition(item, latestReview));
}

function getCheckItemCategory(item: PilotCheckItem) {
  return item.subCategory ? `${item.category} / ${item.subCategory}` : item.category;
}

function getFindingDispositionLabel(disposition: string) {
  switch (disposition) {
    case "blocked":
      return "阻塞，暂不能放行";
    case "fail":
      return "不通过，需补件整改";
    case "needs_human_review":
      return "待人工判断";
    case "warning":
      return "提示关注";
    case "pass":
      return "通过";
    case "not_applicable":
      return "本轮不适用";
    case "missing_in_current_run":
      return "本轮未再列为问题";
    case "confirm":
      return "人工确认";
    case "correct":
      return "人工修正";
    case "reject":
      return "人工驳回";
    case "defer":
      return "人工延期";
    default:
      return disposition;
  }
}

export function summarizePreviousRun(currentTask: OpeningConditionPilotTask | null | undefined, tasks: OpeningConditionPilotTask[]) {
  if (!currentTask || tasks.length < 2) {
    return null;
  }
  const sorted = [...tasks].sort(compareTaskByUpdatedAtDesc);
  const index = sorted.findIndex((task) => task.id === currentTask.id);
  if (index < 0) {
    return null;
  }
  const previous = sorted.slice(index + 1).find((task) => task.state === "archived") ?? sorted[index + 1];
  if (!previous) {
    return null;
  }
  const countProblemItems = (task: OpeningConditionPilotTask) => {
    const latestReviewByTargetId = buildLatestHumanReviewMap(task.humanReviewQueue);
    return task.checkItems.filter((item) => isProblemCheckItem(item, latestReviewByTargetId.get(item.id))).length;
  };
  const currentLatestReviewByTargetId = buildLatestHumanReviewMap(currentTask.humanReviewQueue);
  const previousLatestReviewByTargetId = buildLatestHumanReviewMap(previous.humanReviewQueue);
  const currentSet = new Set(
    currentTask.checkItems
      .filter((item) => isProblemCheckItem(item, currentLatestReviewByTargetId.get(item.id)))
      .map((item) => item.id),
  );
  const previousSet = new Set(
    previous.checkItems
      .filter((item) => isProblemCheckItem(item, previousLatestReviewByTargetId.get(item.id)))
      .map((item) => item.id),
  );
  return {
    previousFailed: countProblemItems(previous),
    currentFailed: countProblemItems(currentTask),
    carried: [...currentSet].filter((id) => previousSet.has(id)).length,
  };
}

function getPreviousArchivedRun(selectedTask: OpeningConditionPilotTask | null | undefined, tasks: OpeningConditionPilotTask[]) {
  if (!selectedTask) {
    return null;
  }
  const selectedCreatedAt = Date.parse(selectedTask.createdAt || selectedTask.updatedAt || "");
  return [...tasks]
    .filter((task) => task.id !== selectedTask.id && task.state === "archived")
    .filter((task) => Date.parse(task.createdAt || task.updatedAt || "") < selectedCreatedAt)
    .sort(compareTaskByUpdatedAtDesc)[0] ?? null;
}

function getRectificationNextAction(category: RectificationClosureCategory) {
  switch (category) {
    case "rectified":
      return "本项可作为已补齐记录进入本轮报告留痕。";
    case "carried_over":
      return "继续列入整改清单，要求补齐资料后进入下一轮复审。";
    case "newly_added":
      return "作为本轮新增问题补充整改要求，避免只处理上一轮遗留项。";
    case "pending_human_review":
      return "先由监理人工判断是否接受说明、修正或驳回。";
  }
}

export function buildRectificationClosureDiff(
  selectedTask: OpeningConditionPilotTask | null | undefined,
  tasks: OpeningConditionPilotTask[],
): RectificationClosureDiff | null {
  const previousTask = getPreviousArchivedRun(selectedTask, tasks);
  if (!selectedTask || !previousTask) {
    return null;
  }

  const previousById = new Map(previousTask.checkItems.map((item) => [item.id, item]));
  const currentById = new Map(selectedTask.checkItems.map((item) => [item.id, item]));
  const previousLatestReviewByTargetId = buildLatestHumanReviewMap(previousTask.humanReviewQueue);
  const currentLatestReviewByTargetId = buildLatestHumanReviewMap(selectedTask.humanReviewQueue);
  const allProblemIds = new Set<string>();
  previousTask.checkItems
    .filter((item) => isProblemCheckItem(item, previousLatestReviewByTargetId.get(item.id)))
    .forEach((item) => allProblemIds.add(item.id));
  selectedTask.checkItems
    .filter((item) => isProblemCheckItem(item, currentLatestReviewByTargetId.get(item.id)))
    .forEach((item) => allProblemIds.add(item.id));

  const items = [...allProblemIds].map((id) => {
    const previousItem = previousById.get(id);
    const currentItem = currentById.get(id);
    const previousProblem = isProblemCheckItem(previousItem, previousLatestReviewByTargetId.get(id));
    const currentProblem = isProblemCheckItem(currentItem, currentLatestReviewByTargetId.get(id));
    const currentDisposition = getCheckItemDisposition(currentItem, currentLatestReviewByTargetId.get(id));
    const closureCategory: RectificationClosureCategory =
      currentDisposition === "needs_human_review"
        ? "pending_human_review"
        : previousProblem && !currentProblem
          ? "rectified"
          : previousProblem && currentProblem
            ? "carried_over"
            : "newly_added";
    const displayItem = currentItem ?? previousItem;

    return {
      id,
      title: displayItem?.name ?? id,
      category: displayItem ? getCheckItemCategory(displayItem) : "未分类",
      closureCategory,
      previousStatus: getFindingDispositionLabel(getCheckItemDisposition(previousItem, previousLatestReviewByTargetId.get(id))),
      currentStatus: currentItem ? getFindingDispositionLabel(currentDisposition) : "本轮未再列为问题",
      nextAction: getRectificationNextAction(closureCategory),
    };
  });

  return {
    previousTask,
    selectedTask,
    items,
    summary: {
      rectified: items.filter((item) => item.closureCategory === "rectified").length,
      carried_over: items.filter((item) => item.closureCategory === "carried_over").length,
      newly_added: items.filter((item) => item.closureCategory === "newly_added").length,
      pending_human_review: items.filter((item) => item.closureCategory === "pending_human_review").length,
    },
  };
}

export function deriveOpeningConditionRunSnapshot(args: {
  workspaceTasks?: OpeningConditionPilotTask[];
  pilotTask?: OpeningConditionPilotTask | null;
  selectedHistoryTaskId?: string | null;
  hiddenRunIds?: Set<string>;
}): OpeningConditionRunSnapshot {
  const historyTasks = [...(args.workspaceTasks ?? [])]
    .filter((task) => !args.hiddenRunIds?.has(task.id) || task.id === args.pilotTask?.id)
    .sort(compareTaskByUpdatedAtDesc);
  const selectedTask =
    historyTasks.find((task) => task.id === args.selectedHistoryTaskId) ?? args.pilotTask ?? historyTasks[0] ?? null;
  const runRoundMap = buildRunRoundMap(historyTasks);
  const currentRound = selectedTask ? runRoundMap.get(selectedTask.id) : undefined;
  const isCurrentRun = Boolean(selectedTask && args.pilotTask && selectedTask.id === args.pilotTask.id);
  const currentRunArchived = args.pilotTask?.state === "archived";
  const blockingReviewCount =
    selectedTask?.humanReviewQueue.filter((item) => activeHumanReviewStatuses.has(item.status)).length ?? 0;

  return {
    historyTasks,
    selectedTask,
    runRoundMap,
    currentRound,
    isCurrentRun,
    currentRunArchived,
    blockingReviewCount,
    previousRun: summarizePreviousRun(selectedTask, historyTasks),
    closureDiff: buildRectificationClosureDiff(selectedTask, historyTasks),
    canStartRectificationRerun: Boolean(isCurrentRun && selectedTask?.state === "archived" && currentRunArchived),
  };
}
