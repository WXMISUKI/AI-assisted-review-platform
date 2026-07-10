## 1. Dependencies And Configuration

- [x] 1.1 Add S3, presigner, and multipart parser dependencies.
- [x] 1.2 Extend backend config with MinIO settings and safe provider status.
- [x] 1.3 Keep `.env.example` aligned with private `construction-review-docs` bucket usage.

## 2. Backend Object Storage

- [x] 2.1 Add a MinIO client wrapper for status checks, uploads, and presigned URLs.
- [x] 2.2 Add backend routes for `/api/minio/status`, `/api/minio/upload`, and `/api/minio/presign`.
- [x] 2.3 Update root backend route and CORS headers for multipart upload support.

## 3. OCR URL Bridge

- [x] 3.1 Add backend route for submitting OCR jobs from stored object keys.
- [x] 3.2 Reuse the existing PaddleOCR URL-mode client and return normalized failure messages.

## 4. Frontend Smoke Surface And Verification

- [x] 4.1 Extend frontend connectivity types and API helpers with MinIO operations.
- [x] 4.2 Add a lightweight MinIO status/upload smoke panel to the data assets page.
- [x] 4.3 Validate OpenSpec, typecheck the app, and smoke-test backend health and MinIO status.
