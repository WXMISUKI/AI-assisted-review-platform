## 1. Shell Scroll Containment

- [x] 1.1 Update platform shell CSS so the shell is viewport-bound and the main area owns vertical scrolling.
- [x] 1.2 Verify document library, knowledge base, data assets, and loading/detail entry keep sidebar height stable.

## 2. Processed Preview Surface

- [x] 2.1 Restyle `preview-document` into a centered document canvas with stable width, padding, and page-like background.
- [x] 2.2 Restyle `preview-paragraph` with readable padding, subtle section separators, hover/focus polish, and dark-theme compatibility.
- [x] 2.3 Constrain long preview content with an internal scroll region suitable for long documents.

## 3. Mock Streaming Review Detail

- [x] 3.1 Add a staged mock streaming model for parsing, outline extraction, rule matching, semantic review, issue generation, and completion.
- [x] 3.2 Replace the centered loading card with a three-panel streaming detail page.
- [x] 3.3 Show outline items, document sections, and issue summaries incrementally while the mock stream advances.
- [x] 3.4 Preserve transition into the existing review workbench when the stream completes.

## 4. Validation And Archive

- [x] 4.1 Run `npm run typecheck`.
- [x] 4.2 Validate the OpenSpec change.
- [x] 4.3 Archive the change after implementation is complete.
