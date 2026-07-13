## ADDED Requirements

### Requirement: Structure-aware loading stage source
The document review task SHALL expose structure-aware loading stage data to the loading view when recovered structure is present.

#### Scenario: Review preparation is underway
- **WHEN** the task is in review preparation with recovered structure available
- **THEN** the loading view can render stage-level progress from the same recovered structure that powers anchor rebinding and draft-issue summaries

#### Scenario: Recovered structure is absent
- **WHEN** the task has not yet produced recovered structure
- **THEN** the loading view continues to use the fallback stage templates already used for OCR and mock loading
