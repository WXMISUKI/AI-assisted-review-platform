import { getKnowledgeBaseProviderReadiness, searchKnowledgeBase } from "./knowledgeBaseProvider.mjs";
import { normalizeProviderString } from "./providerContracts.mjs";

function compactParts(parts) {
  return parts
    .map((value) => normalizeProviderString(value, "", 240))
    .filter(Boolean)
    .slice(0, 8);
}

function buildIssueSupportingEvidenceQuery(task, issue) {
  const paragraph =
    task?.recoveredStructure?.paragraphs?.find((item) => item.id === issue.anchor?.paragraphId) ??
    task?.paragraphs?.find((item) => item.id === issue.anchor?.paragraphId) ??
    null;
  const primaryReference = issue.kernel?.basisReferences?.[0];

  const query = compactParts([
    issue.finding?.title,
    primaryReference?.sourceTitle,
    primaryReference?.clauseNumber,
    issue.finding?.basis,
    issue.anchor?.text,
    paragraph?.section,
    paragraph?.text,
  ]).join(" ");

  const filters = {
    taskId: normalizeProviderString(task?.id, "", 120) || undefined,
    projectName: normalizeProviderString(task?.project, "", 160) || undefined,
    sectionTitle: normalizeProviderString(paragraph?.section, "", 160) || undefined,
    issueSeverity: normalizeProviderString(issue?.severity, "", 40) || undefined,
    issueSource: normalizeProviderString(issue?.source, "", 40) || undefined,
    clauseNumber: normalizeProviderString(primaryReference?.clauseNumber, "", 80) || undefined,
    basisTitle: normalizeProviderString(primaryReference?.sourceTitle, "", 180) || undefined,
  };

  return {
    query,
    filters: Object.fromEntries(Object.entries(filters).filter(([, value]) => Boolean(value))),
  };
}

export async function getReviewIssueSupportingEvidence(task, issue) {
  const readiness = await getKnowledgeBaseProviderReadiness();
  const provider = normalizeProviderString(readiness?.provider || readiness?.source, "knowledge-base", 80);

  const { query, filters } = buildIssueSupportingEvidenceQuery(task, issue);
  if (!query) {
    return {
      ok: false,
      status: "invalid_query",
      provider,
      query: "",
      hits: [],
      message: "当前 issue 缺少足够的结构化上下文，暂时无法组织支持证据检索。",
    };
  }

  const result = await searchKnowledgeBase({
    query,
    topK: 5,
    filters,
    correlationId: `review-task:${task.id}:issue:${issue.id}`,
  });

  if (!result?.ok) {
    return {
      ok: false,
      status: normalizeProviderString(result?.status, "provider_failed", 80),
      provider,
      query,
      hits: [],
      message: normalizeProviderString(
        result?.message,
        "支持证据召回暂时不可用，当前不影响 issue 审查与决策。",
        300,
      ),
    };
  }

  const hits = Array.isArray(result.hits) ? result.hits : [];
  return {
    ok: true,
    status: hits.length > 0 ? "ready" : "empty",
    provider,
    query,
    hits,
    message: hits.length > 0 ? "已返回支持证据召回结果。" : "当前未召回支持证据。",
  };
}
