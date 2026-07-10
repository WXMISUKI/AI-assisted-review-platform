## Context

The backend already exposes local health, LLM connectivity, PaddleOCR status, URL-mode OCR submission, and a mock review stream. The next platform milestone is to connect uploaded construction-plan documents to durable object storage before OCR extraction and agent review. The user has created a private MinIO bucket named `construction-review-docs`, and the project guide recommends S3-compatible access with `forcePathStyle: true`.

The browser must not receive MinIO access keys or secret keys. The backend is therefore the only component that talks to MinIO directly.

## Goals / Non-Goals

**Goals:**
- Add server-side MinIO configuration and safe readiness status.
- Upload local files from the browser to the private MinIO bucket.
- Generate short-lived presigned download URLs for stored objects.
- Submit a stored object to PaddleOCR URL-mode OCR using a presigned URL.
- Add a small frontend smoke surface so developers can verify MinIO readiness and upload behavior before wiring the full document workflow.

**Non-Goals:**
- Replace the current document-library mock workflow.
- Implement full PDF parsing, markdown reconstruction, or vector knowledge-base ingestion.
- Implement a backend multipart relay from MinIO to PaddleOCR local-file mode in this change.
- Make the private bucket public.

## Decisions

1. **Use AWS SDK S3 packages for MinIO access.**  
   `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` match the existing MinIO guide and work with S3-compatible storage. The client will use `forcePathStyle: true` and server-only environment variables.

2. **Use multipart parsing only on the backend upload route.**  
   The upload endpoint accepts `multipart/form-data` and stores one `file` field. This keeps the browser integration simple and prevents direct browser-to-MinIO credentials. A small dependency such as `busboy` is acceptable because Node's native HTTP server does not parse multipart bodies.

3. **Generate storage keys on the backend.**  
   Keys will be namespaced under `uploads/YYYY/MM/DD/` and include a random suffix plus a sanitized original filename. This avoids collisions and keeps object listings operationally readable.

4. **Presigned URL is the first OCR bridge.**  
   The backend submits `fileUrl` to PaddleOCR using a generated short-lived URL. This is the fastest path to validate storage-to-OCR connectivity. If PaddleOCR cannot access the configured `MINIO_PUBLIC_ENDPOINT`, the response will preserve a clear error message so the next change can add a backend relay.

5. **Health responses stay secret-free.**  
   `/api/health` and `/api/minio/status` return booleans, bucket name, endpoint presence, and connectivity status. They never return raw access keys, secret keys, or PaddleOCR tokens.

## Risks / Trade-offs

- **PaddleOCR cannot reach LAN-only MinIO URLs** -> Surface the failed OCR submission response clearly and keep a later backend relay change small and explicit.
- **Large file upload memory pressure** -> Stream multipart data into buffers only for MVP validation and document the route as a smoke bridge. A later production path can stream directly to S3 multipart upload.
- **Incorrect public endpoint replacement** -> Keep `MINIO_PUBLIC_ENDPOINT` optional and generate URLs from the configured SDK endpoint by default.
- **Bucket permissions accidentally made public** -> The implementation relies on presigned URLs and does not require `mc anonymous set download`.

## Migration Plan

1. Install S3 client, presigner, and multipart parser dependencies.
2. Add MinIO environment placeholders to `.env.example`.
3. Add backend MinIO client wrapper and routes.
4. Add frontend connectivity helpers and a small Data Assets smoke panel.
5. Validate OpenSpec, TypeScript, backend health, and MinIO status.

Rollback is straightforward: remove the new routes, helper module, dependency entries, and frontend smoke panel. Existing LLM/OCR URL routes remain unchanged.
