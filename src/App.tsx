import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  ClipboardCheck,
  Database,
  FileCheck2,
  FolderKanban,
  GitCompareArrows,
  LayoutDashboard,
  ListChecks,
  LogOut,
  SunMoon,
  Users,
} from "lucide-react";
import {
  DataAssetsPage,
  DocumentLibraryPage,
  KnowledgeBasePage,
  OpeningConditionBasisPage,
  OpeningConditionHumanReviewPage,
  OpeningConditionMasterDataPage,
  LoginPage,
  OpeningConditionReviewPage,
  OpeningConditionReportsPage,
  OpeningConditionWorkspacePage,
  ProductLauncherPage,
  ResultPreviewPage,
  ReviewLoadingPage,
} from "./appShellPages";
import {
  getInitialTheme,
  getOcrLoadingStageIndex,
  modeName,
  openingConditionPortalPageLabels,
  pageLabels,
  statusLabels,
  NavButton,
} from "./appShellDisplay";
import { roleLabels, roleModes } from "./appShellTypes";
import type {
  LibraryDocument,
  OpeningConditionPortalPage,
  Session,
  ShellPage,
  StreamingStage,
  ThemeMode,
  UploadDraft,
} from "./appShellTypes";
import { ReviewWorkbenchPage } from "./ReviewWorkbenchPage";
import {
  createActiveProductContext,
  getAccessibleProductPortals,
  type ProductPortalId,
} from "./domain/productPortal";
import {
  getOpeningConditionMasterDataReadiness,
  getOpeningConditionWorkspacePacket,
  openingConditionWorkspaces,
  type OpeningConditionReviewPacket,
} from "./domain/openingConditionReview";
import type {
  ReviewCompletionPayload,
  ReviewMode,
  ReviewPipelineStageType,
  ReviewAgentKey,
} from "./domain/reviewTypes";
import type { ReviewStreamEvent, ReviewStreamSubscriptionHandlers } from "./domain/backendConnectivity";
import { mockStreamingStages as reviewStreamingStages } from "./domain/mockReviewTaskSeeds";
import {
  addManualTaskIssue,
  completeReviewTask,
  completeReviewGenerationRun,
  createDocumentTask,
  createReviewSession,
  deleteDocumentTask,
  deleteManualTaskIssue,
  failReviewGenerationRun,
  listReviewTasks,
  markReviewTaskReady,
  mergeGeneratedReviewIssues,
  resolveTaskIssue,
  startReviewGenerationRun,
  startReviewTask,
  syncDocumentTaskOcrStatus,
  updateReviewGenerationRunStage,
  updateReviewTaskPreparationPackage,
  updateReviewTaskStreamStage,
  updateReviewTaskViewContext,
  updateTaskIssueDraft,
} from "./domain/reviewSessionService";
import { getReviewTaskOrchestrationSnapshot } from "./domain/reviewTaskOrchestration";
import { buildReviewPreparationStages } from "./domain/reviewPreparationStages";
import {
  createLocalFallbackPreparationPackage,
  createPreparationStructureSummary,
  normalizeBackendPreparationPackage,
} from "./domain/reviewPreparationPackage";
import {
  archiveOpeningConditionPilotTask,
  bindOpeningConditionPilotKnowledgeBase,
  addPersistedManualReviewTaskIssue,
  completePersistedReviewTask,
  createReviewGenerationRun,
  decideOpeningConditionPilotHumanReview,
  decideOpeningConditionPilotMasterData,
  deletePersistedManualReviewTaskIssue,
  fetchOpeningConditionPilotBasis,
  fetchOpeningConditionPilotHumanReview,
  fetchOpeningConditionPilotKnowledgeBases,
  fetchOpeningConditionPilotMasterData,
  fetchOpeningConditionPilotTask,
  fetchOpeningConditionPilotTaskReadiness,
  fetchReviewGenerationRunEvents,
  fetchReviewGenerationRunStatus,
  generateOpeningConditionPilotReport,
  hydrateOcrResultStructure,
  fetchOcrJobStatus,
  intakeOpeningConditionPilotPacket,
  initializeOpeningConditionPilotIntake,
  publishOpeningConditionPilotBasis,
  requestDraftIssueGeneration,
  resolvePersistedReviewTaskIssue,
  runOpeningConditionPilotMatch,
  subscribeReviewGenerationRunEvents,
  subscribeReviewStreamEvents,
  submitStoredObjectOcrJob,
  upsertOpeningConditionPilotBasis,
  upsertOpeningConditionPilotKnowledgeBase,
  upsertOpeningConditionPilotMasterData,
  upsertOpeningConditionPilotTask,
  updatePersistedReviewTaskIssueDraft,
  uploadMinioDocument,
} from "./domain/backendConnectivity";
import type { OpeningConditionPilotTask } from "./domain/openingConditionPilot";

