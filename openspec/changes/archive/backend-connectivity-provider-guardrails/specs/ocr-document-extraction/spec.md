## MODIFIED Requirements

### Requirement: PaddleOCR-VL client configuration
The backend SHALL provide a PaddleOCR-VL client wrapper configured by environment variables and SHALL expose only safe OCR readiness metadata to clients.

#### Scenario: OCR status is requested
- **WHEN** the frontend requests OCR connectivity metadata
- **THEN** the backend returns whether OCR token, job URL, and model name are configured without returning the token

### Requirement: OCR asynchronous job wrapper
The backend SHALL provide operations for submitting OCR jobs and checking job status with normalized success and failure payloads.

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

### Requirement: OCR output normalization contract
The backend SHALL expose OCR results in a shape that can be normalized into a review-ready document structure.

#### Scenario: OCR result is received
- **WHEN** the backend receives OCR markdown, JSONL, or page text output
- **THEN** the result can be mapped into a normalized structure recovery input without losing ordering metadata

### Requirement: Structured OCR handoff
The backend SHALL preserve enough OCR output metadata for a downstream structure-recovery stage to rebuild document order and anchors.

#### Scenario: OCR result is handed off
- **WHEN** OCR completes successfully
- **THEN** the backend can provide the downstream stage with page, block, and text metadata needed for structure recovery

### Requirement: OCR result URL ingestion
The backend SHALL be able to ingest PaddleOCR result content from a `resultUrl.jsonUrl` and treat it as an intermediate review-ready OCR artifact.

#### Scenario: OCR result URL is available
- **WHEN** a completed OCR job returns a `resultUrl.jsonUrl`
- **THEN** the backend can fetch the remote content and preserve the OCR result payload for structure recovery

#### Scenario: OCR result URL is missing
- **WHEN** a completed OCR job does not provide `resultUrl.jsonUrl`
- **THEN** the backend returns a normalized failure that allows the task flow to fall back to the existing mock or manual recovery path
