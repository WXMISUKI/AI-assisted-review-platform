## MODIFIED Requirements

### Requirement: Result preview export state
The system SHALL expose construction-plan DOCX report export from the result preview when a completed task contains a `supervisor-report` result asset.

#### Scenario: Exportable supervisor report is available
- **WHEN** a user opens a completed result preview backed by a `supervisor-report`
- **THEN** the page shows a DOCX export action

#### Scenario: Export is unavailable
- **WHEN** DOCX export cannot be completed because the adapter is unavailable or rejected the request
- **THEN** the page remains usable, shows a safe failure message, and keeps an HTML fallback action available

#### Scenario: Result type is not exportable
- **WHEN** the result asset is absent or is not a `supervisor-report`
- **THEN** the page does not pretend DOCX export is available
