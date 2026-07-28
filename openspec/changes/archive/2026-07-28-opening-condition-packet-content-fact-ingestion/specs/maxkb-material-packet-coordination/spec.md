## ADDED Requirements

### Requirement: Provider ingestion is task-scoped
The provider coordination contract SHALL submit packet content extraction results to a task-scoped platform endpoint.

#### Scenario: Provider posts batch results
- **WHEN** OCR Worker or MaxKB Provider Proxy completes batch processing for packet files
- **THEN** it posts safe per-file facts to the platform task endpoint
- **AND** the platform owns the task state, content-fact merge, checklist conclusions, human decisions, and reports

#### Scenario: Provider reports unsupported files
- **WHEN** a provider cannot process a packet file type
- **THEN** it returns a safe unsupported status and reason
- **AND** the platform records the unsupported fact and keeps affected checklist items eligible for human review
