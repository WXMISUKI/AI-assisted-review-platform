# Change Proposal

This change makes the document library surface the review task lifecycle more clearly.

The current workbench already carries OCR, structure recovery, and review streaming state. The library view should expose that state so users can quickly understand whether a document is uploaded, OCR-processing, review-preparing, ready, completed, or failed, and whether the task is currently carrying paragraph-level progress.

The implementation will remain UI-facing and service-compatible:

- reuse existing `ReviewTask` fields
- derive human-readable lifecycle summaries from `status`, `ocrJob`, `streamStageType`, and `recoveredStructure`
- keep open/review actions unchanged
- avoid introducing new backend-only fields
