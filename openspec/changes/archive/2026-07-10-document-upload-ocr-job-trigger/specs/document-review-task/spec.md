## ADDED Requirements

### Requirement: Uploaded document OCR submission state
The document review task SHALL store OCR job submission metadata for tasks created from stored source documents.

#### Scenario: OCR submission succeeds after upload
- **WHEN** a file upload succeeds and the backend accepts OCR submission for the stored object
- **THEN** the created document task stores the OCR job id and enters the `parsing` status

#### Scenario: OCR submission fails after upload
- **WHEN** a file upload succeeds but OCR submission fails
- **THEN** the created document task stores the OCR failure message and enters the `failed` status

#### Scenario: Mock task is created
- **WHEN** a user creates a mock task without a stored source object
- **THEN** the created document task remains in `uploaded` status without OCR job metadata
