## ADDED Requirements

### Requirement: Safe document presign helper
The backend connectivity surface SHALL expose a frontend helper for requesting a safe presigned URL for a stored review document object.

#### Scenario: Frontend needs original document access
- **WHEN** the workbench needs to load a stored source document by object key
- **THEN** the frontend can request a bounded presigned URL through the backend connectivity helper

#### Scenario: Presign request fails
- **WHEN** the backend cannot issue a presigned URL
- **THEN** the helper returns a safe structured failure without exposing storage credentials
