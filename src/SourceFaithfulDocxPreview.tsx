import { useEffect, useMemo, useRef, useState } from "react";
import type {
  DocumentParagraph,
  ReviewIssue,
  ReviewTaskSourceObject,
  ReviewViewerAnchor,
} from "./domain/reviewTypes";

type FetchPresignedDocumentUrl = (
  key: string,
  expiresIn?: number,
) => Promise<{
  ok: boolean;
  presigned?: {
    bucket: string;
    key: string;
    url: string;
    expiresIn: number;
    summary?: string;
  };
  message?: string;
}>;

interface SourceFaithfulDocxPreviewProps {
  sourceObject?: ReviewTaskSourceObject;
  activeIssue?: ReviewIssue | null;
  paragraphs: DocumentParagraph[];
  fetchPresignedDocumentUrl: FetchPresignedDocumentUrl;
  onSelectionDraft?: (draft: {
    text: string;
    viewerAnchor: ReviewViewerAnchor;
  }) => void;
}

type PreviewState =
  | { status: "idle"; message: string }
  | { status: "loading"; message: string }
  | { status: "ready"; message: string }
  | { status: "fallback"; message: string }
  | { status: "error"; message: string };

function normalizeText(value: string) {
  return value.replace(/\s+/g, "").toLowerCase();
}

function collectRenderableBlocks(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>("p, h1, h2, h3, h4, h5, h6, li, td, th"),
  ).filter((node) => normalizeText(node.textContent || "").length > 0);
}

function inferPageHint(node: HTMLElement, blocks: HTMLElement[]) {
  const nearestPage = node.closest("section");
  if (!nearestPage) {
    return undefined;
  }

  const pages = Array.from(new Set(blocks.map((item) => item.closest("section")).filter(Boolean)));
  const pageIndex = pages.findIndex((page) => page === nearestPage);
  return pageIndex >= 0 ? pageIndex + 1 : undefined;
}

function scoreBlockMatch(node: HTMLElement, terms: string[]) {
  const normalized = normalizeText(node.textContent || "");
  if (!normalized) {
    return -1;
  }

  let score = -1;
  for (const term of terms) {
    if (!term) {
      continue;
    }

    if (normalized === term) {
      score = Math.max(score, term.length + 2000);
      continue;
    }

    if (normalized.includes(term)) {
      score = Math.max(score, term.length + 1000);
      continue;
    }

    if (term.includes(normalized)) {
      score = Math.max(score, normalized.length + 300);
    }
  }

  return score;
}

function buildSearchTerms(issue: ReviewIssue | null | undefined, paragraphs: DocumentParagraph[]) {
  const fallbackParagraph = issue ? paragraphs.find((item) => item.id === issue.anchor.paragraphId) : null;
  return [
    issue?.anchor.viewer?.matchText,
    issue?.anchor.viewer?.blockText,
    issue?.anchor.text,
    fallbackParagraph?.text,
    issue?.finding.title,
  ]
    .filter((value): value is string => Boolean(value))
    .map((value) => normalizeText(value).slice(0, 240))
    .filter(Boolean);
}

