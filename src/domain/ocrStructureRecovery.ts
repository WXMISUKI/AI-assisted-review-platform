import type {
  DocumentParagraph,
  RecoveredDocumentSection,
  RecoveredDocumentStructure,
  StructureRecoveryStatus,
} from "./reviewTypes";

function nowIsoString() {
  return new Date().toISOString();
}

function createParagraphId(index: number) {
  return `ocr-p-${String(index + 1).padStart(3, "0")}`;
}

function isSectionHeading(line: string) {
  return /^[一二三四五六七八九十0-9]+[、.．]\s*/.test(line.trim());
}

export function normalizeOcrLinesToParagraphs(
  lines: string[],
  sourceFormat: RecoveredDocumentStructure["sourceFormat"] = "ocr-text",
): RecoveredDocumentStructure {
  const paragraphs: DocumentParagraph[] = [];
  const sections: RecoveredDocumentSection[] = [];
  let currentSection = "正文";
  let currentSectionParagraphIds: string[] = [];

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) {
      return;
    }

    if (isSectionHeading(line) && line.length <= 40) {
      if (currentSectionParagraphIds.length > 0) {
        sections.push({
          id: `section-${sections.length + 1}`,
          title: currentSection,
          paragraphIds: currentSectionParagraphIds,
        });
      }

      currentSection = line.replace(/\s+/g, " ");
      currentSectionParagraphIds = [];
      return;
    }

    const paragraphId = createParagraphId(paragraphs.length);
    paragraphs.push({
      id: paragraphId,
      section: currentSection,
      text: line,
    });
    currentSectionParagraphIds.push(paragraphId);
  });

  if (currentSectionParagraphIds.length > 0) {
    sections.push({
      id: `section-${sections.length + 1}`,
      title: currentSection,
      paragraphIds: currentSectionParagraphIds,
    });
  }

  return {
    status: paragraphs.length > 0 ? "done" : "idle",
    sourceFormat,
    recoveredAt: paragraphs.length > 0 ? nowIsoString() : null,
    progress: {
      totalParagraphs: paragraphs.length,
      recoveredParagraphs: paragraphs.length,
      currentSection: sections[0]?.title,
      currentParagraphId: paragraphs[0]?.id,
    },
    sections,
    paragraphs,
  };
}

export function recoverStructureFromParagraphs(
  paragraphs: DocumentParagraph[],
  sourceFormat: RecoveredDocumentStructure["sourceFormat"] = "mock",
  status: StructureRecoveryStatus = "done",
): RecoveredDocumentStructure {
  const sectionMap = new Map<string, string[]>();
  for (const paragraph of paragraphs) {
    const list = sectionMap.get(paragraph.section) ?? [];
    list.push(paragraph.id);
    sectionMap.set(paragraph.section, list);
  }

  const sections: RecoveredDocumentSection[] = Array.from(sectionMap.entries()).map(
    ([title, paragraphIds], index) => ({
      id: `section-${index + 1}`,
      title,
      paragraphIds,
    }),
  );

  return {
    status,
    sourceFormat,
    recoveredAt: paragraphs.length > 0 ? nowIsoString() : null,
    progress: {
      totalParagraphs: paragraphs.length,
      recoveredParagraphs: paragraphs.length,
      currentSection: sections[0]?.title,
      currentParagraphId: paragraphs[0]?.id,
    },
    sections,
    paragraphs: paragraphs.map((paragraph) => ({ ...paragraph })),
  };
}
