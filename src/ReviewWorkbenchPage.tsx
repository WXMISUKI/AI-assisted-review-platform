import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  ClipboardCheck,
  FileText,
  GitCompareArrows,
  LocateFixed,
  MousePointer2,
  PencilLine,
  Plus,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react";
import { documentParagraphs, initialReviewIssues } from "./domain/mockReview";
import type {
  DocumentParagraph,
  IssueSeverity,
  IssueStatus,
  ReviewMode,
  ReviewIssue,
  StatusFilter,
} from "./domain/reviewTypes";
import {
  buildProcessedParagraphs,
  getIssueCounts,
  matchesFilter,
  resolveIssue,
} from "./domain/reviewUtils";

export interface ReviewWorkbenchPageProps {
  allowedModes?: ReviewMode[];
  roleLabel?: string;
  documentName?: string;
}

interface SelectionDraft {
  paragraphId: string;
  startOffset: number;
  endOffset: number;
  text: string;
  popover: {
    top: number;
    left: number;
  };
}

interface ManualAnnotationForm {
  title: string;
  reason: string;
  basis: string;
  suggestion: string;
}

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

const POPOVER_WIDTH = 430;
const POPOVER_ESTIMATED_HEIGHT = 500;
const POPOVER_MARGIN = 16;

const modeCopy: Record<ReviewMode, { label: string; title: string; note: string }> = {
  review: {
    label: "审查模式",
    title: "审查模式：只确认意见，不替换正文",
    note: "当前预览保持原方案文本。接受表示认可该审查意见成立，拒绝表示不采纳该意见。",
  },
  revise: {
    label: "审查修改模式",
    title: "审查修改模式：接受后生成处理后文本",
    note: "当前预览会应用已接受问题的建议修改。可先编辑建议文本，再点击接受。",
  },
};

