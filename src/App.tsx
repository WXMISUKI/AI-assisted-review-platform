import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  ClipboardCheck,
  FileText,
  LocateFixed,
  PencilLine,
  ShieldAlert,
  X,
} from "lucide-react";
import { documentParagraphs, initialReviewIssues } from "./domain/mockReview";
import type {
  DocumentParagraph,
  IssueSeverity,
  IssueStatus,
  ReviewIssue,
  StatusFilter,
} from "./domain/reviewTypes";
import {
  buildProcessedParagraphs,
  getIssueCounts,
  matchesFilter,
  resolveIssue,
} from "./domain/reviewUtils";

const statusLabels: Record<StatusFilter, string> = {
  all: "全部",
  pending: "待处理",
  accepted: "已接受",
  rejected: "已拒绝",
  modified: "修改后接受",
};

const severityLabels: Record<IssueSeverity, string> = {
  critical: "重大",
  high: "高",
  medium: "中",
  low: "低",
};

const statusTone: Record<IssueStatus, string> = {
  pending: "pending",
  accepted: "accepted",
  rejected: "rejected",
  modified: "modified",
};

export function App() {
  const [issues, setIssues] = useState<ReviewIssue[]>(initialReviewIssues);
  const [activeIssueId, setActiveIssueId] = useState(initialReviewIssues[0]?.id ?? "");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [draftSuggestions, setDraftSuggestions] = useState<Record<string, string>>(
    Object.fromEntries(initialReviewIssues.map((issue) => [issue.id, issue.finding.suggestion])),
  );
  const paragraphRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const counts = useMemo(() => getIssueCounts(issues), [issues]);
  const processedParagraphs = useMemo(
    () => buildProcessedParagraphs(documentParagraphs, issues),
    [issues],
  );
  const filteredIssues = useMemo(
    () => issues.filter((issue) => matchesFilter(issue, filter)),
    [filter, issues],
  );

  const activeIssue = issues.find((issue) => issue.id === activeIssueId) ?? issues[0];

  function focusIssue(issueId: string, target: "paragraph" | "card" = "paragraph") {
    const issue = issues.find((item) => item.id === issueId);
    if (!issue) {
      return;
    }

    setActiveIssueId(issueId);
    window.requestAnimationFrame(() => {
      const element =
        target === "paragraph"
          ? paragraphRefs.current[issue.anchor.paragraphId]
          : cardRefs.current[issueId];
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  function updateIssue(issueId: string, status: "accepted" | "rejected" | "modified") {
    setIssues((currentIssues) =>
      currentIssues.map((issue) =>
        issue.id === issueId
          ? resolveIssue(issue, status, draftSuggestions[issueId] || issue.finding.suggestion)
          : issue,
      ),
    );
    setActiveIssueId(issueId);
  }

  function updateDraft(issueId: string, value: string) {
    setDraftSuggestions((currentDrafts) => ({
      ...currentDrafts,
      [issueId]: value,
    }));
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <span className="eyebrow">AI-assisted review platform · MVP</span>
          <h1>施工方案智能审查工作台</h1>
        </div>
        <div className="project-meta" aria-label="项目摘要">
          <span>南京综合楼项目</span>
          <span>监理复核</span>
          <span>Mock 数据</span>
        </div>
      </header>

      <section className="summary-strip" aria-label="审查进度">
        <Metric label="全部问题" value={counts.total} />
        <Metric label="待处理" value={counts.pending} tone="warning" />
        <Metric label="已接受" value={counts.accepted + counts.modified} tone="success" />
        <Metric label="已拒绝" value={counts.rejected} tone="danger" />
        <div className="active-issue">
          <LocateFixed size={18} />
          <span>{activeIssue ? `当前定位：${activeIssue.id}` : "当前定位：无"}</span>
        </div>
      </section>

      <section className="workspace">
        <aside className="outline-panel" aria-label="文档目录">
          <div className="panel-title">
            <FileText size={18} />
            <span>方案章节</span>
          </div>
          {documentParagraphs.map((paragraph) => (
            <button
              key={paragraph.id}
              className="outline-item"
              type="button"
              onClick={() => {
                paragraphRefs.current[paragraph.id]?.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });
              }}
            >
              <ChevronRight size={15} />
              <span>{paragraph.section}</span>
            </button>
          ))}
        </aside>

        <section className="document-panel" aria-label="施工方案正文">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">原文审查视图</span>
              <h2>施工组织设计专项方案节选</h2>
            </div>
            <span className="legend">
              <span className="legend-mark" />
              问题标注
            </span>
          </div>
          <div className="document-scroll">
            {documentParagraphs.map((paragraph) => (
              <DocumentParagraphBlock
                key={paragraph.id}
                paragraph={paragraph}
                issues={issues.filter((issue) => issue.anchor.paragraphId === paragraph.id)}
                activeIssueId={activeIssueId}
                onIssueClick={(issueId) => focusIssue(issueId, "card")}
                refSetter={(node) => {
                  paragraphRefs.current[paragraph.id] = node;
                }}
              />
            ))}
          </div>
        </section>

        <aside className="issues-panel" aria-label="审查问题列表">
          <div className="panel-heading compact">
            <div>
              <span className="eyebrow">审查意见</span>
              <h2>问题闭环</h2>
            </div>
            <ClipboardCheck size={20} />
          </div>

          <div className="filter-row" role="tablist" aria-label="问题状态筛选">
            {(["all", "pending", "accepted", "rejected", "modified"] as StatusFilter[]).map(
              (item) => (
                <button
                  key={item}
                  className={filter === item ? "filter active" : "filter"}
                  type="button"
                  onClick={() => setFilter(item)}
                >
                  {statusLabels[item]}
                </button>
              ),
            )}
          </div>

          <div className="issue-list">
            {filteredIssues.map((issue) => (
              <IssueCard
                key={issue.id}
                issue={issue}
                isActive={issue.id === activeIssueId}
                draftSuggestion={draftSuggestions[issue.id] ?? issue.finding.suggestion}
                onFocus={() => focusIssue(issue.id)}
                onDraftChange={(value) => updateDraft(issue.id, value)}
                onAccept={() => updateIssue(issue.id, "accepted")}
                onReject={() => updateIssue(issue.id, "rejected")}
                onModify={() => updateIssue(issue.id, "modified")}
                refSetter={(node) => {
                  cardRefs.current[issue.id] = node;
                }}
              />
            ))}
            {filteredIssues.length === 0 && (
              <div className="empty-state">当前筛选条件下没有审查问题。</div>
            )}
          </div>
        </aside>
      </section>

      <section className="processed-preview" aria-label="处理后方案预览">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">处理后预览</span>
            <h2>采纳修改后的方案文本</h2>
          </div>
          <span className="preview-note">接受或修改后接受的问题会实时替换原文。</span>
        </div>
        <div className="preview-grid">
          {processedParagraphs.map((paragraph) => (
            <article key={paragraph.id} className="preview-paragraph">
              <strong>{paragraph.section}</strong>
              <p>{paragraph.text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function Metric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "neutral" | "warning" | "success" | "danger";
}) {
  return (
    <div className={`metric metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function DocumentParagraphBlock({
  paragraph,
  issues,
  activeIssueId,
  onIssueClick,
  refSetter,
}: {
  paragraph: DocumentParagraph;
  issues: ReviewIssue[];
  activeIssueId: string;
  onIssueClick: (issueId: string) => void;
  refSetter: (node: HTMLDivElement | null) => void;
}) {
  const ranges = [...issues].sort((a, b) => a.anchor.startOffset - b.anchor.startOffset);
  let cursor = 0;
  const parts: Array<{ text: string; issue?: ReviewIssue }> = [];

  ranges.forEach((issue) => {
    if (issue.anchor.startOffset > cursor) {
      parts.push({ text: paragraph.text.slice(cursor, issue.anchor.startOffset) });
    }

    parts.push({
      text: paragraph.text.slice(issue.anchor.startOffset, issue.anchor.endOffset),
      issue,
    });
    cursor = issue.anchor.endOffset;
  });

  if (cursor < paragraph.text.length) {
    parts.push({ text: paragraph.text.slice(cursor) });
  }

  return (
    <article
      ref={refSetter}
      className={
        issues.some((issue) => issue.id === activeIssueId)
          ? "document-paragraph active"
          : "document-paragraph"
      }
    >
      <h3>{paragraph.section}</h3>
      <p>
        {parts.map((part, index) =>
          part.issue ? (
            <button
              key={`${part.issue.id}-${index}`}
              className={`inline-issue ${statusTone[part.issue.status]} ${
                part.issue.id === activeIssueId ? "active" : ""
              }`}
              type="button"
              onClick={() => onIssueClick(part.issue!.id)}
              title={`${part.issue.id}：${part.issue.finding.title}`}
            >
              {part.text}
            </button>
          ) : (
            <span key={`${paragraph.id}-${index}`}>{part.text}</span>
          ),
        )}
      </p>
    </article>
  );
}

function IssueCard({
  issue,
  isActive,
  draftSuggestion,
  onFocus,
  onDraftChange,
  onAccept,
  onReject,
  onModify,
  refSetter,
}: {
  issue: ReviewIssue;
  isActive: boolean;
  draftSuggestion: string;
  onFocus: () => void;
  onDraftChange: (value: string) => void;
  onAccept: () => void;
  onReject: () => void;
  onModify: () => void;
  refSetter: (node: HTMLDivElement | null) => void;
}) {
  const resolved = issue.status !== "pending";

  return (
    <article
      ref={refSetter}
      className={`issue-card ${isActive ? "active" : ""} ${statusTone[issue.status]}`}
    >
      <button className="issue-card-header" type="button" onClick={onFocus}>
        <span className={`severity severity-${issue.severity}`}>
          {severityLabels[issue.severity]}
        </span>
        <span className="issue-id">{issue.id}</span>
        <span className="source">{issue.source === "ai" ? "AI 标注" : "人工标注"}</span>
      </button>

      <div className="issue-card-body">
        <h3>{issue.finding.title}</h3>
        <p className="anchor-text">“{issue.anchor.text}”</p>

        <section>
          <h4>
            <ShieldAlert size={15} />
            不合规理由
          </h4>
          <p>{issue.finding.reason}</p>
        </section>

        <section>
          <h4>
            <AlertTriangle size={15} />
            依据
          </h4>
          <p>{issue.finding.basis}</p>
        </section>

        <label className="suggestion-editor">
          <span>
            <PencilLine size={15} />
            建议修改
          </span>
          <textarea
            value={draftSuggestion}
            onChange={(event) => onDraftChange(event.target.value)}
            disabled={resolved}
          />
        </label>

        <div className="action-row">
          <button type="button" onClick={onAccept} disabled={resolved}>
            <Check size={16} />
            接受
          </button>
          <button type="button" onClick={onModify} disabled={resolved}>
            <PencilLine size={16} />
            修改后接受
          </button>
          <button type="button" className="reject" onClick={onReject} disabled={resolved}>
            <X size={16} />
            拒绝
          </button>
        </div>
      </div>
    </article>
  );
}