export function SourceFaithfulDocxPreview({
  sourceObject,
  activeIssue,
  paragraphs,
  fetchPresignedDocumentUrl,
  onSelectionDraft,
}: SourceFaithfulDocxPreviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const renderTokenRef = useRef(0);
  const [state, setState] = useState<PreviewState>({
    status: "idle",
    message: "等待原文预览加载。",
  });

  const previewable = Boolean(sourceObject?.key?.toLowerCase().endsWith(".docx"));
  const terms = useMemo(() => buildSearchTerms(activeIssue, paragraphs), [activeIssue, paragraphs]);

  useEffect(() => {
    renderTokenRef.current += 1;
    const token = renderTokenRef.current;
    const container = containerRef.current;

    if (!container) {
      return;
    }

    if (!sourceObject) {
      container.innerHTML = "";
      setState({ status: "fallback", message: "当前任务没有可预览的源文档。" });
      return;
    }

    if (!previewable) {
      container.innerHTML = "";
      setState({ status: "fallback", message: "当前源文件不是 DOCX，继续使用文本审查视图。" });
      return;
    }

    const previewSource = sourceObject;
    const previewContainer = container;
    let cancelled = false;

    async function run() {
      try {
        setState({ status: "loading", message: "正在加载原文预览..." });
        const presignResult = await fetchPresignedDocumentUrl(previewSource.key, 900);
        if (cancelled || token !== renderTokenRef.current) {
          return;
        }

        const previewUrl = presignResult.presigned?.url;
        if (!presignResult.ok || !previewUrl) {
          throw new Error(presignResult.message || "无法获取原文临时访问地址。");
        }

        const response = await fetch(previewUrl);
        if (!response.ok) {
          throw new Error(`原文下载失败：${response.status}`);
        }

        const blob = await response.blob();
        if (cancelled || token !== renderTokenRef.current) {
          return;
        }

        previewContainer.innerHTML = "";
        const docxPreview = await import("docx-preview");
        await docxPreview.renderAsync(blob, previewContainer, undefined, {
          breakPages: true,
          className: "docx-preview-root",
          inWrapper: true,
          ignoreLastRenderedPageBreak: false,
        });

        if (cancelled || token !== renderTokenRef.current) {
          return;
        }

        setState({ status: "ready", message: "原文预览已加载。"});
      } catch (error) {
        if (cancelled || token !== renderTokenRef.current) {
          return;
        }

        previewContainer.innerHTML = "";
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "原文预览加载失败。",
        });
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [fetchPresignedDocumentUrl, previewable, sourceObject]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || state.status !== "ready" || terms.length === 0) {
      return;
    }

    const blocks = collectRenderableBlocks(container);

    const target = blocks
      .map((node) => ({ node, score: scoreBlockMatch(node, terms) }))
      .filter((item) => item.score >= 0)
      .sort((left, right) => right.score - left.score)[0]?.node;

    if (!target) {
      return;
    }

    container.querySelectorAll(".docx-preview-highlight, .docx-preview-highlight-active").forEach((node) => {
      node.classList.remove("docx-preview-highlight");
      node.classList.remove("docx-preview-highlight-active");
    });
    target.classList.add("docx-preview-highlight");
    target.classList.add("docx-preview-highlight-active");
    target.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [state.status, terms]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onSelectionDraft || state.status !== "ready") {
      return;
    }
    const previewContainer = container;
    const handleSelectionDraft = onSelectionDraft;

    function handleMouseUp() {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        return;
      }

      const range = selection.getRangeAt(0);
      const commonAncestor = range.commonAncestorContainer;
      if (!previewContainer.contains(commonAncestor)) {
        return;
      }

      const text = selection.toString().trim();
      if (!text) {
        return;
      }

      const blocks = collectRenderableBlocks(previewContainer);
      const selectionNode =
        commonAncestor.nodeType === Node.ELEMENT_NODE
          ? (commonAncestor as Element)
          : commonAncestor.parentElement;
      const block = selectionNode
        ? blocks.find((item) => item.contains(selectionNode))
        : undefined;
      const blockText = block?.textContent?.trim() || text;
      const blockIndex = block ? blocks.indexOf(block) : -1;

      handleSelectionDraft({
        text,
        viewerAnchor: {
          matchText: text,
          blockText,
          pageHint: block ? inferPageHint(block, blocks) : undefined,
          blockHint: blockIndex >= 0 ? `block-${blockIndex + 1}` : undefined,
        },
      });
    }

    previewContainer.addEventListener("mouseup", handleMouseUp);
    return () => {
      previewContainer.removeEventListener("mouseup", handleMouseUp);
    };
  }, [onSelectionDraft, state.status]);

  return (
    <section className="source-faithful-preview" aria-label="原文近似预览">
      <div className="source-faithful-preview-header">
        <div>
          <span className="eyebrow">原文近似预览</span>
          <strong>{sourceObject?.originalFilename ?? "未提供源文档"}</strong>
        </div>
        <span className={`source-faithful-preview-badge ${state.status}`}>
          {state.status === "ready" ? "已加载" : state.status === "loading" ? "加载中" : state.status === "error" ? "失败" : "回退"}
        </span>
      </div>
      <div className="source-faithful-preview-body">
        <p className="source-faithful-preview-status">{state.message}</p>
        <div ref={containerRef} className="docx-preview-shell" />
      </div>
    </section>
  );
}
