import { useEffect, useMemo, useState } from "react";
import { getInitialTheme } from "./appShellDisplay";
import { roleLabels, type OpeningConditionPortalPage, type Session, type ThemeMode } from "./appShellTypes";
import { ConstructionPlanReviewApp } from "./ConstructionPlanReviewApp";
import {
  LoginPage,
  OpeningConditionWorkspaceShell,
  ProductLauncherPage,
} from "./productWorkspacePages";
import {
  archiveOpeningConditionPilotTask,
  bindOpeningConditionPilotKnowledgeBase,
  decideOpeningConditionPilotMasterData,
  decideOpeningConditionPilotHumanReview,
  fetchOpeningConditionPilotBasis,
  fetchOpeningConditionPilotKnowledgeBases,
  fetchOpeningConditionPilotMasterData,
  fetchOpeningConditionPilotTasks,
  fetchOpeningConditionPilotTask,
  fetchOpeningConditionPilotTaskReadiness,
  generateOpeningConditionPilotReport,
  initializeOpeningConditionPilotIntake,
  publishOpeningConditionPilotBasis,
  runOpeningConditionPilotMatch,
  upsertOpeningConditionPilotKnowledgeBase,
  type OpeningConditionPilotBasisRecord,
  type OpeningConditionPilotIntakeInitResult,
  type OpeningConditionPilotMasterDataRecord,
  type OpeningConditionPilotReadinessResult,
} from "./domain/backendConnectivity";
import type { OpeningConditionPilotKnowledgeBaseRef, OpeningConditionPilotTask } from "./domain/openingConditionPilot";
import { getAccessibleProductPortals, type ProductPortalId } from "./domain/productPortal";
import {
  getOpeningConditionWorkspacePacket,
  openingConditionReviewPacket,
  openingConditionWorkspaces,
  type OpeningConditionReviewPacket,
} from "./domain/openingConditionReview";

function getOpeningPilotTaskId(packet: OpeningConditionReviewPacket) {
  return `oc-pilot-${packet.workspaceId}`;
}

function getOpeningPilotRunTaskId(packet: OpeningConditionReviewPacket) {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  return `${getOpeningPilotTaskId(packet)}-run-${timestamp}`;
}

function isOpeningPilotTerminalState(state?: OpeningConditionPilotTask["state"] | null) {
  return state === "archived" || state === "failed" || state === "canceled";
}

function compareOpeningPilotTaskRecency(left: OpeningConditionPilotTask, right: OpeningConditionPilotTask) {
  const leftTime = Date.parse(left.updatedAt || left.createdAt || "");
  const rightTime = Date.parse(right.updatedAt || right.createdAt || "");
  return rightTime - leftTime;
}

function buildOpeningPilotIntakeRequest(packet: OpeningConditionReviewPacket, submittedBy = "pilot-user") {
  const workspace = packet.workspaceContext;
  const publishedBasis = packet.basisVersions.find((basis) => basis.status === "published");
  const publishedMasterData = packet.masterData.filter((record) => record.status === "published");
  const uniqueEvidence = Array.from(new Map(packet.evidence.map((item) => [item.fileName, item])).values());

  return {
    taskId: getOpeningPilotTaskId(packet),
    context: {
      workspaceId: packet.workspaceId,
      tenantId: workspace.tenantName || "tenant-opening-condition",
      projectId: workspace.projectName || packet.projectName,
      contractPackageId: workspace.contractPackage || "contract-package",
      participatingOrganizationId: workspace.participatingOrganization || "organization",
    },
    checklistObject: {
      objectId: `${packet.id}-checklist`,
      kind: "checklist" as const,
      fileName: `${packet.reviewTarget}.docx`,
      summary: "开工条件核查表对象引用",
    },
    sourceObjects:
      uniqueEvidence.length > 0
        ? uniqueEvidence.slice(0, 20).map((item, index) => ({
            objectId: `${packet.id}-source-${index + 1}`,
            kind: "source_archive" as const,
            fileName: item.fileName,
            summary: item.locator,
          }))
        : [
            {
              objectId: `${packet.id}-source-1`,
              kind: "source_archive" as const,
              fileName: `${packet.projectName}-资料包.zip`,
              summary: "试点资料包对象引用",
            },
          ],
    basisVersionId: publishedBasis?.id,
    requiredMasterDataIds: publishedMasterData.map((record) => record.id),
    submittedBy,
  };
}

