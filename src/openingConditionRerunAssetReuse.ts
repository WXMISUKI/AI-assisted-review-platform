import type {
  OpeningConditionPilotBasisRecord,
  OpeningConditionPilotMasterDataRecord,
} from "./domain/backendConnectivity";
import type { OpeningConditionPilotTask } from "./domain/openingConditionPilot";
import {
  openingConditionBasisComponentTypeLabels,
  openingConditionMasterDataTypeLabels,
  openingConditionRecordStatusLabels,
} from "./domain/openingConditionReview";

export type OpeningConditionAssetReuseStatus =
  | "reused"
  | "new_for_current_run"
  | "needs_reconfirmation"
  | "dropped_from_current_run";

export type OpeningConditionAssetReuseEntry = {
  id: string;
  assetType: "basis" | "master_data";
  title: string;
  category: string;
  reuseStatus: OpeningConditionAssetReuseStatus;
  currentStatusLabel?: string;
  previousStatusLabel?: string;
  note: string;
  currentRun: boolean;
  previousRun: boolean;
};

export type OpeningConditionRerunAssetDiff = {
  previousTask: OpeningConditionPilotTask | null;
  currentTask: OpeningConditionPilotTask;
  entries: OpeningConditionAssetReuseEntry[];
  summary: Record<OpeningConditionAssetReuseStatus, number>;
};

const formallyUsableStatuses = new Set(["published", "human_approved"]);

function compareTaskByCreatedAtDesc(left: OpeningConditionPilotTask, right: OpeningConditionPilotTask) {
  return Date.parse(right.createdAt || right.updatedAt || "") - Date.parse(left.createdAt || left.updatedAt || "");
}

function getPreviousArchivedRun(
  currentTask: OpeningConditionPilotTask,
  tasks: OpeningConditionPilotTask[],
) {
  const currentCreatedAt = Date.parse(currentTask.createdAt || currentTask.updatedAt || "");
  return [...tasks]
    .filter((task) => task.id !== currentTask.id && task.state === "archived")
    .filter((task) => Date.parse(task.createdAt || task.updatedAt || "") < currentCreatedAt)
    .sort(compareTaskByCreatedAtDesc)[0] ?? null;
}

function getBasisStatusLabel(status?: string) {
  return openingConditionRecordStatusLabels[status as keyof typeof openingConditionRecordStatusLabels] ?? status ?? "unknown";
}

function getMasterDataStatusLabel(status?: string) {
  return openingConditionRecordStatusLabels[status as keyof typeof openingConditionRecordStatusLabels] ?? status ?? "unknown";
}

function isFormallyUsable(status?: string) {
  return status ? formallyUsableStatuses.has(status) : false;
}

export function getOpeningConditionAssetReuseStatusMeta(status: OpeningConditionAssetReuseStatus) {
  switch (status) {
    case "reused":
      return {
        label: "沿用上一轮",
        tone: "success" as const,
        description: "上一轮已确认，本轮继续沿用。",
      };
    case "new_for_current_run":
      return {
        label: "本轮新增",
        tone: "info" as const,
        description: "上一轮未绑定，本轮首次纳入。",
      };
    case "needs_reconfirmation":
      return {
        label: "待重新确认",
        tone: "warning" as const,
        description: "当前状态尚未达到正式可用，需要重新确认。",
      };
    case "dropped_from_current_run":
      return {
        label: "本轮不再使用",
        tone: "muted" as const,
        description: "上一轮在用，但当前 run 不再绑定。",
      };
  }
}

