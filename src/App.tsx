import { ArrowLeft, SunMoon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { LoginPage, OpeningConditionReviewPage, ProductLauncherPage } from "./appShellPages";
import { getInitialTheme } from "./appShellDisplay";
import { roleLabels, type Session, type ThemeMode } from "./appShellTypes";
import { ReviewWorkbenchPage } from "./ReviewWorkbenchPage";
import {
  bindOpeningConditionPilotKnowledgeBase,
  fetchOpeningConditionPilotTask,
  fetchOpeningConditionPilotTaskReadiness,
  initializeOpeningConditionPilotIntake,
  runOpeningConditionPilotMatch,
  upsertOpeningConditionPilotKnowledgeBase,
  type OpeningConditionPilotReadinessResult,
} from "./domain/backendConnectivity";
import type { OpeningConditionPilotTask } from "./domain/openingConditionPilot";
import { getAccessibleProductPortals, type ProductPortalId } from "./domain/productPortal";
import {
  getOpeningConditionWorkspacePacket,
  openingConditionReviewPacket,
  type OpeningConditionReviewPacket,
} from "./domain/openingConditionReview";

function getOpeningPilotTaskId(packet: OpeningConditionReviewPacket) {
  return `oc-pilot-${packet.workspaceId}`;
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
  const [openingPacket, setOpeningPacket] = useState<OpeningConditionReviewPacket>(() =>
    getOpeningConditionWorkspacePacket(openingConditionReviewPacket.workspaceId),
  );
  const [openingPilotTask, setOpeningPilotTask] = useState<OpeningConditionPilotTask | null>(null);
  const [openingPilotReadiness, setOpeningPilotReadiness] =
    useState<OpeningConditionPilotReadinessResult | null>(null);
  const [openingPilotStatus, setOpeningPilotStatus] = useState("试点任务尚未初始化，可先执行资料包接入。");
  const [openingPilotBusy, setOpeningPilotBusy] = useState(false);

  const roleLabel = session ? roleLabels[session.role] : "监理";
  const availableProducts = useMemo(
    () => (session ? getAccessibleProductPortals(session.role) : []),
    [session],
  );

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
  }

  async function refreshOpeningPilotTask() {
    const taskId = getOpeningPilotTaskId(openingPacket);

    try {
      const taskResult = await fetchOpeningConditionPilotTask(taskId).catch(() => null);
      if (!taskResult?.ok || !taskResult.task) {
        setOpeningPilotTask(null);
        setOpeningPilotReadiness(null);
        setOpeningPilotStatus("试点任务尚未初始化，可先执行资料包接入。");
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
    setOpeningPilotBusy(true);

    try {
      const result = await initializeOpeningConditionPilotIntake(
        buildOpeningPilotIntakeRequest(openingPacket, session?.username ?? "pilot-user"),
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
      const checklistTemplateId = result.intake?.selectedChecklistTemplateId;
      if (checklistResolution === "manual_definition_required") {
        setOpeningPilotStatus("资料包接入已完成，但当前核查表尚未纳入后端模板适配，需补充 checklist 定义后再执行正式核查。");
      } else if (checklistResolution === "derived_from_template" && !result.preflightReadiness?.blockingReasons?.length) {
        setOpeningPilotStatus(
          `资料包接入已完成，后端已识别核查表模板${checklistTemplateId ? `（${checklistTemplateId}）` : ""}，可执行正式核查。`,
        );
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

  async function ensureOpeningDefaultKnowledgeBase() {
    const workspace = openingPacket.workspaceContext;
    const taskId = getOpeningPilotTaskId(openingPacket);
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
      <ReviewWorkbenchPage
        roleLabel={roleLabel}
        themeMode={themeMode}
        onToggleTheme={toggleTheme}
        onBack={() => setActiveProduct(null)}
      />
    );
  }

  return (
    <main className="app-shell">
      <header className="shell-topbar">
        <div className="shell-topbar-actions">
          <button type="button" className="theme-toggle subtle" onClick={() => setActiveProduct(null)}>
            <ArrowLeft size={16} />
            返回门户
          </button>
          <button type="button" className="theme-toggle subtle" onClick={toggleTheme}>
            <SunMoon size={16} />
            {themeMode === "light" ? "深色主题" : "浅色主题"}
          </button>
        </div>
      </header>
      <OpeningConditionReviewPage
        roleLabel={roleLabel}
        packet={openingPacket}
        pilotTask={openingPilotTask}
        pilotReadiness={openingPilotReadiness}
        pilotStatus={openingPilotStatus}
        pilotBusy={openingPilotBusy}
        onRefreshPilotTask={() => void refreshOpeningPilotTask()}
        onInitializePilotTask={() => void initializeOpeningPilotTask()}
        onRunPilotMatch={() => void runOpeningPilotFormalMatch()}
        onEnsureKnowledgeBase={() => void ensureOpeningDefaultKnowledgeBase()}
      />
    </main>
  );
}
