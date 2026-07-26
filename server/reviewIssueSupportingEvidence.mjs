import { getKnowledgeBaseProviderReadiness, searchKnowledgeBase } from "./knowledgeBaseProvider.mjs";
import { normalizeProviderString } from "./providerContracts.mjs";

function compactParts(parts, limit = 8) {
  return parts
    .map((value) => normalizeProviderString(value, "", 240))
    .filter(Boolean)
    .slice(0, limit);
}

function buildIssueSupportingEvidenceContext(task, issue) {
  const paragraph =
    task?.recoveredStructure?.paragraphs?.find((item) => item.id === issue.anchor?.paragraphId) ??
    task?.paragraphs?.find((item) => item.id === issue.anchor?.paragraphId) ??
    null;
  const primaryReference = issue.kernel?.basisReferences?.[0];

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
    paragraph,
    primaryReference,
    filters: Object.fromEntries(Object.entries(filters).filter(([, value]) => Boolean(value))),
  };
}

function buildQueryCandidates(task, issue) {
  const { paragraph, primaryReference, filters } = buildIssueSupportingEvidenceContext(task, issue);
  const candidates = [
    {
      strategy: "basis-led",
      queryParts: compactParts([
        primaryReference?.sourceTitle,
        primaryReference?.clauseNumber,
        issue.finding?.basis,
        issue.finding?.title,
        paragraph?.section,
      ]),
    },
    {
      strategy: "anchor-led",
      queryParts: compactParts([
        issue.anchor?.text,
        paragraph?.section,
        paragraph?.text,
        issue.finding?.reason,
      ], 6),
    },
    {
      strategy: "title-led",
      queryParts: compactParts([
        issue.finding?.title,
        issue.finding?.reason,
        issue.finding?.basis,
      ], 5),
    },
  ]
    .map((candidate) => ({
      ...candidate,
      query: candidate.queryParts.join(" "),
    }))
    .filter((candidate) => Boolean(candidate.query));

  return {
    filters,
    candidates,
  };
}

function buildSafeReadiness(readiness, provider) {
  return {
    provider,
    configured: Boolean(readiness?.configured),
    ready: Boolean(readiness?.ready),
    status: normalizeProviderString(readiness?.status, "degraded", 80),
    summary: normalizeProviderString(readiness?.summary, "支持证据 provider 当前状态未知。", 300),
  };
}

function classifyFailureStatus(rawStatus, readinessStatus) {
  const status = normalizeProviderString(rawStatus, "failed", 80);
  if (status === "timeout" || status === "adapter_unreachable") {
    return status;
  }
  if (status === "not_configured" || status === "invalid_input") {
    return "provider_unavailable";
  }
  if (["degraded", "failed", "blocked", "provisional"].includes(readinessStatus)) {
    return "provider_degraded";
  }
  return "failed";
}

export async function getReviewIssueSupportingEvidence(task, issue) {
  const readiness = await getKnowledgeBaseProviderReadiness();
  const provider = normalizeProviderString(readiness?.provider || readiness?.source, "knowledge-base", 80);
  const safeReadiness = buildSafeReadiness(readiness, provider);
  const { filters, candidates } = buildQueryCandidates(task, issue);

  if (candidates.length === 0) {
    return {
      ok: false,
      status: "invalid_query",
      provider,
      readiness: safeReadiness,
      canRetry: false,
      queryParts: [],
      query: "",
      strategy: undefined,
      attempts: [],
      hits: [],
      message: "当前 issue 缺少足够的结构化上下文，暂时无法组织支持证据检索。",
    };
  }

  if (!safeReadiness.configured || safeReadiness.status === "disabled" || safeReadiness.status === "unconfigured") {
    const firstCandidate = candidates[0];
    return {
      ok: false,
      status: "provider_unavailable",
      provider,
      readiness: safeReadiness,
      canRetry: false,
      queryParts: firstCandidate.queryParts,
      query: firstCandidate.query,
      strategy: undefined,
      attempts: [],
      hits: [],
      message: "知识库 provider 当前未配置，支持证据暂不可用。",
    };
  }

  const attempts = [];
  let lastFailureStatus = "failed";
  let lastFailureMessage = "支持证据召回暂时不可用，当前不影响 issue 审查与决策。";

  for (const candidate of candidates) {
    const result = await searchKnowledgeBase({
      query: candidate.query,
      topK: 5,
      filters,
      correlationId: `review-task:${task.id}:issue:${issue.id}:${candidate.strategy}`,
    });

    if (!result?.ok) {
      lastFailureStatus = classifyFailureStatus(result?.status, safeReadiness.status);
      lastFailureMessage = normalizeProviderString(
        result?.message,
        "支持证据召回暂时不可用，当前不影响 issue 审查与决策。",
        300,
      );
      attempts.push({
        strategy: candidate.strategy,
        querySummary: candidate.query,
        hitCount: 0,
      });
      continue;
    }

    const hits = Array.isArray(result.hits) ? result.hits : [];
    attempts.push({
      strategy: candidate.strategy,
      querySummary: candidate.query,
      hitCount: hits.length,
    });

    if (hits.length > 0) {
      return {
        ok: true,
        status: "ready",
        provider,
        readiness: safeReadiness,
        canRetry: false,
        strategy: candidate.strategy,
        attempts,
        queryParts: candidate.queryParts,
        query: candidate.query,
        hits,
        message: "已返回支持证据召回结果。",
      };
    }
  }

  const lastCandidate = candidates[candidates.length - 1];
  return {
    ok: true,
    status: "empty",
    provider,
    readiness: safeReadiness,
    canRetry: true,
    strategy: undefined,
    attempts,
    queryParts: lastCandidate?.queryParts ?? [],
    query: lastCandidate?.query ?? "",
    hits: [],
    message:
      lastFailureStatus === "failed" || lastFailureStatus === "provider_degraded"
        ? lastFailureMessage
        : "当前未召回支持证据。",
  };
}