export function deriveOpeningConditionRerunAssetDiff(args: {
  currentTask?: OpeningConditionPilotTask | null;
  workspaceTasks?: OpeningConditionPilotTask[];
  basisRecords?: OpeningConditionPilotBasisRecord[];
  masterDataRecords?: OpeningConditionPilotMasterDataRecord[];
}): OpeningConditionRerunAssetDiff | null {
  const currentTask = args.currentTask;
  if (!currentTask) {
    return null;
  }

  const previousTask = getPreviousArchivedRun(currentTask, args.workspaceTasks ?? []);
  if (!previousTask) {
    return {
      previousTask: null,
      currentTask,
      entries: [],
      summary: {
        reused: 0,
        new_for_current_run: 0,
        needs_reconfirmation: 0,
        dropped_from_current_run: 0,
      },
    };
  }

  const basisById = new Map((args.basisRecords ?? []).map((item) => [item.id, item]));
  const masterDataById = new Map((args.masterDataRecords ?? []).map((item) => [item.id, item]));
  const entries: OpeningConditionAssetReuseEntry[] = [];

  const currentBasisId = currentTask.basisVersion?.id;
  const previousBasisId = previousTask.basisVersion?.id;
  const currentBasis = currentBasisId ? basisById.get(currentBasisId) : null;
  const previousBasis = previousBasisId ? basisById.get(previousBasisId) : null;
  if (currentBasisId) {
    const reuseStatus: OpeningConditionAssetReuseStatus =
      !isFormallyUsable(currentBasis?.status)
        ? "needs_reconfirmation"
        : currentBasisId === previousBasisId
          ? "reused"
          : "new_for_current_run";
    entries.push({
      id: currentBasisId,
      assetType: "basis",
      title: currentBasis?.title ?? currentTask.basisVersion?.id ?? currentBasisId,
      category:
        openingConditionBasisComponentTypeLabels[currentBasis?.componentType ?? ""] ??
        currentBasis?.componentType ??
        "依据",
      reuseStatus,
      currentStatusLabel: getBasisStatusLabel(currentBasis?.status ?? currentTask.basisVersion?.status),
      previousStatusLabel: previousBasis ? getBasisStatusLabel(previousBasis.status) : undefined,
      note:
        reuseStatus === "reused"
          ? "当前 run 继续沿用上一轮已确认依据。"
          : reuseStatus === "needs_reconfirmation"
            ? "当前依据仍未达到正式可用状态，需要重新发布或确认。"
            : "当前依据是本轮新绑定的 basis。"
      ,
      currentRun: true,
      previousRun: currentBasisId === previousBasisId,
    });
  }
  if (previousBasisId && previousBasisId !== currentBasisId) {
    entries.push({
      id: previousBasisId,
      assetType: "basis",
      title: previousBasis?.title ?? previousBasisId,
      category:
        openingConditionBasisComponentTypeLabels[previousBasis?.componentType ?? ""] ??
        previousBasis?.componentType ??
        "依据",
      reuseStatus: "dropped_from_current_run",
      previousStatusLabel: getBasisStatusLabel(previousBasis?.status ?? previousTask.basisVersion?.status),
      note: "上一轮 basis 未继续绑定到当前 run。",
      currentRun: false,
      previousRun: true,
    });
  }

  const currentMasterIds = new Set((currentTask.requiredMasterData ?? []).map((item) => item.id));
  const previousMasterIds = new Set((previousTask.requiredMasterData ?? []).map((item) => item.id));
  currentTask.requiredMasterData.forEach((recordRef) => {
    const record = masterDataById.get(recordRef.id);
    const previousRecord = previousMasterIds.has(recordRef.id) ? masterDataById.get(recordRef.id) : null;
    const reuseStatus: OpeningConditionAssetReuseStatus =
      !isFormallyUsable(record?.status ?? recordRef.status)
        ? "needs_reconfirmation"
        : previousMasterIds.has(recordRef.id)
          ? "reused"
          : "new_for_current_run";
    entries.push({
      id: recordRef.id,
      assetType: "master_data",
      title: record?.label ?? recordRef.label,
      category: openingConditionMasterDataTypeLabels[record?.type ?? recordRef.type] ?? (record?.type ?? recordRef.type),
      reuseStatus,
      currentStatusLabel: getMasterDataStatusLabel(record?.status ?? recordRef.status),
      previousStatusLabel: previousRecord ? getMasterDataStatusLabel(previousRecord.status) : undefined,
      note:
        reuseStatus === "reused"
          ? "当前 run 继续沿用上一轮已确认主数据。"
          : reuseStatus === "needs_reconfirmation"
            ? "当前主数据仍待人工确认，不能直接视为稳定复用事实。"
            : "该主数据是当前 run 新纳入的事实。"
      ,
      currentRun: true,
      previousRun: previousMasterIds.has(recordRef.id),
    });
  });

  previousTask.requiredMasterData.forEach((recordRef) => {
    if (currentMasterIds.has(recordRef.id)) {
      return;
    }
    const record = masterDataById.get(recordRef.id);
    entries.push({
      id: recordRef.id,
      assetType: "master_data",
      title: record?.label ?? recordRef.label,
      category: openingConditionMasterDataTypeLabels[record?.type ?? recordRef.type] ?? (record?.type ?? recordRef.type),
      reuseStatus: "dropped_from_current_run",
      previousStatusLabel: getMasterDataStatusLabel(record?.status ?? recordRef.status),
      note: "上一轮主数据未继续进入当前 run。",
      currentRun: false,
      previousRun: true,
    });
  });

  const summary = entries.reduce<Record<OpeningConditionAssetReuseStatus, number>>(
    (acc, entry) => {
      acc[entry.reuseStatus] += 1;
      return acc;
    },
    {
      reused: 0,
      new_for_current_run: 0,
      needs_reconfirmation: 0,
      dropped_from_current_run: 0,
    },
  );

  return {
    previousTask,
    currentTask,
    entries,
    summary,
  };
}
