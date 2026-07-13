import type { RecoveredDocumentStructure, ReviewIssue } from "./reviewTypes";

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function findIssueAnchorMatch(
  issue: ReviewIssue,
  paragraphs: RecoveredDocumentStructure["paragraphs"],
) {
  const expectedText = normalizeText(issue.anchor.text);
  if (!expectedText) {
    return null;
  }

  for (const paragraph of paragraphs) {
    const paragraphText = normalizeText(paragraph.text);
    const startOffset = paragraphText.indexOf(expectedText);
    if (startOffset >= 0) {
      return {
        paragraph,
        startOffset,
        endOffset: startOffset + expectedText.length,
        text: issue.anchor.text,
      };
    }
  }

  return null;
}

function buildFallbackAnchor(
  issue: ReviewIssue,
  paragraph: RecoveredDocumentStructure["paragraphs"][number] | undefined,
) {
  if (!paragraph) {
    return issue.anchor;
  }

  const fallbackLength = Math.min(
    Math.max(normalizeText(issue.anchor.text).length, 16),
    paragraph.text.length,
  );
  const fallbackText = paragraph.text.slice(0, fallbackLength);

  return {
    paragraphId: paragraph.id,
    startOffset: 0,
    endOffset: fallbackText.length,
    text: fallbackText,
  };
}

export function rebindReviewIssueAnchors(
  issues: ReviewIssue[],
  recoveredStructure: RecoveredDocumentStructure | undefined,
): ReviewIssue[] {
  const paragraphs = recoveredStructure?.paragraphs ?? [];
  if (paragraphs.length === 0) {
    return issues.map((issue) => ({ ...issue, anchor: { ...issue.anchor } }));
  }

  return issues.map((issue, index) => {
    const exactMatch = findIssueAnchorMatch(issue, paragraphs);
    if (exactMatch) {
      return {
        ...issue,
        anchor: {
          paragraphId: exactMatch.paragraph.id,
          startOffset: exactMatch.startOffset,
          endOffset: exactMatch.endOffset,
          text: exactMatch.text,
        },
      };
    }

    const fallbackParagraph = paragraphs[Math.min(index, paragraphs.length - 1)];
    return {
      ...issue,
      anchor: buildFallbackAnchor(issue, fallbackParagraph),
    };
  });
}
