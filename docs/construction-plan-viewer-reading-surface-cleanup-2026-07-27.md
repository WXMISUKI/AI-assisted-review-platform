# Viewer Reading Surface Cleanup

Date: 2026-07-27

## What changed

- Removed the detail-page paragraph fallback/debug surface.
- Removed the heuristic chapter-outline panel from the detail page.
- Kept the source-faithful DOCX viewer and issue list as the only primary review surfaces.
- Fixed viewer-side text selection so drafting a manual annotation clears stale active-issue focus.
- Stopped the old post-create auto-scroll that previously pulled the page away from the selected source location.

## Why the old chapter tree was removed

The current DOCX structure recovery is built from heading styles and regex heuristics in [server/docxParser.mjs](/C:/project/nanjin/AI-assisted-review-platform/server/docxParser.mjs). It is useful for internal review grouping and compatibility, but it is not a trustworthy Word-native outline tree.

`docx-preview` preserves page-like rendering, but it does not directly provide a durable review-navigation outline that we can treat as the document's authoritative table of contents.

Because of that mismatch, keeping the chapter tree in the detail page reduced trust more than it added value. The viewer-first MVP is clearer when it focuses on:

- source-faithful page viewing
- issue-to-viewer location
- viewer-side manual annotation

## What remains intentionally internal

- `recoveredStructure.sections`
- `recoveredStructure.paragraphs`
- `paragraph.reviewEligible`
- paragraph-based anchors and rebinding

These still support review generation, persistence, and legacy compatibility even though they are no longer rendered as primary navigation UI.

## Verification

- `pnpm typecheck`: passed.
- `openspec validate construction-plan-viewer-reading-surface-cleanup`: pending until this change is finalized.
- Manual browser verification still recommended for:
  - viewer selection no longer jumping back to the previous issue
  - manual issue creation keeping the user at the selected source location
  - issue click still landing correctly inside the viewer
