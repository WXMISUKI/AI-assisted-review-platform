## 1. Specification

- [x] 1.1 Create the proposal, design, spec deltas, and task list for `construction-plan-viewer-annotation-binding-mvp`.
- [x] 1.2 Keep scope limited to the `.docx` viewer-first MVP; do not expand into Word-native, OnlyOffice, or PDF coordinate annotation.

## 2. Implementation

- [x] 2.1 Make the viewer the primary detail-page view and demote the paragraph text surface to fallback/debug.
- [x] 2.2 Reduce cover and table-of-contents interference in the primary review experience.
- [x] 2.3 Improve issue-to-viewer focus with block-level matching and persistent visible highlight feedback.
- [x] 2.4 Extend issue anchors with an optional viewer anchor while preserving paragraph-anchor compatibility.
- [x] 2.5 Support viewer text selection and the minimum manual-annotation creation loop.

## 3. Verification

- [x] 3.1 Run `pnpm typecheck`.
- [ ] 3.2 Manually confirm that a ready `.docx` task can complete issue focus and manual annotation from the viewer.
- [ ] 3.3 Manually confirm that legacy tasks without viewer anchors still fall back through paragraph anchors.

## 4. Archive

- [x] 4.1 Record implementation conclusions and MVP limitations.
- [x] 4.2 Record follow-up directions: page-coordinate overlays, bidirectional issue/viewer binding, and image-region annotations.
