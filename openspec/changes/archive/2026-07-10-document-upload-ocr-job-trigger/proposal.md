## Why

Stored document uploads now create tasks with MinIO object metadata, but OCR is still not started from the document library flow. Triggering a PaddleOCR job immediately after upload gives each stored task a concrete backend parsing job and prepares the next stage for polling and document extraction.

## What Changes

- Add OCR job metadata to review task records.
- After a real file upload succeeds, submit the stored object key to the existing backend OCR object endpoint.
- Mark the task as `parsing` when OCR submission succeeds.
- Mark the task as `failed` with a visible error when OCR submission fails.
- Preserve mock task creation without OCR metadata.

## Capabilities

### New Capabilities

### Modified Capabilities
- `document-review-task`: Real stored uploads transition into parsing or failed state based on OCR job submission.
- `ocr-document-extraction`: Frontend can submit OCR jobs for stored objects and consume normalized job submission results.

## Impact

- Frontend task model and session service gain OCR job metadata.
- Document library upload flow calls `/api/ocr/jobs/object` after MinIO upload.
- Document list displays OCR job state in a compact, non-secret form.
- No new backend route is required.
