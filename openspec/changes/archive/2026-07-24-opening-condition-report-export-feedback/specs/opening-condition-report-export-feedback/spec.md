## ADDED Requirements

### Requirement: Report page shows export feedback
The report page SHALL show bounded export progress, success, and failure feedback.

#### Scenario: Export succeeds
- **WHEN** the backend returns a DOCX download URL
- **THEN** the report page shows a success message and an explicit download link

#### Scenario: Export fails
- **WHEN** the backend returns a safe failure payload
- **THEN** the report page shows the failure message without exposing provider internals

### Requirement: Export uses selected run
The report page SHALL export the currently selected run.

#### Scenario: Historical run is selected
- **WHEN** an archived historical run is selected and the operator clicks export
- **THEN** the request uses that historical task ID and does not silently use another current run
