## Context

The backend already supports `/api/minio/upload` and returns the object bucket, key, original filename, content type, and size. The document library currently creates a review task immediately from the file name or text input. That leaves the next OCR stage without a stable source object.

## Goals / Non-Goals

**Goals:**
- Upload real selected files to MinIO from the document library page.
- Create review tasks only after successful object upload when a file is selected.
- Persist source object metadata on `ReviewTask`.
- Show clear status for uploading and upload failure.
- Preserve current mock-only manual task creation when the user clicks upload without choosing a file.

**Non-Goals:**
- Parse OCR content after upload.
- Replace mock paragraphs/issues.
- Implement direct browser-to-MinIO upload.
- Store MinIO credentials or signed URLs in frontend task records.

## Decisions

1. **Use backend upload API from existing frontend helper.**  
   The browser sends `multipart/form-data` to `/api/minio/upload`; the backend owns credentials and object key generation.

2. **Add optional `sourceObject` to `ReviewTask`.**  
   The field stores only non-secret metadata: bucket, key, original filename, content type, and size. Existing persisted tasks without the field remain valid.

3. **Keep typed mock task creation as fallback.**  
   A user can still create a mock task from the optional filename/project fields. File picker and drop flows use MinIO; the manual button stays useful for UI testing when backend storage is unavailable.

4. **Do not store presigned URLs.**  
   Presigned URLs expire and should be generated on demand later for OCR or download.

## Risks / Trade-offs

- **Upload fails because backend or MinIO is not running** -> Show inline error and do not create a misleading stored task.
- **Large files take time** -> Disable upload actions and show an uploading state.
- **Existing localStorage data lacks `sourceObject`** -> The field is optional and does not require migration.
