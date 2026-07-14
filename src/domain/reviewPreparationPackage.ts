import type { ReviewStreamEvent } from "./backendConnectivity";
import type {
  RecoveredDocumentStructure,
  ReviewAgentKey,
  ReviewPipelineStageType,
  ReviewPreparationPackage,
  ReviewPreparationPackageSource,
  ReviewPreparationPackageStatus,
  ReviewPreparationProviderSummary,
  ReviewPreparationStructureSummary,
  ReviewStreamingStage,
} from "./reviewTypes";

function collectIssueSummaries(stages: ReviewStreamingStage[]) {
  return Array.from(new Set(stages.flatMap((stage) => stage.issueSummaries)));
}

export function createPreparationStructureSummary(
  recoveredStructure: RecoveredDocumentStructure | undefined,
): ReviewPreparationStructureSummary | null {
  if (!recoveredStructure || recoveredStructure.paragraphs.length === 0) {
    return null;
  }

  const currentParagraphId =
    recoveredStructure.progress.currentParagraphId ?? recoveredStructure.paragraphs[0]?.id;
  const currentParagraphIndex = recoveredStructure.paragraphs.findIndex(
    (paragraph) => paragraph.id === currentParagraphId,
  );
  const currentParagraph =
    recoveredStructure.paragraphs[currentParagraphIndex >= 0 ? currentParagraphIndex : 0];

  return {
    sectionCount: recoveredStructure.sections.length,
    paragraphCount: recoveredStructure.paragraphs.length,
    currentSection:
      recoveredStructure.progress.currentSection ?? currentParagraph?.section,
    currentParagraphId,
    currentParagraphLabel:
      currentParagraph?.section ?? recoveredStructure.progress.currentSection,
    currentParagraphIndex: currentParagraphIndex >= 0 ? currentParagraphIndex + 1 : 1,
    currentParagraphTotal: recoveredStructure.paragraphs.length,
    sourceFormat: recoveredStructure.sourceFormat,
  };
}

export function createPackageId(taskId: string, source: ReviewPreparationPackageSource) {
  return `${taskId}-${source}-${Date.now()}`;
}

export function mapReviewStreamEventToStage(event: ReviewStreamEvent): ReviewStreamingStage {
  return {
    id: event.stageId,
    stageType: event.stageType as ReviewPipelineStageType | undefined,
    title: event.title,
    detail: event.detail,
    progress: event.progress,
    agentKey: event.agentKey as ReviewAgentKey | undefined,
    agentLabel: event.agentLabel,
    currentParagraphId: event.currentParagraphId,
    currentParagraphIndex: event.currentParagraphIndex,
    currentParagraphTotal: event.currentParagraphTotal,
    currentParagraphLabel: event.currentParagraphLabel,
    currentSection: event.currentSection,
    outlineItems: [],
    documentSnippets: [],
    issueSummaries: event.issueSummaries ?? [],
  };
}

export function createReviewPreparationPackage(input: {
  taskId: string;
  packageId?: string;
  source: ReviewPreparationPackageSource;
  status: ReviewPreparationPackageStatus;
  structureSummary: ReviewPreparationStructureSummary;
  stages: ReviewStreamingStage[];
  providerSummary?: ReviewPreparationProviderSummary;
  message?: string;
  completedAt?: string;
}): ReviewPreparationPackage {
  const completedAt = input.completedAt ?? new Date().toISOString();

  return {
    packageId: input.packageId ?? createPackageId(input.taskId, input.source),
    source: input.source,
    status: input.status,
    createdAt: completedAt,
    completedAt,
    structureSummary: input.structureSummary,
    stageEvents: input.stages,
    issueSummaries: collectIssueSummaries(input.stages),
    providerSummary: input.providerSummary,
    message: input.message,
  };
}

export function createLocalFallbackPreparationPackage(input: {
  taskId: string;
  recoveredStructure: RecoveredDocumentStructure | undefined;
  stages: ReviewStreamingStage[];
  message?: string;
}) {
  const structureSummary = createPreparationStructureSummary(input.recoveredStructure);
  if (!structureSummary) {
    return null;
  }

  return createReviewPreparationPackage({
    taskId: input.taskId,
    source: "local-fallback",
    status: "fallback",
    structureSummary,
    stages: input.stages,
    message: input.message ?? "Backend review preparation stream unavailable; using local stages.",
  });
}

export function normalizeBackendPreparationPackage(input: {
  taskId: string;
  recoveredStructure: RecoveredDocumentStructure | undefined;
  events: ReviewStreamEvent[];
}) {
  const structureSummary = createPreparationStructureSummary(input.recoveredStructure);
  if (!structureSummary) {
    return null;
  }

  const stageEvents = input.events
    .filter((event) => event.type !== "review.connection")
    .map(mapReviewStreamEventToStage);
  const completionEvent = input.events.find((event) => event.type === "review.complete");

  if (stageEvents.length === 0) {
    return null;
  }

  return createReviewPreparationPackage({
    taskId: input.taskId,
    packageId: completionEvent?.preparationPackage?.packageId,
    source: completionEvent?.preparationPackage?.source ?? "backend-sse",
    status: completionEvent?.preparationPackage?.status ?? "ready",
    structureSummary,
    stages: stageEvents,
    providerSummary: completionEvent?.preparationPackage?.providerSummary,
    message: completionEvent?.preparationPackage?.message ?? completionEvent?.detail,
    completedAt: completionEvent?.completedAt,
  });
}
