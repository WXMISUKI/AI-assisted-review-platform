## Why

The review platform now needs a real document storage bridge before OCR and agent review can be connected end to end. The user has created the private MinIO bucket `construction-review-docs`, so the backend should own upload, status checking, and short-lived object access without leaking storage credentials to the browser.

## What Changes

- Add a MinIO/S3-compatible document object storage capability for private review documents.
- Expose safe backend status for MinIO configuration and bucket connectivity.
- Add backend endpoints for multipart file upload and presigned download URL generation.
- Add an OCR bridge that can submit a stored object to PaddleOCR through a generated URL, with clear failure messaging when the URL is not reachable by the OCR service.
- Add frontend connectivity helpers and a lightweight data-assets smoke surface for MinIO readiness and upload validation.
- Keep full production document workflow replacement out of scope for this change.

## Capabilities

### New Capabilities
- `document-object-storage`: Stores uploaded review documents in a private MinIO bucket and returns non-secret metadata plus short-lived signed access links.

### Modified Capabilities
- `backend-connectivity`: Backend health status includes safe MinIO readiness flags.
- `ocr-document-extraction`: OCR submission can be initiated from a stored document object key as well as a direct URL.

## Impact

- Backend: `server/config.mjs`, `server/index.mjs`, new MinIO client module, and OCR bridge route.
- Frontend: `src/domain/backendConnectivity.ts` and the existing data-assets connectivity panel.
- Dependencies: AWS SDK S3 client and presigner packages, plus multipart parsing support for local uploads.
- Configuration: `.env.example` documents MinIO endpoint, public endpoint, credentials, bucket, and region placeholders.