export function ReviewWorkbenchPage({
  allowedModes = ["review", "revise"],
  roleLabel = "监理",
  documentName = "施工方案智能审查工作台",
}: ReviewWorkbenchPageProps = {}) {
  const [issues, setIssues] = useState<ReviewIssue[]>(initialReviewIssues);
  const [activeIssueId, setActiveIssueId] = useState(initialReviewIssues[0]?.id ?? "");
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [reviewMode, setReviewMode] = useState<ReviewMode>(() =>
    allowedModes.includes("review") ? "review" : allowedModes[0] ?? "revise",
  );
  const [deleteCandidateId, setDeleteCandidateId] = useState<string | null>(null);
  const [selectionDraft, setSelectionDraft] = useState<SelectionDraft | null>(null);
  const [selectionMessage, setSelectionMessage] = useState("拖选原文中的一段文字，可新增人工标注。");
  const [manualForm, setManualForm] = useState<ManualAnnotationForm>({
    title: "",
    reason: "",
    basis: "",
    suggestion: "",
  });
  const [draftSuggestions, setDraftSuggestions] = useState<Record<string, string>>(
    Object.fromEntries(initialReviewIssues.map((issue) => [issue.id, issue.finding.suggestion])),
  );
  const paragraphRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const counts = useMemo(() => getIssueCounts(issues), [issues]);
  const processedParagraphs = useMemo(
    () => buildProcessedParagraphs(documentParagraphs, issues, reviewMode),
    [issues, reviewMode],
  );
  const filteredIssues = useMemo(
    () => issues.filter((issue) => matchesFilter(issue, filter)),
    [filter, issues],
  );

  const activeIssue = issues.find((issue) => issue.id === activeIssueId) ?? issues[0];
  const visibleModes: ReviewMode[] =
    allowedModes.length > 0 ? allowedModes : ["review", "revise"];

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

  function updateIssue(issueId: string, status: "accepted" | "rejected") {
    setIssues((currentIssues) =>
      currentIssues.map((issue) =>
        issue.id === issueId
          ? resolveIssue(issue, status, draftSuggestions[issueId] || issue.finding.suggestion)
          : issue,
      ),
    );
    setActiveIssueId(issueId);
  }

  function deleteManualIssue(issueId: string) {
    setIssues((currentIssues) => currentIssues.filter((issue) => issue.id !== issueId));
    setDraftSuggestions((currentDrafts) => {
      const nextDrafts = { ...currentDrafts };
      delete nextDrafts[issueId];
      return nextDrafts;
    });
    setDeleteCandidateId(null);
    setActiveIssueId((currentActiveId) => {
      if (currentActiveId !== issueId) {
        return currentActiveId;
      }

      const nextIssue = issues.find((issue) => issue.id !== issueId);
      return nextIssue?.id ?? "";
    });
  }

  function updateDraft(issueId: string, value: string) {
    setDraftSuggestions((currentDrafts) => ({
      ...currentDrafts,
      [issueId]: value,
    }));
  }

  function captureSelection(paragraph: DocumentParagraph, textElement: HTMLParagraphElement | null) {
    const selection = window.getSelection();

    if (!selection || selection.isCollapsed || !textElement || selection.rangeCount === 0) {
      return;
    }

    const range = selection.getRangeAt(0);
    if (
      !textElement.contains(range.startContainer) ||
      !textElement.contains(range.endContainer)
    ) {
      setSelectionMessage("当前原型仅支持选择同一段落内的文字。");
      return;
    }

    const beforeRange = range.cloneRange();
    beforeRange.selectNodeContents(textElement);
    beforeRange.setEnd(range.startContainer, range.startOffset);

    const startOffset = beforeRange.toString().length;
    const selectedText = range.toString().trim();
    const rawSelectedText = range.toString();
    const leadingWhitespace = rawSelectedText.length - rawSelectedText.trimStart().length;
    const normalizedStart = startOffset + leadingWhitespace;
    const normalizedEnd = normalizedStart + selectedText.length;

    if (!selectedText) {
      return;
    }

    const overlapsExistingIssue = issues.some(
      (issue) =>
        issue.anchor.paragraphId === paragraph.id &&
        normalizedStart < issue.anchor.endOffset &&
        normalizedEnd > issue.anchor.startOffset,
    );

    if (overlapsExistingIssue) {
      setSelectionDraft(null);
      setSelectionMessage("选区与已有标注重叠。当前原型请先选择未标注文字。");
      selection.removeAllRanges();
      return;
    }

    const selectionRect = range.getBoundingClientRect();
    const popover = getClampedPopoverPosition(selectionRect);

    setSelectionDraft({
      paragraphId: paragraph.id,
      startOffset: normalizedStart,
      endOffset: normalizedEnd,
      text: selectedText,
      popover,
    });
    setManualForm({
      title: "人工补充审查意见",
      reason: "",
      basis: "",
      suggestion: selectedText,
    });
    setSelectionMessage("已捕获选区，可在下方填写人工标注。");
  }

  function cancelSelectionDraft() {
    setSelectionDraft(null);
    setManualForm({ title: "", reason: "", basis: "", suggestion: "" });
    setSelectionMessage("拖选原文中的一段文字，可新增人工标注。");
    window.getSelection()?.removeAllRanges();
  }

  function createManualIssue() {
    if (!selectionDraft) {
      return;
    }

    const issueNumber = String(issues.length + 1).padStart(3, "0");
    const issueId = `MANUAL-${issueNumber}`;
    const fallbackReason = "监理人工复核时标记该处需要补充说明或调整。";
    const fallbackBasis = "人工审查意见，后续可补充企业标准、合同要求或现行规范依据。";

    const newIssue: ReviewIssue = {
      id: issueId,
      source: "manual",
      status: "pending",
      severity: "medium",
      anchor: selectionDraft,
      finding: {
        title: manualForm.title.trim() || "人工补充审查意见",
        reason: manualForm.reason.trim() || fallbackReason,
        basis: manualForm.basis.trim() || fallbackBasis,
        suggestion: manualForm.suggestion.trim() || selectionDraft.text,
      },
      resolution: {
        action: null,
        editedText: null,
        resolvedAt: null,
      },
    };

    setIssues((currentIssues) => [...currentIssues, newIssue]);
    setDraftSuggestions((currentDrafts) => ({
      ...currentDrafts,
      [issueId]: newIssue.finding.suggestion,
    }));
    setFilter("all");
    setActiveIssueId(issueId);
    cancelSelectionDraft();
    window.requestAnimationFrame(() => {
      cardRefs.current[issueId]?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <span className="eyebrow">AI-assisted review platform · MVP</span>
          <h1>{documentName}</h1>
        </div>
        <div className="project-meta" aria-label="项目摘要">
          <span>南京综合楼项目</span>
          <span>{roleLabel}</span>
          <span>Mock 数据</span>
        </div>
      </header>

      <section className="summary-strip" aria-label="审查进度">
        <Metric label="全部问题" value={counts.total} />
        <Metric label="待处理" value={counts.pending} tone="warning" />
        <Metric label="已接受" value={counts.accepted} tone="success" />
        <Metric label="已拒绝" value={counts.rejected} tone="danger" />
        <div className="active-issue">
          <LocateFixed size={18} />
          <span>{activeIssue ? `当前定位：${activeIssue.id}` : "当前定位：无"}</span>
        </div>
      </section>

      <section className="mode-switch-panel" aria-label="审查模式切换">
        <div>
          <span className="eyebrow">工作模式</span>
          <h2>{modeCopy[reviewMode].title}</h2>
          <p>{modeCopy[reviewMode].note}</p>
        </div>
        <div className="mode-switch" role="tablist" aria-label="工作模式">
          {visibleModes.map((mode) => (
            <button
              key={mode}
              className={reviewMode === mode ? "mode-button active" : "mode-button"}
              type="button"
              onClick={() => setReviewMode(mode)}
            >
              <GitCompareArrows size={16} />
              {modeCopy[mode].label}
            </button>
          ))}
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
          <ManualSelectionPanel
            draft={selectionDraft}
            message={selectionMessage}
          />
          {selectionDraft && (
            <ManualAnnotationPopover
              draft={selectionDraft}
              form={manualForm}
              onFormChange={(nextForm) => setManualForm(nextForm)}
              onCancel={cancelSelectionDraft}
              onCreate={createManualIssue}
            />
          )}
          <div className="document-scroll">
            {documentParagraphs.map((paragraph) => (
              <DocumentParagraphBlock
                key={paragraph.id}
                paragraph={paragraph}
                issues={issues.filter((issue) => issue.anchor.paragraphId === paragraph.id)}
                activeIssueId={activeIssueId}
                onIssueClick={(issueId) => focusIssue(issueId, "card")}
                onTextSelection={captureSelection}
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
            {(["all", "pending", "accepted", "rejected"] as StatusFilter[]).map((item) => (
              <button
                key={item}
                className={filter === item ? "filter active" : "filter"}
                type="button"
                onClick={() => setFilter(item)}
              >
                {statusLabels[item]}
              </button>
            ))}
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
                onRequestDelete={() => setDeleteCandidateId(issue.id)}
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
            <h2>{reviewMode === "review" ? "审查意见确认视图" : "采纳修改后的方案全文"}</h2>
          </div>
          <span className="preview-note">{modeCopy[reviewMode].note}</span>
        </div>
        <div className="preview-document">
          {processedParagraphs.map((paragraph) => (
            <article key={paragraph.id} className="preview-paragraph">
              <h3>{paragraph.section}</h3>
              <p>{paragraph.text}</p>
            </article>
          ))}
        </div>
      </section>

      {deleteCandidateId && (
        <DeleteConfirmDialog
          issue={issues.find((issue) => issue.id === deleteCandidateId) ?? null}
          onCancel={() => setDeleteCandidateId(null)}
          onConfirm={() => deleteManualIssue(deleteCandidateId)}
        />
      )}
    </main>
  );
}

function getClampedPopoverPosition(rect: DOMRect): SelectionDraft["popover"] {
  const availableWidth = window.innerWidth - POPOVER_MARGIN * 2;
  const width = Math.min(POPOVER_WIDTH, availableWidth);
  const preferredLeft = rect.left + rect.width / 2 - width / 2;
  const left = Math.min(
    Math.max(POPOVER_MARGIN, preferredLeft),
    window.innerWidth - width - POPOVER_MARGIN,
  );

  const hasSpaceBelow = rect.bottom + POPOVER_ESTIMATED_HEIGHT + POPOVER_MARGIN < window.innerHeight;
  const preferredTop = hasSpaceBelow
    ? rect.bottom + 10
    : rect.top - POPOVER_ESTIMATED_HEIGHT - 10;
  const top = Math.min(
    Math.max(POPOVER_MARGIN, preferredTop),
    window.innerHeight - POPOVER_MARGIN - Math.min(POPOVER_ESTIMATED_HEIGHT, window.innerHeight - 32),
  );

  return {
    top,
    left,
  };
}

function ManualSelectionPanel({
  draft,
  message,
}: {
  draft: SelectionDraft | null;
  message: string;
}) {
  return (
    <section className={draft ? "manual-selection active" : "manual-selection"}>
      <div className="manual-selection-hint">
        <MousePointer2 size={16} />
        <span>{message}</span>
      </div>
    </section>
  );
}

function ManualAnnotationPopover({
  draft,
  form,
  onFormChange,
  onCancel,
  onCreate,
}: {
  draft: SelectionDraft;
  form: ManualAnnotationForm;
  onFormChange: (form: ManualAnnotationForm) => void;
  onCancel: () => void;
  onCreate: () => void;
}) {
  return (
    <section
      className="manual-popover"
      style={{
        top: draft.popover.top,
        left: draft.popover.left,
        width: Math.min(POPOVER_WIDTH, window.innerWidth - POPOVER_MARGIN * 2),
      }}
    >
      <div className="manual-popover-arrow" />
      <div className="manual-popover-header">
        <div>
          <span className="eyebrow">人工标注</span>
          <h3>就地补充审查意见</h3>
        </div>
        <button type="button" className="icon-button" onClick={onCancel} aria-label="取消标注">
          <X size={16} />
        </button>
      </div>
      <div className="manual-form">
        <div className="selected-text">
          <strong>已选原文</strong>
          <p>“{draft.text}”</p>
        </div>
        <label>
          <span>问题标题</span>
          <input
            value={form.title}
            onChange={(event) => onFormChange({ ...form, title: event.target.value })}
          />
        </label>
        <label>
          <span>不合规理由</span>
          <textarea
            value={form.reason}
            onChange={(event) => onFormChange({ ...form, reason: event.target.value })}
            placeholder="例如：该表述缺少责任分工、验收要求或规范依据。"
          />
        </label>
        <label>
          <span>依据</span>
          <input
            value={form.basis}
            onChange={(event) => onFormChange({ ...form, basis: event.target.value })}
            placeholder="可填写规范、合同条款或企业标准。"
          />
        </label>
        <label>
          <span>建议修改</span>
          <textarea
            value={form.suggestion}
            onChange={(event) => onFormChange({ ...form, suggestion: event.target.value })}
          />
        </label>
        <div className="manual-actions">
          <button type="button" onClick={onCreate}>
            <Plus size={16} />
            新增人工标注
          </button>
          <button type="button" className="secondary" onClick={onCancel}>
            <X size={16} />
            取消
          </button>
        </div>
      </div>
    </section>
  );
}

function DeleteConfirmDialog({
  issue,
  onCancel,
  onConfirm,
}: {
  issue: ReviewIssue | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!issue) {
    return null;
  }

  return (
    <div className="dialog-backdrop" role="presentation">
      <section className="confirm-dialog" role="dialog" aria-modal="true" aria-label="删除标注确认">
        <div className="dialog-icon">
          <Trash2 size={22} />
        </div>
        <h2>确认删除该人工标注？</h2>
        <p>删除后会从原文高亮、右侧卡片和预览计算中移除。当前原型不会持久化，可重新手动标注。</p>
        <p className="dialog-anchor">“{issue.anchor.text}”</p>
        <div className="dialog-actions">
          <button type="button" className="danger" onClick={onConfirm}>
            删除标注
          </button>
          <button type="button" onClick={onCancel}>
            取消
          </button>
        </div>
      </section>
    </div>
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
  onTextSelection,
  refSetter,
}: {
  paragraph: DocumentParagraph;
  issues: ReviewIssue[];
  activeIssueId: string;
  onIssueClick: (issueId: string) => void;
  onTextSelection: (paragraph: DocumentParagraph, textElement: HTMLParagraphElement | null) => void;
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

  let textElement: HTMLParagraphElement | null = null;

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
      <p
        ref={(node) => {
          textElement = node;
        }}
        onMouseUp={() => onTextSelection(paragraph, textElement)}
      >
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
  onRequestDelete,
  refSetter,
}: {
  issue: ReviewIssue;
  isActive: boolean;
  draftSuggestion: string;
  onFocus: () => void;
  onDraftChange: (value: string) => void;
  onAccept: () => void;
  onReject: () => void;
  onRequestDelete: () => void;
  refSetter: (node: HTMLDivElement | null) => void;
}) {
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
          />
        </label>

        <div className="action-row">
          <button
            type="button"
            className={issue.status === "accepted" ? "selected" : ""}
            onClick={onAccept}
          >
            <Check size={16} />
            {issue.status === "accepted" ? "已接受" : "接受"}
          </button>
          <button
            type="button"
            className={issue.status === "rejected" ? "reject selected" : "reject"}
            onClick={onReject}
          >
            <X size={16} />
            {issue.status === "rejected" ? "已拒绝" : "拒绝"}
          </button>
          {issue.source === "manual" && (
            <button type="button" className="delete" onClick={onRequestDelete}>
              <Trash2 size={16} />
              删除
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
