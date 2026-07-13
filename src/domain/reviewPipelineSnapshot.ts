import type {
  ReviewAgentKey,
  ReviewPipelineSnapshot,
  ReviewPipelineStageType,
  ReviewTask,
} from "./reviewTypes";

export interface ReviewPipelineSnapshotInput {
  stageIndex: number;
  stageType?: ReviewPipelineStageType;
  agentKey?: ReviewAgentKey;
  paragraphIndex?: number;
  paragraphTotal?: number;
  currentParagraphId?: string;
  paragraphLabel?: string;
  currentSection?: string;
  updatedAt?: string;
}

function normalizeIndex(value: number | undefined, fallback: number) {
  return Number.isFinite(value) && value != null && value >= 0 ? Math.floor(value) : fallback;
}

function normalizeText(value: string | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function createReviewPipelineSnapshot(
  input: ReviewPipelineSnapshotInput,
): ReviewPipelineSnapshot {
  return {
    stageIndex: normalizeIndex(input.stageIndex, 0),
    stageType: input.stageType,
    agentKey: input.agentKey,
    paragraphIndex: normalizeIndex(input.paragraphIndex, 0) || undefined,
    paragraphTotal: normalizeIndex(input.paragraphTotal, 0) || undefined,
    currentParagraphId: normalizeText(input.currentParagraphId),
    paragraphLabel: normalizeText(input.paragraphLabel),
    currentSection: normalizeText(input.currentSection),
    updatedAt: input.updatedAt ?? new Date().toISOString(),
  };
}

export function deriveReviewPipelineSnapshot(
  task: Pick<
    ReviewTask,
    | "status"
    | "updatedAt"
    | "pipelineSnapshot"
    | "streamStageIndex"
    | "streamStageType"
    | "streamAgentKey"
    | "streamParagraphIndex"
    | "streamParagraphTotal"
    | "streamCurrentParagraphId"
    | "streamParagraphLabel"
    | "recoveredStructure"
    | "paragraphs"
  >,
): ReviewPipelineSnapshot | undefined {
  if (task.pipelineSnapshot) {
    return task.pipelineSnapshot;
  }

  const hasLoadingContext =
    task.status === "parsing" ||
    task.status === "reviewing" ||
    task.status === "ready" ||
    typeof task.streamStageType !== "undefined" ||
    typeof task.streamAgentKey !== "undefined" ||
    typeof task.streamParagraphIndex !== "undefined" ||
    typeof task.streamParagraphTotal !== "undefined" ||
    typeof task.streamCurrentParagraphId !== "undefined" ||
    typeof task.streamParagraphLabel !== "undefined" ||
    Boolean(task.recoveredStructure);

  if (!hasLoadingContext) {
    return undefined;
  }

  const paragraphTotal =
    task.streamParagraphTotal ??
    task.recoveredStructure?.paragraphs.length ??
    task.paragraphs.length;
  const currentParagraphId =
    task.streamCurrentParagraphId ??
    task.recoveredStructure?.progress.currentParagraphId ??
    task.paragraphs[0]?.id;
  const currentSection =
    task.streamParagraphLabel ??
    task.recoveredStructure?.progress.currentSection ??
    task.paragraphs[0]?.section;

  return createReviewPipelineSnapshot({
    stageIndex: task.streamStageIndex ?? 0,
    stageType: task.streamStageType,
    agentKey: task.streamAgentKey,
    paragraphIndex: task.streamParagraphIndex ?? (paragraphTotal > 0 ? 1 : undefined),
    paragraphTotal: paragraphTotal > 0 ? paragraphTotal : undefined,
    currentParagraphId,
    paragraphLabel: task.streamParagraphLabel ?? currentSection,
    currentSection,
    updatedAt: task.updatedAt,
  });
}