export function App() {
  const initialTasks = useMemo(() => listReviewTasks(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [activeProduct, setActiveProduct] = useState<ProductPortalId | null>(null);
  const [activePage, setActivePage] = useState<ShellPage>("documents");
  const [openingActivePage, setOpeningActivePage] =
    useState<OpeningConditionPortalPage>("workspace-context");
  const [openingWorkspaceId, setOpeningWorkspaceId] = useState(openingConditionWorkspaces[0]?.id ?? "");
  const [openingPacket, setOpeningPacket] = useState<OpeningConditionReviewPacket>(() =>
    getOpeningConditionWorkspacePacket(openingConditionWorkspaces[0]?.id ?? ""),
  );
  const [openingPilotTask, setOpeningPilotTask] = useState<OpeningConditionPilotTask | null>(null);
  const [openingPilotReadiness, setOpeningPilotReadiness] = useState<Awaited<
    ReturnType<typeof fetchOpeningConditionPilotTaskReadiness>
  > | null>(null);
  const [openingPilotStatus, setOpeningPilotStatus] = useState("平台试点记录待同步");
  const [openingPilotBusy, setOpeningPilotBusy] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState(initialTasks[0]?.id ?? "");
  const [documents, setDocuments] = useState<LibraryDocument[]>(initialTasks);
  const [uploadDraft, setUploadDraft] = useState<UploadDraft>({ name: "", project: "" });
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [documentUploadError, setDocumentUploadError] = useState("");
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [loadingDocId, setLoadingDocId] = useState<string | null>(null);
  const [streamStageIndex, setStreamStageIndex] = useState(0);
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => getInitialTheme());
  const documentsRef = useRef<LibraryDocument[]>(documents);

  const selectedDocument = documents.find((doc) => doc.id === selectedDocId) ?? documents[0];
  const deleteTargetDocument = documents.find((doc) => doc.id === deleteTargetId) ?? null;
  const allowedModes: ReviewMode[] = session ? roleModes[session.role] : ["review", "revise"];
  const accessibleProducts = useMemo(
    () => (session ? getAccessibleProductPortals(session.role) : []),
    [session],
  );
  const activeProductContext = activeProduct ? createActiveProductContext(activeProduct) : null;

  function replaceDocumentFromBackend(task: LibraryDocument | undefined) {
    if (!task) {
      return;
    }

    setDocuments((currentDocs) =>
      currentDocs.map((document) => (document.id === task.id ? task : document)),
    );
  }

  const selectedDocumentSession = useMemo(
    () => (selectedDocument ? createReviewSession(selectedDocument, selectedDocument.mode) : null),
    [selectedDocument],
  );
  const loadingStages = useMemo(
    () =>
      selectedDocument?.preparationPackage?.stageEvents.length
        ? selectedDocument.preparationPackage.stageEvents
        : buildReviewPreparationStages(selectedDocument?.recoveredStructure, reviewStreamingStages),
    [selectedDocument?.preparationPackage, selectedDocument?.recoveredStructure],
  );

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
    window.localStorage.setItem("app-theme", themeMode);
  }, [themeMode]);

  useEffect(() => {
    documentsRef.current = documents;
  }, [documents]);

  useEffect(() => {
    if (activeProduct !== "opening-condition-review" || !openingWorkspaceId) {
      return;
    }

    void syncOpeningPilotWorkspace(openingWorkspaceId);
  }, [activeProduct, openingWorkspaceId]);

  useEffect(() => {
    if (activePage !== "review-loading" || !loadingDocId) {
      return;
    }

    const currentDocument = documentsRef.current.find((doc) => doc.id === loadingDocId);
    if (!currentDocument) {
      return;
    }

    let cancelled = false;
    let timerId: number | null = null;
    let streamSubscription: { close: () => void } | null = null;

    const stopActiveStreams = () => {
      if (timerId) {
        window.clearInterval(timerId);
        window.clearTimeout(timerId);
        timerId = null;
      }

      if (streamSubscription) {
        streamSubscription.close();
        streamSubscription = null;
      }
    };

    const finishReady = (nextDocuments: LibraryDocument[]) => {
      if (cancelled) {
        return;
      }

      stopActiveStreams();
      documentsRef.current = nextDocuments;
      setDocuments(nextDocuments);
      setSelectedDocId(loadingDocId);
      setActivePage("review-detail");
      setLoadingDocId(null);
    };

    const finishFailed = (message: string, nextDocuments: LibraryDocument[]) => {
      if (cancelled) {
        return;
      }

      stopActiveStreams();
      const failedDocuments = failReviewGenerationRun(nextDocuments, loadingDocId, {
        status: "failed",
        message,
        source: "ocr-hydration",
      });
      documentsRef.current = failedDocuments;
      setDocuments(failedDocuments);
      setDocumentUploadError(message);
      setActivePage("documents");
      setLoadingDocId(null);
    };

    const buildPreparationStages = (document: LibraryDocument | undefined) =>
      buildReviewPreparationStages(document?.recoveredStructure, reviewStreamingStages);

    const buildStageSnapshot = (stageIndex: number, stages = buildPreparationStages(currentDocument)) => {
      const stage = stages[stageIndex] ?? stages[0] ?? reviewStreamingStages[0];
      return {
        streamStageIndex: stageIndex,
        streamStageType: stage.stageType,
        streamAgentKey: stage.agentKey,
        streamParagraphIndex: stage.currentParagraphIndex,
        streamParagraphTotal: stage.currentParagraphTotal,
        streamCurrentParagraphId: stage.currentParagraphId,
        streamParagraphLabel: stage.currentParagraphLabel ?? stage.currentSection,
      };
    };

    const buildStructureSummary = (document: LibraryDocument | undefined) =>
      createPreparationStructureSummary(document?.recoveredStructure);

    const enrichDocumentsWithGeneratedIssues = async (
      nextDocuments: LibraryDocument[],
      sourceDocument: LibraryDocument,
      preparationPackage: NonNullable<LibraryDocument["preparationPackage"]>,
    ) => {
      if (!sourceDocument.recoveredStructure?.paragraphs.length) {
        return completeReviewGenerationRun(nextDocuments, loadingDocId, {
          status: "degraded",
          preparationPackageId: preparationPackage.packageId,
          generatedIssueCount: 0,
          diagnostics: {
            status: "no-paragraphs",
            message: "No recovered paragraphs were available for draft issue generation.",
            source: "draft-issue-generation",
          },
        });
      }

      try {
        const startedAt = new Date().toISOString();
        const result = await requestDraftIssueGeneration({
          taskId: loadingDocId,
          preparationPackage,
          paragraphs: sourceDocument.recoveredStructure.paragraphs,
          mode: sourceDocument.mode,
          maxIssues: 6,
        });
        const completedAt = new Date().toISOString();

        return mergeGeneratedReviewIssues(nextDocuments, loadingDocId, result.issues, {
          source: result.source,
          status: result.status,
          diagnostics: result.diagnostics,
          preparationPackageId: preparationPackage.packageId,
          startedAt,
          completedAt,
        });
      } catch (error) {
        return completeReviewGenerationRun(nextDocuments, loadingDocId, {
          status: "degraded",
          preparationPackageId: preparationPackage.packageId,
          generatedIssueCount: 0,
          diagnostics: {
            status: "request-failed",
            message: error instanceof Error ? error.message : "Draft issue generation request failed.",
            source: "draft-issue-generation",
          },
        });
      }
    };

    const enrichDocumentsWithBackendDraftIssues = (
      nextDocuments: LibraryDocument[],
      preparationPackage: NonNullable<LibraryDocument["preparationPackage"]>,
      draftIssueGeneration: NonNullable<ReviewStreamEvent["draftIssueGeneration"]>,
    ) => {
      if (!draftIssueGeneration) {
        return null;
      }

      return mergeGeneratedReviewIssues(nextDocuments, loadingDocId, draftIssueGeneration.issues ?? [], {
        source: draftIssueGeneration.source,
        status: draftIssueGeneration.status,
        diagnostics: draftIssueGeneration.diagnostics,
        preparationPackageId: preparationPackage.packageId,
        startedAt: draftIssueGeneration.startedAt,
        completedAt: draftIssueGeneration.completedAt,
        runId: draftIssueGeneration.runId,
      });
    };

    const startReviewPreparation = (startIndex: number, sourceDocument = currentDocument) => {
      stopActiveStreams();
      const preparationStages = buildPreparationStages(sourceDocument);
      const initialSnapshot = buildStageSnapshot(startIndex, preparationStages);
      setDocuments((currentDocs) => {
        const nextDocuments = updateReviewGenerationRunStage(
          updateReviewTaskStreamStage(currentDocs, loadingDocId, initialSnapshot),
          loadingDocId,
          initialSnapshot,
        );
        documentsRef.current = nextDocuments;
        return nextDocuments;
      });
      setStreamStageIndex(startIndex);
      timerId = window.setInterval(() => {
        setStreamStageIndex((currentIndex) => {
          const nextIndex = currentIndex + 1;
          if (nextIndex < preparationStages.length) {
            setDocuments((currentDocs) => {
              const nextSnapshot = buildStageSnapshot(nextIndex, preparationStages);
              const nextDocuments = updateReviewGenerationRunStage(
                updateReviewTaskStreamStage(
                  currentDocs,
                  loadingDocId,
                  nextSnapshot,
                ),
                loadingDocId,
                nextSnapshot,
              );
              documentsRef.current = nextDocuments;
              return nextDocuments;
            });
            return nextIndex;
          }

          if (timerId) {
            window.clearInterval(timerId);
            timerId = null;
          }

          window.setTimeout(async () => {
            if (cancelled) {
              return;
            }

            let nextDocuments = markReviewTaskReady(
              documentsRef.current,
              loadingDocId,
              buildStageSnapshot(currentIndex, preparationStages),
            );
            const preparationPackage = createLocalFallbackPreparationPackage({
              taskId: loadingDocId,
              recoveredStructure: sourceDocument.recoveredStructure,
              stages: preparationStages,
            });
            if (preparationPackage) {
              nextDocuments = updateReviewTaskPreparationPackage(
                nextDocuments,
                loadingDocId,
                preparationPackage,
              );
              nextDocuments = await enrichDocumentsWithGeneratedIssues(
                nextDocuments,
                sourceDocument,
                preparationPackage,
              );
            }
            finishReady(nextDocuments);
          }, 650);

          return currentIndex;
        });
      }, 850);
    };

    const startBackendReviewPreparation = async (sourceDocument = currentDocument) => {
      const structureSummary = buildStructureSummary(sourceDocument);
      const persistedStageIndex = sourceDocument.pipelineSnapshot?.stageIndex ?? sourceDocument.streamStageIndex;
      if (!structureSummary || !sourceDocument.recoveredStructure?.paragraphs.length || persistedStageIndex > 0) {
        startReviewPreparation(persistedStageIndex || 0, sourceDocument);
        return;
      }

      stopActiveStreams();

      const stageOrder = [
        "connect",
        "structure-restoration",
        "basis-binding",
        "review-analysis",
        "result-packaging",
      ] as const;
      let latestStageIndex = 0;
      let completed = false;
      let backendRunId = "";
      let lastBackendEventSequence = 0;
      const seenBackendEventKeys = new Set<string>();
      const backendEvents: Parameters<typeof normalizeBackendPreparationPackage>[0]["events"] = [];

      const buildSnapshotFromEvent = (
        event: {
          stageId: string;
          stageType?: string;
          agentKey?: string;
          currentParagraphId?: string;
          currentParagraphIndex?: number;
          currentParagraphTotal?: number;
          currentParagraphLabel?: string;
          currentSection?: string;
        },
        stageIndex: number,
      ) => ({
        streamStageIndex: stageIndex,
        streamStageType:
          (event.stageType as ReviewPipelineStageType | undefined) ??
          sourceDocument.streamStageType ??
          "result-packaging",
        streamAgentKey:
          (event.agentKey as ReviewAgentKey | undefined) ??
          sourceDocument.streamAgentKey ??
          "report-generation",
        streamParagraphIndex: event.currentParagraphIndex ?? sourceDocument.streamParagraphIndex,
        streamParagraphTotal: event.currentParagraphTotal ?? sourceDocument.streamParagraphTotal,
        streamCurrentParagraphId: event.currentParagraphId ?? sourceDocument.streamCurrentParagraphId,
        streamParagraphLabel: event.currentParagraphLabel ?? event.currentSection ?? sourceDocument.streamParagraphLabel,
      });

      const handleBackendEvent = (event: ReviewStreamEvent) => {
        if (cancelled || completed) {
          return;
        }

        const eventKey = event.sequence != null ? `sequence:${event.sequence}` : `${event.type}:${event.stageId}`;
        if (seenBackendEventKeys.has(eventKey)) {
          return;
        }
        seenBackendEventKeys.add(eventKey);
        if (event.sequence != null) {
          lastBackendEventSequence = Math.max(lastBackendEventSequence, event.sequence);
        }

        backendEvents.push(event);
        const stageIndex =
          event.type === "review.complete"
            ? stageOrder.length - 1
            : Math.max(0, stageOrder.indexOf(event.stageId as (typeof stageOrder)[number]));
        latestStageIndex = stageIndex >= 0 ? stageIndex : latestStageIndex;
        setStreamStageIndex(latestStageIndex);

        const snapshot = buildSnapshotFromEvent(event, latestStageIndex);
        setDocuments((currentDocs) => {
          const nextDocuments = updateReviewGenerationRunStage(
            updateReviewTaskStreamStage(
              currentDocs,
              loadingDocId,
              snapshot,
            ),
            loadingDocId,
            snapshot,
          );
          documentsRef.current = nextDocuments;
          return nextDocuments;
        });

        if (event.type === "review.complete") {
          completed = true;
          window.setTimeout(async () => {
            if (cancelled) {
              return;
            }

            let nextDocuments = markReviewTaskReady(
              documentsRef.current,
              loadingDocId,
              snapshot,
            );
            const preparationPackage = normalizeBackendPreparationPackage({
              taskId: loadingDocId,
              recoveredStructure: sourceDocument.recoveredStructure,
              events: backendEvents,
            });
            if (preparationPackage) {
              nextDocuments = updateReviewTaskPreparationPackage(
                nextDocuments,
                loadingDocId,
                preparationPackage,
              );
              const completionEvent = backendEvents.find((item) => item.type === "review.complete");
              const backendDraftDocuments = completionEvent?.draftIssueGeneration
                ? enrichDocumentsWithBackendDraftIssues(
                    nextDocuments,
                    preparationPackage,
                    completionEvent.draftIssueGeneration,
                  )
                : null;
              nextDocuments =
                backendDraftDocuments ??
                (await enrichDocumentsWithGeneratedIssues(
                  nextDocuments,
                  sourceDocument,
                  preparationPackage,
                ));
            }
            finishReady(nextDocuments);
          }, 650);
        }
      };

      const recoverBackendRunEvents = async () => {
        if (!backendRunId || cancelled || completed) {
          return false;
        }

        try {
          const [statusResult, eventsResult] = await Promise.all([
            fetchReviewGenerationRunStatus(backendRunId),
            fetchReviewGenerationRunEvents(backendRunId, lastBackendEventSequence),
          ]);
          if (eventsResult.ok) {
            eventsResult.events.forEach(handleBackendEvent);
          }

          return Boolean(completed || statusResult.status === "ready" || statusResult.status === "degraded");
        } catch {
          return false;
        }
      };

      const fallbackAfterRecoveryAttempt = async () => {
        if (cancelled || completed) {
          return;
        }

        const recovered = await recoverBackendRunEvents();
        if (!recovered && !completed) {
          startReviewPreparation(latestStageIndex, sourceDocument);
        }
      };

      const streamHandlers: ReviewStreamSubscriptionHandlers = {
        onEvent: handleBackendEvent,
        onError: () => {
          void fallbackAfterRecoveryAttempt();
        },
        onTimeout: () => {
          void fallbackAfterRecoveryAttempt();
        },
      };

      try {
        const generationRun = await createReviewGenerationRun({
          taskId: loadingDocId,
          structureSummary,
          paragraphs: sourceDocument.recoveredStructure.paragraphs,
          mode: sourceDocument.mode,
          maxIssues: 6,
        });

        if (!cancelled && generationRun.ok && generationRun.streamUrl) {
          backendRunId = generationRun.runId ?? "";
          streamSubscription = subscribeReviewGenerationRunEvents(
            generationRun.streamUrl,
            streamHandlers,
            12000,
          );
          return;
        }
      } catch {
        // The bridge is optional in this slice; fall through to the existing SSE path.
      }

      streamSubscription = subscribeReviewStreamEvents(
        streamHandlers,
        structureSummary,
        10000,
      );
    };

    const pollOcrJob = async () => {
      const jobId = currentDocument.ocrJob?.jobId;
      if (!jobId) {
        startBackendReviewPreparation(currentDocument);
        return;
      }

      try {
        const jobStatus = await fetchOcrJobStatus(jobId);
        if (cancelled) {
          return;
        }

        if (jobStatus.state === "done") {
          const recoveryResult = jobStatus.resultUrl?.jsonUrl
            ? await hydrateOcrResultStructure({ jsonUrl: jobStatus.resultUrl.jsonUrl })
            : { ok: false, message: "OCR 结果未返回可用的结构化地址。" };

          if (cancelled) {
            return;
          }

          if (!recoveryResult.ok || !recoveryResult.recoveredStructure) {
            const message = recoveryResult.message || "OCR 结果结构化失败。";
            const nextStageIndex = getOcrLoadingStageIndex(jobStatus);
            setStreamStageIndex(nextStageIndex);
            const nextDocuments = updateReviewTaskStreamStage(
              syncDocumentTaskOcrStatus(documentsRef.current, loadingDocId, {
                ...jobStatus,
                state: "failed",
                errorMsg: message,
                message,
              }),
              loadingDocId,
              buildStageSnapshot(nextStageIndex),
            );
            finishFailed(message, nextDocuments);
            return;
          }

          const nextDocuments = syncDocumentTaskOcrStatus(documentsRef.current, loadingDocId, {
            ...jobStatus,
            state: "done",
            recoveredStructure: recoveryResult.recoveredStructure,
          });
          const hydratedDocument = nextDocuments.find((doc) => doc.id === loadingDocId);
          documentsRef.current = nextDocuments;
          setDocuments(nextDocuments);
          startBackendReviewPreparation(hydratedDocument ?? currentDocument);
          return;
        }

        if (jobStatus.state === "failed") {
          const message = jobStatus.errorMsg || jobStatus.message || "OCR 任务失败。";
          const nextStageIndex = getOcrLoadingStageIndex(jobStatus);
          setStreamStageIndex(nextStageIndex);
          const nextDocuments = updateReviewTaskStreamStage(
            syncDocumentTaskOcrStatus(documentsRef.current, loadingDocId, {
              ...jobStatus,
              state: "failed",
              errorMsg: message,
            }),
            loadingDocId,
            buildStageSnapshot(nextStageIndex),
          );
          finishFailed(message, nextDocuments);
          return;
        }

        const nextStageIndex = getOcrLoadingStageIndex(jobStatus);
        setStreamStageIndex(nextStageIndex);
        const nextDocuments = syncDocumentTaskOcrStatus(documentsRef.current, loadingDocId, jobStatus);
        documentsRef.current = nextDocuments;
        setDocuments(nextDocuments);

        timerId = window.setTimeout(pollOcrJob, 1800);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "OCR 状态查询失败，请稍后重试。";
        const nextStageIndex = reviewStreamingStages.length - 1;
        setStreamStageIndex(nextStageIndex);
        const nextDocuments = updateReviewTaskStreamStage(
          syncDocumentTaskOcrStatus(documentsRef.current, loadingDocId, {
            state: "failed",
            errorMsg: message,
            message,
          }),
          loadingDocId,
          buildStageSnapshot(nextStageIndex),
        );
        finishFailed(message, nextDocuments);
      }
    };

    if (currentDocument.status === "parsing") {
      pollOcrJob();
    } else {
      startBackendReviewPreparation(currentDocument);
    }

    return () => {
      cancelled = true;
      stopActiveStreams();
    };
  }, [activePage, loadingDocId]);

  function handleSignIn(nextSession: Session) {
    setSession(nextSession);
    const products = getAccessibleProductPortals(nextSession.role);
    setActiveProduct(products.length === 1 ? products[0].id : null);
    setSelectedDocId(documents[0]?.id ?? "");
    setActivePage("documents");
    setOpeningActivePage("workspace-context");
  }

  function handleLogout() {
    setSession(null);
    setActiveProduct(null);
    setActivePage("documents");
    setOpeningActivePage("workspace-context");
  }

  function selectProduct(productId: ProductPortalId) {
    setActiveProduct(productId);

    if (productId === "construction-plan-review") {
      setActivePage("documents");
      return;
    }

    setOpeningActivePage("workspace-context");
  }

  function getOpeningPilotTaskId(workspaceId: string) {
    return `oc-pilot-${workspaceId}`;
  }

  function applyOpeningPilotTaskToPacket(
    packet: OpeningConditionReviewPacket,
    task: OpeningConditionPilotTask,
  ): OpeningConditionReviewPacket {
    const evidence = task.evidence.length
      ? task.evidence.map((item) => ({
          id: item.id,
          fileName: item.objectRef.fileName,
          locator: item.locator ?? "平台资料包清单",
          extractedValue: item.extractedValue ?? item.objectRef.summary ?? item.objectRef.fileName,
          confidence: item.confidence,
          masterDataId: item.masterDataIds[0],
        }))
      : packet.evidence;
    const humanReviewQueue = task.humanReviewQueue.length
      ? task.humanReviewQueue.map((item) => ({
          id: item.id,
          targetType:
            item.targetType === "master_data"
              ? ("master-data" as const)
              : item.targetType === "check_item"
                ? ("check-item" as const)
                : ("basis" as const),
          targetId: item.targetId,
          trigger: "rule-semantic-conflict" as const,
          reason: `${item.reason}${item.status !== "open" ? `（${item.status}）` : ""}`,
          difyNode: "平台人工复核",
        }))
      : packet.humanReviewQueue;
    const checkItems = task.checkItems.length
      ? task.checkItems.map((item) => ({
          id: item.id,
          category: item.category,
          subCategory: "平台匹配",
          content: item.name,
          mandatory: item.required,
          verdict:
            item.verdict === "needs_human_review" || item.verdict === "blocked"
              ? ("needs-human-review" as const)
              : item.verdict === "pass"
                ? ("pass" as const)
                : item.verdict === "fail"
                  ? ("fail" as const)
                  : ("warning" as const),
          riskLevel: item.verdict === "fail" ? ("high" as const) : item.humanReviewIds.length ? ("medium" as const) : ("low" as const),
          ruleExplanation: item.ruleExplanation,
          semanticNote: item.semanticNote,
          basisVersionId: item.basisVersionId || packet.boundBasisSetVersionId || "",
          masterDataIds: item.masterDataIds,
          evidenceIds: item.evidenceIds,
          humanReviewIds: item.humanReviewIds,
          blockedReason: item.verdict === "blocked" ? "后端试点任务标记该项阻塞。" : undefined,
          rectification: item.humanReviewIds.length ? "请在人工复核页完成裁定。" : "无需整改。",
        }))
      : packet.checkItems;
    const reportSummary = task.reportAsset
      ? {
          title: task.reportAsset.title,
          conclusion: `平台报告已生成：共 ${task.reportAsset.summary.total} 项，符合 ${task.reportAsset.summary.passed} 项，不符合 ${task.reportAsset.summary.failed} 项，待复核 ${task.reportAsset.summary.humanReview} 项。`,
          nextAction: task.state === "archived" ? "任务已归档，可进入报告资产查看。" : "可继续归档或补充导出产物。",
          disclaimer: task.reportAsset.disclaimer,
        }
      : packet.reportSummary;

    return {
      ...packet,
      stage:
        task.state === "archived" || task.state === "report_ready"
          ? "report-ready"
          : task.state === "awaiting_human_review"
            ? "human-review"
            : task.state === "matching" || task.state === "packet_uploaded"
              ? "material-review"
              : packet.stage,
      boundBasisSetVersionId: task.basisVersion?.id ?? packet.boundBasisSetVersionId,
      evidence,
      humanReviewQueue,
      checkItems,
      reportSummary,
    };
  }

  async function legacyAutoRunOpeningPilotWorkspace(workspaceId: string, sourcePacket?: OpeningConditionReviewPacket) {
    const basePacket = sourcePacket ?? getOpeningConditionWorkspacePacket(workspaceId);
    const taskId = getOpeningPilotTaskId(workspaceId);
    setOpeningPilotStatus("正在同步平台试点记录...");

    try {
      for (const basis of basePacket.basisVersions) {
        await upsertOpeningConditionPilotBasis(workspaceId, basis.id, {
          title: basis.title,
          componentType: basis.componentType,
          version: basis.version,
          status:
            basis.status === "published"
              ? "published"
              : basis.status === "confirmed"
                ? "confirmed"
                : basis.status === "rejected"
                  ? "rejected"
                  : "pending_confirmation",
          applicability: basis.applicability,
          confidence: basis.confidence,
          confirmedBy: basis.confirmedBy,
          confirmedAt: basis.confirmedAt,
          publishedAt: basis.publishedAt,
        });
        if (basis.status === "published") {
          await publishOpeningConditionPilotBasis(workspaceId, basis.id, basis.confirmedBy ?? session?.username ?? "pilot-user");
        }
      }

      for (const record of basePacket.masterData) {
        await upsertOpeningConditionPilotMasterData(workspaceId, record.id, {
          type: record.type === "system-document" ? "system_document" : record.type,
          label: record.label,
          normalizedFields: {
            value: record.normalizedValue,
          },
          status:
            record.status === "published"
              ? "published"
              : record.status === "confirmed"
                ? "confirmed"
                : record.status === "rejected"
                  ? "rejected"
                  : "provisional",
          validity: record.validity,
          confidence: record.confidence,
          confirmedBy: record.confirmedBy,
          confirmedAt: record.confirmedAt,
          publishedAt: record.publishedAt,
          safeNote: record.reviewNeededReason,
        });
        if (record.status === "published") {
          await decideOpeningConditionPilotMasterData(workspaceId, record.id, "publish", record.confirmedBy ?? session?.username ?? "pilot-user");
        }
      }

      const publishedBasis = basePacket.basisVersions.find((item) => item.status === "published");
      const publishedMasterData = basePacket.masterData.filter((item) => item.status === "published");
      const upsertResult = await upsertOpeningConditionPilotTask(taskId, {
        context: {
          workspaceId,
          tenantId: basePacket.workspaceContext.tenantName,
          projectId: basePacket.workspaceContext.projectName,
          contractPackageId: basePacket.workspaceContext.contractPackage,
          participatingOrganizationId: basePacket.workspaceContext.participatingOrganization,
        },
        basisVersion: publishedBasis
          ? {
              id: publishedBasis.id,
              workspaceId,
              version: publishedBasis.version,
              status: "published",
              publishedAt: publishedBasis.publishedAt ?? new Date().toISOString(),
            }
          : undefined,
        requiredMasterData: publishedMasterData.map((record) => ({
          id: record.id,
          workspaceId,
          type: record.type === "system-document" ? "system_document" : record.type,
          status: "published",
          label: record.label,
        })),
      });
      if (!upsertResult.ok) {
        throw new Error(upsertResult.message ?? "开工条件试点任务同步失败");
      }

      const sourceObjects = basePacket.evidence.map((item) => ({
        objectId: item.id,
        kind: "source_archive" as const,
        fileName: item.fileName,
        summary: item.extractedValue,
      }));
      const intakeResult = await intakeOpeningConditionPilotPacket(taskId, {
        checklistObject: {
          objectId: `${taskId}-checklist`,
          kind: "checklist",
          fileName: `${basePacket.reviewTarget || "开工条件核查表"}.xlsx`,
          summary: basePacket.reviewTarget,
        },
        sourceObjects,
        submittedBy: session?.username ?? "pilot-user",
      });
      const matchResult = await runOpeningConditionPilotMatch(taskId, basePacket.checkItems.map((item) => ({
        id: item.id,
        name: item.content,
        category: item.category,
        required: item.mandatory,
        expectedEvidenceHints: [item.subCategory, item.content],
        basisVersionId: item.basisVersionId,
        masterDataIds: item.masterDataIds,
      })));
      const task = matchResult.task ?? intakeResult.task ?? upsertResult.task;
      if (task) {
        setOpeningPilotTask(task);
        setOpeningPacket(applyOpeningPilotTaskToPacket(basePacket, task));
      }

      const [basisResult, masterDataResult] = await Promise.all([
        fetchOpeningConditionPilotBasis(workspaceId),
        fetchOpeningConditionPilotMasterData(workspaceId),
      ]);
      setOpeningPilotStatus(
        `平台试点记录已同步 · 依据 ${basisResult.basisVersions?.length ?? 0} · 主数据 ${masterDataResult.masterDataRecords?.length ?? 0}`,
      );
    } catch (error) {
      setOpeningPilotTask(null);
      setOpeningPacket(basePacket);
      setOpeningPilotStatus(error instanceof Error ? `后端试点记录不可用，使用本地演示数据：${error.message}` : "后端试点记录不可用，使用本地演示数据");
    }
  }

  function buildOpeningPilotIntakeRequest(packet: OpeningConditionReviewPacket) {
    const workspace = packet.workspaceContext;
    const publishedBasis = packet.basisVersions.find((basis) => basis.status === "published");
    const publishedMasterData = packet.masterData.filter((record) => record.status === "published");
    const uniqueEvidence = Array.from(new Map(packet.evidence.map((item) => [item.fileName, item])).values());

    return {
      taskId: getOpeningPilotTaskId(packet.workspaceId),
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
      submittedBy: session?.username ?? "pilot-user",
    };
  }

  function buildOpeningPilotChecklistItems(packet: OpeningConditionReviewPacket) {
    return packet.checkItems.map((item) => ({
      id: item.id,
      name: item.content,
      category: item.category,
      required: item.mandatory,
      expectedEvidenceHints: [item.subCategory, item.content].filter(Boolean),
      basisVersionId: item.basisVersionId,
      masterDataIds: item.masterDataIds,
    }));
  }

  async function hydrateOpeningPilotTaskState(
    workspaceId: string,
    basePacket: OpeningConditionReviewPacket,
    options: {
      statusWhenMissing?: string;
      statusPrefix?: string;
    } = {},
  ) {
    const taskId = getOpeningPilotTaskId(workspaceId);
    const taskResult = await fetchOpeningConditionPilotTask(taskId).catch(() => null);

    if (!taskResult?.ok || !taskResult.task) {
      setOpeningPilotTask(null);
      setOpeningPilotReadiness(null);
      setOpeningPacket(basePacket);
      setOpeningPilotStatus(options.statusWhenMissing ?? "试点任务未初始化，可先执行资料包接入。");
      return;
    }

    const readinessResult = await fetchOpeningConditionPilotTaskReadiness(taskId).catch(() => null);
    setOpeningPilotTask(taskResult.task);
    setOpeningPilotReadiness(readinessResult?.ok ? readinessResult : null);
    setOpeningPacket(applyOpeningPilotTaskToPacket(basePacket, taskResult.task));

    const blockingText = readinessResult?.preflightReadiness?.blockingReasons?.length
      ? `阻塞 ${readinessResult.preflightReadiness.blockingReasons.length} 项`
      : "门禁已同步";
    setOpeningPilotStatus(
      `${options.statusPrefix ?? "平台试点记录已同步"} · 状态 ${taskResult.task.state} · ${blockingText}`,
    );
  }

  async function syncOpeningPilotWorkspace(workspaceId: string, sourcePacket?: OpeningConditionReviewPacket) {
    const basePacket = sourcePacket ?? getOpeningConditionWorkspacePacket(workspaceId);
    setOpeningPilotBusy(true);
    setOpeningPilotStatus("正在同步工作区事实和试点任务状态...");

    try {
      for (const basis of basePacket.basisVersions) {
        await upsertOpeningConditionPilotBasis(workspaceId, basis.id, {
          title: basis.title,
          componentType: basis.componentType,
          version: basis.version,
          status:
            basis.status === "published"
              ? "published"
              : basis.status === "confirmed"
                ? "confirmed"
                : basis.status === "rejected"
                  ? "rejected"
                  : "pending_confirmation",
          applicability: basis.applicability,
          confidence: basis.confidence,
          confirmedBy: basis.confirmedBy,
          confirmedAt: basis.confirmedAt,
          publishedAt: basis.publishedAt,
        });
        if (basis.status === "published") {
          await publishOpeningConditionPilotBasis(
            workspaceId,
            basis.id,
            basis.confirmedBy ?? session?.username ?? "pilot-user",
          );
        }
      }

      for (const record of basePacket.masterData) {
        await upsertOpeningConditionPilotMasterData(workspaceId, record.id, {
          type: record.type === "system-document" ? "system_document" : record.type,
          label: record.label,
          normalizedFields: {
            value: record.normalizedValue,
          },
          status:
            record.status === "published"
              ? "published"
              : record.status === "confirmed"
                ? "confirmed"
                : record.status === "rejected"
                  ? "rejected"
                  : "provisional",
          validity: record.validity,
          confidence: record.confidence,
          confirmedBy: record.confirmedBy,
          confirmedAt: record.confirmedAt,
          publishedAt: record.publishedAt,
          safeNote: record.reviewNeededReason,
        });
        if (record.status === "published") {
          await decideOpeningConditionPilotMasterData(
            workspaceId,
            record.id,
            "publish",
            record.confirmedBy ?? session?.username ?? "pilot-user",
          );
        }
      }

      await hydrateOpeningPilotTaskState(workspaceId, basePacket, {
        statusWhenMissing: "工作区事实已同步，试点任务尚未初始化。",
        statusPrefix: "工作区事实和试点任务已同步",
      });
    } catch (error) {
      setOpeningPilotTask(null);
      setOpeningPilotReadiness(null);
      setOpeningPacket(basePacket);
      setOpeningPilotStatus(
        error instanceof Error
          ? `后端试点记录不可用，使用本地演示数据：${error.message}`
          : "后端试点记录不可用，使用本地演示数据",
      );
    } finally {
      setOpeningPilotBusy(false);
    }
  }

  async function refreshOpeningPilotTask(workspaceId = openingWorkspaceId, sourcePacket?: OpeningConditionReviewPacket) {
    const basePacket = sourcePacket ?? openingPacket;
    setOpeningPilotBusy(true);

    try {
      await hydrateOpeningPilotTaskState(workspaceId, basePacket, {
        statusWhenMissing: "试点任务尚未初始化，可先执行资料包接入。",
        statusPrefix: "试点任务已刷新",
      });
    } finally {
      setOpeningPilotBusy(false);
    }
  }

  async function initializeOpeningPilotTask() {
    setOpeningPilotBusy(true);

    try {
      const result = await initializeOpeningConditionPilotIntake(buildOpeningPilotIntakeRequest(openingPacket));
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
      setOpeningPacket((currentPacket) => applyOpeningPilotTaskToPacket(currentPacket, result.task!));
      setOpeningPilotStatus(
        result.preflightReadiness?.blockingReasons?.length
          ? `资料包接入已完成 · 仍有 ${result.preflightReadiness.blockingReasons.length} 项门禁阻塞`
          : "资料包接入已完成，可执行正式核查",
      );
    } catch (error) {
      setOpeningPilotStatus(error instanceof Error ? error.message : "资料包接入初始化失败");
    } finally {
      setOpeningPilotBusy(false);
    }
  }

  async function ensureOpeningDefaultKnowledgeBase() {
    const taskId = getOpeningPilotTaskId(openingWorkspaceId);
    const workspace = openingPacket.workspaceContext;
    setOpeningPilotBusy(true);

    try {
      const knowledgeBaseId = `${openingWorkspaceId}-subcontract-kb`;
      const upserted = await upsertOpeningConditionPilotKnowledgeBase(openingWorkspaceId, knowledgeBaseId, {
        id: knowledgeBaseId,
        workspaceId: openingWorkspaceId,
        organizationId: workspace.participatingOrganization,
        contractPackageId: workspace.contractPackage,
        subcontractTeamId: workspace.participatingOrganization,
        label: `${workspace.participatingOrganization}资料核查知识库`,
        status: "ready",
        summary: "用于试点的分包队伍资料模板、历史证据摘要和人工修正记录。",
      });

      if (!upserted.ok) {
        setOpeningPilotStatus(upserted.message ?? "知识库写入失败");
        return;
      }

      const existingTask = await fetchOpeningConditionPilotTask(taskId).catch(() => null);
      if (existingTask?.ok && existingTask.task) {
        const bound = await bindOpeningConditionPilotKnowledgeBase(taskId, knowledgeBaseId);
        if (!bound.ok) {
          setOpeningPilotStatus(bound.message ?? "知识库绑定失败");
          return;
        }
      }

      await refreshOpeningPilotTask(openingWorkspaceId);
    } catch (error) {
      setOpeningPilotStatus(error instanceof Error ? error.message : "知识库绑定失败");
    } finally {
      setOpeningPilotBusy(false);
    }
  }

  async function runOpeningPilotFormalMatch() {
    const taskId = openingPilotTask?.id ?? getOpeningPilotTaskId(openingWorkspaceId);
    setOpeningPilotBusy(true);

    try {
      const result = await runOpeningConditionPilotMatch(taskId, buildOpeningPilotChecklistItems(openingPacket));
      if (!result.ok || !result.task) {
        setOpeningPilotStatus(result.message ?? "正式核查执行失败");
        return;
      }

      const readinessResult = await fetchOpeningConditionPilotTaskReadiness(taskId).catch(() => null);
      setOpeningPilotTask(result.task);
      setOpeningPilotReadiness(readinessResult?.ok ? readinessResult : openingPilotReadiness);
      setOpeningPacket((currentPacket) => applyOpeningPilotTaskToPacket(currentPacket, result.task!));
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

  function selectOpeningWorkspace(workspaceId: string) {
    setOpeningWorkspaceId(workspaceId);
    const nextPacket = getOpeningConditionWorkspacePacket(workspaceId);
    setOpeningPacket(nextPacket);
    void syncOpeningPilotWorkspace(workspaceId, nextPacket);
  }

  async function confirmOpeningBasis(basisId: string) {
    setOpeningPacket((currentPacket) => ({
      ...currentPacket,
      basisVersions: currentPacket.basisVersions.map((basis) =>
        basis.id === basisId
          ? {
              ...basis,
              status: "confirmed",
              confirmedBy: roleLabels[session?.role ?? "supervisor"],
              confirmedAt: new Date().toISOString(),
              correctionNote: "人工确认依据适用于当前工作区。",
              score: basis.score ?? 90,
            }
          : basis,
      ),
    }));
    const basis = openingPacket.basisVersions.find((item) => item.id === basisId);
    if (basis) {
      await upsertOpeningConditionPilotBasis(openingWorkspaceId, basisId, {
        title: basis.title,
        componentType: basis.componentType,
        version: basis.version,
        status: "confirmed",
        applicability: basis.applicability,
        confidence: basis.confidence,
        confirmedBy: roleLabels[session?.role ?? "supervisor"],
        confirmedAt: new Date().toISOString(),
      }).catch(() => undefined);
      void syncOpeningPilotWorkspace(openingWorkspaceId);
    }
  }

  async function publishOpeningBasis(basisId: string) {
    setOpeningPacket((currentPacket) => ({
      ...currentPacket,
      boundBasisSetVersionId: basisId,
      workspaceContext: {
        ...currentPacket.workspaceContext,
        activeBasisSetVersionId: basisId,
      },
      basisVersions: currentPacket.basisVersions.map((basis) =>
        basis.id === basisId
          ? {
              ...basis,
              status: "published",
              publishedAt: new Date().toISOString(),
            }
          : basis,
      ),
    }));
    const result = await publishOpeningConditionPilotBasis(
      openingWorkspaceId,
      basisId,
      session?.username ?? roleLabels[session?.role ?? "supervisor"],
    ).catch(() => null);
    if (result?.ok) {
      void syncOpeningPilotWorkspace(openingWorkspaceId);
    }
  }

  async function confirmOpeningMasterData(recordId: string) {
    setOpeningPacket((currentPacket) => ({
      ...currentPacket,
      masterData: currentPacket.masterData.map((record) =>
        record.id === recordId
          ? {
              ...record,
              status: "confirmed",
              confirmedBy: roleLabels[session?.role ?? "supervisor"],
              confirmedAt: new Date().toISOString(),
              correctionNote: "人工确认字段与证据匹配。",
              score: record.score ?? 90,
            }
          : record,
      ),
    }));
    const record = openingPacket.masterData.find((item) => item.id === recordId);
    if (record) {
      await upsertOpeningConditionPilotMasterData(openingWorkspaceId, recordId, {
        type: record.type === "system-document" ? "system_document" : record.type,
        label: record.label,
        normalizedFields: {
          value: record.normalizedValue,
        },
        status: "confirmed",
        validity: record.validity,
        confidence: record.confidence,
        confirmedBy: roleLabels[session?.role ?? "supervisor"],
        confirmedAt: new Date().toISOString(),
      }).catch(() => undefined);
      void syncOpeningPilotWorkspace(openingWorkspaceId);
    }
  }

  async function rejectOpeningMasterData(recordId: string) {
    setOpeningPacket((currentPacket) => {
      const masterData = currentPacket.masterData.map((record) =>
        record.id === recordId
          ? {
              ...record,
              status: "rejected" as const,
              reviewNeededReason: "人工驳回该临时抽取记录，不纳入正式主数据。",
            }
          : record,
      );

      return {
        ...currentPacket,
        masterData,
        masterDataReadiness: getOpeningConditionMasterDataReadiness(masterData),
      };
    });
    await decideOpeningConditionPilotMasterData(
      openingWorkspaceId,
      recordId,
      "reject",
      session?.username ?? "pilot-user",
      "人工驳回该临时抽取记录，不纳入正式主数据。",
    ).catch(() => undefined);
    void syncOpeningPilotWorkspace(openingWorkspaceId);
  }

  async function publishOpeningMasterData(recordId: string) {
    setOpeningPacket((currentPacket) => {
      const masterData = currentPacket.masterData.map((record) =>
        record.id === recordId
          ? {
              ...record,
              status: "published" as const,
              publishedAt: new Date().toISOString(),
            }
          : record,
      );

      return {
        ...currentPacket,
        masterData,
        masterDataReadiness: getOpeningConditionMasterDataReadiness(masterData),
      };
    });
    await decideOpeningConditionPilotMasterData(
      openingWorkspaceId,
      recordId,
      "publish",
      session?.username ?? "pilot-user",
      "人工确认并发布为试点主数据。",
    ).catch(() => undefined);
    void syncOpeningPilotWorkspace(openingWorkspaceId);
  }

  async function decideOpeningHumanReviewItem(
    reviewId: string,
    decision: "confirm" | "correct" | "reject" | "defer",
  ) {
    const taskId = openingPilotTask?.id ?? getOpeningPilotTaskId(openingWorkspaceId);
    const result = await decideOpeningConditionPilotHumanReview(
      taskId,
      reviewId,
      decision,
      session?.username ?? "pilot-user",
      "人工复核决策来自开工条件门户。",
    ).catch(() => null);

    if (result?.task) {
      setOpeningPilotTask(result.task);
      setOpeningPacket((currentPacket) => applyOpeningPilotTaskToPacket(currentPacket, result.task!));
      setOpeningPilotStatus(`人工复核已同步 · 阻塞项 ${result.blockingCount ?? 0}`);
      return;
    }

    const refreshed = await fetchOpeningConditionPilotHumanReview(taskId).catch(() => null);
    setOpeningPilotStatus(refreshed?.ok ? `人工复核队列已刷新 · 阻塞项 ${refreshed.blockingCount ?? 0}` : "人工复核后端同步失败，保留本地展示");
  }

  async function generateOpeningReport() {
    const taskId = openingPilotTask?.id ?? getOpeningPilotTaskId(openingWorkspaceId);
    const result = await generateOpeningConditionPilotReport(taskId, {
      objectId: `${taskId}-report`,
      kind: "report",
      fileName: "开工条件核查内部辅助意见.md",
      summary: "平台生成的内部辅助报告摘要。",
    }).catch(() => null);

    if (result?.task) {
      setOpeningPilotTask(result.task);
      setOpeningPacket((currentPacket) => applyOpeningPilotTaskToPacket(currentPacket, result.task!));
      setOpeningPilotStatus("内部辅助报告已由后端生成");
      return;
    }

    setOpeningPilotStatus(result?.message ?? "报告生成失败，请先处理阻塞人工复核项");
  }

  async function archiveOpeningReportTask() {
    const taskId = openingPilotTask?.id ?? getOpeningPilotTaskId(openingWorkspaceId);
    const result = await archiveOpeningConditionPilotTask(taskId).catch(() => null);

    if (result?.task) {
      setOpeningPilotTask(result.task);
      setOpeningPacket((currentPacket) => applyOpeningPilotTaskToPacket(currentPacket, result.task!));
      setOpeningPilotStatus("开工条件核查试点任务已归档");
      return;
    }

    setOpeningPilotStatus(result?.message ?? "任务归档失败，请先生成报告资产");
  }

  function returnToProductLauncher() {
    setActiveProduct(null);
    setActivePage("documents");
    setLoadingDocId(null);
    setOpeningActivePage("workspace-context");
  }

  function toggleTheme() {
    setThemeMode((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
  }

  function createUploadedTask(input: Parameters<typeof createDocumentTask>[1]) {
    const nextDocuments = createDocumentTask(documents, {
      ...input,
      uploader: session?.username ?? "当前用户",
      mode: session?.role === "contractor" ? "revise" : "review",
    });
    const newDoc = nextDocuments[0];

    setDocuments(nextDocuments);
    setSelectedDocId(newDoc.id);
    setUploadDraft({ name: "", project: "" });
    setDocumentUploadError("");
  }

  function handleManualUpload(name: string, project: string) {
    createUploadedTask({
      name,
      project,
      uploader: session?.username ?? "当前用户",
      mode: session?.role === "contractor" ? "revise" : "review",
    });
  }

  function handleFileSelect(file: File) {
    setStagedFile(file);
    setDocumentUploadError("");
    setUploadDraft((currentDraft) => ({
      ...currentDraft,
      name: currentDraft.name.trim() ? currentDraft.name : file.name,
    }));
  }

  function clearStagedFile() {
    setStagedFile(null);
    setDocumentUploadError("");
  }

  async function handleAddDocument() {
    if (!stagedFile) {
      const name = uploadDraft.name.trim() || `演示文档_${Date.now()}.pdf`;
      const project = uploadDraft.project.trim() || "未知项目";
      handleManualUpload(name, project);
      return;
    }

    setUploadingDocument(true);
    setDocumentUploadError("");
    const taskName = uploadDraft.name.trim() || stagedFile.name;
    const taskProject = uploadDraft.project.trim() || "未知项目";

    try {
      const uploadResult = await uploadMinioDocument(stagedFile);
      if (!uploadResult.ok || !uploadResult.object) {
        const message = uploadResult.message || "文件上传到对象存储失败。";
        setDocumentUploadError(message);
        return;
      }

      const ocrResult = await submitStoredObjectOcrJob(uploadResult.object.key);
      const ocrSubmittedAt = new Date().toISOString();
      const ocrJob = {
        jobId: ocrResult.jobId ?? null,
        state: ocrResult.ok && ocrResult.jobId ? "submitted" : "failed",
        submittedAt: ocrSubmittedAt,
        sourceObjectKey: uploadResult.object.key,
        message: ocrResult.ok
          ? ocrResult.status || "OCR 任务已提交。"
          : ocrResult.message || ocrResult.status || "OCR 任务提交失败。",
      } as const;

      createUploadedTask({
        name: taskName,
        project: taskProject,
        uploader: session?.username ?? "当前用户",
        mode: session?.role === "contractor" ? "revise" : "review",
        status: ocrResult.ok && ocrResult.jobId ? "parsing" : "failed",
        sourceObject: uploadResult.object,
        ocrJob,
        failure: ocrJob.state === "failed"
          ? { message: ocrJob.message || "OCR 任务提交失败。", failedAt: new Date().toISOString() }
          : undefined,
      });
      setStagedFile(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "文件上传到对象存储失败。";
      setDocumentUploadError(message);
    } finally {
      setUploadingDocument(false);
    }
  }

  function requestDeleteDocument(documentId: string) {
    setDeleteTargetId(documentId);
  }

  function cancelDeleteDocument() {
    setDeleteTargetId(null);
  }

  function confirmDeleteDocument() {
    if (!deleteTargetId) {
      return;
    }

    const nextDocuments = deleteDocumentTask(documents, deleteTargetId);
    setDocuments(nextDocuments);
    if (selectedDocId === deleteTargetId) {
      setSelectedDocId(nextDocuments[0]?.id ?? "");
      setActivePage("documents");
    }
    setDeleteTargetId(null);
  }

  function startReview(documentId: string) {
    setSelectedDocId(documentId);
    setLoadingDocId(documentId);
    setStreamStageIndex(0);
    setDocuments((currentDocs) => startReviewGenerationRun(startReviewTask(currentDocs, documentId), documentId));
    setActivePage("review-loading");
  }

  function openDocument(documentId: string) {
    const doc = documents.find((item) => item.id === documentId);
    if (!doc) {
      return;
    }

    const lifecycle = getReviewTaskOrchestrationSnapshot(doc);
    setSelectedDocId(documentId);

    if (lifecycle.entryTarget === "result" || doc.resultAsset) {
      setActivePage("review-result");
      return;
    }

    if (lifecycle.entryTarget === "detail") {
      setActivePage("review-detail");
      return;
    }

    if (lifecycle.entryTarget === "loading" && doc.status === "uploaded") {
      startReview(documentId);
      return;
    }

    if (doc.status === "parsing" || lifecycle.phase === "ocr-processing") {
      setLoadingDocId(documentId);
      setStreamStageIndex(0);
      setActivePage("review-loading");
      return;
    }

    if (doc.status === "reviewing" || lifecycle.phase === "review-preparation") {
      setLoadingDocId(documentId);
      setStreamStageIndex(doc.pipelineSnapshot?.stageIndex ?? doc.streamStageIndex);
      setActivePage("review-loading");
      return;
    }

  }

  function openResult(documentId: string) {
    const doc = documents.find((item) => item.id === documentId);
    if (!doc?.resultAsset) {
      openDocument(documentId);
      return;
    }

    setSelectedDocId(documentId);
    setActivePage("review-result");
  }

  async function completeReview(payload: ReviewCompletionPayload) {
    if (!selectedDocument) {
      return;
    }

    const { tasks } = completeReviewTask(documents, selectedDocument.id, payload);

    setDocuments(tasks);
    setSelectedDocId(selectedDocument.id);
    setActivePage("review-result");

    try {
      const result = await completePersistedReviewTask({
        taskId: selectedDocument.id,
        mode: payload.mode,
      });
      if (result.ok && result.task) {
        replaceDocumentFromBackend(result.task);
      }
    } catch {
      // Keep the existing local completion fallback when the backend is unavailable.
    }
  }

  async function updateSelectedIssueResolution(
    issueId: string,
    status: "accepted" | "rejected",
    editedText: string,
  ) {
    if (!selectedDocument) {
      return;
    }

    setDocuments((currentDocs) =>
      resolveTaskIssue(currentDocs, selectedDocument.id, issueId, status, editedText),
    );

    try {
      const result = await resolvePersistedReviewTaskIssue({
        taskId: selectedDocument.id,
        issueId,
        status,
        editedText,
      });
      if (result.ok && result.task) {
        replaceDocumentFromBackend(result.task);
      }
    } catch {
      // Local issue resolution remains the MVP fallback path.
    }
  }

  async function updateSelectedIssueDraft(issueId: string, suggestion: string) {
    if (!selectedDocument) {
      return;
    }

    setDocuments((currentDocs) =>
      updateTaskIssueDraft(currentDocs, selectedDocument.id, issueId, suggestion),
    );

    try {
      const result = await updatePersistedReviewTaskIssueDraft({
        taskId: selectedDocument.id,
        issueId,
        suggestion,
      });
      if (result.ok && result.task) {
        replaceDocumentFromBackend(result.task);
      }
    } catch {
      // Draft edits stay local when the backend is not reachable.
    }
  }

  async function addSelectedManualIssue(issue: Parameters<typeof addManualTaskIssue>[2]) {
    if (!selectedDocument) {
      return;
    }

    setDocuments((currentDocs) => addManualTaskIssue(currentDocs, selectedDocument.id, issue));

    try {
      const result = await addPersistedManualReviewTaskIssue({
        taskId: selectedDocument.id,
        issue,
      });
      if (result.ok && result.task) {
        replaceDocumentFromBackend(result.task);
      }
    } catch {
      // Manual issue creation keeps the local fallback path.
    }
  }

  async function deleteSelectedManualIssue(issueId: string) {
    if (!selectedDocument) {
      return;
    }

    setDocuments((currentDocs) =>
      deleteManualTaskIssue(currentDocs, selectedDocument.id, issueId),
    );

    try {
      const result = await deletePersistedManualReviewTaskIssue({
        taskId: selectedDocument.id,
        issueId,
      });
      if (result.ok && result.task) {
        replaceDocumentFromBackend(result.task);
      }
    } catch {
      // Deletion remains local when backend persistence is unavailable.
    }
  }

  function updateSelectedViewContext(context: {
    activeSectionTitle?: string;
    activeParagraphId?: string;
    activeIssueId?: string;
  }) {
    if (!selectedDocument) {
      return;
    }

    setDocuments((currentDocs) =>
      updateReviewTaskViewContext(currentDocs, selectedDocument.id, context),
    );
  }

  if (!session) {
    return <LoginPage onSignIn={handleSignIn} themeMode={themeMode} onToggleTheme={toggleTheme} />;
  }

  if (!activeProduct) {
    return (
      <ProductLauncherPage
        entries={accessibleProducts}
        roleLabel={roleLabels[session.role]}
        username={session.username}
        themeMode={themeMode}
        onToggleTheme={toggleTheme}
        onSelectProduct={selectProduct}
        onLogout={handleLogout}
      />
    );
  }

  if (activeProduct === "opening-condition-review") {
    const openingNavItems: Array<{
      page: OpeningConditionPortalPage;
      icon: typeof LayoutDashboard;
    }> = [
      { page: "workspace-context", icon: FolderKanban },
      { page: "basis-sets", icon: BookOpen },
      { page: "master-data", icon: Database },
      { page: "check-tasks", icon: ClipboardCheck },
      { page: "human-review", icon: ListChecks },
      { page: "reports", icon: FileCheck2 },
    ];

    return (
      <div className="platform-shell opening-portal-shell">
        <aside className="shell-sidebar">
          <div className="shell-brand">
            <div className="shell-brand-mark">OC</div>
            <div>
              <strong>开工条件核查</strong>
              <span>{activeProductContext?.routeNamespace}</span>
            </div>
          </div>

          <nav className="shell-nav" aria-label="开工条件核查导航">
            {openingNavItems.map((item) => (
              <NavButton
                key={item.page}
                icon={item.icon}
                label={openingConditionPortalPageLabels[item.page]}
                active={openingActivePage === item.page}
                onClick={() => setOpeningActivePage(item.page)}
              />
            ))}
          </nav>

          <div className="shell-sidebar-foot">
            <div className="shell-role-card">
              <span className="eyebrow">当前门户</span>
              <strong>{roleLabels[session.role]}</strong>
              <p>{session.username}</p>
            </div>
            <button type="button" className="shell-logout" onClick={returnToProductLauncher}>
              <GitCompareArrows size={16} />
              返回产品入口
            </button>
            <button type="button" className="shell-logout" onClick={handleLogout}>
              <LogOut size={16} />
              退出登录
            </button>
          </div>
        </aside>

        <section className="shell-main">
          <header className="shell-topbar">
            <div>
              <span className="eyebrow">开工条件核查门户</span>
              <h1>{openingConditionPortalPageLabels[openingActivePage]}</h1>
            </div>
            <div className="shell-topbar-actions">
              <button type="button" className="theme-toggle" onClick={toggleTheme}>
                <SunMoon size={16} />
                {themeMode === "light" ? "深色主题" : "浅色主题"}
              </button>
              <span className="shell-role-pill">
                <Users size={14} />
                {roleLabels[session.role]}
              </span>
              <span className="shell-role-pill muted">
                <GitCompareArrows size={14} />
                独立业务上下文
              </span>
              <span className="shell-role-pill muted">
                <ClipboardCheck size={14} />
                {openingPilotStatus}
              </span>
            </div>
          </header>

          <div className="shell-content">
            {openingActivePage === "workspace-context" && (
              <OpeningConditionWorkspacePage
                workspaces={openingConditionWorkspaces}
                selectedWorkspaceId={openingWorkspaceId}
                onSelectWorkspace={selectOpeningWorkspace}
              />
            )}
            {openingActivePage === "basis-sets" && (
              <OpeningConditionBasisPage
                packet={openingPacket}
                onConfirmBasis={confirmOpeningBasis}
                onPublishBasis={publishOpeningBasis}
              />
            )}
            {openingActivePage === "master-data" && (
              <OpeningConditionMasterDataPage
                packet={openingPacket}
                onConfirmRecord={confirmOpeningMasterData}
                onRejectRecord={rejectOpeningMasterData}
                onPublishRecord={publishOpeningMasterData}
              />
            )}
            {openingActivePage === "check-tasks" && (
              <OpeningConditionReviewPage
                roleLabel={roleLabels[session.role]}
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
            )}
            {openingActivePage === "human-review" && (
              <OpeningConditionHumanReviewPage
                packet={openingPacket}
                pilotTask={openingPilotTask}
                onReviewDecision={decideOpeningHumanReviewItem}
              />
            )}
            {openingActivePage === "reports" && (
              <OpeningConditionReportsPage
                packet={openingPacket}
                pilotTask={openingPilotTask}
                onGenerateReport={generateOpeningReport}
                onArchive={archiveOpeningReportTask}
              />
            )}
          </div>
        </section>
      </div>
    );
  }

  if (activePage === "review-detail" && selectedDocument) {
    return (
      <ReviewWorkbenchPage
        allowedModes={allowedModes}
        roleLabel={roleLabels[session.role]}
        documentName={selectedDocument.name}
        projectName={selectedDocument.project}
        onBack={() => setActivePage("documents")}
        themeMode={themeMode}
        onToggleTheme={toggleTheme}
        onComplete={completeReview}
        sessionSnapshot={selectedDocumentSession ?? undefined}
        paragraphs={selectedDocumentSession?.paragraphs ?? selectedDocument.paragraphs}
        initialIssues={selectedDocumentSession?.issues ?? selectedDocument.issues}
        recoveredStructure={selectedDocument.recoveredStructure}
        onIssueResolve={updateSelectedIssueResolution}
        onIssueDraftChange={updateSelectedIssueDraft}
        onManualIssueAdd={addSelectedManualIssue}
        onManualIssueDelete={deleteSelectedManualIssue}
        onViewContextChange={updateSelectedViewContext}
      />
    );
  }

  if (activePage === "review-result" && selectedDocument) {
    return (
      <ResultPreviewPage
        document={selectedDocument}
        sessionSnapshot={selectedDocumentSession ?? undefined}
        onBack={() => setActivePage("documents")}
        onOpenWorkbench={() => {
          setSelectedDocId(selectedDocument.id);
          setActivePage("review-detail");
        }}
        themeMode={themeMode}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <div className="platform-shell">
      <aside className="shell-sidebar">
        <div className="shell-brand">
          <div className="shell-brand-mark">AI</div>
          <div>
            <strong>施工审查平台</strong>
            <span>{activeProductContext?.routeNamespace}</span>
          </div>
        </div>

        <nav className="shell-nav" aria-label="主导航">
          <NavButton
            icon={LayoutDashboard}
            label={pageLabels.documents}
            active={activePage === "documents"}
            onClick={() => setActivePage("documents")}
          />
          <NavButton
            icon={BookOpen}
            label={pageLabels["knowledge-base"]}
            active={activePage === "knowledge-base"}
            onClick={() => setActivePage("knowledge-base")}
          />
          <NavButton
            icon={Database}
            label={pageLabels["data-assets"]}
            active={activePage === "data-assets"}
            onClick={() => setActivePage("data-assets")}
          />
        </nav>

        <div className="shell-sidebar-foot">
          <div className="shell-role-card">
            <span className="eyebrow">当前角色</span>
            <strong>{roleLabels[session.role]}</strong>
            <p>{session.username}</p>
          </div>
          <button type="button" className="shell-logout" onClick={handleLogout}>
            <LogOut size={16} />
            退出登录
          </button>
          <button type="button" className="shell-logout" onClick={returnToProductLauncher}>
            <GitCompareArrows size={16} />
            返回产品入口
          </button>
        </div>
      </aside>

      <section className="shell-main">
        <header className="shell-topbar">
          <div>
            <span className="eyebrow">默认入口</span>
            <h1>
              {
                pageLabels[
                  activePage as Exclude<
                    ShellPage,
                    "review-loading" | "review-detail" | "review-result"
                  >
                ]
              }
            </h1>
          </div>
          <div className="shell-topbar-actions">
            <button type="button" className="theme-toggle" onClick={toggleTheme}>
              <SunMoon size={16} />
              {themeMode === "light" ? "深色主题" : "浅色主题"}
            </button>
            <span className="shell-role-pill">
              <Users size={14} />
              {roleLabels[session.role]}
            </span>
            <span className="shell-role-pill muted">
              <GitCompareArrows size={14} />
              {allowedModes.length === 2 ? "双模式可用" : `${modeName(allowedModes[0])} 可用`}
            </span>
          </div>
        </header>

        <div className="shell-content">
          {activePage === "documents" && (
            <DocumentLibraryPage
              documents={documents}
              uploadDraft={uploadDraft}
              stagedFile={stagedFile}
              dragging={dragging}
              onUploadDraftChange={setUploadDraft}
              onAddDocument={handleAddDocument}
              onFileSelect={handleFileSelect}
              onStagedFileRemove={clearStagedFile}
              onDragChange={setDragging}
              uploading={uploadingDocument}
              uploadError={documentUploadError}
              onStartReview={startReview}
              onOpenDocument={openDocument}
              onOpenResult={openResult}
              onDeleteDocument={requestDeleteDocument}
            />
          )}

          {activePage === "knowledge-base" && <KnowledgeBasePage />}

          {activePage === "data-assets" && (
            <DataAssetsPage role={session.role} onOpenDocument={() => setActivePage("documents")} />
          )}

          {activePage === "review-loading" && (
            <ReviewLoadingPage
              document={selectedDocument}
              roleLabel={roleLabels[session.role]}
              statusLabel={statusLabels[selectedDocument?.status ?? "uploaded"]}
              stage={loadingStages[streamStageIndex] ?? loadingStages[0]}
              stages={loadingStages}
              stageIndex={streamStageIndex}
            />
          )}
        </div>
      </section>
      {deleteTargetDocument && (
        <div className="dialog-backdrop" role="presentation">
          <section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-doc-title">
            <span className="eyebrow">删除文档</span>
            <h2 id="delete-doc-title">确认删除该文档？</h2>
            <p>
              {deleteTargetDocument.name} 将从当前文档库和本地 mock 记录中移除。该操作不会删除已经上传到
              MinIO 的源文件对象。
            </p>
            <div className="dialog-actions">
              <button type="button" onClick={cancelDeleteDocument}>
                取消
              </button>
              <button type="button" className="danger" onClick={confirmDeleteDocument}>
                确认删除
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
