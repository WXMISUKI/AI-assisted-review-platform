## ADDED Requirements

### Requirement: Stored document OCR submission
The backend SHALL allow OCR submission for a document object stored in MinIO by generating a short-lived presigned URL and submitting that URL to PaddleOCR.

#### Scenario: Stored document OCR job is submitted
- **WHEN** a caller submits an object key for OCR
- **THEN** the backend generates a presigned document URL and submits a PaddleOCR URL-mode job using the configured model

#### Scenario: Stored document URL is not reachable by OCR service
- **WHEN** PaddleOCR rejects the generated URL submission
- **THEN** the backend returns the normalized OCR failure with a clear non-secret message so operators can decide whether a public endpoint or relay mode is required
