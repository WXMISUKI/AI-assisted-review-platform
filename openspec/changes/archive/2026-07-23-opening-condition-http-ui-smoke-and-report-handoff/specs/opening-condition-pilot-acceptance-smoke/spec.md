## ADDED Requirements

### Requirement: HTTP opening-condition pilot smoke gate
The system SHALL provide an HTTP-level smoke path that verifies the opening-condition pilot chain through public API routes without exposing provider secrets, raw OCR text, raw prompts, private object URLs, or browser-local paths.

#### Scenario: HTTP smoke verifies API delivery chain
- **WHEN** the HTTP smoke creates or bootstraps a pilot run, performs packet intake, formal matching, human-review decision, report generation, and archive through API routes
- **THEN** each response returns the expected safe status, task state, bounded diagnostics, and report/archive payload
- **AND** the final archived run rejects follow-on mutation attempts through the same API routes

#### Scenario: HTTP smoke verifies next-run isolation
- **WHEN** the HTTP smoke starts a new run-specific task id for the same workspace after archiving a prior run
- **THEN** the new run reaches packet-ready state independently
- **AND** the archived run remains unchanged in subsequent task-list or task-detail responses

### Requirement: Lightweight UI pilot smoke gate
The system SHALL provide a lightweight UI or render-level smoke guard for the most important operator-facing opening-condition workflow boundaries.

#### Scenario: Archived run controls are read-only
- **WHEN** the UI smoke renders an archived current or selected run
- **THEN** formal matching, report regeneration, archive mutation, basis publish, master-data confirm, and direct reinitialize controls are not available as mutation actions

#### Scenario: Report handoff path is visible
- **WHEN** the UI smoke renders a report-ready or archived run
- **THEN** the report page exposes the selected round, report status, finding summary, decision ledger or safe empty state, and the correct next-run entry behavior