type OpeningPilotPacketRef =
  | NonNullable<NonNullable<OpeningConditionPilotTask["packet"]>["sourceObjects"]>[number]
  | NonNullable<NonNullable<OpeningConditionPilotTask["packet"]>["checklistObject"]>;

function isPersistedOpeningPilotObject(objectRef?: OpeningPilotPacketRef | null) {
  if (!objectRef) {
    return false;
  }

  return Boolean(objectRef.storageKey || String(objectRef.objectId || "").startsWith("uploads/"));
}

function buildOpeningPilotReinitializeRequest(
  task: OpeningConditionPilotTask,
  basisRecords: OpeningConditionPilotBasisRecord[],
  masterDataRecords: OpeningConditionPilotMasterDataRecord[],
  submittedBy = "pilot-user",
) {
  const checklistObject = task.packet?.checklistObject;
  const sourceObjects = task.packet?.sourceObjects ?? [];
  if (!checklistObject || !isPersistedOpeningPilotObject(checklistObject) || sourceObjects.length === 0) {
    return null;
  }
  if (sourceObjects.some((item) => !isPersistedOpeningPilotObject(item))) {
    return null;
  }

  const publishedBasisId =
    task.basisVersion?.id ??
    basisRecords.find((item) => item.status === "published")?.id;
  const approvedMasterDataIds =
    (task.requiredMasterData?.length ?? 0) > 0
      ? task.requiredMasterData.map((item) => item.id)
      : masterDataRecords
          .filter((item) => item.status === "published" || item.status === "human_approved")
          .map((item) => item.id);

  return {
    taskId: task.id,
    context: task.context,
    basisVersionId: publishedBasisId,
    requiredMasterDataIds: approvedMasterDataIds,
    checklistObject,
    sourceObjects,
    submittedBy,
  };
}

