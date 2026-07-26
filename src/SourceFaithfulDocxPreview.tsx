import { useEffect, useMemo, useRef, useState } from "react";
import type { DocumentParagraph, ReviewIssue, ReviewTaskSourceObject } from "./domain/reviewTypes";

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

function buildSearchTerms(issue: ReviewIssue | null | undefined, paragraphs: DocumentParagraph[]) {
  const fallbackParagraph = issue ? paragraphs.find((item) => item.id === issue.anchor.paragraphId) : null;
  return [
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
}: SourceFaithfulDocxPreviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const highlightTimerRef = useRef<number | null>(null);
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

    if (highlightTimerRef.current != null) {
      window.clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = null;
    }

    const nodes = Array.from(
      container.querySelectorAll<HTMLElement>("p, h1, h2, h3, h4, h5, h6, li, td, th, div, span"),
    );

    const target = nodes.find((node) => {
      const text = normalizeText(node.textContent || "");
      return terms.some((term) => term.length > 0 && text.includes(term));
    });

    if (!target) {
      return;
    }

    container.querySelectorAll(".docx-preview-highlight").forEach((node) => {
      node.classList.remove("docx-preview-highlight");
    });
    target.classList.add("docx-preview-highlight");
    target.scrollIntoView({ behavior: "smooth", block: "center" });

    highlightTimerRef.current = window.setTimeout(() => {
      target.classList.remove("docx-preview-highlight");
      highlightTimerRef.current = null;
    }, 2400);
  }, [state.status, terms]);

  useEffect(
    () => () => {
      if (highlightTimerRef.current != null) {
        window.clearTimeout(highlightTimerRef.current);
      }
    },
    [],
  );

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
