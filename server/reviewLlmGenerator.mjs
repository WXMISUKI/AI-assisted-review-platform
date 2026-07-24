import { config } from "./config.mjs";
import { createOpenAIClient } from "./llmClient.mjs";

const MAX_CHAPTER_TEXT_LENGTH = 4000;
const MAX_ISSUES_PER_CHAPTER = 3;

function buildReviewPrompt(sectionTitle, chapterText, ruleFindings) {
  const ruleContext = ruleFindings.length > 0
    ? `\n\n规则预检发现以下风险点：\n${ruleFindings.map((f) => `- [${f.severity}] ${f.title}: ${f.reason}`).join("\n")}`
    : "";

  return `你是一名专业的施工方案审查工程师。请审查以下施工方案章节内容，发现合规性、安全性和技术问题。

章节标题：${sectionTitle}

章节内容：
${chapterText.slice(0, MAX_CHAPTER_TEXT_LENGTH)}
${ruleContext}

请以 JSON 数组格式返回审查问题，每个问题包含：
- title: 问题标题（简明扼要）
- severity: 严重性（critical/high/medium/low）
- reason: 问题原因说明
- basis: 法规或规范依据
- suggestion: 整改建议
- matchedText: 问题相关的原文片段（不超过100字）

要求：
1. 只返回确实存在的问题，不要虚构
2. 重点关注安全措施、合规性、技术参数的完整性
3. 如果规则预检已标记风险，请重点审查并给出更详细的分析
4. 如果该章节没有问题，返回空数组 []
5. 最多返回 ${MAX_ISSUES_PER_CHAPTER} 个问题

返回格式（仅 JSON，无其他文字）：
[{"title":"...","severity":"...","reason":"...","basis":"...","suggestion":"...","matchedText":"..."}]`;
}

function normalizeLlmIssue(raw, paragraphId, section) {
  const severity = ["critical", "high", "medium", "low"].includes(raw.severity)
    ? raw.severity
    : "medium";

  return {
    id: `llm-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    source: "ai",
    status: "pending",
    severity,
    anchor: {
      paragraphId,
      startOffset: 0,
      endOffset: Math.min(raw.matchedText?.length ?? 20, 200),
      text: raw.matchedText?.slice(0, 200) ?? "审查问题",
    },
    finding: {
      title: raw.title?.slice(0, 200) ?? "审查问题",
      reason: raw.reason?.slice(0, 500) ?? "",
      basis: raw.basis?.slice(0, 500) ?? "",
      suggestion: raw.suggestion?.slice(0, 500) ?? "",
    },
    resolution: { action: null, editedText: null, resolvedAt: null },
    kernel: {
      engineSource: "semantic",
      checkDomain: "professional-technical",
      checkItem: section?.slice(0, 100) ?? "施工方案审查",
      outputScenario: "supervisor-formal-review",
      complianceCategory: severity === "critical" ? "mandatory-clause" : "general-norm",
      basisPriority: severity === "critical" ? "primary" : "supporting",
      schemaVersion: "review-kernel-llm-1.0",
      basisReferences: raw.basis ? [{
        type: "normative-standard",
        sourceTitle: raw.basis.slice(0, 200),
        summary: raw.reason?.slice(0, 200) ?? "",
        priority: severity === "critical" ? "primary" : "supporting",
      }] : [],
    },
  };
}

function parseLlmResponse(responseText) {
  try {
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return [];
    }
    return JSON.parse(jsonMatch[0]);
  } catch {
    return [];
  }
}

export async function generateReviewIssuesForChapter(sectionTitle, paragraphs, ruleFindings) {
  const openai = createOpenAIClient();
  if (!openai) {
    return {
      ok: false,
      source: "llm-unavailable",
      issues: [],
      diagnostics: { status: "no_client", message: "OpenAI client not configured." },
    };
  }

  const chapterText = paragraphs.map((p) => p.text).join("\n");
  const prompt = buildReviewPrompt(sectionTitle, chapterText, ruleFindings);

  try {
    const response = await openai.chat.completions.create({
      model: config.openai?.model ?? "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content ?? "";
    const rawIssues = parseLlmResponse(content);
    const firstParagraphId = paragraphs[0]?.id ?? "unknown";

    const issues = rawIssues
      .slice(0, MAX_ISSUES_PER_CHAPTER)
      .map((raw) => normalizeLlmIssue(raw, firstParagraphId, sectionTitle));

    return {
      ok: true,
      source: "llm",
      issues,
      diagnostics: {
        status: "ready",
        message: `Generated ${issues.length} issues for section "${sectionTitle}".`,
        candidateCount: rawIssues.length,
      },
    };
  } catch (error) {
    return {
      ok: false,
      source: "llm-error",
      issues: [],
      diagnostics: {
        status: "error",
        message: error instanceof Error ? error.message : "LLM request failed.",
      },
    };
  }
}

export async function generateReviewIssuesForDocument(sections, paragraphs, ruleSummaries) {
  const allIssues = [];
  const diagnostics = [];

  for (const section of sections) {
    if (section.paragraphIds.length === 0) {
      continue;
    }

    const sectionParagraphs = paragraphs.filter((p) =>
      section.paragraphIds.includes(p.id),
    );
    if (sectionParagraphs.length === 0) {
      continue;
    }

    const sectionRuleFindings = ruleSummaries.filter((r) =>
      section.paragraphIds.includes(r.paragraphId),
    );

    const result = await generateReviewIssuesForChapter(
      section.title,
      sectionParagraphs,
      sectionRuleFindings,
    );

    if (result.ok) {
      allIssues.push(...result.issues);
    }
    diagnostics.push({
      section: section.title,
      ...result.diagnostics,
    });
  }

  return {
    ok: allIssues.length > 0,
    source: "llm",
    issues: allIssues,
    diagnostics: {
      status: allIssues.length > 0 ? "ready" : "no_issues",
      message: `Generated ${allIssues.length} total issues across ${sections.length} sections.`,
      sectionResults: diagnostics,
    },
  };
}
