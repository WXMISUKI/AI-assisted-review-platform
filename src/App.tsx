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
  decideOpeningConditionPilotHumanReview,
  fetchOpeningConditionPilotTask,
  fetchOpeningConditionPilotTaskReadiness,
  generateOpeningConditionPilotReport,
  initializeOpeningConditionPilotIntake,
  runOpeningConditionPilotMatch,
  upsertOpeningConditionPilotKnowledgeBase,
  type OpeningConditionPilotIntakeInitResult,
  type OpeningConditionPilotReadinessResult,
} from "./domain/backendConnectivity";
import type { OpeningConditionPilotTask } from "./domain/openingConditionPilot";
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

export function App() {
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getInitialTheme());
  const [session, setSession] = useState<Session | null>(null);
  const [activeProduct, setActiveProduct] = useState<ProductPortalId | null>(null);
  const [openingPage, setOpeningPage] = useState<OpeningConditionPortalPage>("workspace-context");
  const [openingPacket, setOpeningPacket] = useState<OpeningConditionReviewPacket>(() =>
    getOpeningConditionWorkspacePacket(openingConditionReviewPacket.workspaceId),
  );
  const [openingPilotTask, setOpeningPilotTask] = useState<OpeningConditionPilotTask | null>(null);
  const [openingPilotReadiness, setOpeningPilotReadiness] =
    useState<OpeningConditionPilotReadinessResult | null>(null);
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

    void refreshOpeningPilotTask();
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
    setOpeningPilotReadiness(null);
    setOpeningPilotStatus("已切换工作区，请进入资料接入页同步或初始化该工作区的试点任务。");
  }

  async function refreshOpeningPilotTask(taskId = openingPilotTask?.id ?? getOpeningPilotTaskId(openingPacket)) {

    try {
      const taskResult = await fetchOpeningConditionPilotTask(taskId).catch(() => null);
      if (!taskResult?.ok || !taskResult.task) {
        setOpeningPilotTask(null);
        setOpeningPilotReadiness(null);
        setOpeningPilotStatus("试点任务尚未初始化，可先进入资料接入页创建任务。");
        return;
      }

      const readinessResult = await fetchOpeningConditionPilotTaskReadiness(taskId).catch(() => null);
      setOpeningPilotTask(taskResult.task);
      setOpeningPilotReadiness(readinessResult?.ok ? readinessResult : null);
      setOpeningPilotStatus(`试点任务已同步 · 当前状态 ${taskResult.task.state}`);
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
      const result = await initializeOpeningConditionPilotIntake(
        {
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
    const taskId = openingPilotTask?.id ?? getOpeningPilotTaskId(openingPacket);
    setOpeningPilotBusy(true);

    try {
      const result = await runOpeningConditionPilotMatch(taskId);
      if (!result.ok || !result.task) {
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

  async function decideOpeningPilotHumanReview(
    reviewId: string,
    decision: "confirm" | "correct" | "reject" | "defer",
  ) {
    const taskId = openingPilotTask?.id ?? getOpeningPilotTaskId(openingPacket);
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
    const taskId = openingPilotTask?.id ?? getOpeningPilotTaskId(openingPacket);
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
    const taskId = openingPilotTask?.id ?? getOpeningPilotTaskId(openingPacket);
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
    const taskId = openingPilotTask?.id ?? getOpeningPilotTaskId(openingPacket);
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
      pilotReadiness={openingPilotReadiness}
      pilotStatus={openingPilotStatus}
      pilotBusy={openingPilotBusy}
      onToggleTheme={toggleTheme}
      onBack={returnToProductLauncher}
      onSelectPage={setOpeningPage}
      onSelectWorkspace={selectOpeningWorkspace}
      onRefreshPilotTask={() => void refreshOpeningPilotTask()}
      onInitializePilotTask={() => void initializeOpeningPilotTask()}
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
