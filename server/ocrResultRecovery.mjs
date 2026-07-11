function nowIsoString() {
  return new Date().toISOString();
}

function createParagraphId(index) {
  return `ocr-p-${String(index + 1).padStart(3, "0")}`;
}

function normalizeTextLine(line) {
  return String(line || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isHeadingLine(line) {
  const trimmed = normalizeTextLine(line);
  if (!trimmed) {
    return false;
  }

  return (
    /^#{1,6}\s+/.test(trimmed) ||
    /^[一二三四五六七八九十0-9]+[、.．]\s*/.test(trimmed) ||
    /^第[一二三四五六七八九十0-9]+[章节篇部分节]\s*/.test(trimmed)
  );
}

function cleanHeadingText(line) {
  return normalizeTextLine(line)
    .replace(/^#{1,6}\s+/, "")
    .replace(/^[一二三四五六七八九十0-9]+[、.．]\s*/, "")
    .replace(/^第[一二三四五六七八九十0-9]+[章节篇部分节]\s*/, "")
    .trim();
}

function splitMarkdownToLines(markdownText) {
  return String(markdownText || "")
    .split(/\r?\n/)
    .map((line) => normalizeTextLine(line))
    .filter(Boolean);
}

function buildRecoveredStructure(lines, sourceFormat) {
  const sections = [];
  const paragraphs = [];
  let currentSection = "正文";
  let currentSectionParagraphIds = [];

  const flushSection = () => {
    if (currentSectionParagraphIds.length === 0) {
      return;
    }

    sections.push({
      id: `section-${sections.length + 1}`,
      title: currentSection,
      paragraphIds: [...currentSectionParagraphIds],
    });
  };

  for (const rawLine of lines) {
    const line = normalizeTextLine(rawLine);
    if (!line) {
      continue;
    }

    if (isHeadingLine(line) && line.length <= 80) {
      flushSection();
      currentSection = cleanHeadingText(line) || "正文";
      currentSectionParagraphIds = [];
      continue;
    }

    const paragraphId = createParagraphId(paragraphs.length);
    paragraphs.push({
      id: paragraphId,
      section: currentSection,
      text: line,
    });
    currentSectionParagraphIds.push(paragraphId);
  }

  flushSection();

  if (paragraphs.length === 0) {
    throw new Error("PaddleOCR result did not contain recoverable text.");
  }

  return {
    status: "done",
    sourceFormat,
    recoveredAt: nowIsoString(),
    progress: {
      totalParagraphs: paragraphs.length,
      recoveredParagraphs: paragraphs.length,
      currentSection: sections[0]?.title ?? "正文",
      currentParagraphId: paragraphs[0]?.id,
    },
    sections,
    paragraphs,
  };
}

function collectMarkdownBlocksFromValue(value, blocks) {
  if (!value) {
    return;
  }

  if (typeof value === "string") {
    if (value.trim()) {
      blocks.push(value);
    }
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectMarkdownBlocksFromValue(item, blocks);
    }
    return;
  }

  if (typeof value === "object") {
    const maybeMarkdown = value.markdown?.text;
    if (typeof maybeMarkdown === "string" && maybeMarkdown.trim()) {
      blocks.push(maybeMarkdown);
    }

    if (Array.isArray(value.layoutParsingResults)) {
      for (const item of value.layoutParsingResults) {
        collectMarkdownBlocksFromValue(item, blocks);
      }
    }

    if (typeof value.text === "string" && value.text.trim() && !maybeMarkdown) {
      blocks.push(value.text);
    }

    for (const [key, nestedValue] of Object.entries(value)) {
      if (key === "markdown" || key === "layoutParsingResults" || key === "text") {
        continue;
      }

      collectMarkdownBlocksFromValue(nestedValue, blocks);
    }
  }
}

function parsePaddleOcrResultText(rawText) {
  const trimmed = String(rawText || "").trim();
  if (!trimmed) {
    throw new Error("PaddleOCR result is empty.");
  }

  const markdownBlocks = [];
  let parsedJsonLines = false;

  const lines = trimmed.split(/\r?\n/);
  for (const line of lines) {
    const candidate = line.trim();
    if (!candidate) {
      continue;
    }

    try {
      const parsed = JSON.parse(candidate);
      parsedJsonLines = true;
      collectMarkdownBlocksFromValue(parsed, markdownBlocks);
    } catch {
      markdownBlocks.push(candidate);
    }
  }

  if (markdownBlocks.length === 0) {
    try {
      const parsed = JSON.parse(trimmed);
      collectMarkdownBlocksFromValue(parsed, markdownBlocks);
      parsedJsonLines = true;
    } catch {
      markdownBlocks.push(trimmed);
    }
  }

  const allLines = markdownBlocks.flatMap((block) => splitMarkdownToLines(block));
  return buildRecoveredStructure(allLines, parsedJsonLines ? "ocr-jsonl" : "ocr-markdown");
}

async function fetchJsonText(jsonUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(jsonUrl, {
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch PaddleOCR result (${response.status}).`);
    }

    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

export async function hydrateOcrResultStructure({ jsonUrl, jsonText }) {
  if (!jsonText && (!jsonUrl || typeof jsonUrl !== "string")) {
    return {
      ok: false,
      message: "jsonUrl or jsonText is required.",
    };
  }

  try {
    const rawText = typeof jsonText === "string" ? jsonText : await fetchJsonText(jsonUrl);
    const recoveredStructure = parsePaddleOcrResultText(rawText);
    return {
      ok: true,
      recoveredStructure,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "OCR result hydration failed.",
    };
  }
}
