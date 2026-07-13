## 1. Spec and Contract

- [x] 1.1 Define OCR recovered structure as the source of truth for review issue anchor rebinding.
- [x] 1.2 Define fallback behavior when no exact anchor match is found in recovered paragraphs.

## 2. Implementation

- [x] 2.1 Add a domain helper that rebinds issue anchors to recovered structure paragraphs.
- [x] 2.2 Apply issue rebinding when OCR hydration succeeds and when review sessions are created.
- [x] 2.3 Keep recovered paragraph ordering and workbench grouping stable after rebinding.

## 3. Verification

- [x] 3.1 Run TypeScript typecheck.
- [x] 3.2 Run a backend syntax check for touched modules if needed.
- [x] 3.3 Archive the completed OpenSpec change.
