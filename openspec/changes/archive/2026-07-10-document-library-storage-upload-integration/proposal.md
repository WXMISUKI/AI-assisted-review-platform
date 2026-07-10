## Why

MinIO is now configured for the project, but the document library upload flow still creates mock tasks without storing the selected file. The platform needs the uploaded object key attached to each review task so OCR and agent review can use the real document in the next stage.

## What Changes

- Change document library drag-and-drop and file-picker uploads to call the backend MinIO upload endpoint before task creation.
- Store non-secret object metadata on the created review task.
- Show upload progress/error feedback in the document library upload card.
- Keep the manual fallback path for typed mock document names when no file is selected.
- Keep OCR parsing and full agent review orchestration out of scope for this change.

## Capabilities

### New Capabilities

### Modified Capabilities
- `document-review-task`: Uploaded file tasks include object-storage metadata and reflect backend upload failures.
- `document-object-storage`: The storage upload response can be consumed by document task creation as source document metadata.

## Impact

- Frontend: `src/App.tsx`, `src/domain/backendConnectivity.ts`, `src/domain/reviewTypes.ts`, `src/domain/reviewSessionService.ts`, and upload-related styles.
- Backend: no new route required; existing `/api/minio/upload` is reused.
- Persistence: mock localStorage snapshots gain an optional task field and remain backward compatible.
