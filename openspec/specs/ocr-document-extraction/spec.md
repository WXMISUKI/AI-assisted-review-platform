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

