import { config } from "./config.mjs";
import { createOpenAIClient } from "./llmClient.mjs";

const allowedSeverities = new Set(["critical", "high", "medium", "low"]);

const fallbackRules = [
  {
    id: "temporary-power",
    severity: "high",
    keywords: ["临时用电", "配电箱", "漏电保护", "防雨"],
    title: "临时用电安全措施需要进一步明确",
    reason: "方案中涉及临时用电或配电设施，应明确防雨、防潮、接地和漏电保护要求。",
    basis: "施工安全技术规范要求临时用电设施具备可靠防护、接地和漏电保护措施。",
    suggestion: "补充临时用电布置、防护等级、漏电保护参数、检查频次和责任人。",
  },
  {
    id: "emergency-response",
    severity: "medium",
    keywords: ["应急", "救援", "事故", "演练"],
    title: "应急处置内容需要形成闭环",
    reason: "应急章节应明确组织职责、联络方式、救援路线、资源清单和演练安排。",
    basis: "安全风险管理要求专项方案具备可执行的应急响应和资源保障安排。",
    suggestion: "补充应急组织架构、联系人清单、救援路线、物资清单和演练计划。",
  },
  {
    id: "acceptance-loop",
    severity: "medium",
    keywords: ["验收", "资料", "归档", "复核"],
    title: "验收与资料归档责任需要明确",
    reason: "验收资料不应只停留在原则性描述，需要明确责任主体、复核节点和归档清单。",
    basis: "施工方案应明确验收、复核、整改闭环和资料归档要求。",
    suggestion: "补充验收责任人、复核流程、整改闭环和归档资料清单。",
  },
  {
    id: "hazard-procedure",
    severity: "critical",
    keywords: ["危大", "专项方案", "专家论证", "脚手架", "吊装"],
    title: "危大工程管理程序需要复核",
    reason: "涉及危大工程或专项施工内容时，应复核专项方案审批、交底、验收和专家论证要求。",
    basis: "危大工程专项方案应按规定履行编制、审核、审批、交底、验收和必要的专家论证程序。",
    suggestion: "补充危大工程识别结论、专项方案审批链路、交底验收记录和专家论证适用性判断。",
  },
];

function normalizeParagraphs(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((paragraph) => paragraph && typeof paragraph.id === "string" && typeof paragraph.text === "string")
    .slice(0, 12)
    .map((paragraph) => ({
      id: paragraph.id,
      section: typeof paragraph.section === "string" ? paragraph.section : "",
      text: paragraph.text.slice(0, 1600),
    }));
}

function createIssueFromMatch(rule, paragraph, keyword, sourceTag = "fallback") {
  const startOffset = Math.max(0, paragraph.text.indexOf(keyword));
  const endOffset = startOffset + keyword.length;

  return {
    id: `${sourceTag}-${rule.id}-${paragraph.id}`,
    source: "ai",
    status: "pending",
    severity: rule.severity,
    anchor: {
      paragraphId: paragraph.id,
      startOffset,
      endOffset,
      text: paragraph.text.slice(startOffset, endOffset) || keyword,
    },
    finding: {
      title: rule.title,
      reason: rule.reason,
      basis: rule.basis,
      suggestion: rule.suggestion,
    },
    resolution: {
      action: null,
      editedText: null,
      resolvedAt: null,
    },
    kernel: {
      engineSource: sourceTag === "llm" ? "semantic" : "rule",
      checkDomain: "preparation-content",
      checkItem: rule.title,
      outputScenario: "supervisor-formal-review",
      complianceCategory: rule.severity === "critical" ? "mandatory-clause" : "general-norm",
      basisPriority: "supporting",
      schemaVersion: "review-kernel-draft-1.0",
      basisReferences: [
        {
          type: "normative-standard",
          sourceTitle: "施工方案审查通用规则",
          summary: rule.basis,
          priority: "supporting",
        },
      ],
    },
  };
}

function dedupeIssues(issues) {
  const deduped = new Map();
  for (const issue of issues) {
    const key = `${issue.finding.title}|${issue.anchor.paragraphId}|${issue.anchor.text}`;
    if (!deduped.has(key)) {
      deduped.set(key, issue);
    }
  }
  return Array.from(deduped.values());
}

function buildFallbackIssues(paragraphs, maxIssues) {
  const issues = [];

  for (const paragraph of paragraphs) {
    for (const rule of fallbackRules) {
      const keyword = rule.keywords.find((item) => paragraph.text.includes(item));
      if (keyword) {
        issues.push(createIssueFromMatch(rule, paragraph, keyword));
      }
      if (issues.length >= maxIssues) {
        return dedupeIssues(issues).slice(0, maxIssues);
      }
    }
  }

  return dedupeIssues(issues).slice(0, maxIssues);
}

function safeDiagnostics(status, message, extra = {}) {
  return {
    status,
    message,
    ...extra,
  };
}

function extractJsonObject(text) {
  if (!text || typeof text !== "string") {
    return null;
  }

  const trimmed = text.trim();
  if (trimmed.startsWith("{")) {
    return trimmed;
  }

  const match = trimmed.match(/\{[\s\S]*\}/);
  return match ? match[0] : null;
}

