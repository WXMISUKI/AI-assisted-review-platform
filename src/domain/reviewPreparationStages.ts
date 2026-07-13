import { summarizeStructureDraftIssues } from "./reviewIssueDrafts";
import type {
  RecoveredDocumentStructure,
  ReviewStreamingStage,
} from "./reviewTypes";

function getParagraphAt(
  recoveredStructure: RecoveredDocumentStructure,
  ratio: number,
) {
  const paragraphs = recoveredStructure.paragraphs;
  if (paragraphs.length === 0) {
    return null;
  }

  const index = Math.min(
    paragraphs.length - 1,
    Math.max(0, Math.round((paragraphs.length - 1) * ratio)),
  );

  return {
    paragraph: paragraphs[index],
    index,
  };
}

function getOutlineItems(recoveredStructure: RecoveredDocumentStructure) {
  const sectionTitles = recoveredStructure.sections.map((section) => section.title);
  if (sectionTitles.length > 0) {
    return sectionTitles.slice(0, 6);
  }

  return Array.from(
    new Set(recoveredStructure.paragraphs.map((paragraph) => paragraph.section)),
  ).slice(0, 6);
}

function createStageFromTemplate(
  template: ReviewStreamingStage,
  recoveredStructure: RecoveredDocumentStructure,
  ratio: number,
  draftIssueSummariesByParagraphId: Map<string, string[]>,
  fallbackIssueSummaries: string[],
): ReviewStreamingStage {
  const selected = getParagraphAt(recoveredStructure, ratio);
  const paragraph = selected?.paragraph;
  const paragraphIndex = selected ? selected.index + 1 : undefined;
  const paragraphTotal = recoveredStructure.paragraphs.length;
  const outlineItems = getOutlineItems(recoveredStructure);
  const snippet = paragraph?.text
    ? paragraph.text.length > 96
      ? `${paragraph.text.slice(0, 96)}...`
      : paragraph.text
    : template.documentSnippets[0] ?? "姝ｅ湪璇诲彇 OCR 缁撴瀯鎭㈠缁撴灉銆?";

  const structureSummaries = paragraph
    ? draftIssueSummariesByParagraphId.get(paragraph.id)
    : undefined;

  return {
    ...template,
    currentParagraphId: paragraph?.id ?? template.currentParagraphId,
    currentParagraphIndex: paragraphIndex ?? template.currentParagraphIndex,
    currentParagraphTotal: paragraphTotal || template.currentParagraphTotal,
    currentParagraphLabel: paragraph?.section ?? template.currentParagraphLabel,
    currentSection: paragraph?.section ?? template.currentSection,
    outlineItems: outlineItems.length > 0 ? outlineItems : template.outlineItems,
    documentSnippets: [snippet],
    issueSummaries:
      structureSummaries && structureSummaries.length > 0
        ? structureSummaries
        : template.issueSummaries.length > 0
          ? template.issueSummaries
          : fallbackIssueSummaries,
  };
}

export function buildReviewPreparationStages(
  recoveredStructure: RecoveredDocumentStructure | undefined,
  fallbackStages: ReviewStreamingStage[],
): ReviewStreamingStage[] {
  if (!recoveredStructure || recoveredStructure.paragraphs.length === 0) {
    return fallbackStages;
  }

  const fallbackIssueSummaries = [
    `已恢复 ${recoveredStructure.sections.length} 个章节、${recoveredStructure.paragraphs.length} 个段落，正在进入审查准备。`,
  ];
  const draftIssueSummaries = summarizeStructureDraftIssues(recoveredStructure);
  const draftIssueSummariesByParagraphId = new Map<string, string[]>();

  draftIssueSummaries.forEach(({ paragraphId, summary }) => {
    const summaries = draftIssueSummariesByParagraphId.get(paragraphId) ?? [];
    if (!summaries.includes(summary)) {
      draftIssueSummariesByParagraphId.set(paragraphId, [...summaries, summary]);
    }
  });

  const lastIndex = Math.max(1, fallbackStages.length - 1);

  return fallbackStages.map((stage, index) =>
    createStageFromTemplate(
      stage,
      recoveredStructure,
      index / lastIndex,
      draftIssueSummariesByParagraphId,
      fallbackIssueSummaries,
    ),
  );
}
