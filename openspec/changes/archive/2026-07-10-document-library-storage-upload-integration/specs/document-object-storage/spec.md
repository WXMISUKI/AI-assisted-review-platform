## ADDED Requirements

### Requirement: Upload response as task source metadata
The document object storage upload response SHALL provide enough non-secret object metadata for a document review task to reference the stored source document.

#### Scenario: Upload response is consumed by document task creation
- **WHEN** a file upload succeeds
- **THEN** the response includes bucket, key, original filename, content type, and size so the frontend can store those values on the review task
