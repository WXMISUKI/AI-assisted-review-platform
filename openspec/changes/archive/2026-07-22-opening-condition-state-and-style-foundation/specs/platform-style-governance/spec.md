## ADDED Requirements

### Requirement: Layered stylesheet entry
The platform SHALL keep a single stylesheet entry while separating token definitions from feature-level business styles.

#### Scenario: Root styles are loaded
- **WHEN** the application bootstraps its global stylesheet entry
- **THEN** theme tokens may be loaded from a dedicated token file
- **AND** feature-specific styles may be loaded from dedicated business stylesheet files

### Requirement: Feature stylesheet extraction
The system SHALL allow business-domain styles to live outside the monolithic root stylesheet.

#### Scenario: Opening-condition workspace styles are maintained
- **WHEN** the opening-condition workspace needs visual updates
- **THEN** its domain styles can be changed inside a dedicated feature stylesheet
- **AND** root tokens and unrelated product styles do not need to be edited in the same block
