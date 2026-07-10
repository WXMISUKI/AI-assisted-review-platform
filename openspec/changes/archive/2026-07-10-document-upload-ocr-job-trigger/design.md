## Context

The backend already exposes `POST /api/ocr/jobs/object`, which generates a presigned URL for a stored object and submits it to PaddleOCR URL-mode OCR. The frontend currently uploads files to MinIO and creates a review task with `sourceObject`, but it does not invoke OCR.

## Goals / Non-Goals

**Goals:**
- Submit OCR automatically after a real file is uploaded to MinIO.
- Store OCR submission metadata on the created task.
- Represent submission success as `parsing` and submission failure as `failed`.
- Keep existing mock upload behavior available.

**Non-Goals:**
- Poll OCR job progress continuously.
- Download or parse OCR result JSONL.
- Replace mock review issues with OCR-derived paragraphs.
- Add a production task queue.

## Decisions

1. **Create the task after OCR submission attempt.**  
   This allows the initial task status to be accurate: `parsing` if a job id exists, `failed` if OCR submission failed.

2. **Store normalized OCR metadata on `ReviewTask`.**  
   The task stores `jobId`, `state`, `submittedAt`, optional source object key, and a failure message. It does not store tokens or presigned URLs.

3. **Use the existing backend object OCR endpoint.**  
   The backend already owns presigned URL creation and PaddleOCR token usage, so frontend changes stay narrow.

4. **Keep polling for a later change.**  
   This change proves upload-to-OCR submission. Continuous status polling and result ingestion deserve their own spec because they affect task lifecycle and document rendering.

## Risks / Trade-offs

- **PaddleOCR rejects public URL access** -> Store the failed submission message on the task and show it in the library.
- **OCR submission makes upload feel slower** -> Show the existing uploading state until both storage upload and OCR submission complete.
- **Mock tasks do not have OCR metadata** -> Keep metadata optional for backward compatibility.