export function App() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getInitialTheme());
  const [session, setSession] = useState<Session | null>(null);
  const [activeProduct, setActiveProduct] = useState<ProductPortalId | null>(null);
  const [openingPage, setOpeningPage] = useState<OpeningConditionPortalPage>("workspace-context");
  const [openingPacket, setOpeningPacket] = useState<OpeningConditionReviewPacket>(() =>
    getOpeningConditionWorkspacePacket(openingConditionReviewPacket.workspaceId),
  );
  const [openingPilotTask, setOpeningPilotTask] = useState<OpeningConditionPilotTask | null>(null);
  const [openingPilotWorkspaceTasks, setOpeningPilotWorkspaceTasks] = useState<OpeningConditionPilotTask[]>([]);
  const [openingPilotReadiness, setOpeningPilotReadiness] =
    useState<OpeningConditionPilotReadinessResult | null>(null);
  const [openingPilotBasisRecords, setOpeningPilotBasisRecords] = useState<OpeningConditionPilotBasisRecord[]>([]);
  const [openingPilotMasterDataRecords, setOpeningPilotMasterDataRecords] = useState<OpeningConditionPilotMasterDataRecord[]>([]);
  const [openingPilotKnowledgeBases, setOpeningPilotKnowledgeBases] = useState<OpeningConditionPilotKnowledgeBaseRef[]>([]);
  const [openingPilotStatus, setOpeningPilotStatus] = useState("试点任务尚未初始化，可先进入资料接入页创建任务。");
  const [openingPilotBusy, setOpeningPilotBusy] = useState(false);

  const roleLabel = session ? roleLabels[session.role] : "监理单位";
  const availableProducts = useMemo(() => (session ? getAccessibleProductPortals(session.role) : []), [session]);

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    window.localStorage.setItem("app-theme", themeMode);
  }, [themeMode]);

  useEffect(() => {
    if (activeProduct !== "opening-condition-review") {
      return;
    }

    void refreshOpeningPilotTask(undefined, { resolveCurrentRun: true });
  }, [activeProduct, openingPacket.workspaceId]);

  function toggleTheme() {
    setThemeMode((current) => (current === "light" ? "dark" : "light"));
  }

  function logout() {
    setSession(null);
    setActiveProduct(null);
    setOpeningPage("workspace-context");
  }

  function returnToProductLauncher() {
    setActiveProduct(null);
    setOpeningPage("workspace-context");
  }

  function selectOpeningWorkspace(workspaceId: string) {
    setOpeningPacket(getOpeningConditionWorkspacePacket(workspaceId));
    setOpeningPilotTask(null);
    setOpeningPilotWorkspaceTasks([]);
    setOpeningPilotReadiness(null);
    setOpeningPilotBasisRecords([]);
    setOpeningPilotMasterDataRecords([]);
    setOpeningPilotKnowledgeBases([]);
    setOpeningPilotStatus("已切换工作区，请进入资料接入页同步或初始化该工作区的试点任务。");
  }

  async function refreshOpeningWorkspaceFacts(workspaceId = openingPacket.workspaceId) {
    const [basisResult, masterDataResult, knowledgeBaseResult] = await Promise.all([
      fetchOpeningConditionPilotBasis(workspaceId).catch(() => null),
      fetchOpeningConditionPilotMasterData(workspaceId).catch(() => null),
      fetchOpeningConditionPilotKnowledgeBases(workspaceId).catch(() => null),
    ]);

    setOpeningPilotBasisRecords(basisResult?.ok ? basisResult.basisVersions : []);
    setOpeningPilotMasterDataRecords(masterDataResult?.ok ? masterDataResult.masterDataRecords : []);
    setOpeningPilotKnowledgeBases(knowledgeBaseResult?.ok ? knowledgeBaseResult.knowledgeBases ?? [] : []);
  }

  async function refreshOpeningWorkspaceTasks(workspaceId = openingPacket.workspaceId) {
    const listed = await fetchOpeningConditionPilotTasks().catch(() => null);
    const workspaceTasks =
      listed?.ok && Array.isArray(listed.tasks)
        ? listed.tasks.filter((task) => task.context.workspaceId === workspaceId).sort(compareOpeningPilotTaskRecency)
        : [];
    setOpeningPilotWorkspaceTasks(workspaceTasks);
    return workspaceTasks;
  }

  async function resolveOpeningPilotTaskId(preferredTaskId?: string) {
    const workspaceTasks = await refreshOpeningWorkspaceTasks(openingPacket.workspaceId);

    if (workspaceTasks.length === 0) {
      return preferredTaskId ?? getOpeningPilotTaskId(openingPacket);
    }

    const preferredTask = preferredTaskId ? workspaceTasks.find((task) => task.id === preferredTaskId) : null;
    if (preferredTask && !isOpeningPilotTerminalState(preferredTask.state)) {
      return preferredTask.id;
    }

    const runnableTask = workspaceTasks.find((task) => !isOpeningPilotTerminalState(task.state));
    if (runnableTask) {
      return runnableTask.id;
    }

    return preferredTask?.id ?? workspaceTasks[0]?.id ?? getOpeningPilotTaskId(openingPacket);
  }

  async function refreshOpeningPilotTask(
    taskId?: string,
    options?: {
      resolveCurrentRun?: boolean;
      preserveStatus?: boolean;
    },
  ) {
    const resolvedTaskId =
      taskId ?? (options?.resolveCurrentRun ? await resolveOpeningPilotTaskId(openingPilotTask?.id) : openingPilotTask?.id ?? getOpeningPilotTaskId(openingPacket));

    try {
      await refreshOpeningWorkspaceFacts(openingPacket.workspaceId);
      await refreshOpeningWorkspaceTasks(openingPacket.workspaceId);
      const taskResult = await fetchOpeningConditionPilotTask(resolvedTaskId).catch(() => null);
      if (!taskResult?.ok || !taskResult.task) {
        setOpeningPilotTask(null);
        setOpeningPilotReadiness(null);
        if (!options?.preserveStatus) {
          setOpeningPilotStatus("试点任务尚未初始化，可先进入资料接入页创建任务。");
        }
        return;
      }

      const readinessResult = await fetchOpeningConditionPilotTaskReadiness(taskResult.task.id).catch(() => null);
      setOpeningPilotTask(taskResult.task);
      setOpeningPilotReadiness(readinessResult?.ok ? readinessResult : null);
      if (!options?.preserveStatus) {
        setOpeningPilotStatus(
          taskResult.task.state === "archived"
            ? "当前展示的是已归档任务，可查看历史结果；如需继续联调，请重新上传并初始化新 run。"
            : `试点任务已同步 · 当前状态 ${taskResult.task.state}`,
        );
      }
    } catch (error) {
      setOpeningPilotStatus(error instanceof Error ? error.message : "试点任务刷新失败");
    }
  }

  async function initializeOpeningPilotTask() {
    const taskId =
      openingPilotTask?.state === "archived"
        ? getOpeningPilotRunTaskId(openingPacket)
        : (openingPilotTask?.id ?? getOpeningPilotTaskId(openingPacket));
    setOpeningPilotBusy(true);

    try {
      const reinitializeRequest =
        openingPilotTask && openingPilotTask.state !== "archived"
          ? buildOpeningPilotReinitializeRequest(
              openingPilotTask,
              openingPilotBasisRecords,
              openingPilotMasterDataRecords,
              session?.username ?? "pilot-user",
            )
          : null;
      if (openingPilotTask && openingPilotTask.state !== "archived" && !reinitializeRequest) {
        setOpeningPilotStatus("当前 run 的真实上传对象引用已丢失或已被演示数据覆盖，不能继续安全重初始化。请通过“真实试点资料接入”重新上传并创建新的 run。");
        return;
      }

      const result = await initializeOpeningConditionPilotIntake(
        reinitializeRequest ?? {
          ...buildOpeningPilotIntakeRequest(openingPacket, session?.username ?? "pilot-user"),
          taskId,
        },
      );
      if (!result.ok || !result.task) {
        setOpeningPilotStatus(result.message ?? "资料包接入初始化失败");
        return;
      }

      setOpeningPilotTask(result.task);
      setOpeningPilotReadiness(
        result.preflightReadiness
          ? {
              ok: true,
              taskId: result.task.id,
              workspaceId: result.task.context.workspaceId,
              state: result.task.state,
              preflightReadiness: result.preflightReadiness,
              knowledgeBaseRef: result.task.knowledgeBaseRef,
            }
          : null,
      );

      const checklistResolution = result.intake?.checklistDefinitionResolution;
      if (checklistResolution === "manual_definition_required") {
        setOpeningPilotStatus("资料包接入已完成，但当前核查表尚未纳入后端模板适配，需补充 checklist 定义后再执行正式核查。");
      } else if (result.preflightReadiness?.blockingReasons?.length) {
        setOpeningPilotStatus(`资料包接入已完成，仍有 ${result.preflightReadiness.blockingReasons.length} 项前置门禁待处理。`);
      } else {
        setOpeningPilotStatus("资料包接入已完成，可执行正式核查。");
      }
    } catch (error) {
      setOpeningPilotStatus(error instanceof Error ? error.message : "资料包接入初始化失败");
    } finally {
      setOpeningPilotBusy(false);
    }
  }

  async function runOpeningPilotFormalMatch() {
    if (!openingPilotTask) {
      setOpeningPilotStatus("当前工作区尚未初始化试点任务，请先上传并初始化资料。");
      return;
    }
    if (openingPilotTask.state === "archived") {
      await refreshOpeningPilotTask(undefined, { resolveCurrentRun: true, preserveStatus: true });
      setOpeningPilotStatus("当前任务已归档，不能继续执行正式核查。请重新上传并初始化新 run，或刷新后切换到当前未归档任务。");
      return;
    }

    const taskId = openingPilotTask.id;
    setOpeningPilotBusy(true);

    try {
      const result = await runOpeningConditionPilotMatch(taskId);
      if (!result.ok || !result.task) {
        if (result.status === "invalid_state") {
          await refreshOpeningPilotTask(undefined, { resolveCurrentRun: true, preserveStatus: true });
        }
        setOpeningPilotStatus(result.message ?? "正式核查执行失败");
        return;
      }

      const readinessResult = await fetchOpeningConditionPilotTaskReadiness(taskId).catch(() => null);
      setOpeningPilotTask(result.task);
      setOpeningPilotReadiness(readinessResult?.ok ? readinessResult : openingPilotReadiness);
      setOpeningPilotStatus(
        result.task.state === "awaiting_human_review"
          ? `正式核查已完成，进入人工复核 · 待处理 ${result.task.humanReviewQueue.length} 项`
          : "正式核查已完成，任务进入报告准备阶段",
      );
    } catch (error) {
      setOpeningPilotStatus(error instanceof Error ? error.message : "正式核查执行失败");
    } finally {
      setOpeningPilotBusy(false);
    }
  }

  async function publishOpeningPilotBasisRecord() {
    if (!openingPilotTask) {
      setOpeningPilotStatus("当前没有可发布的依据记录，请先初始化试点任务。");
      return;
    }
    if (openingPilotTask.state === "archived") {
      setOpeningPilotStatus("当前任务已归档，不能再发布依据；请初始化新的试点 run。");
      return;
    }

    const workspaceId = openingPilotTask.context.workspaceId;
    const actorId = session?.username ?? "pilot-user";
    const currentBasisId =
      openingPilotTask.basisVersion?.id ??
      openingPilotBasisRecords.find((item) => item.status !== "published" && item.status !== "rejected")?.id;

    if (!currentBasisId) {
      setOpeningPilotStatus("当前 run 没有待发布的依据记录。");
      return;
    }

    setOpeningPilotBusy(true);
    try {
      const result = await publishOpeningConditionPilotBasis(workspaceId, currentBasisId, actorId);
      if (!result.ok) {
        setOpeningPilotStatus(result.message ?? "依据发布失败");
        return;
      }

      await refreshOpeningPilotTask(openingPilotTask.id, { preserveStatus: true });
      setOpeningPilotStatus("当前 run 依据已发布，请继续确认主数据并检查知识库门禁。");
    } catch (error) {
      setOpeningPilotStatus(error instanceof Error ? error.message : "依据发布失败");
    } finally {
      setOpeningPilotBusy(false);
    }
  }

  async function confirmOpeningPilotMasterDataRecords() {
    if (!openingPilotTask) {
      setOpeningPilotStatus("当前没有可确认的主数据记录，请先初始化试点任务。");
      return;
    }
    if (openingPilotTask.state === "archived") {
      setOpeningPilotStatus("当前任务已归档，不能再确认主数据；请初始化新的试点 run。");
      return;
    }

    const workspaceId = openingPilotTask.context.workspaceId;
    const actorId = session?.username ?? "pilot-user";
    const currentRunMasterDataIds =
      (openingPilotTask.requiredMasterData ?? []).map((item) => item.id).length > 0
        ? (openingPilotTask.requiredMasterData ?? []).map((item) => item.id)
        : openingPilotMasterDataRecords.map((item) => item.id);
    const pendingRecords = openingPilotMasterDataRecords.filter(
      (item) =>
        currentRunMasterDataIds.includes(item.id) &&
        item.status !== "published" &&
        item.status !== "human_approved" &&
        item.status !== "rejected" &&
        item.status !== "expired",
    );

    if (pendingRecords.length === 0) {
      setOpeningPilotStatus("当前 run 主数据已处于 human approved 或 published 状态。");
      return;
    }

    setOpeningPilotBusy(true);
    try {
      for (const record of pendingRecords) {
        const result = await decideOpeningConditionPilotMasterData(
          workspaceId,
          record.id,
          "approve",
          actorId,
          "当前记录已在试点接入预览中由操作员确认，可进入正式核查门禁。",
        );
        if (!result.ok) {
          setOpeningPilotStatus(result.message ?? `主数据确认失败：${record.label}`);
          return;
        }
      }

      await refreshOpeningPilotTask(openingPilotTask.id, { preserveStatus: true });
      setOpeningPilotStatus(`当前 run 主数据已确认 ${pendingRecords.length} 项，可继续检查正式核查门禁。`);
    } catch (error) {
      setOpeningPilotStatus(error instanceof Error ? error.message : "主数据确认失败");
    } finally {
      setOpeningPilotBusy(false);
    }
  }

  async function decideOpeningPilotHumanReview(
    reviewId: string,
    decision: "confirm" | "correct" | "reject" | "defer",
  ) {
    if (!openingPilotTask) {
      setOpeningPilotStatus("当前没有可处理的人工复核任务。");
      return;
    }
    if (openingPilotTask.state === "archived") {
      setOpeningPilotStatus("当前任务已归档，仅可查看历史复核记录；如需继续处理，请初始化新的试点 run。");
      return;
    }

    const taskId = openingPilotTask.id;
    setOpeningPilotBusy(true);

    try {
      const result = await decideOpeningConditionPilotHumanReview(
        taskId,
        reviewId,
        decision,
        session?.username ?? "pilot-user",
        "平台试点闭环操作台记录的人工复核决策。",
      );
      if (!result.ok || !result.task) {
        setOpeningPilotStatus(result.message ?? "人工复核决策提交失败");
        return;
      }

      const readinessResult = await fetchOpeningConditionPilotTaskReadiness(taskId).catch(() => null);
      setOpeningPilotTask(result.task);
      setOpeningPilotReadiness(readinessResult?.ok ? readinessResult : openingPilotReadiness);
      setOpeningPilotStatus(
        result.blockingCount && result.blockingCount > 0
          ? `人工复核决策已记录，仍有 ${result.blockingCount} 项阻塞。`
          : "人工复核阻塞项已处理完毕，可进入报告生成。",
      );
    } catch (error) {
      setOpeningPilotStatus(error instanceof Error ? error.message : "人工复核决策提交失败");
    } finally {
      setOpeningPilotBusy(false);
    }
  }

  async function generateOpeningPilotReport() {
    if (!openingPilotTask) {
      setOpeningPilotStatus("当前没有可生成报告的试点任务。");
      return;
    }
    if (openingPilotTask.state === "archived") {
      setOpeningPilotStatus("当前任务已归档，报告资产只读展示；如需再次运行，请初始化新的试点 run。");
      return;
    }

    const taskId = openingPilotTask.id;
    setOpeningPilotBusy(true);

    try {
      const result = await generateOpeningConditionPilotReport(taskId);
      if (!result.ok || !result.task) {
        setOpeningPilotStatus(result.message ?? "报告摘要生成失败");
        return;
      }

      const readinessResult = await fetchOpeningConditionPilotTaskReadiness(taskId).catch(() => null);
      setOpeningPilotTask(result.task);
      setOpeningPilotReadiness(readinessResult?.ok ? readinessResult : openingPilotReadiness);
      setOpeningPilotStatus(
        `报告摘要已生成，共 ${result.reportAsset?.summary.total ?? result.task.checkItems.length} 项核查结果。`,
      );
    } catch (error) {
      setOpeningPilotStatus(error instanceof Error ? error.message : "报告摘要生成失败");
    } finally {
      setOpeningPilotBusy(false);
    }
  }

  async function archiveOpeningPilotTask() {
    if (!openingPilotTask) {
      setOpeningPilotStatus("当前没有可归档的试点任务。");
      return;
    }

    const taskId = openingPilotTask.id;
    setOpeningPilotBusy(true);

    try {
      const result = await archiveOpeningConditionPilotTask(taskId);
      if (!result.ok || !result.task) {
        setOpeningPilotStatus(result.message ?? "试点任务归档失败");
        return;
      }

      const readinessResult = await fetchOpeningConditionPilotTaskReadiness(taskId).catch(() => null);
      setOpeningPilotTask(result.task);
      setOpeningPilotReadiness(readinessResult?.ok ? readinessResult : openingPilotReadiness);
      setOpeningPilotStatus("试点任务已归档，平台已保留任务状态、复核决策和报告资产记录。");
    } catch (error) {
      setOpeningPilotStatus(error instanceof Error ? error.message : "试点任务归档失败");
    } finally {
      setOpeningPilotBusy(false);
    }
  }

  async function ensureOpeningDefaultKnowledgeBase() {
    const workspace = openingPacket.workspaceContext;
    if (!openingPilotTask) {
      setOpeningPilotStatus("请先初始化试点任务，再绑定试点知识库。");
      return;
    }
    if (openingPilotTask.state === "archived") {
      setOpeningPilotStatus("当前任务已归档，不能再绑定知识库；请初始化新的试点 run。");
      return;
    }

    const taskId = openingPilotTask.id;
    const knowledgeBaseId = `${openingPacket.workspaceId}-subcontract-kb`;
    setOpeningPilotBusy(true);

    try {
      const upserted = await upsertOpeningConditionPilotKnowledgeBase(openingPacket.workspaceId, knowledgeBaseId, {
        id: knowledgeBaseId,
        workspaceId: openingPacket.workspaceId,
        organizationId: workspace.participatingOrganization,
        contractPackageId: workspace.contractPackage,
        subcontractTeamId: workspace.participatingOrganization,
        label: `${workspace.participatingOrganization}资料核查知识库`,
        status: "ready",
        summary: "用于试点的分包队伍资料模板、历史证据摘要和人工修正记录。",
      });
      if (!upserted.ok) {
        setOpeningPilotStatus(upserted.message ?? "知识库初始化失败");
        return;
      }

      const bound = await bindOpeningConditionPilotKnowledgeBase(taskId, knowledgeBaseId);
      if (!bound.ok) {
        setOpeningPilotStatus(bound.message ?? "知识库绑定失败");
        return;
      }

      await refreshOpeningWorkspaceFacts(openingPacket.workspaceId);
      setOpeningPilotTask(bound.task ?? openingPilotTask);
      setOpeningPilotReadiness(
        bound.preflightReadiness
          ? {
              ok: true,
              taskId,
              workspaceId: openingPacket.workspaceId,
              state: bound.task?.state ?? openingPilotTask?.state ?? "ready_for_packet",
              preflightReadiness: bound.preflightReadiness,
              knowledgeBaseRef: bound.task?.knowledgeBaseRef,
            }
          : openingPilotReadiness,
      );
      setOpeningPilotStatus("试点知识库已准备并绑定到当前任务。");
    } catch (error) {
      setOpeningPilotStatus(error instanceof Error ? error.message : "知识库绑定失败");
    } finally {
      setOpeningPilotBusy(false);
    }
  }

  function handleOpeningTrialBootstrapComplete(result: OpeningConditionPilotIntakeInitResult) {
    if (!result.task) {
      setOpeningPilotStatus(result.message ?? "真实试点任务初始化失败");
      return;
    }

    setOpeningPilotTask(result.task);
    setOpeningPilotReadiness(
      result.preflightReadiness
        ? {
            ok: true,
            taskId: result.task.id,
            workspaceId: result.task.context.workspaceId,
            state: result.task.state,
            preflightReadiness: result.preflightReadiness,
            knowledgeBaseRef: result.task.knowledgeBaseRef,
          }
        : null,
    );
    setOpeningPilotStatus(
      `真实试点任务已初始化 · 清单 ${result.packet?.inventoryEntries.length ?? 0} 项 · 状态 ${result.task.state}`,
    );
    void refreshOpeningWorkspaceFacts(result.task.context.workspaceId);
  }

  if (!session) {
    return <LoginPage onSignIn={setSession} themeMode={themeMode} onToggleTheme={toggleTheme} />;
  }

  if (!activeProduct) {
    return (
      <ProductLauncherPage
        entries={availableProducts}
        roleLabel={roleLabel}
        username={session.username}
        themeMode={themeMode}
        onToggleTheme={toggleTheme}
        onSelectProduct={setActiveProduct}
        onLogout={logout}
      />
    );
  }

  if (activeProduct === "construction-plan-review") {
    return (
      <ConstructionPlanReviewApp
        session={session}
        themeMode={themeMode}
        onToggleTheme={toggleTheme}
        onBackToProducts={returnToProductLauncher}
        onLogout={logout}
      />
    );
  }

  return (
      <OpeningConditionWorkspaceShell
      roleLabel={roleLabel}
      themeMode={themeMode}
      activePage={openingPage}
      workspaces={openingConditionWorkspaces}
      selectedWorkspaceId={openingPacket.workspaceId}
      packet={openingPacket}
      pilotTask={openingPilotTask}
      pilotWorkspaceTasks={openingPilotWorkspaceTasks}
      pilotBasisRecords={openingPilotBasisRecords}
      pilotMasterDataRecords={openingPilotMasterDataRecords}
      pilotKnowledgeBases={openingPilotKnowledgeBases}
      pilotReadiness={openingPilotReadiness}
      pilotStatus={openingPilotStatus}
      pilotBusy={openingPilotBusy}
      onToggleTheme={toggleTheme}
      onBack={returnToProductLauncher}
      onSelectPage={setOpeningPage}
      onSelectWorkspace={selectOpeningWorkspace}
      onRefreshPilotTask={() => void refreshOpeningPilotTask()}
      onInitializePilotTask={() => void initializeOpeningPilotTask()}
      onPublishPilotBasis={() => void publishOpeningPilotBasisRecord()}
      onConfirmPilotMasterData={() => void confirmOpeningPilotMasterDataRecords()}
      onRunPilotMatch={() => void runOpeningPilotFormalMatch()}
      onEnsureKnowledgeBase={() => void ensureOpeningDefaultKnowledgeBase()}
      onReviewDecision={(reviewId, decision) => void decideOpeningPilotHumanReview(reviewId, decision)}
      onGenerateReport={() => void generateOpeningPilotReport()}
      onArchivePilotTask={() => void archiveOpeningPilotTask()}
      onTrialBootstrapComplete={handleOpeningTrialBootstrapComplete}
      getNextOpeningPilotRunTaskId={() => getOpeningPilotRunTaskId(openingPacket)}
    />
  );
}
