## ADDED Requirements

### Requirement: OCR result URL ingestion
The backend SHALL be able to ingest PaddleOCR result content from a `resultUrl.jsonUrl` and treat it as an intermediate review-ready OCR artifact.

#### Scenario: OCR result URL is available
- **WHEN** a completed OCR job returns a `resultUrl.jsonUrl`
- **THEN** the backend can fetch the remote content and preserve the OCR result payload for structure recovery

#### Scenario: OCR result URL is missing
- **WHEN** a completed OCR job does not provide `resultUrl.jsonUrl`
- **THEN** the backend returns a normalized failure that allows the task flow to fall back to the existing mock or manual recovery path
