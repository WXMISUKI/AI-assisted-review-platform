## Why

The opening-condition pilot now has platform-owned orchestration, but several MVP gaps block real use: checklist extraction is still effectively template-first, history rows cannot be deleted, newly uploaded runs are not reflected immediately enough, document-library files do not open a preview, file/review groups are open by default, and the progress pane reads like a static status card rather than an agent run.

## What Changes

- Prefer dynamic extraction from the uploaded checklist document over the hard-coded 承台 template. The template remains only as a safe fallback.
- Extract only `资料核查` rows for the current MVP and explicitly ignore `现场核查` rows.
- Add a backend delete endpoint for opening-condition history tasks and a scoped UI delete action.
- Make upload completion insert/select the returned task immediately, so the left history and detail surface reflect the new run without waiting for a manual refresh.
- Reuse the project’s existing `docx-preview` approach for opening-condition document-library preview from MinIO presigned URLs.
- Default `资料文档库` and `待核查资料项` to collapsed.
- Render progress as a dynamic agent timeline from backend run events, with a clear pause at the single human-review step.

## Impact

- Backend: checklist extraction adapter, pilot store, HTTP routes, smoke tests.
- Frontend: opening-condition shell/task list/detail/progress, document preview component, connectivity API.
- Specs: opening-condition platform orchestration and execution console.
- No direct frontend Dify/MaxKB/OCR worker calls; external workflows remain schema/prompt references.
