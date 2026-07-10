## ADDED Requirements

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

### Requirement: Mock-only export state
The system SHALL clearly keep export as unavailable in the MVP.

#### Scenario: User views result preview
- **WHEN** export controls are displayed
- **THEN** the system indicates that PDF/Word export is reserved for later backend integration
