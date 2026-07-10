# ocr-document-extraction Specification

## Purpose
TBD - created by archiving change backend-connectivity-and-agent-adapter-foundation. Update Purpose after archive.
## Requirements
### Requirement: PaddleOCR-VL client configuration
The backend SHALL provide a PaddleOCR-VL client wrapper configured by environment variables.

#### Scenario: OCR status is requested
- **WHEN** the frontend requests OCR connectivity metadata
- **THEN** the backend returns whether OCR token, job URL, and model name are configured without returning the token

### Requirement: OCR asynchronous job wrapper
The backend SHALL provide operations for submitting OCR jobs and checking job status.

#### Scenario: URL-mode OCR job is submitted
- **WHEN** a caller submits a file URL for OCR
- **THEN** the backend submits a PaddleOCR job using configured model and optional payload

#### Scenario: OCR job status is checked
- **WHEN** a caller checks an OCR job id
- **THEN** the backend returns pending, running, done, or failed state information in a normalized shape

### Requirement: Stored document OCR submission
The backend SHALL allow OCR submission for a document object stored in MinIO by generating a short-lived presigned URL and submitting that URL to PaddleOCR.

#### Scenario: Stored document OCR job is submitted
- **WHEN** a caller submits an object key for OCR
- **THEN** the backend generates a presigned document URL and submits a PaddleOCR URL-mode job using the configured model

#### Scenario: Stored document URL is not reachable by OCR service
- **WHEN** PaddleOCR rejects the generated URL submission
- **THEN** the backend returns the normalized OCR failure with a clear non-secret message so operators can decide whether a public endpoint or relay mode is required

### Requirement: Frontend stored-object OCR submission
The frontend SHALL be able to submit a stored document object key to the backend OCR object endpoint and consume the normalized response.

#### Scenario: Stored object OCR request is made
- **WHEN** the frontend has a stored document object key after upload
- **THEN** it posts the key to `/api/ocr/jobs/object` and receives either a job id or a normalized failure message

