## 1. Data Model and Snapshot

- [x] 1.1 Extend review task and session types to store recovered structure, recovery progress, and paragraph anchor metadata.
- [x] 1.2 Add mock recovered-structure fixtures so the app can display section/paragraph recovery without a backend.
- [x] 1.3 Preserve the recovery snapshot through reloads using the existing mock persistence boundary.

## 2. OCR-to-Structure Flow

- [x] 2.1 Add normalization helpers that transform OCR-like output into sections, paragraphs, and anchorable spans.
- [x] 2.2 Update the loading flow to show a dedicated structure-recovery stage after OCR completion.
- [x] 2.3 Make review readiness depend on recovered structure being available, not just OCR completion.

## 3. UI and Orchestration Visibility

- [x] 3.1 Render recovered paragraphs and section labels in the review detail context.
- [x] 3.2 Expose the structure-restoration agent and its prompt binding in data assets.
- [x] 3.3 Run typecheck and a lightweight browser smoke test for the new recovery stage.
