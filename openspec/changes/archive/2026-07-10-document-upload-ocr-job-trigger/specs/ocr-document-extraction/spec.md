## ADDED Requirements

### Requirement: Frontend stored-object OCR submission
The frontend SHALL be able to submit a stored document object key to the backend OCR object endpoint and consume the normalized response.

#### Scenario: Stored object OCR request is made
- **WHEN** the frontend has a stored document object key after upload
- **THEN** it posts the key to `/api/ocr/jobs/object` and receives either a job id or a normalized failure message
