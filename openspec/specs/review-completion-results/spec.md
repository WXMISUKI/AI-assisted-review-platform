# review-completion-results Specification

## Purpose
TBD - created by archiving change review-completion-report-and-result-assets. Update Purpose after archive.
## Requirements
### Requirement: Backend-generated completion result
The system SHALL generate review completion result assets through the backend task completion action when the backend is available.

#### Scenario: Review mode completes through backend
- **WHEN** a review-mode task is completed through the backend
- **THEN** the backend creates and persists a supervisor report asset based on persisted issues and reviewer decisions

#### Scenario: Review-revise mode completes through backend
- **WHEN** a revise-mode task is completed through the backend
- **THEN** the backend creates and persists a revised-plan snapshot with processed paragraphs derived from accepted issue resolutions

### Requirement: Incomplete review cannot be completed
The system SHALL prevent backend completion while unresolved issues remain.

#### Scenario: Pending issue remains
- **WHEN** a task contains one or more pending issues
- **THEN** the backend completion endpoint returns a safe `incomplete_review` error and does not mark the task completed

### Requirement: Mode-specific result asset
The system SHALL generate a mode-specific mock result asset when a review is completed.

#### Scenario: Review mode completes
- **WHEN** a user completes a document in review mode
- **THEN** the system creates a supervisor review report asset containing summary, issue statistics, major risks, issue opinions, rectification suggestions, and conclusion

#### Scenario: Review-revise mode completes
- **WHEN** a user completes a document in review-revise mode
- **THEN** the system creates a revised-plan snapshot asset containing processed paragraphs, accepted changes, rejected items, and processing summary

### Requirement: Result preview
The system SHALL provide a readable preview for generated result assets.

#### Scenario: User opens a result asset
- **WHEN** a completed document has a generated result asset
- **THEN** the system displays a result preview page with document metadata, result type, created time, statistics, and mode-specific sections

### Requirement: Session-backed result preview
The system SHALL let the result preview consume the same review session boundary used by the rest of the review workflow.

#### Scenario: Completed task is reopened
- **WHEN** a user opens a completed review task from the document library
- **THEN** the result preview can be initialized from the session snapshot that carries the stored result asset and task metadata

#### Scenario: Session snapshot is unavailable
- **WHEN** the result session snapshot cannot be derived
- **THEN** the result preview may fall back to the persisted task aggregate without blocking entry

### Requirement: Graceful missing result shell
The system SHALL show a safe fallback shell when a completed task is opened but no result asset can be recovered.

#### Scenario: Result asset is missing
- **WHEN** a completed task is opened and neither the session snapshot nor the task aggregate contains a result asset
- **THEN** the result route remains available and shows a safe fallback shell that explains the result is not ready yet

### Requirement: Result provenance visibility
The system SHALL show where the result preview data came from.

#### Scenario: Session snapshot provides the asset
- **WHEN** the result preview is initialized from the session snapshot
- **THEN** the page indicates that the result came from the session boundary

#### Scenario: Task aggregate provides the asset
- **WHEN** the session snapshot is unavailable but the persisted task still contains a result asset
- **THEN** the page indicates that the result came from the persisted task aggregate

#### Scenario: No result asset exists
- **WHEN** the result preview opens in fallback mode without any result asset
- **THEN** the page indicates that the result is not yet available

### Requirement: Workbench recovery entry
The system SHALL provide a direct path back to the review workbench from the result preview.

#### Scenario: User wants to inspect the task
- **WHEN** the user opens a result preview
- **THEN** the page offers a control to reopen the review workbench for the same task

### Requirement: Mock-only export state
The system SHALL clearly keep export as unavailable in the MVP.

#### Scenario: User views result preview
- **WHEN** export controls are displayed
- **THEN** the system indicates that PDF/Word export is reserved for later backend integration

### Requirement: Service-backed result asset storage
The system SHALL store generated review result assets through the review session service boundary.

#### Scenario: Completion generates result
- **WHEN** the workbench completion payload is confirmed
- **THEN** the result asset is stored on the corresponding review task through the session service

#### Scenario: Result is reopened
- **WHEN** a completed task with a result asset is opened from the document library
- **THEN** the result preview is loaded from persisted task session state

