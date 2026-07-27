# Viewer Annotation Binding MVP Implementation

Date: 2026-07-27

## Implemented

- The source-faithful DOCX viewer is now the primary reading surface for previewable tasks.
- The older paragraph surface is a collapsible fallback/debug view.
- Paragraphs marked `reviewEligible: false` are excluded from the primary outline, issue list, counts, completion gating, and processed preview.
- Active issue matching now considers viewer match text and block text before paragraph fallback text and finding title.
- Viewer focus uses scored block matching and a persistent red background highlight.
- The issue anchor contract now supports an optional `viewer` anchor without breaking paragraph anchors.
- Text selection inside the viewer can open the existing manual annotation popover and create a structured manual issue.
- Rebinding paragraph anchors preserves any existing viewer anchor.

## Verification

- `pnpm typecheck`: passed.
- `openspec validate construction-plan-viewer-annotation-binding-mvp`: passed.
- Browser verification remains pending for a real ready `.docx` task:
  - click an issue and confirm viewer landing/highlight
  - select viewer text and create a manual issue
  - open a legacy task without `viewer` anchor and confirm paragraph fallback

## MVP Limits

- Viewer anchors are advisory text/block hints, not durable Word run ranges or exact page coordinates.
- The implementation does not add Word-native comments, OnlyOffice, PDF coordinate overlays, or image-region annotation.
- The paragraph model remains for compatibility and fallback rather than being deleted.
