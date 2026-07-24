import yauzl from "yauzl";

const HEADING_STYLES = new Set(["1", "2", "3", "4"]);
const POINT_STYLE = "5";
const HEADING_PATTERN = /^(第[一二三四五六七八九十百]+章|[0-9]+(\.[0-9]+)*\s*[一-龥]|附录\s*[A-Z])/;

function isHeadingStyle(styleId) {
  return HEADING_STYLES.has(styleId);
}

function isPointHeading(styleId, text) {
  if (styleId !== POINT_STYLE) {
    return false;
  }
  return HEADING_PATTERN.test(text.trim());
}

function extractTextFromParagraph(xml) {
  const textParts = [];
  const textPattern = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  let match;
  while ((match = textPattern.exec(xml)) !== null) {
    if (match[1]) {
      textParts.push(match[1]);
    }
  }
  return textParts.join("");
}

function extractStyleFromParagraph(xml) {
  const styleMatch = xml.match(/<w:pStyle w:val="([^"]*)"/);
  return styleMatch ? styleMatch[1] : "Normal";
}

function extractImageDescriptions(xml) {
  const images = [];
  const descPattern = /<wp:docPr[^>]*descr="([^"]*)"/g;
  let match;
  while ((match = descPattern.exec(xml)) !== null) {
    if (match[1]) {
      images.push(match[1]);
    }
  }
  if (images.length === 0) {
    const drawPattern = /<w:drawing|<w:pict/g;
    while (drawPattern.exec(xml) !== null) {
      images.push("图片");
    }
  }
  return images;
}

function parseTableRows(xml) {
  const rows = [];
  const rowPattern = /<w:tr[ >][\s\S]*?<\/w:tr>/g;
  let rowMatch;
  let rowIndex = 0;

  while ((rowMatch = rowPattern.exec(xml)) !== null) {
    rowIndex++;
    const cellPattern = /<w:tc[ >][\s\S]*?<\/w:tc>/g;
    let cellMatch;
    let colIndex = 0;
    const cellTexts = [];

    while ((cellMatch = cellPattern.exec(rowMatch[0])) !== null) {
      colIndex++;
      const cellText = extractTextFromParagraph(cellMatch[0]);
      if (cellText.trim()) {
        cellTexts.push(cellText.trim());
      }
    }

    if (cellTexts.length > 0) {
      rows.push({
        style: "Normal",
        text: `表格：行${rowIndex} ${cellTexts.join(" | ")}`,
      });
    }
  }

  return rows;
}

function stripTrailingPageNumber(text) {
  return text.replace(/[0-9]+$/, "").trim();
}

function buildStructureFromParagraphs(rawParagraphs) {
  const sections = [];
  const paragraphs = [];
  let currentSection = "正文";
  let currentSectionParagraphIds = [];
  let paragraphIndex = 0;

  function flushSection() {
    if (currentSectionParagraphIds.length > 0) {
      sections.push({
        id: `section-${sections.length + 1}`,
        title: currentSection,
        paragraphIds: [...currentSectionParagraphIds],
      });
      currentSectionParagraphIds = [];
    }
  }

  for (const raw of rawParagraphs) {
    const isHeading = isHeadingStyle(raw.style) || isPointHeading(raw.style, raw.text);
    const cleanText = stripTrailingPageNumber(raw.text);

    if (isHeading && cleanText.length <= 80 && cleanText.length > 0) {
      flushSection();
      currentSection = cleanText;
      continue;
    }

    paragraphIndex++;
    const paragraphId = `docx-p-${String(paragraphIndex).padStart(4, "0")}`;
    paragraphs.push({
      id: paragraphId,
      section: currentSection,
      text: raw.text,
    });
    currentSectionParagraphIds.push(paragraphId);
  }

  flushSection();

  return { sections, paragraphs };
}

function readEntryBuffer(zipfile, entry) {
  return new Promise((resolve, reject) => {
    zipfile.openReadStream(entry, (err, readStream) => {
      if (err) {
        reject(err);
        return;
      }
      const chunks = [];
      readStream.on("data", (chunk) => chunks.push(chunk));
      readStream.on("end", () => resolve(Buffer.concat(chunks)));
      readStream.on("error", reject);
    });
  });
}

export async function parseDocxFile(filePath) {
  return new Promise((resolve, reject) => {
    yauzl.open(filePath, { lazyEntries: true }, (err, zipfile) => {
      if (err) {
        reject(new Error(`Failed to open DOCX: ${err.message}`));
        return;
      }

      let documentXml = null;

      zipfile.readEntry();
      zipfile.on("entry", (entry) => {
        if (entry.fileName === "word/document.xml") {
          readEntryBuffer(zipfile, entry)
            .then((buffer) => {
              documentXml = buffer.toString("utf8");
              zipfile.close();
              try {
                resolve(parseDocumentXmlToStructure(documentXml));
              } catch (parseErr) {
                reject(parseErr);
              }
            })
            .catch(reject);
        } else {
          zipfile.readEntry();
        }
      });

      zipfile.on("end", () => {
        if (!documentXml) {
          reject(new Error("DOCX does not contain word/document.xml"));
        }
      });
    });
  });
}

function parseDocumentXmlToStructure(xml) {
  const rawParagraphs = [];

  const tablePattern = /<w:tbl[ >][\s\S]*?<\/w:tbl>/g;
  const tableRanges = [];
  let tableMatch;
  while ((tableMatch = tablePattern.exec(xml)) !== null) {
    tableRanges.push({
      start: tableMatch.index,
      end: tableMatch.index + tableMatch[0].length,
      rows: parseTableRows(tableMatch[0]),
    });
  }

  const paraPattern = /<w:p[ >][\s\S]*?<\/w:p>/g;
  let paraMatch;
  while ((paraMatch = paraPattern.exec(xml)) !== null) {
    const isInTable = tableRanges.some(
      (range) => paraMatch.index >= range.start && paraMatch.index < range.end,
    );
    if (isInTable) {
      continue;
    }

    const style = extractStyleFromParagraph(paraMatch[0]);
    const text = extractTextFromParagraph(paraMatch[0]);
    const images = extractImageDescriptions(paraMatch[0]);

    let fullText = text;
    if (images.length > 0) {
      const imgMarkers = images.map((desc) => `[图片：${desc}]`).join(" ");
      fullText = fullText ? `${fullText} ${imgMarkers}` : imgMarkers;
    }

    if (fullText.trim()) {
      rawParagraphs.push({ style, text: fullText.trim() });
    }
  }

  for (const range of tableRanges) {
    rawParagraphs.push(...range.rows);
  }

  const { sections, paragraphs } = buildStructureFromParagraphs(rawParagraphs);

  return {
    status: "done",
    sourceFormat: "docx-xml",
    recoveredAt: new Date().toISOString(),
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
