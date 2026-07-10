## ADDED Requirements

### Requirement: Service-backed result asset storage
The system SHALL store generated review result assets through the review session service boundary.

#### Scenario: Completion generates result
- **WHEN** the workbench completion payload is confirmed
- **THEN** the result asset is stored on the corresponding review task through the session service

#### Scenario: Result is reopened
- **WHEN** a completed task with a result asset is opened from the document library
- **THEN** the result preview is loaded from persisted task session state
