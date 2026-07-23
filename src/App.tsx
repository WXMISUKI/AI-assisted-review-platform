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
  refreshOpeningConditionPilotBasisPreview,
  runOpeningConditionPilotMatch,
  upsertOpeningConditionPilotBasis,
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
import type { OpeningPilotIntakeMode } from "./openingConditionPortalState";

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
      projectId: workspace.projectId || workspace.projectName || packet.projectName,
      reviewObjectId: workspace.reviewObjectId,
      contractPackageId: workspace.contractPackage || "contract-package",
      participatingOrganizationId: workspace.participatingOrganization || "organization",
      participantEntityId: workspace.participantEntityId,
    },
    checklistObject: {
      objectId: `${packet.id}-checklist`,
      kind: "checklist" as const,
      fileName: `${packet.reviewTarget}.docx`,
      summary: "寮€宸ユ潯浠舵牳鏌ヨ〃瀵硅薄寮曠敤",
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
              fileName: `${packet.projectName}-璧勬枡鍖?zip`,
              summary: "璇曠偣璧勬枡鍖呭璞″紩鐢?",
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
  const [openingPilotStatus, setOpeningPilotStatus] = useState("璇曠偣浠诲姟灏氭湭鍒濆鍖栵紝鍙厛杩涘叆璧勬枡鎺ュ叆椤靛垱寤轰换鍔°€?");
  const [openingPilotBusy, setOpeningPilotBusy] = useState(false);
  const [openingPilotIntakeMode, setOpeningPilotIntakeMode] = useState<OpeningPilotIntakeMode>("default");

  const roleLabel = session ? roleLabels[session.role] : "鐩戠悊鍗曚綅";
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
    setOpeningPilotIntakeMode("default");
  }

  function returnToProductLauncher() {
    setActiveProduct(null);
    setOpeningPage("workspace-context");
    setOpeningPilotIntakeMode("default");
  }

  function selectOpeningWorkspace(workspaceId: string) {
    setOpeningPacket(getOpeningConditionWorkspacePacket(workspaceId));
    setOpeningPilotTask(null);
    setOpeningPilotWorkspaceTasks([]);
    setOpeningPilotReadiness(null);
    setOpeningPilotBasisRecords([]);
    setOpeningPilotMasterDataRecords([]);
    setOpeningPilotKnowledgeBases([]);
    setOpeningPilotStatus("宸插垏鎹㈠伐浣滃尯锛岃杩涘叆璧勬枡鎺ュ叆椤靛悓姝ユ垨鍒濆鍖栬宸ヤ綔鍖虹殑璇曠偣浠诲姟銆?");
    setOpeningPilotIntakeMode("default");
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
          setOpeningPilotStatus("璇曠偣浠诲姟灏氭湭鍒濆鍖栵紝鍙厛杩涘叆璧勬枡鎺ュ叆椤靛垱寤轰换鍔°€?");
        }
        return;
      }

      const readinessResult = await fetchOpeningConditionPilotTaskReadiness(taskResult.task.id).catch(() => null);
      setOpeningPilotTask(taskResult.task);
      setOpeningPilotReadiness(readinessResult?.ok ? readinessResult : null);
      if (!options?.preserveStatus) {
        setOpeningPilotStatus(
          taskResult.task.state === "archived"
            ? "褰撳墠灞曠ず鐨勬槸宸插綊妗ｄ换鍔★紝鍙煡鐪嬪巻鍙茬粨鏋滐紱濡傞渶缁х画鑱旇皟锛岃閲嶆柊涓婁紶骞跺垵濮嬪寲鏂?run銆?"
            : "Pilot task synced; current state: " + taskResult.task.state,
        );
      }
    } catch (error) {
      setOpeningPilotStatus(error instanceof Error ? error.message : "璇曠偣浠诲姟鍒锋柊澶辫触");
    }
  }

  async function initializeOpeningPilotTask() {
    if (openingPilotTask?.state === "archived") {
      setOpeningPilotStatus("褰撳墠灞曠ず鐨勬槸宸插綊妗ｄ换鍔★紝鎵ц鍙颁笉鑳界洿鎺ュ垱寤烘柊 run銆傝浠庢姤鍛婂綊妗ｉ〉鍙戣捣涓嬩竴杞暣鏀瑰瀹★紝骞跺湪璧勬枡鎺ュ叆椤典笂浼犳柊鐨勪緷鎹€佹牳鏌ヨ〃鍜岃祫鏂欏寘銆?");
      return;
    }

    const taskId = openingPilotTask?.id ?? getOpeningPilotTaskId(openingPacket);
    setOpeningPilotBusy(true);

    try {
      const reinitializeRequest =
        openingPilotTask
          ? buildOpeningPilotReinitializeRequest(
              openingPilotTask,
              openingPilotBasisRecords,
              openingPilotMasterDataRecords,
              session?.username ?? "pilot-user",
            )
          : null;
      if (openingPilotTask && !reinitializeRequest) {
        setOpeningPilotStatus("褰撳墠 run 鐨勭湡瀹炰笂浼犲璞″紩鐢ㄥ凡涓㈠け鎴栧凡琚紨绀烘暟鎹鐩栵紝涓嶈兘缁х画瀹夊叏閲嶅垵濮嬪寲銆傝閫氳繃鈥滅湡瀹炶瘯鐐硅祫鏂欐帴鍏モ€濋噸鏂颁笂浼犲苟鍒涘缓鏂扮殑 run銆?");
        return;
      }

      const result = await initializeOpeningConditionPilotIntake(
        reinitializeRequest ?? {
          ...buildOpeningPilotIntakeRequest(openingPacket, session?.username ?? "pilot-user"),
          taskId,
        },
      );
      if (!result.ok || !result.task) {
        setOpeningPilotStatus(result.message ?? "璧勬枡鍖呮帴鍏ュ垵濮嬪寲澶辫触");
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
        setOpeningPilotStatus("璧勬枡鍖呮帴鍏ュ凡瀹屾垚锛屼絾褰撳墠鏍告煡琛ㄥ皻鏈撼鍏ュ悗绔ā鏉块€傞厤锛岄渶琛ュ厖 checklist 瀹氫箟鍚庡啀鎵ц姝ｅ紡鏍告煡銆?");
      } else if (result.preflightReadiness?.blockingReasons?.length) {
        setOpeningPilotStatus("Packet intake completed; blocking reasons remain: " + result.preflightReadiness.blockingReasons.length + ".");
      } else {
        setOpeningPilotStatus("璧勬枡鍖呮帴鍏ュ凡瀹屾垚锛屽彲鎵ц姝ｅ紡鏍告煡銆?");
      }
    } catch (error) {
      setOpeningPilotStatus(error instanceof Error ? error.message : "璧勬枡鍖呮帴鍏ュ垵濮嬪寲澶辫触");
    } finally {
      setOpeningPilotBusy(false);
    }
  }

  async function runOpeningPilotFormalMatch() {
    if (!openingPilotTask) {
      setOpeningPilotStatus("褰撳墠宸ヤ綔鍖哄皻鏈垵濮嬪寲璇曠偣浠诲姟锛岃鍏堜笂浼犲苟鍒濆鍖栬祫鏂欍€?");
      return;
    }
    if (openingPilotTask.state === "archived") {
      await refreshOpeningPilotTask(undefined, { resolveCurrentRun: true, preserveStatus: true });
      setOpeningPilotStatus("褰撳墠浠诲姟宸插綊妗ｏ紝涓嶈兘缁х画鎵ц姝ｅ紡鏍告煡銆傝閲嶆柊涓婁紶骞跺垵濮嬪寲鏂?run锛屾垨鍒锋柊鍚庡垏鎹㈠埌褰撳墠鏈綊妗ｄ换鍔°€?");
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
        setOpeningPilotStatus(result.message ?? "姝ｅ紡鏍告煡鎵ц澶辫触");
        return;
      }

      const readinessResult = await fetchOpeningConditionPilotTaskReadiness(taskId).catch(() => null);
      setOpeningPilotTask(result.task);
      setOpeningPilotReadiness(readinessResult?.ok ? readinessResult : openingPilotReadiness);
      if (result.task.state === "awaiting_human_review") {
        setOpeningPilotStatus("Formal match complete; human review queue has " + result.task.humanReviewQueue.length + " item(s).");
      } else {
        setOpeningPilotStatus("Formal match complete; report preparation is ready.");
      }
    } catch (error) {
      setOpeningPilotStatus(error instanceof Error ? error.message : "姝ｅ紡鏍告煡鎵ц澶辫触");
    } finally {
      setOpeningPilotBusy(false);
    }
  }

  async function publishOpeningPilotBasisRecord(input?: { basisId?: string; safeNote?: string }) {
    if (!openingPilotTask) {
      setOpeningPilotStatus("当前没有可发布的依据记录，请先初始化试点任务。")
      return;
    }
    if (openingPilotTask.state === "archived") {
      setOpeningPilotStatus("当前任务已归档，不能再发布依据；请初始化新的试点 run。")
      return;
    }

    const workspaceId = openingPilotTask.context.workspaceId;
    const actorId = session?.username ?? "pilot-user";
    const currentBasisId =
      input?.basisId ??
      openingPilotTask.basisVersion?.id ??
      openingPilotBasisRecords.find((item) => item.status !== "published" && item.status !== "rejected")?.id;

    if (!currentBasisId) {
      setOpeningPilotStatus("当前 run 没有待发布的依据记录。")
      return;
    }

    setOpeningPilotBusy(true);
    try {
      if (input?.safeNote?.trim()) {
        const updateResult = await upsertOpeningConditionPilotBasis(workspaceId, currentBasisId, {
          safeNote: input.safeNote.trim(),
        });
        if (!updateResult.ok) {
          setOpeningPilotStatus(updateResult.message ?? "依据备注保存失败")
          return;
        }
      }

      const result = await publishOpeningConditionPilotBasis(workspaceId, currentBasisId, actorId);
      if (!result.ok) {
        setOpeningPilotStatus(result.message ?? "依据发布失败")
        return;
      }

      await refreshOpeningPilotTask(openingPilotTask.id, { preserveStatus: true });
      setOpeningPilotStatus("当前 run 依据已发布，请继续确认主数据并检查知识库门禁。")
    } catch (error) {
      setOpeningPilotStatus(error instanceof Error ? error.message : "依据发布失败")
    } finally {
      setOpeningPilotBusy(false);
    }
  }

  async function refreshOpeningPilotBasisPreview(basisId: string) {
    if (!openingPilotTask) {
      setOpeningPilotStatus("当前没有可抽取的依据记录，请先初始化试点任务。");
      return;
    }
    if (openingPilotTask.state === "archived") {
      setOpeningPilotStatus("当前任务已归档，不能刷新依据预览；请发起新的整改复审 run。");
      return;
    }

    setOpeningPilotBusy(true);
    try {
      const result = await refreshOpeningConditionPilotBasisPreview(openingPilotTask.context.workspaceId, basisId, {
        projectId: openingPilotTask.context.projectId,
        contractPackageId: openingPilotTask.context.contractPackageId,
        participatingOrganizationId: openingPilotTask.context.participatingOrganizationId,
        safeNote: "Operator refreshed the deterministic basis preview before publication.",
      });
      if (!result.ok) {
        setOpeningPilotStatus(result.message ?? "依据预览抽取刷新失败。");
        return;
      }

      await refreshOpeningPilotTask(openingPilotTask.id, { preserveStatus: true });
      const missingCount = result.basisVersion?.ingestionPreview?.missingFields.length ?? 0;
      setOpeningPilotStatus(
        missingCount > 0
          ? `依据预览已刷新，仍有 ${missingCount} 个字段需要人工补充或确认。`
          : "依据预览已刷新，请人工确认后发布。",
      );
    } catch (error) {
      setOpeningPilotStatus(error instanceof Error ? error.message : "依据预览抽取刷新失败。");
    } finally {
      setOpeningPilotBusy(false);
    }
  }

  async function confirmOpeningPilotMasterDataRecords() {
    if (!openingPilotTask) {
      setOpeningPilotStatus("褰撳墠娌℃湁鍙‘璁ょ殑涓绘暟鎹褰曪紝璇峰厛鍒濆鍖栬瘯鐐逛换鍔°€?");
      return;
    }
    if (openingPilotTask.state === "archived") {
      setOpeningPilotStatus("褰撳墠浠诲姟宸插綊妗ｏ紝涓嶈兘鍐嶇‘璁や富鏁版嵁锛涜鍒濆鍖栨柊鐨勮瘯鐐?run銆?");
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
      setOpeningPilotStatus("褰撳墠 run 涓绘暟鎹凡澶勪簬 human approved 鎴?published 鐘舵€併€?");
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
          "褰撳墠璁板綍宸插湪璇曠偣鎺ュ叆棰勮涓敱鎿嶄綔鍛樼‘璁わ紝鍙繘鍏ユ寮忔牳鏌ラ棬绂併€?",
        );
        if (!result.ok) {
          setOpeningPilotStatus(result.message ?? ("Master-data confirmation failed: " + record.label));
          return;
        }
      }

      await refreshOpeningPilotTask(openingPilotTask.id, { preserveStatus: true });
      setOpeningPilotStatus("Current run master data confirmed: " + pendingRecords.length + " item(s).");
    } catch (error) {
      setOpeningPilotStatus(error instanceof Error ? error.message : "Master-data confirmation failed.");
    } finally {
      setOpeningPilotBusy(false);
    }
  }


  async function decideOpeningPilotMasterDataRecord(
    recordId: string,
    decision: "approve" | "reject" | "publish",
    safeNote?: string,
  ) {
    if (!openingPilotTask) {
      setOpeningPilotStatus("当前没有可处理的主数据候选。");
      return;
    }
    if (openingPilotTask.state === "archived") {
      setOpeningPilotStatus("当前任务已归档，不能再处理主数据候选；请初始化新的试点 run。");
      return;
    }

    const workspaceId = openingPilotTask.context.workspaceId;
    const actorId = session?.username ?? "pilot-user";
    setOpeningPilotBusy(true);

    try {
      const result = await decideOpeningConditionPilotMasterData(
        workspaceId,
        recordId,
        decision,
        actorId,
        safeNote?.trim() || undefined,
      );
      if (!result.ok) {
        setOpeningPilotStatus(result.message ?? "主数据候选处理失败");
        return;
      }

      await refreshOpeningPilotTask(openingPilotTask.id, { preserveStatus: true });
      setOpeningPilotStatus(
        decision === "reject"
          ? "主数据候选已驳回，当前 run 状态已刷新。"
          : "主数据候选已确认，当前 run 状态已刷新。",
      );
    } catch (error) {
      setOpeningPilotStatus(error instanceof Error ? error.message : "主数据候选处理失败");
    } finally {
      setOpeningPilotBusy(false);
    }
  }
  async function decideOpeningPilotHumanReview(
    reviewId: string,
    decision: "confirm" | "correct" | "reject" | "defer",
  ) {
    if (!openingPilotTask) {
      setOpeningPilotStatus("褰撳墠娌℃湁鍙鐞嗙殑浜哄伐澶嶆牳浠诲姟銆?");
      return;
    }
    if (openingPilotTask.state === "archived") {
      setOpeningPilotStatus("褰撳墠浠诲姟宸插綊妗ｏ紝浠呭彲鏌ョ湅鍘嗗彶澶嶆牳璁板綍锛涘闇€缁х画澶勭悊锛岃鍒濆鍖栨柊鐨勮瘯鐐?run銆?");
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
        "骞冲彴璇曠偣闂幆鎿嶄綔鍙拌褰曠殑浜哄伐澶嶆牳鍐崇瓥銆?",
      );
      if (!result.ok || !result.task) {
        setOpeningPilotStatus(result.message ?? "浜哄伐澶嶆牳鍐崇瓥鎻愪氦澶辫触");
        return;
      }

      const readinessResult = await fetchOpeningConditionPilotTaskReadiness(taskId).catch(() => null);
      setOpeningPilotTask(result.task);
      setOpeningPilotReadiness(readinessResult?.ok ? readinessResult : openingPilotReadiness);
      if (result.blockingCount && result.blockingCount > 0) {
        setOpeningPilotStatus("Human-review decision recorded; " + result.blockingCount + " blocker(s) remain.");
      } else {
        setOpeningPilotStatus("Human-review blockers cleared; report generation can continue.");
      }
    } catch (error) {
      setOpeningPilotStatus(error instanceof Error ? error.message : "浜哄伐澶嶆牳鍐崇瓥鎻愪氦澶辫触");
    } finally {
      setOpeningPilotBusy(false);
    }
  }

  async function generateOpeningPilotReport() {
    if (!openingPilotTask) {
      setOpeningPilotStatus("褰撳墠娌℃湁鍙敓鎴愭姤鍛婄殑璇曠偣浠诲姟銆?");
      return;
    }
    if (openingPilotTask.state === "archived") {
      setOpeningPilotStatus("褰撳墠浠诲姟宸插綊妗ｏ紝鎶ュ憡璧勪骇鍙灞曠ず锛涘闇€鍐嶆杩愯锛岃鍒濆鍖栨柊鐨勮瘯鐐?run銆?");
      return;
    }

    const taskId = openingPilotTask.id;
    setOpeningPilotBusy(true);

    try {
      const result = await generateOpeningConditionPilotReport(taskId);
      if (!result.ok || !result.task) {
        setOpeningPilotStatus(result.message ?? "鎶ュ憡鎽樿鐢熸垚澶辫触");
        return;
      }

      const readinessResult = await fetchOpeningConditionPilotTaskReadiness(taskId).catch(() => null);
      setOpeningPilotTask(result.task);
      setOpeningPilotReadiness(readinessResult?.ok ? readinessResult : openingPilotReadiness);
      setOpeningPilotStatus(
        "Report summary generated with " + (result.reportAsset?.summary.total ?? result.task.checkItems.length) + " check item(s).",
      );
    } catch (error) {
      setOpeningPilotStatus(error instanceof Error ? error.message : "鎶ュ憡鎽樿鐢熸垚澶辫触");
    } finally {
      setOpeningPilotBusy(false);
    }
  }

  async function archiveOpeningPilotTask() {
    if (!openingPilotTask) {
      setOpeningPilotStatus("褰撳墠娌℃湁鍙綊妗ｇ殑璇曠偣浠诲姟銆?");
      return;
    }

    const taskId = openingPilotTask.id;
    setOpeningPilotBusy(true);

    try {
      const result = await archiveOpeningConditionPilotTask(taskId);
      if (!result.ok || !result.task) {
        setOpeningPilotStatus(result.message ?? "璇曠偣浠诲姟褰掓。澶辫触");
        return;
      }

      const readinessResult = await fetchOpeningConditionPilotTaskReadiness(taskId).catch(() => null);
      setOpeningPilotTask(result.task);
      setOpeningPilotReadiness(readinessResult?.ok ? readinessResult : openingPilotReadiness);
      setOpeningPilotStatus("璇曠偣浠诲姟宸插綊妗ｏ紝骞冲彴宸蹭繚鐣欎换鍔＄姸鎬併€佸鏍稿喅绛栧拰鎶ュ憡璧勪骇璁板綍銆?");
    } catch (error) {
      setOpeningPilotStatus(error instanceof Error ? error.message : "璇曠偣浠诲姟褰掓。澶辫触");
    } finally {
      setOpeningPilotBusy(false);
    }
  }

  function startOpeningRectificationRerun() {
    setOpeningPilotIntakeMode("rectification_rerun");
    setOpeningPage("material-intake");
    setOpeningPilotStatus("宸茶繘鍏ユ暣鏀瑰瀹℃帴鍏ワ紝璇蜂笂浼犳湰杞ˉ姝ｅ悗鐨勫悎鍚屼緷鎹€佽祫鏂欐牳鏌ヨ〃鍜岃祫鏂欏寘锛涘綊妗ｅ巻鍙插皢淇濇寔鍙銆?");
  }

  async function ensureOpeningDefaultKnowledgeBase() {
    const workspace = openingPacket.workspaceContext;
    if (!openingPilotTask) {
      setOpeningPilotStatus("璇峰厛鍒濆鍖栬瘯鐐逛换鍔★紝鍐嶇粦瀹氳瘯鐐圭煡璇嗗簱銆?");
      return;
    }
    if (openingPilotTask.state === "archived") {
      setOpeningPilotStatus("褰撳墠浠诲姟宸插綊妗ｏ紝涓嶈兘鍐嶇粦瀹氱煡璇嗗簱锛涜鍒濆鍖栨柊鐨勮瘯鐐?run銆?");
      return;
    }

    const taskId = openingPilotTask.id;
    const knowledgeBaseId = openingPacket.workspaceId + "-subcontract-kb";
    setOpeningPilotBusy(true);

    try {
      const upserted = await upsertOpeningConditionPilotKnowledgeBase(openingPacket.workspaceId, knowledgeBaseId, {
        id: knowledgeBaseId,
        workspaceId: openingPacket.workspaceId,
        organizationId: workspace.participantEntityId,
        contractPackageId: workspace.reviewObjectId,
        subcontractTeamId: workspace.participantEntityId,
        label: workspace.participantEntityName + " knowledge base",
        status: "ready",
        summary: workspace.reviewObjectName + " review evidence and corrected facts.",
      });
      if (!upserted.ok) {
        setOpeningPilotStatus(upserted.message ?? "鐭ヨ瘑搴撳垵濮嬪寲澶辫触");
        return;
      }

      const bound = await bindOpeningConditionPilotKnowledgeBase(taskId, knowledgeBaseId);
      if (!bound.ok) {
        setOpeningPilotStatus(bound.message ?? "鐭ヨ瘑搴撶粦瀹氬け璐?");
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
      setOpeningPilotStatus("璇曠偣鐭ヨ瘑搴撳凡鍑嗗骞剁粦瀹氬埌褰撳墠浠诲姟銆?");
    } catch (error) {
      setOpeningPilotStatus(error instanceof Error ? error.message : "鐭ヨ瘑搴撶粦瀹氬け璐?");
    } finally {
      setOpeningPilotBusy(false);
    }
  }

  function handleOpeningTrialBootstrapComplete(result: OpeningConditionPilotIntakeInitResult) {
    if (!result.task) {
      setOpeningPilotStatus(result.message ?? "鐪熷疄璇曠偣浠诲姟鍒濆鍖栧け璐?");
      return;
    }

    setOpeningPilotIntakeMode("default");
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
      "Pilot task initialized; manifest " + (result.packet?.inventoryEntries.length ?? 0) + "; state " + result.task.state,
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
      intakeMode={openingPilotIntakeMode}
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
      onPublishPilotBasisDecision={(basisId, safeNote) => void publishOpeningPilotBasisRecord({ basisId, safeNote })}
      onRefreshPilotBasisPreview={(basisId) => void refreshOpeningPilotBasisPreview(basisId)}
      onConfirmPilotMasterData={() => void confirmOpeningPilotMasterDataRecords()}
      onDecidePilotMasterDataCandidate={(recordId, decision, safeNote) =>
        void decideOpeningPilotMasterDataRecord(recordId, decision, safeNote)
      }
      onRunPilotMatch={() => void runOpeningPilotFormalMatch()}
      onEnsureKnowledgeBase={() => void ensureOpeningDefaultKnowledgeBase()}
      onReviewDecision={(reviewId, decision) => void decideOpeningPilotHumanReview(reviewId, decision)}
      onGenerateReport={() => void generateOpeningPilotReport()}
      onArchivePilotTask={() => void archiveOpeningPilotTask()}
      onStartRectificationRerun={startOpeningRectificationRerun}
      onTrialBootstrapComplete={handleOpeningTrialBootstrapComplete}
      getNextOpeningPilotRunTaskId={() => getOpeningPilotRunTaskId(openingPacket)}
    />
  );
}
