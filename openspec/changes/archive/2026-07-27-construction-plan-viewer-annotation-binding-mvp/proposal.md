## Why

The construction-plan review detail page now has a page-like DOCX preview, but the product is still driven by the older paragraph-splitting review surface. That creates three MVP blockers:

- table of contents and cover-driven paragraph artifacts still interfere with review perception
- issue cards cannot reliably land on the right place in the viewer
- reviewers still cannot create manual annotations directly from the original-page viewer

For the fastest production-oriented MVP, we should not switch to Word-native editors, OnlyOffice, or a new PDF coordinate pipeline yet. The highest-value next slice is to make the existing viewer the primary detail surface, improve issue-to-viewer binding, and add the smallest viewer-side manual annotation loop.

## What Changes

- Promote the source-faithful DOCX viewer to the primary review surface in the workbench detail page.
- Demote the old paragraph-rendered document surface from primary review UI to fallback and debug support.
- Filter or suppress obvious `cover` and `toc` paragraph interference from the main detail review experience.
- Strengthen issue-to-viewer focus behavior from broad text search to a more stable block-level binding and visible highlight state.
- Add viewer-side text selection capture so reviewers can create manual issues directly from the rendered original-page viewer.
- Extend the issue anchor model with an optional viewer-oriented anchor while preserving backward compatibility with paragraph anchors.

## Capabilities

### New Capabilities
- `review-workbench`: viewer-first construction-plan review detail experience with issue focus and viewer-side manual annotation.

### Modified Capabilities
- `review-issue-model`: review issues can optionally carry a viewer-oriented anchor for source-faithful location recovery.

## Impact

- Detail workbench UI: `src/ReviewWorkbenchPage.tsx`
- Source-faithful viewer: `src/SourceFaithfulDocxPreview.tsx`
- Review issue types and contracts: `src/domain/reviewTypes.ts`
- Optional anchor rebinding helpers: `src/domain/reviewIssueAnchorBinding.ts`
- Supporting docs/specs: `docs/`, `openspec/changes/construction-plan-viewer-annotation-binding-mvp/`