function normalizeCandidateIssue(candidate, paragraphsById, index) {
  if (!candidate || typeof candidate !== "object") {
    return null;
  }

  const paragraphId = typeof candidate.paragraphId === "string" ? candidate.paragraphId : "";
  const paragraph = paragraphsById.get(paragraphId);
  const anchorText = typeof candidate.anchorText === "string" ? candidate.anchorText.trim() : "";
  const title = typeof candidate.title === "string" ? candidate.title.trim() : "";

  if (!paragraph || !anchorText || !title) {
    return null;
  }

  const startOffset = paragraph.text.indexOf(anchorText);
  if (startOffset < 0) {
    return null;
  }

  const severity = allowedSeverities.has(candidate.severity) ? candidate.severity : "medium";
  const endOffset = startOffset + anchorText.length;

  return {
    id: `llm-candidate-${index + 1}-${paragraphId}`,
    source: "ai",
    status: "pending",
    severity,
    anchor: {
      paragraphId,
      startOffset,
      endOffset,
      text: anchorText,
    },
    finding: {
      title,
      reason: typeof candidate.reason === "string" && candidate.reason.trim()
        ? candidate.reason.trim()
        : "LLM candidate requires reviewer confirmation.",
      basis: typeof candidate.basis === "string" && candidate.basis.trim()
        ? candidate.basis.trim()
        : "Review basis should be confirmed during human review.",
      suggestion: typeof candidate.suggestion === "string" && candidate.suggestion.trim()
        ? candidate.suggestion.trim()
        : "请结合规范和现场条件补充完善该处内容。",
    },
    resolution: {
      action: null,
      editedText: null,
      resolvedAt: null,
    },
    kernel: {
      engineSource: "semantic",
      checkDomain: "preparation-content",
      checkItem: title,
      outputScenario: "supervisor-formal-review",
      complianceCategory: severity === "critical" ? "mandatory-clause" : "general-norm",
      basisPriority: "supporting",
      schemaVersion: "review-kernel-llm-candidate-1.0",
      basisReferences: [
        {
          type: "normative-standard",
          sourceTitle: "LLM semantic review candidate",
          summary: typeof candidate.basis === "string" ? candidate.basis : "Model-proposed basis requires review.",
          priority: "supporting",
        },
      ],
    },
  };
}

async function generateLlmCandidateIssues(input, paragraphs, maxIssues) {
  const client = createOpenAIClient();
  if (!client) {
    return {
      ok: false,
      reason: "not_configured",
      message: "Missing OpenAI-compatible model configuration.",
      issues: [],
    };
  }

  const context = paragraphs
    .map((paragraph, index) => {
      return [
        `#${index + 1}`,
        `paragraphId: ${paragraph.id}`,
        `section: ${paragraph.section}`,
        `text: ${paragraph.text}`,
      ].join("\n");
    })
    .join("\n\n");

  try {
    const completion = await client.chat.completions.create({
      model: config.openai.model,
      messages: [
        {
          role: "system",
          content:
            "You are a construction plan review assistant. Return strict JSON only. Do not include markdown.",
        },
        {
          role: "user",
          content: [
            "Generate at most structured review issue candidates from the supplied paragraphs.",
            `maxIssues: ${maxIssues}`,
            "Return JSON with shape: {\"issues\":[{\"paragraphId\":\"...\",\"anchorText\":\"exact text from paragraph\",\"severity\":\"critical|high|medium|low\",\"title\":\"...\",\"reason\":\"...\",\"basis\":\"...\",\"suggestion\":\"...\"}]}",
            "Only use paragraphId values and anchorText that exactly appear in the provided text.",
            `mode: ${input.mode || "review"}`,
            `preparationPackageId: ${input.preparationPackage?.packageId || ""}`,
            context,
          ].join("\n\n"),
        },
      ],
      temperature: 0.1,
      max_tokens: 1200,
    });

    const content = completion.choices?.[0]?.message?.content || "";
    const jsonText = extractJsonObject(content);
    if (!jsonText) {
      return {
        ok: false,
        reason: "invalid_json",
        message: "LLM response did not contain JSON.",
        issues: [],
      };
    }

    const parsed = JSON.parse(jsonText);
    const rawIssues = Array.isArray(parsed.issues) ? parsed.issues : [];
    const paragraphsById = new Map(paragraphs.map((paragraph) => [paragraph.id, paragraph]));
    const issues = rawIssues
      .map((candidate, index) => normalizeCandidateIssue(candidate, paragraphsById, index))
      .filter(Boolean)
      .slice(0, maxIssues);

    return {
      ok: issues.length > 0,
      reason: issues.length > 0 ? "ok" : "no_valid_candidates",
      message: issues.length > 0 ? "LLM candidates generated." : "LLM response had no valid anchored candidates.",
      issues,
    };
  } catch (error) {
    return {
      ok: false,
      reason: "llm_failed",
      message: error instanceof Error ? error.message : "Unknown LLM generation error.",
      issues: [],
    };
  }
}

export async function generateDraftIssues(input = {}) {
  const paragraphs = normalizeParagraphs(input.paragraphs);
  const maxIssues = Math.min(Math.max(Number(input.maxIssues) || 6, 1), 10);

  if (paragraphs.length === 0) {
    return {
      ok: true,
      source: "deterministic-fallback",
      status: "fallback",
      issues: [],
      diagnostics: safeDiagnostics("no_context", "No usable recovered paragraph context was provided."),
    };
  }

  const llmResult = await generateLlmCandidateIssues(input, paragraphs, maxIssues);
  if (llmResult.ok) {
    return {
      ok: true,
      source: "llm",
      status: "ready",
      issues: dedupeIssues(llmResult.issues).slice(0, maxIssues),
      diagnostics: safeDiagnostics("ready", "LLM draft issue candidates generated.", {
        candidateCount: llmResult.issues.length,
      }),
    };
  }

  const fallbackIssues = buildFallbackIssues(paragraphs, maxIssues);
  return {
    ok: true,
    source: "deterministic-fallback",
    status: "fallback",
    issues: fallbackIssues,
    diagnostics: safeDiagnostics(llmResult.reason, llmResult.message, {
      candidateCount: fallbackIssues.length,
    }),
  };
}
