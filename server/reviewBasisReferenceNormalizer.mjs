const VERSION_PATTERN =
  /\b(?:JGJ|JTG|JT\/T|GB(?:\/T)?|SL|DL|AQ|CECS|T\/[A-Z0-9.-]+|DB\d{2}(?:\/T)?)[A-Z0-9\s./-]*\d{2,4}(?:-\d{4})?\b/i;
const ORDER_PATTERN = /(住建部令第\s*\d+\s*号|第\s*\d+\s*号)/i;
const CLAUSE_PATTERN = /(第[一二三四五六七八九十百零0-9]+\s*[章节条款]|[1-9]\d*(?:\.\d+){1,3})/i;

function compactText(value, maxLength = 200) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function inferReferenceType(text, fallbackType = "normative-standard") {
  if (!text) {
    return fallbackType;
  }

  if (/合同|协议|承诺/.test(text)) {
    return "contract";
  }
  if (/图|图纸|布置图/.test(text)) {
    return "drawing";
  }
  if (/风险评估|评估报告/.test(text)) {
    return "safety-risk-assessment";
  }
  if (/施工组织设计|专项方案|项目/.test(text)) {
    return "project-document";
  }
  if (/条例|规定|办法|法/.test(text)) {
    return "law-regulation";
  }
  if (/地方|省|市/.test(text) && /规范|标准|规定|要求/.test(text)) {
    return "local-requirement";
  }
  if (/规范|规程|标准|导则|技术/.test(text)) {
    return "normative-standard";
  }

  return fallbackType;
}

function extractTitle(text, fallbackTitle) {
  const titleMatch = text.match(/《([^》]+)》/);
  if (titleMatch?.[1]) {
    return compactText(titleMatch[1]);
  }

  if (fallbackTitle) {
    return compactText(fallbackTitle);
  }

  const firstSegment = text.split(/[；;。]/)[0]?.trim();
  return compactText(firstSegment || "审查依据");
}

function extractVersion(text) {
  const orderMatch = text.match(ORDER_PATTERN);
  if (orderMatch?.[1]) {
    return compactText(orderMatch[1]);
  }

  const versionMatch = text.match(VERSION_PATTERN);
  if (versionMatch?.[0]) {
    return compactText(versionMatch[0].replace(/\s+/g, " "));
  }

  return undefined;
}

function extractClause(text, version) {
  const clauseMatch = text.match(CLAUSE_PATTERN);
  if (!clauseMatch?.[1]) {
    return undefined;
  }

  const clause = compactText(clauseMatch[1]);
  if (version && clause === version) {
    return undefined;
  }
  return clause;
}

function buildSingleReference(rawText, options = {}) {
  const text = compactText(rawText, 400);
  const reason = compactText(options.reason, 200);
  const sourceTitle = extractTitle(text, options.fallbackTitle);
  const version = extractVersion(text);
  const clauseNumber = extractClause(text, version);
  const summary = reason || compactText(text.replace(/《|》/g, ""), 200);

  return {
    type: inferReferenceType(text || sourceTitle, options.fallbackType),
    sourceTitle,
    version,
    clauseNumber,
    summary,
    priority: options.priority ?? "supporting",
  };
}

export function normalizeBasisReferences(input = {}) {
  const basisText = typeof input.basisText === "string" ? input.basisText.trim() : "";
  const reason = typeof input.reason === "string" ? input.reason.trim() : "";

  if (!basisText) {
    return [];
  }

  const segments = basisText
    .split(/[；;]\s*/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 3);

  const references = segments.map((segment) =>
    buildSingleReference(segment, {
      reason,
      priority: input.priority,
      fallbackType: input.fallbackType,
      fallbackTitle: input.fallbackTitle,
    }),
  );

  const deduped = new Map();
  references.forEach((reference) => {
    const key = `${reference.type}|${reference.sourceTitle}|${reference.version ?? ""}|${reference.clauseNumber ?? ""}`;
    if (!deduped.has(key)) {
      deduped.set(key, reference);
    }
  });

  return Array.from(deduped.values());
}
