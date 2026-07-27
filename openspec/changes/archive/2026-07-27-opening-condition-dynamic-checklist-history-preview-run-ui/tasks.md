## 1. Dynamic Checklist Extraction

- [x] 1.1 Add DOCX-buffer checklist extraction for uploaded checklist files.
- [x] 1.2 Prefer extracted items over built-in templates and filter out `现场核查`.
- [x] 1.3 Extend store smoke coverage for dynamic extraction and fallback behavior.

## 2. History And Task Selection

- [x] 2.1 Add backend/API support for deleting opening-condition pilot history tasks.
- [x] 2.2 Insert returned upload task into frontend task lists immediately and clear selection after delete.
- [x] 2.3 Add UI delete controls to the history list without breaking row click navigation.

## 3. Document Preview And Detail Defaults

- [x] 3.1 Add opening-condition document preview using MinIO presigned URL and `docx-preview`.
- [x] 3.2 Make `资料文档库` and `待核查资料项` collapsed by default.

## 4. Agent Timeline Progress

- [x] 4.1 Render progress from task events as an agent timeline.
- [x] 4.2 Highlight `awaiting_human_review` as the only operator pause.

## 5. Verification And Archive

- [x] 5.1 Run OpenSpec validation, typecheck, and opening-condition smoke suites.
- [x] 5.2 Sync main specs and archive the change.
