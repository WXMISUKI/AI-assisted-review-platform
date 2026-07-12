# platform-shell Specification Update

## ADDED Requirements

### Requirement: App shell component boundaries
The system SHALL keep the app shell split into page-level components and shared display helpers instead of concentrating all shell UI in a single file.

#### Scenario: Login page is rendered
- **WHEN** the login view is shown
- **THEN** the login UI can be rendered by a dedicated component module

#### Scenario: Document library is rendered
- **WHEN** the library view is shown
- **THEN** the library UI can be rendered by a dedicated component module

#### Scenario: Loading or result views are rendered
- **WHEN** the user opens a locked task or a completed result
- **THEN** the corresponding page can be rendered by a dedicated component module

### Requirement: Shared task display helpers
The system SHALL centralize reusable task display formatting in a shared helper module.

#### Scenario: Library shows task state
- **WHEN** the document library renders status summaries
- **THEN** it can reuse shared helpers for lifecycle labels, OCR labels, file size formatting, and result timestamps

#### Scenario: Future pages need lifecycle text
- **WHEN** another shell page needs the same task summary
- **THEN** it can reuse the same helper contract without duplicating formatting logic
