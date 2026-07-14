import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Database,
  GitCompareArrows,
  LayoutDashboard,
  LogOut,
  SunMoon,
  Users,
} from "lucide-react";
import {
  DataAssetsPage,
  DocumentLibraryPage,
  KnowledgeBasePage,
  LoginPage,
  ResultPreviewPage,
  ReviewLoadingPage,
} from "./appShellPages";
import {
  getInitialTheme,
  getOcrLoadingStageIndex,
  modeName,
  pageLabels,
  statusLabels,
  NavButton,
} from "./appShellDisplay";
import { roleLabels, roleModes } from "./appShellTypes";
import type { LibraryDocument, Session, ShellPage, StreamingStage, ThemeMode, UploadDraft } from "./appShellTypes";
import { ReviewWorkbenchPage } from "./ReviewWorkbenchPage";
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
  addPersistedManualReviewTaskIssue,
  completePersistedReviewTask,
  createReviewGenerationRun,
  deletePersistedManualReviewTaskIssue,
  fetchReviewGenerationRunEvents,
  fetchReviewGenerationRunStatus,
  hydrateOcrResultStructure,
  fetchOcrJobStatus,
  requestDraftIssueGeneration,
  resolvePersistedReviewTaskIssue,
  subscribeReviewGenerationRunEvents,
  subscribeReviewStreamEvents,
  submitStoredObjectOcrJob,
  updatePersistedReviewTaskIssueDraft,
  uploadMinioDocument,
} from "./domain/backendConnectivity";

export function App() {
  const initialTasks = useMemo(() => listReviewTasks(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [activePage, setActivePage] = useState<ShellPage>("documents");
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
    setSelectedDocId(documents[0]?.id ?? "");
    setActivePage("documents");
  }

  function handleLogout() {
    setSession(null);
    setActivePage("documents");
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
            <span>企业审查工作台</span>
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
