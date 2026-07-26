# opening-condition-pilot-acceptance-smoke Specification

## Purpose
TBD - created by archiving change opening-condition-pilot-smoke-gate. Update Purpose after archive.
## Requirements
### Requirement: Opening-condition pilot acceptance smoke gate
The system SHALL provide a retained smoke gate that verifies the single-project opening-condition pilot delivery chain from intake through archive without requiring external providers.

#### Scenario: Smoke verifies human-review blocking and report readiness
- **WHEN** the smoke creates a task, publishes required readiness inputs, intakes a checklist and material packet, and runs formal matching with at least one unresolved item
- **THEN** report generation is blocked until all open or deferred human-review items are resolved
- **AND** resolving the blocking queue moves the task to `report_ready`

#### Scenario: Smoke verifies report and archive completion
- **WHEN** the smoke generates a report for a `report_ready` task and archives it
- **THEN** the task is archived, the report asset is archived, package diagnostics are retained, and archive status is recorded

#### Scenario: Smoke verifies archived run immutability
- **WHEN** the smoke attempts to rerun matching, regenerate a report, or reinitialize intake against an archived task
- **THEN** each mutation is rejected with a safe invalid-state response and the archived task remains unchanged

#### Scenario: Smoke verifies independent next-run creation
- **WHEN** the smoke creates a new run-specific task id for the same workspace after a prior run was archived
- **THEN** the new run can reach packet-ready state without mutating the archived run or reusing its task id

#### Scenario: Smoke is runnable from package scripts
- **WHEN** a developer runs the opening-condition smoke npm script
- **THEN** the retained test executes the pilot acceptance scenarios without requiring browser interaction or provider secrets

#### Scenario: Unified acceptance command runs all smoke layers
- **WHEN** an operator or developer runs the opening-condition acceptance command
- **THEN** the command executes the retained domain smoke, HTTP smoke, and UI smoke in sequence
- **AND** the output identifies which smoke layer passed or failed

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

### Requirement: Smoke verifies MVP acceptance snapshot
The opening-condition pilot acceptance smoke SHALL verify that the backend acceptance snapshot follows the report, export, and archive lifecycle.

#### Scenario: Report-ready snapshot
- **WHEN** the smoke generates a report after human review is closed
- **THEN** the report diagnostics include an acceptance snapshot with completed intake, match, human-review, and report steps
- **AND** the archive step remains pending

#### Scenario: Archived snapshot
- **WHEN** the smoke archives the same task
- **THEN** the acceptance snapshot marks the archive step complete
- **AND** the overall snapshot is completed and read-only

#### Scenario: Runbook references the same acceptance entry
- **WHEN** the single-project trial runbook describes preflight or regression verification
- **THEN** it references the same acceptance command
- **AND** it explains that the command covers domain, HTTP, and UI smoke layers
